# JobPulse — What We're Building and How, Step by Step

This document is the "explain it to me like I'm starting fresh" companion to `JobPulse-MVP-Master-Prompt.md`. That other file is the spec you'd hand to an AI or use as a build checklist. This one is the plain-English story: what the project is, why each piece exists, and the order to build it in.

---

## 1. What is JobPulse, in one sentence?

A small background service that watches a LinkedIn job search for you, and the second a new job shows up, it taps you on the shoulder (a phone notification) with a link straight to it — so you're never the 50th applicant because you checked LinkedIn three hours late.

Think of it like a **doorbell camera, but for job postings**. You tell it what to watch for ("Software Engineer jobs in Zimbabwe"), it checks that "street" every couple of minutes, and it only alerts you when something *new* walks by — it doesn't bother you about things it already showed you.

---

## 2. Why build this instead of just checking LinkedIn myself?

LinkedIn's own alert emails are batched (daily/weekly) and slow. By the time you see a posting, dozens of people already applied. Being early to apply is one of the few things you can actually control in job hunting. JobPulse's whole reason to exist is **speed**: detect → notify → click → apply, in minutes instead of hours.

---

## 3. The mental model (no code yet)

Picture three characters:

1. **The Watcher** (Firebase Cloud Function, running on a timer) — sits quietly, and every few minutes goes and looks at your LinkedIn search results page.
2. **The Notebook** (Cloud Firestore, a NoSQL database) — every job the Watcher has ever seen gets written down here as its own little document, so it can tell "new" apart from "already told you about this."
3. **The Messenger** (Firebase Cloud Messaging + your phone's PWA) — whenever the Watcher writes a *new* entry in the Notebook, it taps the Messenger, who buzzes your phone.

That's the entire system. Everything else (filters, multiple job sites, auth, admin panels) is decoration we add later — the three characters above are the whole MVP.

**Why Firebase specifically:** Firebase bundles all three characters — scheduled functions, a database, and push messaging — into one platform with one login, one deployment command, and no server to keep alive yourself. That's a meaningful head start for a solo, personal-use project like this.

---

## 4. How a single cycle works, step by step

Every 1–5 minutes, this happens:

1. The Watcher wakes up (a Cloud Function scheduled trigger — Firebase's version of a cron job).
2. It looks up which searches you've asked it to watch (e.g. one document in the `search_alerts` collection: "Software Engineer, Zimbabwe").
3. It fetches that LinkedIn search results page — plain HTML, no login, using a Node.js library called `cheerio` that's good at reading HTML like a book and pulling out the bits you want (job title, company, link, etc.) — it works a lot like jQuery, if you've used that.
4. It pulls out every job card on that page and gets each one's LinkedIn job ID (a unique number LinkedIn assigns to each posting).
5. For each job ID, it checks the Notebook: "Have I written this ID down before?" In Firestore, the clever trick is to name the document itself after the job (like `LINKEDIN_4012345678`), so checking "have I seen this?" is just "does a document with this exact name already exist?" — no searching required.
   - **Yes, it exists** → do nothing, move to the next one.
   - **No, it's new** → write the document *and* tell the Messenger.
6. The Messenger (Firebase Cloud Messaging) sends a push notification: title, company, location, and — most importantly — the direct LinkedIn link.
7. You get a buzz on your phone. You tap it. It opens the job. You apply.
8. The Watcher goes back to sleep until the next cycle.

That loop, repeated forever, is the entire product.

---

## 5. Why each technical decision exists (plain English)

| Decision | Why |
|---|---|
| Name each job document after its LinkedIn job ID (e.g. `LINKEDIN_4012345678`) | This is how we avoid spamming you with the same job notification every 2 minutes forever. Instead of searching a table for a matching row (the SQL way), we just ask "does a document with this exact name exist?" — a NoSQL-native way to get the same "have I already told you this?" memory. |
| Use `cheerio` instead of a full browser (Playwright) for v0 | `cheerio` just reads HTML text — it's lightweight and fast. A full browser automation tool is heavier and only needed if LinkedIn requires you to be logged in or runs a lot of JavaScript to render the page. We start simple and only upgrade if we hit a wall. |
| Scheduled Cloud Function, not something running in your browser tab | Your phone's browser tab won't stay open and running 24/7. A Cloud Function is Firebase's always-on background worker, so it's the one responsible for "always watching." The frontend's job is just to show you results and receive notifications. |
| Firebase Cloud Messaging instead of raw Web Push | FCM handles all the messy subscription/endpoint/key bookkeeping that raw Web Push would otherwise make you build yourself. Since we're already on Firebase for the database, using FCM for push too means one platform instead of two. |
| Firestore (NoSQL, documents) instead of a relational database | For this project's shape — independent job postings, independent alerts, independent device tokens — there isn't much need for the "join tables together" power of SQL. Firestore lets each job just be its own self-contained document, which is simpler to reason about for a project this size, and it pairs naturally with the rest of the Firebase platform (Functions, FCM) with no extra setup. |
| A `JobProvider` interface even though we only build LinkedIn now | This costs us almost nothing today, but means that when we later want to add Indeed or RemoteOK, we write a new class that plugs into the same scheduled function — instead of rewriting the scheduler itself. It's the difference between building a wall socket versus hardwiring one specific lamp into the wall. |
| No login/auth in v0 | This is a tool for one person (you). Auth exists to separate *different* people's data from each other — with one user, it's pure overhead that slows down getting to a working product. We add Firebase Authentication in Phase 4 if/when this becomes multi-user. |

---

## 6. Step-by-step build order

This is the order I'd actually build things in, and roughly why that order:

### Step 1 — Firebase project setup
Create a Firebase project, enable Firestore and Cloud Messaging, install the Firebase CLI, and get a bare Cloud Functions project deploying successfully. No business logic yet — just prove the plumbing works.

### Step 2 — Firestore collections
Set up the three collections from the master prompt (`search_alerts`, `jobs`, `fcm_tokens`) — with NoSQL you don't "create" a schema up front the way you would with `CREATE TABLE`, but it's worth writing down the shape of each document before you start writing data into them, so everyone (including future-you) agrees on the fields.

**Important:** The Firestore database is Enterprise edition with an explicit database ID of `"default"` (no parentheses). The implicit default is named `(default)` — these are different. Both frontend and backend must pass the ID explicitly:
- Frontend: `getFirestore(app, "default")`
- Backend: `getFirestore(admin.app(), "default")`
This has caused `NOT_FOUND` errors twice when forgotten.

### Step 3 — The LinkedIn provider (scraper)
Write a `LinkedInJobProvider` function using `cheerio`: given a search URL, return a list of parsed jobs (title, company, location, job ID, link). Test this in isolation first — call it manually, log the results, confirm it's pulling real data — before wiring it into a scheduled function. This is the riskiest, most fragile part (HTML structure can change), so get it working and verified on its own.

### Step 4 — Dedup + save logic
Take the list from Step 3, check each job ID against Firestore using the deterministic-document-ID trick, write only the new ones. Still no notifications yet — just prove new-vs-seen detection works by running it twice and confirming the second run finds nothing new.

### Step 5 — Scheduled script
Wrap Steps 3–4 in a cron job that runs every N minutes. Implemented as a **GitHub Actions cron workflow** running `scraper/run.js` — Cloud Functions require Blaze billing which hit a blocker. Now the Watcher is actually watching on its own, unattended.

### Step 6 — FCM sending logic
Add the Firebase Admin SDK code that sends a push message to every token in `fcm_tokens` when Step 4 finds a new job. Test this by manually adding a fake/test token first, before connecting the real frontend.

### Step 7 — React PWA shell
Vite + React + Tailwind + `vite-plugin-pwa`, plus the Firebase JS SDK. Get the app installable on your phone with a manifest and service worker — before adding real features, confirm "Add to Home Screen" works and the service worker registers.

### Step 8 — Notification permission + FCM token registration
Frontend requests permission, gets an FCM token from the Firebase Messaging SDK, saves it to the `fcm_tokens` collection. Now Step 6's function has a real token to send to.

### Step 9 — Job list screen
Simple page using a Firestore `onSnapshot` listener on the `jobs` collection, rendering cards (title, company, location, "Open on LinkedIn" button) that update live as new jobs come in — no manual refresh needed, which is one of Firestore's nicer built-in behaviors.

### Step 10 — End-to-end test
Add a real search alert document, let the scheduled function run, confirm: new job document appears in Firestore → push notification arrives on your phone → tapping it opens the LinkedIn posting → the app's job list updates on its own too.

### Step 11 — Live for a few days, then iterate
Let it run against a real search for a few days. Watch for: LinkedIn changing its HTML (breaks the scraper), rate limiting/blocking (too-frequent requests), false duplicates or missed jobs, Firestore read/write costs creeping up. Fix what breaks *before* adding any Phase 2+ features.

---

## 7. What "done" looks like for v0

You'll know the MVP is genuinely working when:

- A new job posted on LinkedIn matching your saved search shows up as a push notification within a few minutes, unprompted.
- Tapping the notification takes you straight to the LinkedIn posting.
- The same job never notifies you twice.
- The app is installed on your phone's home screen like a real app.

Nothing about admin dashboards, other job sites, or AI features matters until the above is boring and reliable.

---

## 8. What comes after (only once v0 is boring and reliable)

In short order, roughly:
1. More alerts, better alert-editing UI, notification history.
2. A second job provider (proves the `JobProvider` interface actually pays off).
3. Firebase Authentication for multi-user support, if you ever want to share this with others — plus tightened Firestore Security Rules to match.
4. Smarter stuff — AI matching, more notification channels, hardening for production scale.

Full detail on all of that lives in Section 12 ("Future Roadmap") of `JobPulse-MVP-Master-Prompt.md` — this document is deliberately just about getting the first working version out the door.
