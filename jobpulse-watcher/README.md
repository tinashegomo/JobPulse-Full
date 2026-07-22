# JobPulse Watcher

Scheduled LinkedIn job search watcher for JobPulse. Runs entirely on GitHub Actions —
no billing, no server to keep alive. Reads active search alerts from Firestore, checks
LinkedIn's public search results, saves new jobs, and sends a push notification (FCM)
for each one.

## Setup

1. **Add these files to a GitHub repo** (private is fine).

2. **Get a Firebase service account key:**
   Firebase Console → Project settings → Service accounts tab → *Generate new private key*.
   This downloads a `.json` file — keep it private, don't commit it to the repo.

3. **Add it as a GitHub Actions secret:**
   Repo → Settings → Secrets and variables → Actions → *New repository secret*
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: paste the entire contents of the downloaded JSON file

4. **Make sure Firestore has at least one active alert**, e.g. a document in
   `search_alerts` with:
   ```json
   {
     "label": "Software Engineer - Zimbabwe",
     "searchUrl": "https://www.linkedin.com/jobs/search/?keywords=Software%20Engineer&location=Zimbabwe",
     "enabled": true
   }
   ```

5. **Test manually before trusting the schedule:**
   Push this repo to GitHub → Actions tab → "JobPulse Watcher" → *Run workflow*.
   Check the run logs to confirm it fetches, parses, and writes to Firestore correctly.

6. **Once a manual run works cleanly**, the `cron` trigger in
   `.github/workflows/watch.yml` takes over automatically — no further action needed.

## Notes

- The job card selectors in `scraper/run.js` (Step 4) depend on LinkedIn's current
  public search results page structure. If jobs stop appearing, this is the first
  place to check — LinkedIn may have changed their markup.
- GitHub's cron scheduler is best-effort, not exact — expect runs to sometimes be a
  few minutes late, especially under GitHub's overall load. Don't rely on
  sub-5-minute precision.
- This only reads LinkedIn's public search results page — no login, no session
  cookie, no authenticated scraping.
