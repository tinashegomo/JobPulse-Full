# System Patterns — JobPulse

## 1. Architecture (3-Character Model)

The entire system has three characters:

1. **The Watcher** (GitHub Actions cron + `scraper/run.js`) — runs on a timer, scrapes LinkedIn + RemoteOK, deduplicates, saves new jobs, triggers notifications.
2. **The Notebook** (Cloud Firestore) — stores every job ever seen as its own document. Deterministic doc IDs (`LINKEDIN_<externalJobId>`, `REMOTEOK_<externalJobId>`) make "have I seen this?" a single document-existence check.
3. **The Messenger** (FCM + PWA service worker) — receives push from Watcher, shows notification on phone, opens the job URL on tap.

Everything else is decoration. Build these three first.

## 2. Provider Abstraction (the one piece of future-proofing worth doing now)

```javascript
// scraper/run.js — LinkedInJobProvider + RemoteOkJobProvider
interface RawJobPosting {
  externalJobId: string;
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  postedText: string;
}

interface JobProvider {
  providerName: string; // "LINKEDIN" or "REMOTEOK"
  fetchLatestJobs(searchAlert: SearchAlert): Promise<RawJobPosting[]>;
}
```

- `LinkedInJobProvider` — per-alert search (keyword + location + work type)
- `RemoteOkJobProvider` — global feed, filtered per alert by keyword
- The scheduled script loops over providers for each alert
- No plugin registry, no admin UI to toggle providers — just a hardcoded array

## 3. Dedup Strategy

- Document ID = `LINKEDIN_<externalJobId>` or `REMOTEOK_<externalJobId>` (deterministic).
- Checking "have I seen this?" = `getDoc(doc(db, "jobs", "LINKEDIN_4012345678"))` — a single cheap read, no query.
- New job → write doc + send FCM. Existing job → skip.

## 4. Scheduled Script Flow

```
GitHub Actions cron (every N minutes)
  │
  ├── Load all search_alerts where enabled == true
  │
  ├── For each alert:
  │     ├── Call LinkedInJobProvider.fetchLatestJobs(alert)
  │     ├── For each parsed job:
  │     │     ├── Check Firestore for doc "LINKEDIN_<externalJobId>"
  │     │     ├── Exists → skip
  │     │     └── New → write doc + send FCM push
  │     └── Log summary (fetched count, new count)
  │
  ├── Fetch RemoteOK global feed once
  │     ├── For each alert with keyword:
  │     │     ├── Filter feed by keyword (title + tags)
  │     │     ├── For each matching job:
  │     │     │     ├── Check Firestore for doc "REMOTEOK_<externalJobId>"
  │     │     │     ├── Exists → skip
  │     │     │     └── New → write doc + send FCM push
  │     │     └── Log summary
  │
  └── Wrap in try/catch — one failed run doesn't kill the schedule
```

## 5. Frontend Patterns (from monishaIMS reference)

### Component Organization
- Feature-based folders: `components/jobs/`, `components/alerts/`, `components/layout/`, `components/shared/`
- PascalCase filenames: `JobCard.jsx`, `AlertForm.jsx`
- One component per file, default exports
- No barrel/index.js files — direct imports

### Page Organization
- Feature-based folders: `pages/Home.jsx`, `pages/Alerts.jsx`
- Plural noun for list pages
- Each page fetches its own data via hooks

### Data Fetching
- Firestore `onSnapshot` for real-time job list (replaces TanStack Query for reads)
- TanStack Query only if hitting a Cloud Function endpoint
- Firebase writes via `addDoc`, `updateDoc`, `setDoc` directly

### Styling
- Tailwind v4 with `@theme` blocks in `index.css`
- Semantic color tokens via CSS custom properties
- Dark mode support via `.dark` class or `prefers-color-scheme`
- Custom utility classes: `glass`, `glass-strong`, `animate-fade-in`

### State Management
- No Redux/Zustand — Firestore listeners + React state is sufficient
- Local state via `useState` / `useReducer` for UI concerns
- Form state via `react-hook-form` + Yup (when forms are needed)

### Routing
- `react-router-dom` v7 with `BrowserRouter`
- Public routes: `/` (home), `/alerts`, `/install`
- Layout via nested `<Route>` with `<Outlet />`

## 6. PWA Pattern

- `vite-plugin-pwa` generates `manifest.json` and service worker
- Service worker handles:
  - Background push messages (FCM)
  - Offline caching (static assets)
  - "Add to Home Screen" prompt
- Manifest: app name "JobPulse", icons, theme color, display: standalone

## 7. Key Decisions

| Decision | Rationale |
|---|---|
| Firestore over relational DB | No joins needed; each job is self-contained; pairs natively with Firebase SDK + FCM |
| Deterministic doc IDs | O(1) dedup check instead of query; NoSQL-native pattern |
| `cheerio` over Playwright for v0 | Lightweight, fast; full browser only needed if LinkedIn requires JS rendering or auth |
| GitHub Actions over Cloud Functions | Cloud Functions require Blaze billing which hit a blocker; GitHub Actions provides free cron |
| FCM over raw Web Push | FCM handles subscription/key bookkeeping; already on Firebase for DB |
| No auth in v0 | Single user; auth separates different people's data — pure overhead with one user |
| JavaScript (not TypeScript) for frontend | User preference; faster MVP iteration |

## 8. Things to NOT do (v0)

- Do not add authentication, roles, or multi-user support.
- Do not add an admin dashboard or analytics.
- Do not add Redis, Playwright, or Docker.
- Do not add a second job provider (interface only).
- Do not add subscription/billing.
- Do not add email/Telegram/WhatsApp/SMS channels.
- Do not add AI features.
- Do not add CI/CD pipelines.
- Do not introduce libraries not listed in the tech stack without asking.
- Do not forget to wrap the scheduled script in try/catch — one failed scrape must not kill the schedule.
