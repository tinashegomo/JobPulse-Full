# JobPulse — MVP Master Prompt (LinkedIn Job Alert PWA)

## 0. How to Use This Document

This is the master prompt/spec for building **JobPulse**, a mobile-first PWA that watches LinkedIn job search results and pushes a notification the moment a new matching job appears, with a link to click straight through.

**Rule for whoever (or whatever AI) implements this: build Section 2 (MVP Scope) only, first.** Everything under "Future Roadmap" is architectural context so early decisions don't paint us into a corner — it is **not** a build instruction. Do not scaffold auth, multi-provider registries, admin panels, or CI/CD in v0. Ship the smallest thing that scrapes → stores → notifies → lets me click through, then we iterate phase by phase.

If an AI assistant is reading this to generate code: **stop and confirm with the user before moving to the next phase.**

---

## 1. Project Overview

- **Name:** JobPulse
- **Purpose:** Monitor a LinkedIn job search continuously; the moment a new job posting appears, store it and push a notification to my phone/browser with a direct link.
- **User base for v0:** Just me. Single-user, no login screen needed yet.
- **Extensibility requirement:** LinkedIn is provider #1. The design must not require a rewrite to add Indeed, RemoteOK, Glassdoor, etc. later — but we only build the LinkedIn provider now.

---

## 2. MVP Scope (Build This First)

- One job source: LinkedIn job search results page (HTML, scraped server-side — no login, no headless browser yet).
- One or a handful of saved searches (keyword + location, or just a raw LinkedIn search URL) stored in Firestore.
- A scheduled Cloud Function (every 1–5 min) that:
  1. Fetches the search URL
  2. Parses job cards
  3. Compares job IDs against what's already stored in Firestore
  4. Saves new jobs
  5. Sends a push notification (Firebase Cloud Messaging) per new job
- A minimal React PWA that:
  1. Requests notification permission and registers an FCM token
  2. Shows a live list of detected jobs (title, company, location, posted time, "Open on LinkedIn" link) — read straight from Firestore
  3. Is installable (manifest + service worker)
- **No** authentication, **no** admin dashboard, **no** multi-provider switcher UI, **no** analytics, **no** subscription/billing to get this running.

---

## 3. Tech Stack (MVP)

**Frontend**
- React + Vite + TypeScript
- Tailwind CSS
- `vite-plugin-pwa` (Workbox under the hood) for manifest + service worker
- Firebase SDK (`firebase/app`, `firebase/firestore`, `firebase/messaging`) for real-time job list + push registration
- TanStack Query optional here — Firestore's real-time `onSnapshot` listeners can replace a lot of what TanStack Query would otherwise do for this list, but you can still use TanStack Query for anything hitting an HTTPS Cloud Function.

**Backend**
- **Firebase** as the backend platform — this replaces Spring Boot + MySQL:
  - **Cloud Firestore** (NoSQL, document-based) as the database — Enterprise edition, explicit database ID `"default"` (not the implicit `(default)`). Both frontend and backend must pass this ID explicitly: `getFirestore(app, "default")` (frontend) / `getFirestore(admin.app(), "default")` (backend).
  - **Firebase Cloud Messaging (FCM)** for push notifications — replaces raw Web Push/VAPID plumbing, since FCM handles subscription/token management for you
  - **GitHub Actions** as the scheduler — runs the LinkedIn + RemoteOK scraper + notification logic every N minutes via cron trigger. The backend script (`scraper/run.js`) lives in a separate repo, not in this directory.
- An HTML parsing library on the Node side — `cheerio` (the Node equivalent of JSoup: loads HTML, lets you query it like jQuery) to parse the LinkedIn search results page

> **Note on the stack:** The backend uses GitHub Actions for the scheduler (free, no billing required) and Firebase for the database (Firestore) and push notifications (FCM). The backend script runs outside of Firebase's infrastructure.

**Explicitly deferred:** Redis, Playwright, Docker, CI/CD pipelines, a second job provider, multi-user auth. Add these only when a real need shows up (see Roadmap).

---

## 4. Architecture (MVP)

```
React PWA (installed on phone)
   │  requests notification permission
   │  registers FCM token ─────────────────────► Firestore: fcm_tokens/{tokenId}
   │
   │  onSnapshot() real-time listener ─────────► Firestore: jobs collection (database ID: "default")
   ▼
GitHub Actions (cron every N minutes)
   │
   ├── onSchedule
   │        │
   │        ▼
   │   LinkedInJobProvider (cheerio)
   │        │  fetch search URL → parse job cards → list of raw jobs
   │        ▼
   │   Dedup against Firestore `jobs` collection (doc ID = source_externalJobId)
   │        │
   │        ├── new job? → write doc to `jobs` collection
   │        └──          → send FCM push to all tokens in `fcm_tokens`
   ▼
Cloud Firestore (NoSQL, Enterprise edition, database ID: "default")
   - jobs
   - search_alerts
   - fcm_tokens
```

---

## 5. Provider Abstraction (the one piece of future-proofing worth doing now)

Retrofitting a provider interface later is painful; defining it up front costs almost nothing. Build **only** the LinkedIn implementation, but shape it behind an interface (TypeScript, since the backend is now Node/Cloud Functions):

```typescript
interface RawJobPosting {
  externalJobId: string;
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  postedText: string;
}

interface JobProvider {
  providerName: string; // "LINKEDIN"
  fetchLatestJobs(searchAlert: SearchAlert): Promise<RawJobPosting[]>;
}

class LinkedInJobProvider implements JobProvider {
  providerName = "LINKEDIN";
  async fetchLatestJobs(searchAlert: SearchAlert): Promise<RawJobPosting[]> {
    // fetch searchAlert.searchUrl, parse with cheerio, return RawJobPosting[]
  }
}
```

The scheduled function loops over a list of `JobProvider` implementations rather than calling LinkedIn-specific code directly. That's the entire future-proofing budget for v0 — no plugin registry, no admin UI to toggle providers, no dynamic provider config collection yet.

---

## 6. Database Schema (MVP only) — Firestore Collections

Firestore is NoSQL and document-based, so there's no `CREATE TABLE`/foreign keys — instead, each collection holds independent documents. Relationships (like "which alert found this job") are handled by storing an ID field, not a join.

**`search_alerts` collection** — one document per saved search
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

**`jobs` collection** — one document per detected job. Use a **deterministic document ID** (e.g. `LINKEDIN_<externalJobId>`) instead of an auto-generated one — this turns "does this job already exist?" into a single cheap document-existence check instead of a query, which is the natural NoSQL way to dedupe.
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

**`fcm_tokens` collection** — one document per registered device/browser
```json
{
  "token": "eXaMpLeFcMtOkEn...",
  "createdAt": "2026-07-17T09:55:00Z"
}
```

That's it for v0 — no `users`, `roles`, `companies`, `locations`, `notification_preferences`, `audit_logs` collections yet. Those come in later phases if/when multi-user shows up.

---

## 7. Scheduler Flow

1. A GitHub Actions cron workflow fires every 1–5 minutes (configurable in `.github/workflows/`).
2. Load all `search_alerts` documents where `enabled == true`.
3. For each alert, call the matching `JobProvider` (just LinkedIn for now).
4. Parse job cards → extract `externalJobId`, title, company, location, URL, posted text.
5. For each parsed job: check Firestore for a document at `jobs/LINKEDIN_<externalJobId>` (database ID: `"default"`).
   - Exists → skip.
   - Doesn't exist → write it, then trigger notification.
6. Log a simple execution summary (count fetched, count new) via Actions logging — no dedicated logs collection yet.
7. Wrap the fetch in try/catch so one failed run doesn't kill the schedule; log and continue next cycle.

---

## 8. Notification Flow

1. On first app load, frontend requests `Notification.requestPermission()`.
2. If granted, the Firebase Messaging SDK generates an FCM token for that browser/device.
3. Frontend saves that token to the `fcm_tokens` collection in Firestore (directly via the SDK, or through a small callable function).
4. When the scheduled function detects a new job, it uses the Firebase Admin SDK to send an FCM message to every token in `fcm_tokens`:
   ```json
   {
     "notification": {
       "title": "🔔 New Job: Junior Software Engineer",
       "body": "TechCorp · Harare · Posted 2 hours ago"
     },
     "data": {
       "url": "https://www.linkedin.com/jobs/view/4012345678"
     }
   }
   ```
5. The service worker's background message handler shows the notification; tapping it opens the `url` from the `data` payload directly — one tap from phone lock screen to the LinkedIn posting.

FCM handles the subscription/endpoint/key management that raw Web Push would otherwise require you to build — that plumbing is one of the practical wins of moving to Firebase.

---

## 9. API / Access Layer (MVP)

Because the frontend talks to Firestore directly via the Firebase SDK, there's no REST layer to build for reading data — this replaces most of what would've been a Spring REST controller:

```
Frontend reads:
  onSnapshot(collection(db, "jobs"))         -> live job list, newest first
  onSnapshot(collection(db, "search_alerts")) -> live alert list

Frontend writes (directly, or via a callable function if you want server-side validation):
  addDoc(collection(db, "search_alerts"), {...})   -> create alert
  updateDoc(doc(db, "search_alerts", id), {...})   -> enable/disable/edit
  setDoc(doc(db, "fcm_tokens", token), {...})      -> register push token

Backend-only (GitHub Actions cron):
  scheduled scraper + notifier  -> the scraper + notifier
```

**Critical: Firestore database ID.** The database is Enterprise edition with explicit ID `"default"` (not the implicit `(default)`). Every Firestore call must pass this:
- Frontend: `getFirestore(app, "default")`
- Backend: `getFirestore(admin.app(), "default")`

Security note: Firestore Security Rules (not Spring Security) are what should restrict who can read/write which collections. For a single-user v0 this can start permissive, but it's worth writing real rules before this is ever exposed beyond your own device.

---

## 10. Frontend Pages (MVP)

- **Home** — live list of detected jobs (card: title, company, location, posted time, "Open on LinkedIn" button), fed by a Firestore listener.
- **Permission banner** — shown until push permission is granted and an FCM token is registered.
- **Alerts (simple)** — view/add/edit the 1–few search alerts (keyword, location, or paste a LinkedIn search URL directly).
- **Install prompt** — standard PWA "Add to Home Screen" affordance.

No dashboard with charts, no notification center with read/unread states, no settings page beyond the alert list — add these in later phases if they're actually needed.

---

## 11. What NOT to Build Yet

Explicitly out of scope for v0, even though earlier research/reference docs mention them:

- Authentication, roles/permissions, multi-user support
- Admin dashboard / system logs / scheduler status UI
- Redis, Playwright / headless browser automation
- Multiple providers or a provider-management UI (interface only, per Section 5)
- Analytics (crawl duration, success rate, keyword stats, etc.)
- Subscription/billing, pricing page
- Email / Telegram / WhatsApp / SMS notification channels
- AI resume matching, cover letter generation, salary prediction
- Docker, CI/CD pipelines, staging environments

If you're an AI implementing this and find yourself about to generate any of the above, stop and check with the user first.

---

## 12. Future Roadmap (Preserved Context — Not v0 Instructions)

**Phase 2 — Personal polish**
- Multiple alerts with per-alert enable/disable, better alert builder UI
- Notification read/unread state, in-app notification history

**Phase 3 — More providers**
- Add Indeed, RemoteOK, Glassdoor, WeWorkRemotely, Greenhouse, Lever by implementing new `JobProvider` classes — no core scheduler changes needed if Section 5 was followed.
- Normalize each provider's output into the same `jobs` document shape.

**Phase 4 — Multi-user**
- Add Firebase Authentication, per-user alerts and tokens (scope `search_alerts`, `fcm_tokens`, and `jobs` reads by `userId`), tightened Firestore Security Rules.
- Admin dashboard: crawler health, logs, retry failed crawls, user management.

**Phase 5 — Intelligence**
- AI job-to-resume matching/scoring, AI cover letter drafts, job recommendation engine.

**Phase 6 — More channels**
- Email digests, Telegram bot, WhatsApp Business API alerts, daily summaries.

**Phase 7 — Production hardening**
- Firestore composite indexes for scale, Cloud Functions concurrency/cost tuning, structured logging/monitoring, load testing.

---

## 13. A Practical Note on Scraping LinkedIn

Continuously polling LinkedIn's search results with an automated client is a gray area under LinkedIn's Terms of Service, which restrict automated scraping/data collection. For a private, personal-use tool this is a common and low-visibility pattern, but it's worth being aware of the risk (rate limiting, IP blocks, account restrictions if authenticated) and revisiting official/partner APIs if this ever moves beyond personal use.

---

## 14. Directives for an AI Assistant Implementing This

1. Build strictly in phase order: **Sections 2–10 first, nothing from Section 12.**
2. After the MVP runs end-to-end locally/deployed (job detected → stored in Firestore → push received → link opens), stop and confirm before starting the next phase.
3. Don't introduce new libraries/services (Redis, Docker, Playwright, a second provider, auth, etc.) that aren't listed in Section 3 without asking first.
4. Briefly explain each non-obvious design decision as you go — especially anywhere NoSQL/Firestore modeling differs from what a relational-DB habit would expect (e.g. deterministic doc IDs instead of unique constraints, denormalized documents instead of joins).
5. Prefer the smallest working version of a feature over a "complete" version — this is an iterate-in-public MVP, not a portfolio-polish exercise (yet).
