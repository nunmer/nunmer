// Pure derivations from a snapshot. No I/O, so it is easy to test.

const DAY_MS = 86_400_000;

export function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Current streak tolerates an empty "today" (the day is not over yet).
  let current = 0;
  const tail = days.length && days[days.length - 1].count === 0 ? days.slice(0, -1) : days;
  for (let i = tail.length - 1; i >= 0 && tail[i].count > 0; i--) current++;
  return { longest, current };
}

export function brightestDay(days) {
  return days.reduce((best, d) => (d.count > best.count ? d : best), { date: null, count: 0 });
}

export function windowSum(days, n) {
  return days.slice(-n).reduce((sum, d) => sum + d.count, 0);
}

/** Language share across repos pushed within `sinceDays`, by bytes. */
export function languageShare(repos, { now = Date.now(), sinceDays = 730, top = 6 } = {}) {
  const cutoff = now - sinceDays * DAY_MS;
  const totals = new Map();
  for (const repo of repos) {
    if (Date.parse(repo.pushedAt) < cutoff) continue;
    for (const lang of repo.languages) {
      const prev = totals.get(lang.name) ?? { name: lang.name, color: lang.color, size: 0 };
      totals.set(lang.name, { ...prev, size: prev.size + lang.size });
    }
  }
  const sorted = [...totals.values()].sort((a, b) => b.size - a.size);
  const sum = sorted.reduce((s, l) => s + l.size, 0) || 1;
  const head = sorted.slice(0, top).map((l) => ({ ...l, pct: (l.size / sum) * 100 }));
  const restPct = 100 - head.reduce((s, l) => s + l.pct, 0);
  return restPct > 0.5 ? [...head, { name: 'Other', color: '#5B6B80', size: 0, pct: restPct }] : head;
}

export function uptime(createdAt, now = Date.now()) {
  const start = new Date(createdAt);
  const end = new Date(now);
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) months--;
  return { years: Math.floor(months / 12), months: months % 12, days: Math.floor((end - start) / DAY_MS) };
}

export function deriveStats(snapshot, now = Date.now()) {
  const { days } = snapshot;
  return {
    total: snapshot.totalContributions,
    activeDays: days.filter((d) => d.count > 0).length,
    ...streaks(days),
    brightest: brightestDay(days),
    load: [windowSum(days, 7), windowSum(days, 30), windowSum(days, 365)],
    languages: languageShare(snapshot.repos, { now }),
    stars: snapshot.repos.reduce((s, r) => s + r.stars, 0),
    uptime: uptime(snapshot.createdAt, now),
  };
}
