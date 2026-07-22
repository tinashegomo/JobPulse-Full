# Project Brief — JobPulse

## What This Is

A mobile-first PWA that monitors LinkedIn job search results and pushes a push notification the moment a new matching job appears, with a direct link to click through and apply. Think of it as a **doorbell camera for job postings** — it watches a LinkedIn "street" for you and only alerts when something new shows up.

## Business Context

- **Domain:** Job hunting automation (personal tool).
- **User base:** Single user (the owner). No login, no multi-user, no auth in v0.
- **Core value:** Speed — detect → notify → click → apply, in minutes instead of hours. LinkedIn's own email alerts are batched daily/weekly and too slow.
- **Provider:** LinkedIn only for v0. The design must support adding Indeed, RemoteOK, Glassdoor etc. later via a `JobProvider` interface, but we only build LinkedIn now.

## MVP Scope (Sections 2–10 of the Master Prompt — BUILD ONLY THIS)

1. One job source: LinkedIn job search results page (HTML, scraped server-side with `cheerio`).
2. One or a few saved searches (keyword + location, or a raw LinkedIn search URL) stored in Firestore.
3. A scheduled Cloud Function (every 1–5 min) that:
   - Fetches the search URL
   - Parses job cards
   - Compares job IDs against Firestore (deterministic doc IDs)
   - Saves new jobs
   - Sends FCM push notifications per new job
4. A minimal React PWA that:
   - Requests notification permission and registers an FCM token
   - Shows a live list of detected jobs (title, company, location, posted time, "Open on LinkedIn" link)
   - Is installable (manifest + service worker)

## Architecture (MVP)

```
React PWA (phone)
   │  requests notification permission
   │  registers FCM token ──────────────► Firestore: fcm_tokens/{tokenId}
   │
   │  onSnapshot() real-time listener ──► Firestore: jobs collection
   ▼
Firebase Cloud Functions
   │
   ├── onSchedule (every N minutes)
   │        │
   │        ▼
   │   LinkedInJobProvider (cheerio)
   │        │  fetch search URL → parse job cards → RawJobPosting[]
   │        ▼
   │   Dedup against Firestore `jobs` (doc ID = LINKEDIN_<externalJobId>)
   │        │
   │        ├── new? → write doc to `jobs`
   │        └──      → send FCM push to all tokens in `fcm_tokens`
   ▼
Cloud Firestore
   - jobs
   - search_alerts
   - fcm_tokens
```

## Goals

1. **Notification within minutes** of a new LinkedIn posting matching saved search.
2. **One tap from phone lock screen** to the LinkedIn job posting.
3. **Never notify twice** for the same job.
4. **Installable on home screen** like a native app.
5. **Zero maintenance** — runs unattended once deployed.

## Non-Goals (v0)

- Authentication / multi-user / roles
- Admin dashboard / system logs / scheduler status UI
- Redis, Playwright / headless browser automation
- Multiple providers or provider-management UI (interface only)
- Analytics (crawl duration, success rate, keyword stats)
- Subscription / billing / pricing
- Email / Telegram / WhatsApp / SMS notification channels
- AI resume matching, cover letter generation, salary prediction
- Docker, CI/CD pipelines, staging environments

## Firestore Collections (MVP)

**`search_alerts`** — one document per saved search
```json
{
  "label": "Software Engineer - Zimbabwe",
  "searchUrl": "https://www.linkedin.com/jobs/search/?keywords=Software%20Engineer&location=Zimbabwe",
  "keyword": "Software Engineer",
  "location": "Zimbabwe",
  "enabled": true,
  "createdAt": "2026-07-17T10:00:00Z"
}
```

**`jobs`** — one document per detected job (deterministic ID: `LINKEDIN_<externalJobId>`)
```json
{
  "source": "LINKEDIN",
  "externalJobId": "4012345678",
  "title": "Junior Software Engineer",
  "company": "TechCorp",
  "location": "Harare, Zimbabwe",
  "jobUrl": "https://www.linkedin.com/jobs/view/4012345678",
  "postedText": "2 hours ago",
  "dateDetected": "2026-07-17T10:02:00Z",
  "notified": true
}
```

**`fcm_tokens`** — one document per registered device/browser
```json
{
  "token": "eXaMpLeFcMtOkEn...",
  "createdAt": "2026-07-17T09:55:00Z"
}
```

## What "Done" Looks Like for v0

- A new job posted on LinkedIn matching your saved search shows up as a push notification within a few minutes, unprompted.
- Tapping the notification takes you straight to the LinkedIn posting.
- The same job never notifies you twice.
- The app is installed on your phone's home screen like a real app.

## Documentation

- `project-md-files/JobPulse-MVP-Master-Prompt.md` — full spec (Sections 2–10 are the build instructions; Section 12 is future roadmap context only)
- `project-md-files/JobPulse-Project-Walkthrough.md` — plain-English companion explaining the "why" behind each decision

**Source of truth = the Master Prompt.** When this file and the prompt disagree, follow the prompt.
