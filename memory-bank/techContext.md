# Tech Context — JobPulse

## Stack Overview

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19 |
| Build (frontend) | Vite | 8 |
| Language | JavaScript (JSX) | ES2022+ |
| Styling | Tailwind CSS | 4 |
| Font | Plus Jakarta Sans (primary), Inter (fallback) | Google Fonts |
| Routing | react-router-dom | 7 |
| Server state | @tanstack/react-query | 5 (optional — Firestore onSnapshot may replace) |
| Icons | lucide-react | latest |
| PWA | vite-plugin-pwa (Workbox) | latest |
| Firebase SDK (frontend) | firebase/app, firebase/firestore, firebase/messaging | latest (modular v9+) |
| Backend runtime | Node.js (GitHub Actions) | — |
| Database | Cloud Firestore (NoSQL, Enterprise edition) | DB ID: `"default"` |
| Push notifications | Firebase Cloud Messaging (FCM V1) | — |
| HTML parsing (server) | cheerio | latest |
| Scheduler | GitHub Actions cron (every N min) | free, no billing required |

## Repository Layout

```
JobPulse/
├── AGENTS.md
├── memory-bank/
├── project-md-files/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── config/
│   │   ├── firebase.json          (Firebase project config — Firestore + Hosting only)
│   │   ├── firestore.rules        (per-user scoped + saved_keywords)
│   │   └── firestore.indexes.json
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── firebase-messaging-sw.js (FCM background push)
│   │   └── icons/                  (icon-192.png, icon-512.png, icon-maskable-512.png)
│   └── src/
│       ├── main.jsx               (entry point)
│       ├── App.jsx                (route table)
│       ├── index.css              (Tailwind 4 theme — Plus Jakarta Sans)
│       ├── firebase.js            (Firebase app + Firestore + Messaging init)
│       ├── api/
│       │   └── firestoreService.js  (CRUD + hideAllJobs + keywords)
│       ├── hooks/
│       │   ├── useJobs.js           (onSnapshot listener for jobs)
│       │   ├── useAlerts.js         (CRUD for search_alerts)
│       │   ├── useFCMToken.js       (permission request + token registration)
│       │   ├── useKeywords.js       (saved keywords CRUD)
│       │   └── useForegroundMessages.js
│       ├── contexts/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── MainLayout.jsx
│       │   │   ├── TopNav.jsx
│       │   │   └── BottomNav.jsx
│       │   ├── jobs/
│       │   │   ├── JobCard.jsx
│       │   │   └── JobDetailModal.jsx
│       │   ├── alerts/
│       │   │   ├── AlertCard.jsx
│       │   │   └── AlertForm.jsx
│       │   ├── auth/
│       │   │   └── ProtectedRoute.jsx
│       │   └── shared/
│       │       ├── Button.jsx      (reusable button)
│       │       ├── Input.jsx       (reusable input)
│       │       ├── Card.jsx        (reusable card)
│       │       ├── Badge.jsx       (reusable badge/chip)
│       │       ├── Modal.jsx       (dialog modal)
│       │       ├── CountrySelect.jsx
│       │       ├── PermissionBanner.jsx
│       │       ├── EmptyState.jsx
│       │       ├── LoadingSpinner.jsx
│       │       └── Toast.jsx
│       ├── pages/
│       │   ├── Home.jsx            (live job list + clear all)
│       │   ├── Alerts.jsx          (view/add/edit search alerts + saved keywords)
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       └── utils/
│           ├── buildLinkedInSearchUrl.js
│           └── groupJobsByTime.js
└── jobpulse-watcher/               (separate repo)
    ├── scraper/
    │   └── run.js                  (LinkedIn + RemoteOK + description fetching)
    └── .github/workflows/
        └── watch.yml               (cron scheduler)
```

## Firebase Configuration

### Firestore Database (Enterprise Edition)
- **Database ID:** `"default"` (no parentheses) — NOT the implicit `(default)`
- **Critical:** Every Firestore call must pass this ID explicitly:
  - Frontend: `getFirestore(app, "default")`
  - Backend: `getFirestore(admin.app(), "default")`
- This has caused `NOT_FOUND` errors twice when forgotten.

### Firestore Security Rules (v0 — permissive for single user)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Scheduler (GitHub Actions — separate repo)
- `scraper/run.js` + `.github/workflows/watch.yml` (NOT in this repo)
- Cloud Functions require Blaze billing — not used
- Schedule: every N minutes (configurable in workflow YAML)
- Authenticates to Firestore via service account (GitHub Actions secret)

## Frontend Dependencies (to install beyond scaffold)

### Production
| Package | Purpose |
|---|---|
| `react-router-dom` | Client-side routing |
| `tailwindcss` | Utility-first CSS |
| `@tailwindcss/vite` | Tailwind Vite plugin |
| `firebase` | Firebase JS SDK (app, firestore, messaging) |
| `lucide-react` | Icons |
| `@tanstack/react-query` | Optional — for anything hitting a Cloud Function |

### Dev
| Package | Purpose |
|---|---|
| `vite-plugin-pwa` | PWA manifest + service worker generation |

## API / Access Layer (MVP)

Because the frontend talks to Firestore directly via the Firebase SDK, there's no REST layer to build for reading data:

```
Frontend reads:
  onSnapshot(collection(db, "jobs"))         -> live job list, newest first
  onSnapshot(collection(db, "search_alerts")) -> live alert list

Frontend writes (directly):
  addDoc(collection(db, "search_alerts"), {...})   -> create alert
  updateDoc(doc(db, "search_alerts", id), {...})   -> enable/disable/edit
  setDoc(doc(db, "fcm_tokens", token), {...})      -> register push token

Backend (separate repo — scraper/run.js via GitHub Actions):
  onSchedule("everyFewMinutes")  -> the scraper + notifier
```

## Notification Flow

1. Frontend requests `Notification.requestPermission()`.
2. If granted, Firebase Messaging SDK generates an FCM token.
3. Frontend saves token to `fcm_tokens` collection.
4. When scheduled function detects a new job, it sends FCM to all tokens:
   ```json
   {
     "notification": {
       "title": "New Job: Junior Software Engineer",
       "body": "TechCorp · Harare · Posted 2 hours ago"
     },
     "data": {
       "url": "https://www.linkedin.com/jobs/view/4012345678"
     }
   }
   ```
5. Service worker shows notification; tapping opens the `url` from `data` payload.

## Build / Run

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # Vite dev server on :5173
npm run build        # Production build
npm run lint         # ESLint check
```

**Backend:** lives in separate repo (`scraper/run.js`), deployed via GitHub Actions cron.

## Design Tokens (from monishaIMS reference)

The frontend will use a Tailwind v4 CSS-based theme with semantic tokens:
- Custom brand color palette (purple-based or adapted for JobPulse)
- Inter font family (body)
- Light/dark mode via CSS custom properties
- Spacing scale, border radius, elevation (shadows)
- Glassmorphism utilities for cards/panels

## Field Names (Firestore-Authoritative)

Field names are defined in the Firestore collections above. When consuming data, always use the exact field names from the document shapes:
- `jobs`: `source`, `externalJobId`, `title`, `company`, `location`, `jobUrl`, `postedText`, `dateDetected`, `notified`
- `search_alerts`: `label`, `searchUrl`, `keyword`, `location`, `enabled`, `createdAt`
- `fcm_tokens`: `token`, `createdAt`
