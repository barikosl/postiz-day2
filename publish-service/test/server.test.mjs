// node --test publish-service/test
// Runs the real server against a mock Postiz public API. Nothing reaches TikTok.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const ADMIN = 'a'.repeat(40);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ttpub-'));
let mock, svc, base, creator, postsCreated, postState, failPostWith, triggerStatus;

function resetMock() {
  creator = {
    creator_nickname: 'Haim', creator_username: 'haim', creator_avatar_url: 'https://x/a.png',
    privacy_level_options: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
    comment_disabled: false, duet_disabled: true, stitch_disabled: false, max_video_post_duration_sec: 600,
  };
  postsCreated = [];
  postState = 'QUEUE';
  failPostWith = 0;
  triggerStatus = 200;
}

before(async () => {
  resetMock();
  mock = http.createServer((req, res) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      assert.equal(req.headers.authorization, 'pz-key');
      if (req.url.startsWith('/api/public/v1/integration-trigger/')) {
        res.writeHead(triggerStatus, { 'content-type': 'application/json' });
        return res.end(JSON.stringify(triggerStatus === 200 ? { output: creator } : { msg: 'x' }));
      }
      if (req.url === '/api/public/v1/posts' && req.method === 'POST') {
        if (failPostWith) { res.writeHead(failPostWith); return res.end('{"msg":"bad"}'); }
        postsCreated.push(JSON.parse(b));
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify([{ postId: 'post' + postsCreated.length, integration: 'int1' }]));
      }
      if (req.url === '/api/public/v1/social/tiktok') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ url: 'https://www.tiktok.com/v2/auth/authorize/?client_key=abc&scope=user.info.basic&state=s1' }));
      }
      if (req.url.startsWith('/api/public/v1/posts?')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ posts: [{ id: 'post1', state: postState, releaseURL: postState === 'PUBLISHED' ? 'https://www.tiktok.com/@haim/video/1' : null }] }));
      }
      res.writeHead(404); res.end('{}');
    });
  });
  await new Promise((r) => mock.listen(0, r));
  Object.assign(process.env, {
    POSTIZ_API_URL: `http://127.0.0.1:${mock.address().port}/api`,
    POSTIZ_API_KEY: 'pz-key', ADMIN_KEY: ADMIN, DATA_DIR: tmp, PUBLIC_BASE: 'https://postiz.day2-ai.com/publish',
  });
  ({ server: svc } = await import('../server.mjs'));
  await new Promise((r) => svc.listen(0, r));
  base = `http://127.0.0.1:${svc.address().port}`;
});
after(() => { svc.close(); mock.close(); });

const j = (r) => r.json();
async function newLink(extra = {}) {
  const r = await fetch(`${base}/publish/api/links`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': ADMIN },
    body: JSON.stringify({
      integrationId: 'int1', mediaId: 'm-1', mediaPath: 'https://postiz.day2-ai.com/uploads/2026/10/22/a.mp4',
      caption: 'hello', business: 'Haim', durationSec: 30, ...extra,
    }),
  });
  assert.equal(r.status, 201);
  const { url } = await j(r);
  return url.split('/publish/')[1].split('?')[0];
}
const good = { caption: 'hello world', privacy: 'PUBLIC_TO_EVERYONE', comment: true, duet: false, stitch: false, disclose: false, consent: true };
const pub = (tok, body) => fetch(`${base}/publish/${tok}/publish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('admin key required to create a link', async () => {
  const r = await fetch(`${base}/publish/api/links`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': 'wrong' }, body: '{}' });
  assert.equal(r.status, 401);
});

test('link rejects a media path outside our Postiz uploads', async () => {
  const r = await fetch(`${base}/publish/api/links`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': ADMIN },
    body: JSON.stringify({ integrationId: 'int1', mediaId: 'm', mediaPath: 'https://evil.example/a.mp4', caption: 'x' }),
  });
  assert.equal(r.status, 400);
});

test('info returns fresh creator info and no privacy default', async () => {
  resetMock();
  const tok = await newLink();
  const d = await j(await fetch(`${base}/publish/${tok}/info`));
  assert.equal(d.creator.nickname, 'Haim');
  assert.deepEqual(d.creator.privacyOptions, ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY']);
  assert.equal(d.creator.duetDisabled, true);
  assert.equal('privacy' in d, false);
});

test('no privacy selected → rejected, nothing posted', async () => {
  resetMock();
  const tok = await newLink();
  const r = await pub(tok, { ...good, privacy: '' });
  assert.equal(r.status, 422);
  assert.ok((await j(r)).errors.includes('privacy_required'));
  assert.equal(postsCreated.length, 0);
});

test('privacy not offered for this creator → rejected', async () => {
  resetMock();
  const tok = await newLink();
  const r = await pub(tok, { ...good, privacy: 'FOLLOWER_OF_CREATOR' });
  assert.ok((await j(r)).errors.includes('privacy_not_allowed'));
});

test('private-only account (unaudited style) accepts SELF_ONLY only', async () => {
  resetMock();
  creator.privacy_level_options = ['SELF_ONLY'];
  const tok = await newLink();
  assert.ok((await j(await pub(tok, good))).errors.includes('privacy_not_allowed'));
  const r = await pub(tok, { ...good, privacy: 'SELF_ONLY' });
  assert.equal(r.status, 202);
});

test('duet disabled by the creator cannot be turned on', async () => {
  resetMock();
  const tok = await newLink();
  assert.ok((await j(await pub(tok, { ...good, duet: true }))).errors.includes('duet_disabled'));
});

test('branded content cannot be private', async () => {
  resetMock();
  const tok = await newLink();
  const e = (await j(await pub(tok, { ...good, privacy: 'SELF_ONLY', disclose: true, brandedContent: true }))).errors;
  assert.ok(e.includes('branded_not_private'));
});

test('disclosure on with no type selected → rejected', async () => {
  resetMock();
  const tok = await newLink();
  assert.ok((await j(await pub(tok, { ...good, disclose: true }))).errors.includes('disclosure_type_required'));
});

test('missing consent → rejected', async () => {
  resetMock();
  const tok = await newLink();
  assert.ok((await j(await pub(tok, { ...good, consent: false }))).errors.includes('consent_required'));
});

test('creator_info failure (cannot post now) → rejected', async () => {
  resetMock();
  triggerStatus = 500;
  const tok = await newLink();
  assert.ok((await j(await pub(tok, good))).errors.includes('creator_cannot_post'));
  assert.equal(postsCreated.length, 0);
});

test('video longer than max duration → rejected', async () => {
  resetMock();
  creator.max_video_post_duration_sec = 20;
  const tok = await newLink({ durationSec: 30 });
  assert.ok((await j(await pub(tok, good))).errors.includes('video_too_long'));
});

test('valid publish sends exactly the owner\'s settings as DIRECT_POST', async () => {
  resetMock();
  const tok = await newLink();
  const r = await pub(tok, { ...good, caption: 'edited by owner', disclose: true, yourBrand: true });
  assert.equal(r.status, 202);
  assert.equal(postsCreated.length, 1);
  const p = postsCreated[0].posts[0];
  assert.equal(postsCreated[0].type, 'now');
  assert.equal(p.value[0].content, 'edited by owner');
  assert.equal(p.settings.content_posting_method, 'DIRECT_POST');
  assert.equal(p.settings.privacy_level, 'PUBLIC_TO_EVERYONE');
  assert.equal(p.settings.comment, true);
  assert.equal(p.settings.duet, false);
  assert.equal(p.settings.brand_organic_toggle, true);
  assert.equal(p.settings.brand_content_toggle, false);
});

test('retry / double click cannot publish twice', async () => {
  resetMock();
  const tok = await newLink();
  const [a, b] = await Promise.all([pub(tok, good), pub(tok, good)]);
  assert.deepEqual([a.status, b.status].sort(), [202, 409]);
  assert.equal(postsCreated.length, 1);
  assert.equal((await pub(tok, good)).status, 409);
});

test('Postiz 4xx leaves the link usable; 5xx locks it as unconfirmed', async () => {
  resetMock();
  failPostWith = 400;
  const tok = await newLink();
  assert.equal((await pub(tok, good)).status, 422);
  failPostWith = 0;
  assert.equal((await pub(tok, good)).status, 202);

  resetMock();
  failPostWith = 503;
  const tok2 = await newLink();
  assert.equal((await pub(tok2, good)).status, 502);
  failPostWith = 0;
  assert.equal((await pub(tok2, good)).status, 409);
  assert.equal(postsCreated.length, 0);
});

test('status follows Postiz to PUBLISHED with the post URL', async () => {
  resetMock();
  const tok = await newLink();
  await pub(tok, good);
  assert.equal((await j(await fetch(`${base}/publish/${tok}/status`))).status, 'processing');
  postState = 'PUBLISHED';
  const s = await j(await fetch(`${base}/publish/${tok}/status`));
  assert.equal(s.status, 'published');
  assert.match(s.releaseURL, /tiktok\.com/);
});

test('expired link is refused', async () => {
  resetMock();
  const tok = await newLink();
  const f = path.join(tmp, 'links', crypto.createHash('sha256').update(tok).digest('hex') + '.json');
  const rec = JSON.parse(fs.readFileSync(f));
  rec.expiresAt = new Date(Date.now() - 1000).toISOString();
  fs.writeFileSync(f, JSON.stringify(rec));
  assert.equal((await pub(tok, good)).status, 410);
});

test('unknown token and malformed token → 404; page has CSP', async () => {
  assert.equal((await fetch(`${base}/publish/${'x'.repeat(43)}/info`)).status, 404);
  assert.equal((await fetch(`${base}/publish/../../etc/passwd`)).status, 404);
  const tok = await newLink();
  const r = await fetch(`${base}/publish/${tok}`);
  assert.match(r.headers.get('content-security-policy'), /default-src 'none'/);
});

test('audit log records publishes without tokens or captions', async () => {
  const log = fs.readFileSync(path.join(tmp, 'audit.log'), 'utf8');
  assert.match(log, /"action":"publish","result":"submitted"/);
  assert.doesNotMatch(log, /edited by owner/);
});

test('connect link: page, info, redirect to TikTok consent; not usable as a publish link', async () => {
  const r = await fetch(`${base}/publish/api/connect-links`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': ADMIN },
    body: JSON.stringify({ business: 'Haim', lang: 'en' }),
  });
  assert.equal(r.status, 201);
  const ct = (await j(r)).url.split('/connect/')[1].split('?')[0];
  assert.equal((await fetch(`${base}/publish/connect/${ct}`)).status, 200);
  assert.equal((await j(await fetch(`${base}/publish/connect/${ct}/info`))).business, 'Haim');
  const go = await fetch(`${base}/publish/connect/${ct}/go`, { redirect: 'manual' });
  assert.equal(go.status, 302);
  assert.match(go.headers.get('location'), /^https:\/\/www\.tiktok\.com\/v2\/auth\/authorize\/\?client_key=abc/);
  assert.equal((await fetch(`${base}/publish/${ct}/info`)).status, 404);
  assert.equal((await pub(ct, good)).status, 404);
});

test('connect link creation needs the admin key', async () => {
  const r = await fetch(`${base}/publish/api/connect-links`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 401);
});
