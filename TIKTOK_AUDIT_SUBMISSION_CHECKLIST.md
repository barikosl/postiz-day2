# TikTok Direct Post — Submission Checklist & Demo Script

**For:** the 3rd Direct Post audit submission (app `7665300194573207559`).
**Built on 22/10:**
- the owner "Post to TikTok" page at `https://postiz.day2-ai.com/publish/<token>`
- the English product page at `https://postiz.day2-ai.com/publish/about`
- Postiz image `v2.22.1-day2.6` (channel tokens encrypted at rest)
- the pipeline guard: Day2 can no longer direct-post TikTok

## A. Before recording

- [ ] **Private TikTok test account**, owned by Bar/Day2 and set to **Private** in TikTok → Settings → Privacy.
  - Unaudited production apps may Direct Post only to private accounts with SELF_ONLY. That is the only way the demo can show a *successful* Direct Post.
- [ ] In that account: TikTok → Settings → Security & permissions → Manage app permissions → remove "Day2 Social Publisher", if it is there. Otherwise TikTok skips the consent screen.
- [ ] A **clean video owned by that account's owner**: 10–40 s, vertical, no logo, watermark, phone number or promo text burned in.
- [ ] Postiz healthy, on `v2.22.1-day2.5` (`docker ps`), and `https://postiz.day2-ai.com/publish/healthz` returns 200.
- [ ] Recording browser at 1920×1080, English UI (`?lang=en`), notifications off.

## B. Demo script (one continuous take per segment; captions added in post)

| # | On screen | Caption (burned in at the bottom, post-production) | Proves |
|---|---|---|---|
| 1 | `postiz.day2-ai.com/publish/about` | "Day2 Social Publisher: small businesses publish their own videos to their own TikTok account." | Product / intended use, same domain as app Web URL |
| 2 | Owner opens the TikTok connect link. TikTok login → **consent screen** (4 scopes) → Continue → back to Day2 | "The business owner connects their own TikTok account with Login Kit." | Login Kit, user.info.basic, user.info.profile, video.upload, video.publish |
| 3 | The owner link opened from WhatsApp (phone-width window) | "Day2 edited the video. The owner gets a private link to review and post it." | Owner control |
| 4 | Header: avatar + "Posting to TikTok as <nickname>" | "The account is read fresh from TikTok (creator_info) every time the page opens." | creator_info, nickname |
| 5 | Press play on the preview; edit the caption | "Playable preview. The caption is editable." | Preview, title |
| 6 | Open "Who can see this video?": nothing selected; the options are the ones TikTok returned | "No default. Only the options TikTok allows for this account." | Privacy rule |
| 7 | Interactions all unchecked; tick Comment | "Comment, Duet and Stitch are off by default (greyed out if the account disabled them)." | Interaction rule |
| 8 | Disclose on with nothing selected → button disabled + message. Your brand → "Promotional content". Branded content → "Paid partnership"; "Only me" greyed out; declaration adds the Branded Content Policy | "Commercial content disclosure, as TikTok requires." | Disclosure rules |
| 9 | Disclose off. Select "Only me". Declaration shows Music Usage Confirmation | "Music Usage Confirmation shown before posting." | Declaration |
| 10 | Press **Post to TikTok** → "Sent to TikTok… may take a few minutes" → "Posted ✓" | "Nothing is sent to TikTok until the owner presses Post." | Consent, processing notice, status |
| 11 | Open the post in the TikTok app/web, on the private account | "The video is live on the owner's profile (private, because the app is not yet audited)." | End-to-end success |

Export at 1080p H.264, ≤ 50 MB. Check the file name on the Review step.

## C. Form answers (draft; Bar approves before Submit)

- **Organization:** Day2 AI, `https://day2-ai.com`.
- **Product page:** `https://postiz.day2-ai.com/publish/about` (English). Hebrew service page: `https://day2-ai.com/services/social-video`.
- **What the app does:**
  - Day2 AI makes short videos for small local businesses in Israel from footage of their own work.
  - Each business connects its own TikTok account with Login Kit.
  - The **business owner** reviews each video on a "Post to TikTok" page, chooses privacy (no default), interactions and disclosure, and presses Post.
  - Day2 never chooses privacy and never posts on the owner's behalf.
  - Owners may instead receive the video as a draft in their TikTok inbox.
- **Users per day:** under 100. Today about 10 client businesses, 1 on TikTok, each posting 2–6 videos a month.
- **Data stored:** access/refresh tokens **encrypted with AES-256-GCM** at the application layer before they reach the database (Postiz `v2.22.1-day2.6`, key outside the DB and its backups), open_id, display name, avatar, publish_id / share URL.
  - Nothing from creator_info is stored.
  - The 14/10 answer said "encrypted tokens" while they were not; since 22/10 they are, so the statement is now true.
- **What changed since the last submission:**
  - The owner now presses Post on a dedicated page; Day2's own automation can no longer Direct Post.
  - The video in the demo has no added logo.
  - The demo shows a successful Direct Post end to end.

## D. After submitting
- [ ] Console shows "Under review" on the Direct Post block.
- [ ] Note the reference number in the memory file.
- [ ] Do not change app config (Create Revision) while under review.
