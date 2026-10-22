# tiktok-publish — the owner "Post to TikTok" page

Day2 edits a business's video. The **business owner** opens a one-time link, sees their
TikTok account (fresh `creator_info`), previews the video, edits the caption, picks who can
see it (no default), interactions, commercial disclosure, reads the declaration and presses
**Post to TikTok**. Only that click creates the Postiz post (`type:"now"`, `DIRECT_POST`).
Why: TikTok's Content Sharing Guidelines — see `../TIKTOK_DIRECT_POST_AUDIT.md`.

- `GET  /publish/<token>`            page (he/en, `?lang=en`)
- `GET  /publish/<token>/info`       creator_info via Postiz `integration-trigger` (patch 0003)
- `POST /publish/<token>/publish`    validates against fresh creator_info, one post per link
- `GET  /publish/<token>/status`     QUEUE → PUBLISHED/ERROR from Postiz
- `POST /publish/api/links`          pipeline only, header `X-Admin-Key`
- audit trail: `data/audit.log` (JSONL, no tokens/captions)

Test: `node --test publish-service/test/server.test.mjs` (mock Postiz, nothing reaches TikTok).

Deploy (home box): copy this folder to `/opt/stacks/tiktok-publish`, create `.env`
(`POSTIZ_API_KEY=…`, `ADMIN_KEY=…` ≥32 chars, chmod 600), `docker compose up -d --build`,
tunnel rule in `/etc/cloudflared/postiz-config.yml` before the postiz rule:
`path: ^/publish(/.*)?$` → `http://localhost:4010`.
