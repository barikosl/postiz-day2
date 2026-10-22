# Direct Post audit: form answers (3rd submission, 22/10/2026)

Every answer below is checked against what is live today. Keep each under 1000 characters.

## Step 1: General information

- **Full Name:** leave empty; the field is optional.
- **Organization name:** Day2 AI
- **Organization website:** https://day2-ai.com
- **Describe your organization's work as it relates to TikTok:**

> Day2 AI is a small Israeli company that builds websites and makes short marketing videos for local service businesses (plumbers, renovators, movers and similar). Our product Day2 Social Publisher (https://postiz.day2-ai.com/publish/about; Hebrew service page https://day2-ai.com/services/social-video) lets each business post videos of its own work to its OWN TikTok account.
>
> The business owner connects their account with Login Kit. Day2 edits the owner's raw footage. The owner then reviews the video on a "Post to TikTok" page. There they choose privacy (no default), interactions and disclosure, and press Post.
>
> Day2 never chooses privacy and never posts on the owner's behalf.

## Step 2: API client information

- **App ID:** 7665300194573207559
- **Goal and benefit:**

> Small business owners film their work on their phone but rarely post it. With Content Posting API they post a finished video to their own profile in one step, from a page that shows exactly what TikTok will receive. It shows:
> - their account (fresh creator_info: avatar, nickname)
> - a playable preview
> - an editable caption
> - privacy from privacy_level_options with nothing preselected
> - Comment/Duet/Stitch off by default and greyed out when the account disabled them
> - commercial content disclosure with TikTok's labels
> - the Music Usage Confirmation / Branded Content Policy declarations
> - the processing notice, then the publish status
>
> The server re-checks creator_info at publish time and rejects anything the account does not allow. Each link publishes once, and every publish is audit-logged. Owners can also choose UPLOAD (inbox draft) instead.
>
> Since the last submission:
> - the owner, not Day2, now presses Post;
> - our own automation can no longer Direct Post at all;
> - the demo shows a successful Direct Post with no logo or watermark added.

- **Daily publishing users:** the lowest bracket ("Less than 100").
  - Today: about 10 client businesses, 1 on TikTok, 2–6 videos a month each.

## Step 3: Supporting documents

- **Demo video:** `C:\Users\97250\scripts\tiktok-demo\out\owner-demo-final-20261022.mp4`. Check the file name on the Review step.
- **API data fields / storage (if asked):**

> We store:
> - the access and refresh tokens, encrypted with AES-256-GCM before they are written to our database (the key is kept outside the database and its backups)
> - open_id, display name and avatar
> - publish_id and the share URL of each post
>
> Nothing returned by creator_info is stored; it is fetched fresh each time the posting page opens and again at publish time. Owners can disconnect at any time in TikTok settings.

## Step 4: Review
Bar sees this screen before Submit.
