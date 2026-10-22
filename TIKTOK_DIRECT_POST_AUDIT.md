# TikTok Direct Post API — Compliance Audit

**Date:** 2026-10-22
**App:** Day2 Social Publisher (`7665300194573207559`, Live in production since 2026-10-01)
**Direct Post audit history:** rejected 2026-10-13 (ref `20261006105815`) and 2026-10-22 (ref `20261014120122`).
Both times the console's Review comments panel was empty. The only text, in the bell notification, is:
"Please adjust according to the Content Sharing Developer Guidelines and try submitting again."

**Scope:** what TikTok sees and what actually runs:
1. The Postiz composer and backend. Upstream v2.22.1 plus `patches/0001-tiktok-audit-ux.patch`, image `v2.22.1-day2.4`.
2. The pipeline that actually publishes client videos: `~/.claude/skills/social-publish`, which calls `postiz-client.mjs` on the Postiz public API.
3. The demo video and form answers submitted on 2026-10-14.
4. The public website.

Sources are marked **[OFFICIAL]** for [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines/) and **[COMMUNITY]** for reported audit experiences:
- [postiz #1563](https://github.com/gitroomhq/postiz-app/issues/1563)
- [Postra #243](https://github.com/Postra-app/Postra-app/pull/243)
- [Themis128 #333](https://github.com/Themis128/cu130-slim/pull/333)
- [clipember](https://clipember.com/guides/tiktok-direct-post-api-audit)
- [codebiy](https://codebiy.com/en/blog/tiktok-direct-post-audit)
- [outstand](https://www.outstand.so/docs/tiktok-audit)

The Reddit thread could not be fetched (reddit blocks the fetcher).

---

## 1. Product eligibility (section 8 of the brief): the main risk

**Classification: B, an internal agency automation tool.** The policy risk is **Critical**.

| Fact (verified in code/docs) | Where |
|---|---|
| The business owner sends raw footage on WhatsApp. Day2 edits it, writes the caption, and publishes. | `day2-ai.com/services/social-video` ("עריכה והעלאה מהוואטסאפ"), `social-publish/SKILL.md` |
| The approval gate goes to **Bar (Day2)**, not to the business owner. `mode:"auto"` skips it entirely. | `social-publish/SKILL.md` §4 |
| Privacy is **hard-coded** `PUBLIC_TO_EVERYONE` by our script. The creator never sees a privacy selector. | `SKILL.md` §5, `postiz-client.mjs:21` |
| Publishing is scheduled by our tick (`auto-publish-tick.mjs`), the day after the YouTube upload. | `SKILL.md` ordering contract |
| A logo watermark, intro/outro and lower-third are burned into the video by our edit step. | `youtube-upload` branded edit, `brand-photo.mjs` |

What the guidelines say **[OFFICIAL]**:
- Not acceptable: "A utility tool to help upload contents to the account(s) you or your team manages".
- Users "must manually select the privacy status from a dropdown and there should be no default value".
- Content must be sent only "after the user has expressly consent to the upload".
- Apps "should not superimpose … any brand name, logo, watermark, promotional text".

The Postiz composer we demoed is compliant. **But it is not the path our clients' videos actually take.** In production, the API path skips every UX rule the reviewer checked in the demo.

[COMMUNITY] codebiy was approved only after it "withdrew the feature that scheduled series videos, so drafts now wait for review". Their approved flow requires the user to choose the settings and confirm each post.

**We must not describe this as category A when it is not.** Legitimate ways forward are listed under §5.

## 2. Gap table

| # | Requirement | Current state | Risk | Fix | Verification |
|---|---|---|---|---|---|
| 1 | [OFFICIAL] Creator chooses privacy, no default | Composer: OK (no default, options from creator_info). **Real pipeline: hard-coded PUBLIC_TO_EVERYONE by Day2** | **Critical** | Owner-facing "Post to TikTok" page (§5-A), or UPLOAD mode (§5-B) | Demo plus code review |
| 2 | [OFFICIAL] Upload only after the creator's express consent | Consent is given by Bar, not by the account owner | **Critical** | §5-A: the owner presses Publish | Demo |
| 3 | [OFFICIAL] Not a tool for accounts "you or your team manages" | Day2 runs the accounts' posting | **Critical** | §5-A or §5-B; truthful form text | TikTok review |
| 4 | [OFFICIAL] No added logo/watermark/promo text | Our edit burns a logo, intro, outro and lower-third into the video; visible in the 14/10 demo | **High** | Send a clean cut to TikTok (no overlay); keep branding for YouTube/IG/FB only | ffprobe plus visual check of tiktok.mp4 |
| 5 | [COMMUNITY: hbweb approval, clipember] Demo must show a successful Direct Post and the post on the profile | 14/10 demo ended with "Upload to TikTok without posting it"; no Direct Post result shown | **High** | Record on a **private** account (unaudited production may Direct Post SELF_ONLY) and end in the TikTok app | Watch the final cut |
| 6 | [OFFICIAL] Fetch fresh creator_info when rendering the post page | Composer: OK (`creatorInfo` on render) | Low | — | — |
| 7 | [OFFICIAL] If the creator cannot post now, stop and tell the user | Composer shows the error. **Backend `post()` does not re-check creator_info at publish time** (scheduled posts) | **High** (clipember's fix) | Call `creatorInfo` in `post()`; fail with a clear message on error; validate `privacy_level ∈ privacy_level_options` and interaction flags | Unit test plus a staged post |
| 8 | [OFFICIAL] Privacy validated against the returned options | DTO checks the 4-value enum only, not this creator's options | Medium | Same server check as #7 | Unit test |
| 9 | [OFFICIAL] Comment/Duet/Stitch off by default, greyed when disabled | Composer: OK. Server does not reject `comment:true` when `comment_disabled` | Medium | Server check in `post()` | Unit test |
| 10 | [OFFICIAL] Commercial disclosure (off by default, at least one type, labels, branded ≠ private) | Composer + DTO + backend `BadBody`: OK | Low | — | Demo |
| 11 | [OFFICIAL] Music Usage / Branded Content Policy declaration before Publish | OK (always shown) | Low | — | Demo |
| 12 | [OFFICIAL] Preview of the content | Composer preview: OK | Low | — | Demo |
| 13 | [OFFICIAL] Caption editable, sent as approved | OK in composer | Low | — | Demo |
| 14 | [OFFICIAL] Duration vs `max_video_post_duration_sec` | Client-side probe plus DTO `video_too_long`; no server check | Medium | Server check in `post()` | Unit test |
| 15 | [OFFICIAL] Processing notice; poll status | Notice: OK. Postiz polls `publish/status/fetch` | Low | — | — |
| 16 | [OFFICIAL] Scopes all demonstrated | 4 scopes (basic, profile, publish, upload); consent screen shows all 4 | Low | Make sure the demo shows the avatar/nickname (basic and profile) | Demo |
| 17 | [COMMUNITY: codebiy] Retries must not double-publish | Postiz worker retry behaviour **not verified**; `postiz-client.mjs` has its own retries | Medium | Verify that a retry after a timeout on `video/init` cannot re-post; dedup is by `used-media.json` | Read the worker code |
| 18 | [COMMUNITY: codebiy/postwire] Website must be an external marketing site, not a login page | App Web/Desktop URL = `https://postiz.day2-ai.com` → redirects to `/auth` login. Organization website `day2-ai.com` is **Hebrew only**; no English page describes the product | Medium | English page on day2-ai.com describing Day2 Social Publisher plus the TikTok service, linking ToS/Privacy | curl 200 plus a read-through |
| 19 | [COMMUNITY] Demo quality: sharp, readable, no fast-forward | 14/10: 1280×720 @ 371 kbps, 1:41, no captions/narration | Medium | Re-record at 1080p, add on-screen captions per rule, stay within the 50MB form cap | ffprobe |

## 3. What is already right (keep)

`patches/0001-tiktok-audit-ux.patch` already covers these items:
- creator header
- creator_info-driven privacy with no default
- greyed and off-by-default interactions
- the full commercial-disclosure flow with TikTok's exact labels
- the declarations
- the duration check
- the processing notice
- removal of the backend `|| 'PUBLIC_TO_EVERYONE'` fallback
- the branded+SELF_ONLY guard

These are the exact four items Postra was rejected on, plus the privacy default that postiz #1563 was rejected on.

## 4. Why the two rejections happened (best evidence, not confirmed by TikTok)

| Submission | Most likely reasons |
|---|---|
| 06/10 | Sandbox footage ("(Sandbox)" on the consent screen); low-res re-encode; private sandbox account |
| 14/10 | No successful Direct Post shown (ended in UPLOAD mode); logo overlay on the posted video; and possibly the form text revealing an agency posting to clients' accounts (gaps 1–3) |

## 5. Options

**A. Make the owner the publisher (recommended if public Direct Post is the goal).**
- After Day2 edits the video, the business owner gets a WhatsApp link to a "Post to TikTok" page for **their** account: video preview, editable caption, privacy dropdown from creator_info (no default), interactions, disclosure, declaration, and a **Publish** button.
- The owner presses Publish; Day2 never chooses privacy or presses publish for them.
- This is a real workflow change, not cosmetic, and it is what the demo then shows.
- The Postiz backend stays the engine. Postiz's composer already is this page, but clients have no Postiz login; a small token-link page or Postiz "customer" access is needed.

**B. Stay on UPLOAD (inbox draft): compliant today, no audit needed.**
- The video lands in the owner's TikTok inbox.
- The owner opens TikTok, picks privacy and taps Post.
- It already works (14/10 `cmv7vjuw…` PUBLISHED to inbox).
- Cost: one extra tap for the owner, and the owner must open the TikTok app.

**C. Resubmit unchanged with nicer wording.** Likely rejected again. Wording that hides the agency model would misrepresent the product, so it is **not** an option.

## 6. Unverifiable without TikTok

Whether reviewers treat "agency edits, owner publishes" (A) as acceptable is unknown; the guidelines only exclude accounts "you or your team manages". Approval is not guaranteed under any option.

---

## 7. Implementation status (22/10, same day)

| Gap | Status | Where |
|---|---|---|
| 1–3 owner chooses + presses Post | **Built + deployed** | `publish-service/` → `https://postiz.day2-ai.com/publish/<token>` |
| 1–3 our automation can't Direct Post | **Enforced** | `social-publish/scripts/postiz-client.mjs` validation refuses TikTok unless `UPLOAD`; `SKILL.md` §5 rewritten; new `tiktok-owner-link.mjs` |
| 4 clean video | **Policy written, automation pending** | `SKILL.md` requires a clean cut; the HF/branded render has no "clean" mode yet → produce it manually until then |
| 5 demo shows a successful Direct Post | Pending recording | `TIKTOK_AUDIT_SUBMISSION_CHECKLIST.md` |
| 7–9, 14 publish-time creator_info check | **Built + deployed** | `patches/0003` (`assertCreatorCanPost`), image `v2.22.1-day2.5` |
| creator_info via public API | **Built + deployed** | `patches/0003` (`@Tool` creatorInfo) |
| 17 duplicate publishing | **Built** for the owner page (exclusive lock, one post per link, 5xx → `unconfirmed`, never auto-retried) | `server.mjs` |
| 18 English website | **Built** | `https://postiz.day2-ai.com/publish/about` |

## 8. Test report

**Automated:** `node --test publish-service/test/server.test.mjs` → **19 pass, 0 fail** (mock Postiz; nothing reaches TikTok). The cases:
- admin key
- media URL allowlist
- fresh creator_info with no privacy default
- no privacy selected
- privacy not offered for this creator
- private-only account
- disabled duet
- branded + private
- disclosure without a type
- missing consent
- creator_info failure
- too long
- the exact payload sent
- double click / retry → one post
- Postiz 4xx vs 5xx
- status → PUBLISHED
- expired link
- malformed token / CSP
- audit log without secrets

**Build:** GH Actions run 39729147262 green (Nest + Next type check with patch 0003).

**Live (production, read-only):**
- `integration-trigger` → `creatorInfo` on Haim's channel returned nickname/options. The expired token was refreshed by Postiz.
- The page renders in a browser at 1280px (en) and 390px (he, RTL).
- In the browser: branded content greys out "Only me" and clears it; the declaration switches; Post stays disabled without a privacy choice.

**Not verified yet:**
- A real Direct Post from the page (needs the private test account, at the recording).
- Expired-OAuth handling, end to end, on a channel whose refresh token is also dead: Postiz disconnects the channel (seen on the old sandbox "Pickok" channel); the page then shows "cannot post".
- Postiz worker retry behaviour (row 17, server side).
