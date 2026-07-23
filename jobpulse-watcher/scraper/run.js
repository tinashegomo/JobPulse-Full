/**
 * JobPulse Watcher
 * -----------------
 * Runs on a schedule via GitHub Actions. Each run:
 *   1. Loads active search alerts from Firestore (each alert belongs to a user)
 *   2. Fetches each LinkedIn search results page + the RemoteOK feed + ApplyNow
 *   3. Parses job cards / entries out of each source
 *   4. Computes a real `postedAt` timestamp for each job
 *   5. Filters out anything older than MAX_JOB_AGE_HOURS
 *   6. Caches job details globally (shared across all users)
 *   7. Tracks notification state PER USER PER JOB
 *
 * Requires FIREBASE_SERVICE_ACCOUNT env var to be set to the full JSON
 * contents of a Firebase service account key (passed in via GitHub Actions
 * secrets — see .github/workflows/watch.yml).
 */

const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const cheerio = require("cheerio");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Only keep jobs posted within this many hours.
const MAX_JOB_AGE_HOURS = 10;

// ---------------------------------------------------------------------------
// 1. Initialize firebase-admin using the service account
// ---------------------------------------------------------------------------

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT env var. Aborting.");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

console.log("Using project ID:", serviceAccount.project_id);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore(admin.app(), "default");

db.listCollections()
  .then((cols) => console.log("Collections found:", cols.map((c) => c.id)))
  .catch((err) => console.error("listCollections failed:", err.message));

// ---------------------------------------------------------------------------
// 2. Load active search alerts (each must belong to a user)
// ---------------------------------------------------------------------------

async function getActiveAlerts() {
  const snapshot = await db
    .collection("search_alerts")
    .where("enabled", "==", true)
    .get();

  const alerts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const missingUserId = alerts.filter((a) => !a.userId);
  if (missingUserId.length > 0) {
    console.warn(
      `  WARNING: ${missingUserId.length} alert(s) have no userId and will be skipped:`,
      missingUserId.map((a) => a.id)
    );
  }

  return alerts.filter((a) => a.userId);
}

// ---------------------------------------------------------------------------
// 3. Recency + posted-time helpers
// ---------------------------------------------------------------------------

function parseRelativeHoursAgo(text) {
  if (!text) return null;
  const normalized = text.toLowerCase().trim();

  if (normalized.includes("just now") || normalized.includes("moment")) {
    return 0;
  }

  const match = normalized.match(
    /(\d+)\s*(minute|min|m\b|hour|hr|h\b|day|d\b|week|w\b|month|mo)/
  );
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (unit.startsWith("min") || unit === "m") return value / 60;
  if (unit.startsWith("hour") || unit === "hr" || unit === "h") return value;
  if (unit.startsWith("day") || unit === "d") return value * 24;
  if (unit.startsWith("week") || unit === "w") return value * 24 * 7;
  if (unit.startsWith("month") || unit === "mo") return value * 24 * 30;

  return null;
}

function hoursAgoFromDate(date) {
  if (!date || isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function hoursAgoToDate(hoursAgo) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// 4. LinkedIn provider
// ---------------------------------------------------------------------------

async function fetchSearchPage(searchUrl) {
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; JobPulseBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${searchUrl}`);
  }

  return await response.text();
}

// NOTE: This selector logic depends on LinkedIn's current public search
// results page structure. If LinkedIn changes their markup, this is the
// part that will need updating — check here first if jobs stop appearing.
function parseJobCards(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  $("div.base-card").each((_, el) => {
    const card = $(el);

    const title = card.find("h3.base-search-card__title").text().trim();
    const company = card.find("h4.base-search-card__subtitle").text().trim();
    const location = card.find("span.job-search-card__location").text().trim();
    const jobUrl = card.find("a.base-card__full-link").attr("href");
    const postedText = card.find("time").text().trim();

    const urn = card.attr("data-entity-urn") || "";
    const externalJobId = urn.split(":").pop();

    if (externalJobId && title && title.toLowerCase() !== "hire feed") {
      jobs.push({ externalJobId, title, company, location, jobUrl, postedText });
    }
  });

  return jobs;
}

/**
 * Fetches an individual LinkedIn job's own page and extracts the FULL
 * description as HTML (not plain text). Using .html() instead of .text()
 * matters a lot here: .text() strips every <p>, <li>, <strong> tag and mashes
 * all the text together with no separators — that's what caused earlier
 * descriptions to look like "agriculture?Build with AI" with no spacing.
 * Keeping the HTML preserves paragraph breaks and bullet lists, so the
 * frontend can render real structure instead of one flat block of text.
 *
 * This is only called for genuinely NEW jobs (see the LinkedIn loop in
 * main() below) — not on every run for jobs already saved. LinkedIn's search
 * results page never includes the full description, only the individual job
 * page does, so this is a second, separate fetch per newly detected job.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLinkedInJobDescription(jobUrl) {
  if (!jobUrl) return "";

  try {
    const html = await fetchSearchPage(jobUrl);
    const $ = cheerio.load(html);

    // NOTE: LinkedIn's public job page markup can change — if descriptions
    // stop appearing, these selectors are the first thing to check.
    const container =
      $("div.show-more-less-html__markup").first().length
        ? $("div.show-more-less-html__markup").first()
        : $("div.description__text").first().length
        ? $("div.description__text").first()
        : $("div.job-details-workflow__markdown").first();

    if (container.length === 0) {
      console.log("    (no description container found on job page)");
      return "";
    }

    return container.html()?.trim() || "";
  } catch (err) {
    console.warn(`    Failed to fetch LinkedIn job description: ${err.message}`);
    return "";
  }
}

// ---------------------------------------------------------------------------
// 5. RemoteOK provider
// ---------------------------------------------------------------------------

async function fetchRemoteOkFeed() {
  const response = await fetch("https://remoteok.com/api", {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; JobPulseBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`RemoteOK fetch failed (${response.status})`);
  }

  const data = await response.json();

  return data.slice(1).map((job) => ({
    externalJobId: String(job.id),
    title: job.position || "",
    company: job.company || "",
    location: job.location || "Remote",
    jobUrl: job.url || (job.id ? `https://remoteok.com/remote-jobs/${job.id}` : ""),
    postedText: job.date || "",
    postedDate: job.date ? new Date(job.date) : null,
    tags: Array.isArray(job.tags) ? job.tags : [],
    description: job.description || "",
  }));
}

// ---------------------------------------------------------------------------
// 5b. ApplyNow (applynow.co.zw) provider — Zimbabwe job listings
// ---------------------------------------------------------------------------

/**
 * Fetches ApplyNow's Zimbabwe jobs archive page.
 *
 * No company field is extracted here — just title, link, and posted time, so
 * you can click straight through to the job page. This site is built with
 * Elementor (a WordPress page builder), and these selectors follow its
 * standard "Posts" widget class naming convention — if no jobs come through,
 * inspect the live page's real markup (browser DevTools -> Inspect on a job
 * title) and update these selectors, same as the LinkedIn note above.
 */
async function fetchApplyNowFeed() {
  const html = await fetchSearchPage("https://applynow.co.zw/category/zimbabwe/");
  const $ = cheerio.load(html);
  const jobs = [];

  $(".elementor-post").each((_, el) => {
    const post = $(el);
    const linkEl = post.find(".elementor-post__title a").first();
    const title = linkEl.text().trim();
    const jobUrl = linkEl.attr("href");
    const postedText = post
      .find(".elementor-post-date, .elementor-post__meta-data")
      .first()
      .text()
      .trim();

    if (!title || !jobUrl) return;

    // No numeric job ID is exposed — use the URL's slug as a stable unique ID
    const slugMatch = jobUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/?$/);
    const externalJobId = slugMatch ? slugMatch[4] : jobUrl.replace(/\W+/g, "_");

    jobs.push({
      externalJobId,
      title,
      company: "",
      location: "Zimbabwe",
      jobUrl,
      postedText,
      description: "", // not available on the listing page
    });
  });

  return jobs;
}

// A small list of common words that are too generic to usefully match on
// their own (e.g. matching "developer" alone would match almost every dev
// job regardless of stack — still allowed, since many providers' tags are
// broad anyway, but words like "a", "in", "of" etc. are filtered out
// entirely since they'd match nearly anything).
const STOPWORDS = new Set(["a", "an", "the", "in", "on", "of", "for", "and", "or"]);

/**
 * GENERIC, provider-agnostic keyword matcher — not tied to any one source.
 *
 * Use this for any provider that returns a broad, UNFILTERED feed that needs
 * local keyword matching against an alert (e.g. RemoteOK, ApplyNow; any
 * future public API/feed that doesn't accept a search-by-keyword URL
 * parameter).
 *
 * Do NOT use this for providers like LinkedIn, where the search URL itself
 * (via its `keywords=` parameter) already filters results server-side before
 * your code ever sees them — adding local matching on top there would be
 * redundant, since LinkedIn never returns unrelated jobs in the first place.
 *
 * Matches if ANY significant word from the alert's keyword phrase appears in
 * the job's title or tags — not the full phrase as one block. This matters
 * for feeds (like RemoteOK) that tag jobs with single words (e.g. "react",
 * "backend"), where an alert like "React Developer" would never match a job
 * tagged just "react" under a strict full-phrase match.
 *
 * `tags` is optional — pass an empty array for providers with no tag concept;
 * matching will just fall back to the title alone.
 */
function matchesAlertKeywordGeneric(job, alert) {
  if (!alert.keyword) return false;

  const words = alert.keyword
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

  if (words.length === 0) return false;

  const titleLower = (job.title || "").toLowerCase();
  const tagsLower = (job.tags || []).map((t) => t.toLowerCase());

  return words.some(
    (word) => titleLower.includes(word) || tagsLower.some((tag) => tag.includes(word))
  );
}

// ---------------------------------------------------------------------------
// 6. Global job cache (shared across all users)
// ---------------------------------------------------------------------------

async function jobExists(source, externalJobId) {
  const doc = await db.collection("jobs").doc(`${source}_${externalJobId}`).get();
  return doc.exists;
}

async function saveJob(job, source) {
  const docRef = db.collection("jobs").doc(`${source}_${job.externalJobId}`);
  await docRef.set({
    source,
    externalJobId: job.externalJobId,
    title: job.title,
    company: job.company,
    location: job.location,
    jobUrl: job.jobUrl,
    postedText: job.postedText,
    postedAt: admin.firestore.Timestamp.fromDate(job.postedAt),
    dateDetected: admin.firestore.FieldValue.serverTimestamp(),
    description: job.description || "",
  });
}

// ---------------------------------------------------------------------------
// 7. Per-user notification tracking
// ---------------------------------------------------------------------------

function notifiedDocId(userId, source, externalJobId) {
  return `${userId}_${source}_${externalJobId}`;
}

async function hasUserBeenNotified(userId, source, externalJobId) {
  const docRef = db
    .collection("notified_jobs")
    .doc(notifiedDocId(userId, source, externalJobId));
  const doc = await docRef.get();
  return doc.exists;
}

async function markUserNotified(userId, source, externalJobId) {
  const docRef = db
    .collection("notified_jobs")
    .doc(notifiedDocId(userId, source, externalJobId));
  await docRef.set({
    userId,
    source,
    externalJobId,
    notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function getUserFcmTokens(userId) {
  const snapshot = await db
    .collection("fcm_tokens")
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map((doc) => doc.data().token).filter(Boolean);
}

async function notifyUser(userId, job) {
  const tokens = await getUserFcmTokens(userId);

  if (tokens.length === 0) {
    console.log(`    (user ${userId} has no registered devices)`);
    return;
  }

  try {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: `🔔 New Job: ${job.title}`,
        body: `${job.company} · ${job.location}`,
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'job-alerts',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      data: {
        url: job.jobUrl || "",
      },
    });
  } catch (err) {
    console.error(`    Failed to notify user ${userId}:`, err.message);
  }
}

async function processJobForAlert(job, source, alert) {
  const isNewJob = !(await jobExists(source, job.externalJobId));

  if (isNewJob) {
    if (source === "LINKEDIN") {
      job.description = await fetchLinkedInJobDescription(job.jobUrl);
      // Small delay to be gentler on LinkedIn's servers — this is a second
      // request per new job, on top of the search page fetch already done.
      await sleep(500);
    }
    await saveJob(job, source);
  }

  const alreadyNotified = await hasUserBeenNotified(
    alert.userId,
    source,
    job.externalJobId
  );

  if (alreadyNotified) return;

  await notifyUser(alert.userId, job);
  await markUserNotified(alert.userId, source, job.externalJobId);
  console.log(`    NEW for user ${alert.userId}: ${job.title} at ${job.company}`);
}

// ---------------------------------------------------------------------------
// ApplyNow (Zimbabwe) — fetch once, match against Zimbabwe-relevant alerts
// ---------------------------------------------------------------------------
async function processApplyNow(alerts) {
  try {
    const applyNowJobs = await fetchApplyNowFeed();
    console.log(`  [ApplyNow] fetched ${applyNowJobs.length} total listing(s)`);

    // Only run against alerts that actually mention Zimbabwe — this is a
    // Zimbabwe-only source, so a "Software Engineer, Germany" alert should
    // never see these results, same principle as RemoteOK ignoring workType.
    const zimbabweAlerts = alerts.filter((alert) =>
      (alert.location || "").toLowerCase().includes("zimbabwe")
    );

    for (const alert of zimbabweAlerts) {
      const matches = applyNowJobs
        .filter((job) => matchesAlertKeywordGeneric(job, alert))
        .map((job) => {
          const ageHours = parseRelativeHoursAgo(job.postedText);
          return {
            ...job,
            ageHours,
            postedAt: ageHours !== null ? hoursAgoToDate(ageHours) : null,
          };
        });

      const recentMatches = matches.filter(
        (job) => job.ageHours !== null && job.ageHours <= MAX_JOB_AGE_HOURS
      );

      console.log(
        `  [ApplyNow] "${alert.label || alert.id}" (user ${alert.userId}) — ${matches.length} keyword match(es), ${recentMatches.length} within ${MAX_JOB_AGE_HOURS}h`
      );

      for (const job of recentMatches) {
        await processJobForAlert(job, "APPLYNOW", alert);
      }
    }
  } catch (err) {
    console.error("  Error processing ApplyNow feed:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const alerts = await getActiveAlerts();
  console.log(`Checking ${alerts.length} active alert(s) (with a valid userId)...`);

  // ---- LinkedIn: one search per alert, filtered to recent postings ----
  for (const alert of alerts) {
    try {
      const html = await fetchSearchPage(alert.searchUrl);
      const rawJobs = parseJobCards(html);

      const recentJobs = rawJobs
        .map((job) => {
          const ageHours = parseRelativeHoursAgo(job.postedText);
          return { ...job, ageHours, postedAt: ageHours !== null ? hoursAgoToDate(ageHours) : null };
        })
        .filter((job) => job.ageHours !== null && job.ageHours <= MAX_JOB_AGE_HOURS);

      console.log(
        `  [LinkedIn] "${alert.label || alert.id}" (user ${alert.userId}) — found ${rawJobs.length} job card(s), ${recentJobs.length} within ${MAX_JOB_AGE_HOURS}h`
      );

      for (const job of recentJobs) {
        await processJobForAlert(job, "LINKEDIN", alert);
      }
    } catch (err) {
      console.error(`  Error processing LinkedIn alert "${alert.label || alert.id}":`, err.message);
    }
  }

  // ---- RemoteOK: fetch the feed once, match against every alert's keyword ----
  try {
    const remoteOkJobs = await fetchRemoteOkFeed();
    console.log(`  [RemoteOK] fetched ${remoteOkJobs.length} total listing(s)`);

    for (const alert of alerts) {
      const matches = remoteOkJobs
        .filter((job) => matchesAlertKeywordGeneric(job, alert))
        .map((job) => ({ ...job, postedAt: job.postedDate }));

      const recentMatches = matches.filter((job) => {
        const ageHours = hoursAgoFromDate(job.postedAt);
        return ageHours !== null && ageHours <= MAX_JOB_AGE_HOURS;
      });

      console.log(
        `  [RemoteOK] "${alert.label || alert.id}" (user ${alert.userId}) — ${matches.length} keyword match(es), ${recentMatches.length} within ${MAX_JOB_AGE_HOURS}h`
      );

      for (const job of recentMatches) {
        await processJobForAlert(job, "REMOTEOK", alert);
      }
    }
  } catch (err) {
    console.error("  Error processing RemoteOK feed:", err.message);
  }

  // ---- ApplyNow: Zimbabwe-specific job listings ----
  await processApplyNow(alerts);

  console.log("Run complete.");
}

main().catch((err) => {
  console.error("Watcher run failed:", err);
  process.exit(1);
});
