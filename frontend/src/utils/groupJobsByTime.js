const BUCKETS = [
  { label: 'Last hour', maxHours: 1 },
  { label: 'Last 6 hours', maxHours: 6 },
  { label: 'Last 24 hours', maxHours: 24 },
  { label: 'Older', maxHours: Infinity },
];

function toDate(date) {
  if (!date) return null;
  if (date.toDate) return date.toDate();
  if (date.seconds) return new Date(date.seconds * 1000);
  return new Date(date);
}

function getTime(date) {
  const d = toDate(date);
  if (!d || isNaN(d.getTime())) return 0;
  return d.getTime();
}

export function groupJobsByTime(jobs) {
  const groups = BUCKETS.map((b) => ({ label: b.label, jobs: [] }));

  for (const job of jobs) {
    const ms = getTime(job.dateDetected);
    const hours = (Date.now() - ms) / (1000 * 60 * 60);
    for (let i = 0; i < BUCKETS.length; i++) {
      if (hours <= BUCKETS[i].maxHours) {
        groups[i].jobs.push(job);
        break;
      }
    }
  }

  for (const g of groups) {
    g.jobs.sort((a, b) => getTime(b.dateDetected) - getTime(a.dateDetected));
  }

  return groups.filter((g) => g.jobs.length > 0);
}
