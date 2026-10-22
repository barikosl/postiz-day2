// tiktok-publish: the owner-facing "Post to TikTok" page.
//
// Day2 edits a business's video; the business OWNER then opens a one-time link,
// sees their own TikTok account (fresh creator_info), previews the video, edits
// the caption, picks privacy (no default), interactions, commercial disclosure,
// reads the declaration and presses Publish. Only that click creates the post
// in Postiz (type "now", DIRECT_POST with the owner's settings). Day2 never
// chooses privacy or publishes on the owner's behalf. This is what TikTok's
// Content Sharing Guidelines require ("the user must have full awareness and
// control"); see TIKTOK_DIRECT_POST_AUDIT.md.
//
// Zero dependencies (node:http). Served at https://postiz.day2-ai.com/publish/*
// through the postiz tunnel (path rule), so the domain matches the TikTok app's
// Web URL.
//
// Env:
//   PORT                 default 4010
//   POSTIZ_API_URL       default http://postiz:5000/api  (public API base, no /public/v1)
//   POSTIZ_API_KEY       Postiz org API key (raw, no "Bearer")
//   ADMIN_KEY            secret for POST /publish/api/links (pipeline only), >= 32 chars
//   DATA_DIR             default /data  (links/, audit.log)
//   PUBLIC_BASE          default https://postiz.day2-ai.com/publish

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 4010);
const API = (process.env.POSTIZ_API_URL || 'http://postiz:5000/api').replace(/\/$/, '');
const API_KEY = process.env.POSTIZ_API_KEY || '';
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const DATA = process.env.DATA_DIR || '/data';
const PUBLIC_BASE = (process.env.PUBLIC_BASE || 'https://postiz.day2-ai.com/publish').replace(/\/$/, '');
const LINKS = path.join(DATA, 'links');
const AUDIT = path.join(DATA, 'audit.log');
const STATIC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

if (!API_KEY || ADMIN_KEY.length < 32) {
  console.error('POSTIZ_API_KEY and ADMIN_KEY (>=32 chars) are required');
  process.exit(1);
}
fs.mkdirSync(LINKS, { recursive: true });

const PRIVACY = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'];
const MAX_CAPTION = 2200; // TikTok video title limit
const LINK_TTL_DAYS_MAX = 14;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url

// ── small helpers ────────────────────────────────────────────────────────────
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const now = () => new Date().toISOString();
const rid = () => crypto.randomBytes(8).toString('hex');

function audit(entry) {
  // Server-side audit trail for the sensitive action (publishing to a third
  // party account). No tokens, no captions, IP hashed.
  try {
    fs.appendFileSync(AUDIT, JSON.stringify({ ts: now(), ...entry }) + '\n');
  } catch (e) {
    console.error('audit write failed', e.message);
  }
}

function linkFile(token) {
  return path.join(LINKS, sha(token) + '.json');
}
function readLink(token) {
  if (!TOKEN_RE.test(token)) return null;
  try {
    return JSON.parse(fs.readFileSync(linkFile(token), 'utf8'));
  } catch {
    return null;
  }
}
function writeLink(token, rec) {
  const f = linkFile(token);
  const tmp = f + '.' + rid();
  fs.writeFileSync(tmp, JSON.stringify(rec, null, 2));
  fs.renameSync(tmp, f);
}
function expired(rec) {
  return !rec || Date.parse(rec.expiresAt) < Date.now();
}

// In-memory fixed-window rate limit (single instance).
const buckets = new Map();
function limited(key, max, windowMs) {
  const t = Date.now();
  const b = buckets.get(key);
  if (!b || t - b.start > windowMs) {
    buckets.set(key, { start: t, n: 1 });
    return false;
  }
  b.n += 1;
  return b.n > max;
}
setInterval(() => {
  const t = Date.now();
  for (const [k, b] of buckets) if (t - b.start > 600000) buckets.delete(k);
}, 600000).unref();

function clientIp(req) {
  return String(req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '');
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' https: data:; " +
    "media-src https://postiz.day2-ai.com; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': type, ...SECURITY_HEADERS });
  res.end(data);
}

function readJson(req, limit = 16384) {
  return new Promise((resolve, reject) => {
    if (!/^application\/json/i.test(req.headers['content-type'] || '')) {
      return reject(Object.assign(new Error('content-type must be application/json'), { status: 415 }));
    }
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('body too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

// ── Postiz public API ────────────────────────────────────────────────────────
async function postiz(pathname, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs || 30000);
  try {
    const r = await fetch(`${API}/public/v1${pathname}`, {
      ...opts,
      signal: ctrl.signal,
      headers: { Authorization: API_KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    const text = await r.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    return { ok: r.ok, status: r.status, body };
  } finally {
    clearTimeout(timer);
  }
}

// Fresh creator_info every time (TikTok: "must retrieve the latest creator
// info when rendering the Post to TikTok page"). Goes through Postiz so an
// expired access token is refreshed by Postiz itself (patch 0003 @Tool).
async function creatorInfo(integrationId) {
  const r = await postiz(`/integration-trigger/${encodeURIComponent(integrationId)}`, {
    method: 'POST',
    body: JSON.stringify({ methodName: 'creatorInfo', data: {} }),
  });
  if (!r.ok) return { error: `creator_info unavailable (HTTP ${r.status})` };
  const out = r.body?.output;
  if (!out || out.error) return { error: out?.error || 'creator_info unavailable' };
  return {
    nickname: out.creator_nickname || '',
    username: out.creator_username || '',
    avatar: out.creator_avatar_url || '',
    privacyOptions: (out.privacy_level_options || []).filter((p) => PRIVACY.includes(p)),
    commentDisabled: !!out.comment_disabled,
    duetDisabled: !!out.duet_disabled,
    stitchDisabled: !!out.stitch_disabled,
    maxDurationSec: Number(out.max_video_post_duration_sec) || null,
  };
}

// ── validation of the owner's choices (server is authoritative) ─────────────
export function validateChoices(body, info, rec) {
  const errors = [];
  const b = (v) => v === true;
  const caption = typeof body.caption === 'string' ? body.caption.replace(/\r\n/g, '\n').trim() : '';
  if (!caption) errors.push('caption_required');
  if (caption.length > MAX_CAPTION) errors.push('caption_too_long');

  if (info.error) errors.push('creator_cannot_post');
  const privacy = typeof body.privacy === 'string' ? body.privacy : '';
  if (!privacy) errors.push('privacy_required');
  else if (!PRIVACY.includes(privacy) || !(info.privacyOptions || []).includes(privacy)) errors.push('privacy_not_allowed');

  const comment = b(body.comment), duet = b(body.duet), stitch = b(body.stitch);
  if (comment && info.commentDisabled) errors.push('comment_disabled');
  if (duet && info.duetDisabled) errors.push('duet_disabled');
  if (stitch && info.stitchDisabled) errors.push('stitch_disabled');

  const disclose = b(body.disclose);
  const yourBrand = disclose && b(body.yourBrand);
  const branded = disclose && b(body.brandedContent);
  if (disclose && !yourBrand && !branded) errors.push('disclosure_type_required');
  if (branded && privacy === 'SELF_ONLY') errors.push('branded_not_private');

  if (info.maxDurationSec && rec.durationSec && rec.durationSec > info.maxDurationSec) errors.push('video_too_long');
  if (body.consent !== true) errors.push('consent_required');

  return {
    errors,
    settings: {
      __type: 'tiktok',
      content_posting_method: 'DIRECT_POST',
      privacy_level: privacy,
      comment,
      duet,
      stitch,
      autoAddMusic: 'no',
      brand_organic_toggle: yourBrand,
      brand_content_toggle: branded,
      video_made_with_ai: b(body.aigc),
      video_too_long: false,
    },
    caption,
  };
}

// ── handlers ─────────────────────────────────────────────────────────────────
async function createLink(req, res, reqId) {
  if (!adminOk(req)) {
    audit({ reqId, action: 'link.create', result: 'denied', ip: sha(clientIp(req)).slice(0, 12) });
    return send(res, 401, { error: 'unauthorized' });
  }
  const body = await readJson(req);
  const str = (v, max) => (typeof v === 'string' && v.length > 0 && v.length <= max ? v : null);
  const integrationId = str(body.integrationId, 64);
  const mediaId = str(body.mediaId, 64);
  const mediaPath = str(body.mediaPath, 500);
  const caption = typeof body.caption === 'string' && body.caption.length <= MAX_CAPTION ? body.caption : null;
  const business = str(body.business, 120) || '';
  const lang = body.lang === 'en' ? 'en' : 'he';
  const durationSec = Number.isFinite(body.durationSec) && body.durationSec > 0 && body.durationSec < 3600 ? body.durationSec : null;
  const ttlDays = Math.min(Math.max(Number(body.ttlDays) || 7, 1), LINK_TTL_DAYS_MAX);
  if (!integrationId || !/^[a-z0-9]+$/i.test(integrationId)) return send(res, 400, { error: 'integrationId' });
  if (!mediaId || !/^[A-Za-z0-9-]+$/.test(mediaId)) return send(res, 400, { error: 'mediaId' });
  if (!mediaPath || !/^https:\/\/postiz\.day2-ai\.com\/uploads\/[A-Za-z0-9/_.-]+\.mp4$/.test(mediaPath)) return send(res, 400, { error: 'mediaPath' });
  if (caption === null) return send(res, 400, { error: 'caption' });

  const token = crypto.randomBytes(32).toString('base64url');
  const rec = {
    v: 1,
    integrationId,
    mediaId,
    mediaPath,
    caption,
    business,
    lang,
    durationSec,
    createdAt: now(),
    expiresAt: new Date(Date.now() + ttlDays * 86400000).toISOString(),
    status: 'ready',
    ref: body.ref && typeof body.ref === 'string' ? body.ref.slice(0, 120) : null,
  };
  writeLink(token, rec);
  audit({ reqId, action: 'link.create', result: 'ok', link: sha(token).slice(0, 12), integrationId, ref: rec.ref });
  return send(res, 201, { url: `${PUBLIC_BASE}/${token}${lang === 'en' ? '?lang=en' : ''}`, expiresAt: rec.expiresAt });
}

async function info(token, res) {
  const rec = readLink(token);
  if (!rec || rec.kind === 'connect') return send(res, 404, { error: 'not_found' });
  if (expired(rec) && rec.status === 'ready') return send(res, 410, { error: 'expired' });
  const base = {
    business: rec.business,
    lang: rec.lang,
    video: rec.mediaPath,
    caption: rec.caption,
    durationSec: rec.durationSec,
    status: rec.status,
    releaseURL: rec.releaseURL || null,
  };
  if (rec.status !== 'ready') return send(res, 200, base);
  const ci = await creatorInfo(rec.integrationId);
  return send(res, 200, { ...base, creator: ci });
}

async function publish(token, req, res, reqId) {
  const rec = readLink(token);
  if (!rec || rec.kind === 'connect') return send(res, 404, { error: 'not_found' });
  if (expired(rec)) return send(res, 410, { error: 'expired' });
  if (rec.status !== 'ready') return send(res, 409, { error: 'already_' + rec.status });

  const body = await readJson(req);
  const ci = await creatorInfo(rec.integrationId);
  const { errors, settings, caption } = validateChoices(body, ci, rec);
  if (errors.length) {
    audit({ reqId, action: 'publish', result: 'rejected', link: sha(token).slice(0, 12), errors });
    return send(res, 422, { errors });
  }

  // Idempotency: exactly one publish per link. The lock file is created
  // exclusively, so a double click / retry cannot create a second post.
  const lock = linkFile(token) + '.lock';
  let fd;
  try {
    fd = fs.openSync(lock, 'wx');
  } catch {
    return send(res, 409, { error: 'already_publishing' });
  }
  fs.closeSync(fd);
  writeLink(token, { ...rec, status: 'publishing', choices: settings, finalCaption: caption, publishedAt: now() });

  const payload = {
    type: 'now',
    shortLink: false,
    tags: [],
    date: now(),
    posts: [
      {
        integration: { id: rec.integrationId },
        value: [{ content: caption, image: [{ id: rec.mediaId, path: rec.mediaPath }] }],
        settings,
      },
    ],
  };
  const r = await postiz('/posts', { method: 'POST', body: JSON.stringify(payload), timeoutMs: 60000 });
  const postId = Array.isArray(r.body) ? r.body[0]?.postId : r.body?.postId;
  if (!r.ok) {
    // Postiz refused before creating anything (4xx) → the owner may try again.
    // 5xx/unknown → keep the link locked; Day2 checks before any retry.
    const retryable = r.status >= 400 && r.status < 500;
    writeLink(token, { ...rec, status: retryable ? 'ready' : 'unconfirmed', lastError: r.body?.msg || r.body?.error || `HTTP ${r.status}` });
    if (retryable) fs.rmSync(lock, { force: true });
    audit({ reqId, action: 'publish', result: retryable ? 'postiz_rejected' : 'unconfirmed', link: sha(token).slice(0, 12), status: r.status });
    return send(res, retryable ? 422 : 502, { errors: [retryable ? 'postiz_rejected' : 'unconfirmed'], detail: r.body?.msg || r.body?.error || null });
  }
  writeLink(token, { ...rec, status: 'submitted', choices: settings, finalCaption: caption, publishedAt: now(), postId: postId || null });
  audit({
    reqId,
    action: 'publish',
    result: 'submitted',
    link: sha(token).slice(0, 12),
    integrationId: rec.integrationId,
    postId: postId || null,
    privacy: settings.privacy_level,
    ref: rec.ref,
  });
  return send(res, 202, { status: 'submitted' });
}

async function status(token, res) {
  const rec = readLink(token);
  if (!rec) return send(res, 404, { error: 'not_found' });
  if (rec.status !== 'submitted' || !rec.postId) return send(res, 200, { status: rec.status, releaseURL: rec.releaseURL || null });
  const from = new Date(Date.parse(rec.publishedAt) - 86400000).toISOString();
  const to = new Date(Date.now() + 86400000).toISOString();
  const r = await postiz(`/posts?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}`);
  const post = (r.body?.posts || []).find((p) => p.id === rec.postId);
  const state = post?.state || 'QUEUE';
  if (state === 'PUBLISHED' || state === 'ERROR') {
    const next = { ...rec, status: state === 'PUBLISHED' ? 'published' : 'error', releaseURL: post.releaseURL || null };
    writeLink(token, next);
    audit({ action: 'publish.result', result: next.status, link: sha(token).slice(0, 12), postId: rec.postId });
    return send(res, 200, { status: next.status, releaseURL: next.releaseURL });
  }
  return send(res, 200, { status: 'processing' });
}

// ── owner connect links ──────────────────────────────────────────────────────
// A raw TikTok authorize URL dies after an hour (Postiz keeps the OAuth state in
// Redis for 3600s), so owners get a stable link to our page instead. The page
// explains what is being connected; its button mints a fresh authorize URL from
// the Postiz public API at click time and redirects to TikTok's consent screen.
function adminOk(req) {
  const key = String(req.headers['x-admin-key'] || '');
  return key.length === ADMIN_KEY.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(ADMIN_KEY));
}

async function createConnectLink(req, res, reqId) {
  if (!adminOk(req)) {
    audit({ reqId, action: 'connect.create', result: 'denied', ip: sha(clientIp(req)).slice(0, 12) });
    return send(res, 401, { error: 'unauthorized' });
  }
  const body = await readJson(req);
  const business = typeof body.business === 'string' && body.business.length <= 120 ? body.business : '';
  const lang = body.lang === 'en' ? 'en' : 'he';
  const ttlDays = Math.min(Math.max(Number(body.ttlDays) || 7, 1), LINK_TTL_DAYS_MAX);
  const token = crypto.randomBytes(32).toString('base64url');
  writeLink(token, {
    v: 1,
    kind: 'connect',
    business,
    lang,
    createdAt: now(),
    expiresAt: new Date(Date.now() + ttlDays * 86400000).toISOString(),
    status: 'ready',
    ref: typeof body.ref === 'string' ? body.ref.slice(0, 120) : null,
  });
  audit({ reqId, action: 'connect.create', result: 'ok', link: sha(token).slice(0, 12) });
  return send(res, 201, { url: `${PUBLIC_BASE}/connect/${token}${lang === 'en' ? '?lang=en' : ''}` });
}

async function connectGo(token, res, reqId) {
  const rec = readLink(token);
  if (!rec || rec.kind !== 'connect' || expired(rec)) return send(res, 410, { error: 'expired' });
  const r = await postiz('/social/tiktok');
  const url = r.body?.url;
  if (!r.ok || typeof url !== 'string' || !/^https:\/\/www\.tiktok\.com\/v2\/auth\/authorize\/?\?/.test(url) || !/client_key=[^&]+/.test(url)) {
    audit({ reqId, action: 'connect.go', result: 'error', link: sha(token).slice(0, 12), status: r.status });
    return send(res, 502, { error: 'connect_unavailable' });
  }
  writeLink(token, { ...rec, lastClickAt: now(), clicks: (rec.clicks || 0) + 1 });
  audit({ reqId, action: 'connect.go', result: 'redirect', link: sha(token).slice(0, 12) });
  res.writeHead(302, { Location: url, ...SECURITY_HEADERS });
  return res.end();
}

const STATIC_FILES = { 'app.js': 'text/javascript; charset=utf-8', 'connect.js': 'text/javascript; charset=utf-8', 'app.css': 'text/css; charset=utf-8' };
function staticFile(name, res) {
  if (!Object.prototype.hasOwnProperty.call(STATIC_FILES, name) || !STATIC_FILES[name]) return send(res, 404, { error: 'not_found' });
  return send(res, 200, fs.readFileSync(path.join(STATIC, name)), STATIC_FILES[name]);
}

const PAGE = () => fs.readFileSync(path.join(STATIC, 'page.html'));

const server = http.createServer(async (req, res) => {
  const reqId = String(req.headers['cf-ray'] || rid());
  const ip = clientIp(req);
  try {
    const url = new URL(req.url, 'http://x');
    const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean); // ['publish', ...]
    if (parts[0] !== 'publish') return send(res, 404, { error: 'not_found' });

    if (limited('ip:' + ip, 120, 60000)) return send(res, 429, { error: 'rate_limited' });

    if (parts.length === 2 && parts[1] === 'healthz') return send(res, 200, { ok: true });
    if (parts.length === 1 || (parts.length === 2 && parts[1] === 'about')) {
      return send(res, 200, fs.readFileSync(path.join(STATIC, 'about.html')), 'text/html; charset=utf-8');
    }
    if (parts.length === 3 && parts[1] === 'static') return staticFile(parts[2], res);
    if (parts.length === 3 && parts[1] === 'api' && parts[2] === 'links' && req.method === 'POST') return await createLink(req, res, reqId);
    if (parts.length === 3 && parts[1] === 'api' && parts[2] === 'connect-links' && req.method === 'POST') return await createConnectLink(req, res, reqId);
    if (parts[1] === 'connect') {
      const ct = parts[2];
      if (!ct || !TOKEN_RE.test(ct)) return send(res, 404, { error: 'not_found' });
      if (parts.length === 3 && req.method === 'GET') {
        const rec = readLink(ct);
        if (!rec || rec.kind !== 'connect') return send(res, 404, { error: 'not_found' });
        return send(res, 200, fs.readFileSync(path.join(STATIC, 'connect.html')), 'text/html; charset=utf-8');
      }
      if (parts.length === 4 && parts[3] === 'info' && req.method === 'GET') {
        const rec = readLink(ct);
        if (!rec || rec.kind !== 'connect') return send(res, 404, { error: 'not_found' });
        if (expired(rec)) return send(res, 410, { error: 'expired' });
        return send(res, 200, { business: rec.business, lang: rec.lang });
      }
      if (parts.length === 4 && parts[3] === 'go' && req.method === 'GET') {
        if (limited('go:' + sha(ct), 10, 60000)) return send(res, 429, { error: 'rate_limited' });
        return await connectGo(ct, res, reqId);
      }
      return send(res, 404, { error: 'not_found' });
    }

    const token = parts[1];
    if (!token || !TOKEN_RE.test(token)) return send(res, 404, { error: 'not_found' });
    if (parts.length === 2 && req.method === 'GET') return send(res, 200, PAGE(), 'text/html; charset=utf-8');
    if (parts.length === 3 && parts[2] === 'info' && req.method === 'GET') return await info(token, res);
    if (parts.length === 3 && parts[2] === 'status' && req.method === 'GET') return await status(token, res);
    if (parts.length === 3 && parts[2] === 'publish' && req.method === 'POST') {
      if (limited('pub:' + sha(token), 5, 60000)) return send(res, 429, { error: 'rate_limited' });
      return await publish(token, req, res, reqId);
    }
    return send(res, 404, { error: 'not_found' });
  } catch (e) {
    console.error(reqId, e.message);
    return send(res, e.status || 500, { error: e.status ? e.message : 'internal_error' });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => console.log(`tiktok-publish listening on :${PORT}`));
}
export { server };
