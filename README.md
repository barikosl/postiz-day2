# postiz-day2

Day2 AI's build of [Postiz](https://github.com/gitroomhq/postiz-app) for `postiz.day2-ai.com`.
Upstream is checked out at a pinned tag, the patches in `patches/` are applied, and the
image is built with upstream's own `Dockerfile.dev` and pushed to `ghcr.io/barikosl/postiz-day2`.

## Why a fork-less build

- The home server that runs Postiz has 8GB RAM and cannot build it (Next.js needs a 4GB heap).
- Two things upstream has not shipped that we need:
  1. **TikTok Content Posting API UX compliance** (`patches/0001-tiktok-audit-ux.patch`) —
     TikTok's [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines)
     require: creator nickname shown, privacy options from `creator_info` with **no default**,
     interaction toggles off by default and greyed out when the creator disabled them,
     commercial-content disclosure with "Promotional content" / "Paid partnership" labels and
     at-least-one-brand rule, branded content never private, the Music Usage Confirmation /
     Branded Content Policy declarations, video duration vs `max_video_post_duration_sec`, and
     the "may take a few minutes to process" notice. Needed to pass TikTok's app audit.
  2. **Graph API v23** — upstream hardcodes `v20.0`, retired by Meta on 2026-09-24
     (gitroomhq/postiz-app#1807). Applied as a `sed` in the workflow.

## Build

Trigger **Actions → Build postiz-day2 → Run workflow** (or push to `main`).
Inputs: `postiz_ref` (upstream tag), `image_tag` (published tag).

## Deploy (home server)

```
docker pull ghcr.io/barikosl/postiz-day2:<tag>
# /opt/stacks/postiz/compose/docker-compose.override.yml → image: ghcr.io/barikosl/postiz-day2:<tag>
free -m   # the box is RAM-oversubscribed; check before restarting anything
docker compose up -d postiz
```

## Updating upstream

Bump `postiz_ref`; if `git apply` fails, regenerate the patch against the new tag.
Drop patch 2 (the sed) once upstream bumps the Graph version; drop patch 1 if upstream
ever ships an audit-compliant TikTok composer.
