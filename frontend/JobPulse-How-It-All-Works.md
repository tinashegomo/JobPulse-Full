# JobPulse — How Everything Actually Works

This document explains, in plain English with examples, exactly what's running behind
JobPulse, what each piece does, and how they all talk to each other. Read this when
you (or an AI helping you later) need to remember "wait, how does this actually work
again?"

---

## 1. The Big Picture — Three Separate Systems Working Together

JobPulse isn't one single program. It's **three separate systems** that don't know
much about each other directly — they only communicate by reading and writing to a
shared database (Firestore). Think of it like three different people working in the
same shared notebook: none of them talk to each other directly, but they all read and
write to the same pages.

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   cron-job.org   │ ──POST─▶│  GitHub Actions   │ ──R/W──▶│  Cloud Firestore │
│  (the alarm      │  every  │  (the worker that │         │  (the shared     │
│   clock)         │  10 min │   runs run.js)    │         │   notebook)      │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                                                    ▲
                                                                    │ reads/writes
                                                                    │
                                                            ┌──────────────────┐
                                                            │   React PWA      │
                                                            │  (what you see   │
                                                            │   on your phone) │
                                                            └──────────────────┘
```

- **cron-job.org** is a free external alarm clock. Its only job is to say "wake up
  and run!" to GitHub every 10 minutes.
- **GitHub Actions** is the actual worker. When it wakes up, it runs a Node.js script
  called `run.js`, which fetches jobs from LinkedIn and RemoteOK, and saves anything
  new into Firestore.
- **Cloud Firestore** is the shared database — the one place both the backend script
  and the frontend app read from and write to.
- **The React PWA** (the app on your phone) never talks to LinkedIn, RemoteOK, or
  GitHub Actions directly. It only ever talks to Firestore — reading the job list,
  saving your search alerts, registering your device for notifications.

This separation matters: the backend (scraping) and the frontend (what you see) are
completely independent programs that just happen to share a database. You could
delete the entire frontend app and the backend would keep scraping and saving jobs
just fine — there'd just be nothing showing them to you.

---

## 2. What GitHub Actions Actually Is

GitHub Actions is a feature built into GitHub that lets you run code automatically,
on a computer GitHub provides for free (you never touch or manage this computer
yourself). Think of it like this: GitHub keeps a small fleet of temporary, disposable
computers on standby. When something tells GitHub "run this workflow," GitHub grabs
one of those computers, sets it up fresh, runs your instructions on it, then throws
that computer away when it's done. Every single run starts from a completely clean
slate — nothing is remembered between runs except what you've explicitly saved
somewhere (like Firestore, or GitHub's own encrypted "Secrets").

**In JobPulse's case**, the instructions GitHub Actions runs are: "download the
`jobpulse-watcher` repo's code, install its dependencies, then run `node
scraper/run.js`." That's it — that's the entire job GitHub Actions does. It doesn't
know anything about LinkedIn, Firestore, or your app; it just faithfully runs
whatever `run.js` tells it to do, using a real (but temporary) internet connection to
actually reach LinkedIn's and RemoteOK's servers.

**Why we needed this at all:** your phone or laptop being open isn't a reliable way
to run a scraper every 10 minutes forever — you'd have to leave your computer on and
the app open permanently. GitHub Actions solves this by being an "always available"
computer that doesn't belong to you and doesn't care if your laptop is closed.

---

## 3. The `jobpulse-watcher` Repo — File by File

This is a separate GitHub repository from your actual PWA app — it exists purely to
hold the backend scraper and its GitHub Actions configuration. Here's exactly what's
in it and what each file does.

```
jobpulse-watcher/
├── scraper/
│   └── run.js              ← the actual scraper program (the "brain")
├── .github/
│   └── workflows/
│       └── watch.yml       ← tells GitHub Actions HOW and WHEN to run run.js
├── package.json             ← lists what external code libraries run.js needs
└── README.md                 ← setup instructions for a human reading the repo
```

### 3a. `package.json` — the shopping list

Before `run.js` can run, it needs two external code libraries that it didn't write
itself:
- **`firebase-admin`** — lets a Node.js script talk to Firestore with full
  administrator access (this is different from how the frontend talks to Firestore —
  more on that in Section 7).
- **`cheerio`** — lets the script read a webpage's raw HTML and pick out specific
  pieces of it, similar to how you'd use your browser's "Inspect Element" to find
  a particular headline or price on a page, except done automatically in code.

`package.json` is just a list saying "this project needs these two libraries." When
GitHub Actions runs `npm install`, it reads this list and downloads exactly those
libraries fresh, every single run (remember — every run starts from a blank
computer).

### 3b. `.github/workflows/watch.yml` — the instruction sheet

This file is GitHub Actions' actual instruction manual. In plain English, it says:

> "When triggered, grab a fresh Ubuntu Linux computer, download this repo's code
> onto it, install Node.js version 20, run `npm install` to fetch the two libraries
> above, then run `node scraper/run.js` — and give that script one secret piece of
> information (`FIREBASE_SERVICE_ACCOUNT`) so it's allowed to write to Firestore."

The current version is triggered only by `workflow_dispatch` — meaning "someone (or
something) explicitly asked me to run right now," as opposed to GitHub's own internal
clock deciding when to run it (which is what we removed, since it was unreliable —
see Section 5).

### 3c. `scraper/run.js` — the actual brain of the operation

This is the real program — everything else just supports getting this file to
actually execute. It's explained in full, step by step, in Section 6.

### 3d. `README.md`

Just plain-English setup notes for a human — how to get the service account key, add
it as a GitHub secret, and test the workflow manually. Not read by any code; purely
for you (or another developer) to reference later.

---

## 4. The Secret: `FIREBASE_SERVICE_ACCOUNT`

`run.js` needs permission to read and write Firestore data. That permission comes
from a **service account key** — think of it as a master password specifically for
this one script, generated from your Firebase project, that proves to Firestore "yes,
this script is allowed to act as an administrator on this database."

This key is never written into any file in the repo (that would be like leaving your
house key taped to your front door). Instead, it's stored as an encrypted **GitHub
Secret** on the repo itself — a value only accessible to workflow runs on that
specific repo, invisible in the code, invisible to anyone browsing the repo's files.
`watch.yml` pulls it in at run time and hands it to `run.js` as an environment
variable, which is just a temporary piece of information available only while that
one run is executing.

---

## 5. cron-job.org — Why It Exists and How It Connects

**The problem it solves:** GitHub Actions has its own built-in scheduling feature
(you write a `cron:` line and it's supposed to run automatically on that timer). We
used this originally, set to run every 10 minutes. In practice, GitHub's own
scheduling queue is unreliable under load — instead of every 10 minutes, real runs
were happening roughly once an hour, sometimes with even longer gaps. This is a
known, documented limitation of GitHub's free scheduling feature — not something
broken in your setup.

**The fix:** instead of trusting GitHub's internal clock, we use an external,
dedicated alarm-clock service — **cron-job.org** — whose only job in life is
reliably firing off a web request on a schedule. Every 10 minutes, cron-job.org sends
a POST request to a specific GitHub API address:

```
https://api.github.com/repos/tinashegomo/jobpulse-watcher/actions/workflows/watch.yml/dispatches
```

This is GitHub's official "please run this specific workflow right now" address.
Along with the request, cron-job.org includes an **Authorization header** containing
a GitHub Personal Access Token — proof that whoever's asking is actually allowed to
trigger workflows on this repo.

**Why this is more reliable:** when GitHub receives this kind of request, it treats
it the same as if a human had clicked the green "Run workflow" button — a direct,
explicit request — rather than something sitting in GitHub's own lower-priority
internal scheduling queue. That's the entire trick: cron-job.org does the reliable
timing, GitHub just handles "run this right now" requests promptly, and the two
combined give you actual ~10-minute intervals instead of ~60-minute ones.

**Concrete example of what happens every 10 minutes, invisibly, in the background:**

```
9:00:00 AM — cron-job.org's clock hits the 10-minute mark
9:00:00 AM — cron-job.org sends: POST .../watch.yml/dispatches  {"ref":"main"}
9:00:01 AM — GitHub receives it, checks the token is valid, queues the workflow
9:00:03 AM — GitHub Actions spins up a fresh Ubuntu computer
9:00:08 AM — that computer downloads your repo's code
9:00:12 AM — npm install finishes
9:00:14 AM — node scraper/run.js starts running
9:00:22 AM — run.js finishes: found 3 new jobs, saved them, sent notifications
9:00:22 AM — the temporary computer is destroyed
9:10:00 AM — the whole cycle repeats
```

---

## 6. `run.js` — The Actual Brain, Explained Section by Section

This is the file that does all the real work. Here's what happens, in order, every
single time it runs.

### Step 1 — Prove it's allowed to access Firestore

```javascript
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore(admin.app(), "default");
```

This reads the secret key (passed in by `watch.yml`) and uses it to "log in" as an
administrator to your specific Firestore database. The `"default"` bit matters — your
particular Firestore database has that as its literal ID (a quirk we discovered
during setup), so the script has to say so explicitly, or it can't find the database
at all.

### Step 2 — Load everyone's active search alerts

```javascript
const alerts = await getActiveAlerts();
```

This asks Firestore: "give me every document in the `search_alerts` collection where
`enabled` is `true`." This is how the script knows what to search for — it has no
idea what jobs you want until it reads this. If you (or User B, or User C) have 5
alerts saved between you, this returns all 5, regardless of who they belong to — the
script processes everyone's alerts in the same run.

**Example:** if your alert says `keyword: "React Developer"`, `location: "Canada"`,
this step is what hands that information to the rest of the script.

### Step 3 — Fetch and read LinkedIn's search results, per alert

For each alert, the script builds a LinkedIn search URL (using the alert's saved
`searchUrl` field) and downloads that page's raw HTML — the same HTML your browser
would receive, just without a visible browser window.

```javascript
const html = await fetchSearchPage(alert.searchUrl);
const rawJobs = parseJobCards(html);
```

`cheerio` then reads through that HTML looking for repeating chunks that represent
each job listing ("job cards"), and pulls out the title, company, location, a link,
and LinkedIn's own posted-time text (like `"3 hours ago"`).

**Example of what one parsed job looks like internally:**
```javascript
{
  externalJobId: "4012345678",
  title: "React Developer",
  company: "Acme Corp",
  location: "Toronto, Canada",
  jobUrl: "https://www.linkedin.com/jobs/view/4012345678",
  postedText: "3 hours ago"
}
```

### Step 4 — Figure out exactly how old each job actually is

```javascript
const ageHours = parseRelativeHoursAgo(job.postedText);
```

LinkedIn only gives text like `"3 hours ago"`, not an exact date/time. This function
converts that text into an actual number (`3`), so the script can compare it against
your recency setting.

### Step 5 — Throw away anything too old

```javascript
const recentJobs = rawJobs.filter((job) => job.ageHours <= MAX_JOB_AGE_HOURS);
```

`MAX_JOB_AGE_HOURS` is currently `10`. Any job older than 10 hours gets discarded
right here — it's never saved, never notified about. This is what makes JobPulse
"recent jobs only" instead of showing you a job posted three weeks ago.

### Step 6 — Do the same thing for RemoteOK, but slightly differently

RemoteOK doesn't work like LinkedIn — there's no way to search it with a custom URL
per alert. Instead, the script fetches RemoteOK's *entire* public job feed once per
run (not once per alert), then checks each of your alerts against that same feed
locally, using word-matching:

```javascript
function matchesAlertKeywordGeneric(job, alert) {
  // splits "React Developer" into ["react", "developer"]
  // matches if EITHER word appears in the job's title or tags
}
```

**Example:** your alert keyword `"React Developer"` will match a RemoteOK job titled
`"Senior React Engineer"` (because "react" appears), even though the exact phrase
"React Developer" never appears anywhere in that listing.

RemoteOK gives an *exact* posted timestamp (unlike LinkedIn's vague text), so its
recency filtering is more precise.

### Step 7 — Check if each job has ever been saved before (the shared cache)

```javascript
await ensureJobCached(job, source);
```

Every job, from either source, gets a unique ID like `LINKEDIN_4012345678` or
`REMOTEOK_98765`. This step checks: "does a document with this exact ID already
exist in the `jobs` collection?" If yes, nothing happens — we already have this job's
details saved, no need to save them again. If no, it's saved for the first time. This
collection is **shared across every user** — it's just a factual record of "here's a
job that exists," not tied to any one person.

### Step 8 — Check if THIS SPECIFIC user has been notified about THIS SPECIFIC job

```javascript
const alreadyNotified = await hasUserBeenNotified(alert.userId, source, job.externalJobId);
if (alreadyNotified) return; // skip — don't notify again
```

This is the key trick that makes multi-user notifications work correctly. Even if
the job itself was already saved (because some *other* user's alert found it
earlier), this checks a completely separate record — `notified_jobs` — keyed to
*this* user specifically. So if User A and User B both have a "Software Engineer"
alert, and a matching job appears, **both** get notified independently, because
each user has their own separate "have I seen this?" record.

**Concrete example:**
```
Job LINKEDIN_4012345678 already exists in the `jobs` collection (User A's alert
found it 5 minutes ago and User A was already notified).

User B's alert also matches this same job on this run.
→ hasUserBeenNotified("userB_uid", "LINKEDIN", "4012345678") → false
→ User B gets notified too, even though the job itself wasn't "new" to the system.
```

### Step 9 — Actually send the push notification

```javascript
await notifyUser(alert.userId, job);
```

This looks up every device token the *specific matching user* has registered (from
the `fcm_tokens` collection, filtered by that user's ID), and sends a push
notification to just those devices — title, company/location, and a link that opens
the job directly when tapped.

### Step 10 — Log everything, so you can debug later

Every step prints a line to GitHub Actions' log output — how many alerts were
checked, how many jobs were found per source, how many passed the recency filter,
and which specific ones were new. This is exactly what you've been pasting to me
throughout this project to diagnose issues.

---

## 7. The Firestore Collections — What Each One Actually Stores

Firestore doesn't have "tables" like a traditional database — it has **collections**
of independent **documents**. Here's what each collection in JobPulse is for, and who
reads/writes it.

| Collection | What it stores | Written by | Read by |
|---|---|---|---|
| `search_alerts` | Each user's saved searches (keyword, location, workType, userId) | Frontend (when you create/edit an alert) | Both — backend reads it to know what to search; frontend reads it to show your alert list |
| `jobs` | Every job ever detected, from any source, for any user — a shared cache of raw job details | Backend only (`run.js`) | Frontend (to show the job list) |
| `notified_jobs` | Per-user record of "has THIS user been notified about THIS job" + seen/hidden status | Backend (notification tracking) + Frontend (seen/hide actions) | Both |
| `fcm_tokens` | Each user's registered device(s) for push notifications | Frontend (when you grant notification permission) | Backend only (to know who to notify) |

**Why `jobs` is separate from `notified_jobs`:** a job's *existence* is a fact shared
by everyone (the job really was posted, everyone should be able to see it in their
list if it matches their alert) — but whether *you specifically* have been notified,
seen it, or hidden it is personal to you. Mixing these together would mean one user
marking a job as "seen" would hide it from everyone else too, which isn't what you
want.

---

## 8. How the Frontend Connects to All of This

The React PWA app (your actual phone-installable app) never talks to LinkedIn,
RemoteOK, or GitHub Actions. It only ever talks to Firestore directly, using the
Firebase JavaScript SDK (a different, more restricted way of connecting than the
backend's admin access).

**What the frontend does, concretely:**

- **Login/Registration** — uses Firebase Authentication (separate from Firestore, but
  part of the same Firebase project) to know who you are. Every alert and token you
  create gets tagged with your unique `userId`.
- **Creating an alert** — writes a new document into `search_alerts` with your
  keyword, location, work type, and your `userId` attached. The backend doesn't find
  out about this instantly — it'll pick it up on its *next* scheduled run (up to ~10
  minutes later).
- **Viewing the job list** — uses a *live listener* (`onSnapshot`) on the `jobs`
  collection, filtered/sorted by `postedAt`. This means the moment the backend saves
  a new job, your app's list updates automatically, with no manual refresh — Firestore
  pushes the update to your open app in real time.
- **Registering for push notifications** — when you grant permission, the app asks
  Firebase for a device-specific "push token" and saves it to `fcm_tokens` with your
  `userId` attached. This is what the backend's `notifyUser()` step looks up later.
- **Marking a job as seen / hiding it** — writes to your personal `notified_jobs`
  document for that job, without touching the shared `jobs` document at all.

---

## 9. The Full Journey of One Job — A Worked Example

Let's trace exactly what happens from the moment a real job gets posted on LinkedIn,
to the moment you see it on your phone.

1. **9:03 AM** — A company posts "React Developer, Toronto" on LinkedIn.
2. **9:10 AM** — cron-job.org's clock hits the 10-minute mark, sends its trigger
   request to GitHub.
3. **9:10:05 AM** — GitHub Actions spins up, downloads `jobpulse-watcher`, installs
   dependencies, runs `run.js`.
4. **9:10:12 AM** — `run.js` loads your alert: `keyword: "React Developer",
   location: "Canada"`.
5. **9:10:13 AM** — It fetches your LinkedIn search URL, finds this new job card
   among the results, reads `"7 minutes ago"` as the posted text.
6. **9:10:13 AM** — Converts `"7 minutes ago"` into `0.12 hours` — well within your
   10-hour limit, so it survives the recency filter.
7. **9:10:14 AM** — Checks Firestore: does `jobs/LINKEDIN_4012345678` exist? No —
   this is the first time anyone's alert has found it. It gets saved, with a real
   computed `postedAt` timestamp (roughly 9:03 AM, based on that "7 minutes ago"
   text).
8. **9:10:14 AM** — Checks: has *you specifically* been notified about this job
   before? No. Looks up your registered device tokens in `fcm_tokens`.
9. **9:10:15 AM** — Sends a push notification to your phone: "🔔 New Job: React
   Developer — Acme Corp · Toronto, Canada."
10. **9:10:15 AM** — Marks `notified_jobs/yourUserId_LINKEDIN_4012345678` as done, so
    you never get notified about this exact job again.
11. **9:10:22 AM** — `run.js` finishes, the temporary GitHub computer is destroyed.
12. **9:10:16 AM (slightly before, actually)** — Your phone buzzes. You tap the
    notification, it opens the LinkedIn job page directly.
13. **Meanwhile, in the app** — since your job list uses a live Firestore listener,
    the job also silently appears at the top of your in-app list, sorted by its real
    `postedAt` time, without you needing to refresh anything.

From the job being posted (9:03 AM) to you seeing the notification (9:10 AM), the
total delay was about **7 minutes** — mostly just waiting for the next scheduled
check. That's the entire value proposition of everything built here: turning "I
might see this on LinkedIn hours or days later" into "I know within about 10 minutes
of it going up."

---

## 10. Quick Reference / Glossary

- **GitHub Actions** — GitHub's free service for running code automatically on
  temporary, disposable computers.
- **Workflow** — the instruction file (`watch.yml`) telling GitHub Actions what to do
  and when.
- **`workflow_dispatch`** — a trigger type meaning "run this right now, because
  someone/something explicitly asked" — as opposed to GitHub's own internal
  scheduling clock.
- **cron-job.org** — an external, free service that reliably sends a "run now"
  request to GitHub every 10 minutes, working around GitHub's own unreliable
  internal scheduler.
- **Personal Access Token (PAT)** — a password-like credential that proves
  cron-job.org is allowed to trigger workflows on your repo — scoped narrowly to just
  this one repo and just "Actions" permission.
- **Service Account Key** — a separate credential, stored as a GitHub Secret, that
  lets `run.js` act as an administrator on your Firestore database.
- **Firestore** — the shared, NoSQL (document-based) database everything reads and
  writes to.
- **Collection / Document** — Firestore's version of a "table" and a "row" — a
  collection (like `jobs`) holds many documents, each one an independent record.
- **`onSnapshot`** — the frontend's way of getting live, automatic updates from
  Firestore without needing to manually refresh.
- **FCM (Firebase Cloud Messaging)** — the system that actually delivers push
  notifications to your phone/browser.
- **Deterministic document ID** — naming a document after something unique about it
  (like `LINKEDIN_4012345678`) so checking "does this already exist?" is a simple,
  fast lookup instead of a search.
