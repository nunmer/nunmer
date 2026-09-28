import { test } from 'node:test';
import assert from 'node:assert/strict';
import { streaks, brightestDay, windowSum, languageShare, uptime } from '../scripts/lib/stats.mjs';

const days = (counts) => counts.map((count, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, count }));

test('streaks counts the longest run and the current run', () => {
  assert.deepEqual(streaks(days([1, 1, 0, 1, 1, 1, 0, 2, 3])), { longest: 3, current: 2 });
});

test('current streak ignores an empty today', () => {
  assert.deepEqual(streaks(days([0, 4, 5, 0])), { longest: 2, current: 2 });
});

test('current streak is zero after two quiet days', () => {
  assert.equal(streaks(days([3, 0, 0])).current, 0);
});

test('brightestDay picks the max, windowSum sums the tail', () => {
  const d = days([1, 9, 2, 4]);
  assert.equal(brightestDay(d).count, 9);
  assert.equal(windowSum(d, 2), 6);
});

test('languageShare only counts recent repos and sums to 100', () => {
  const now = Date.parse('2026-09-01T00:00:00Z');
  const repos = [
    { pushedAt: '2026-08-01T00:00:00Z', languages: [{ name: 'Go', color: '#0f0', size: 300 }, { name: 'TS', color: '#00f', size: 100 }] },
    { pushedAt: '2019-01-01T00:00:00Z', languages: [{ name: 'PHP', color: '#f00', size: 10_000 }] },
  ];
  const share = languageShare(repos, { now });
  assert.deepEqual(share.map((l) => l.name), ['Go', 'TS']);
  assert.equal(Math.round(share.reduce((s, l) => s + l.pct, 0)), 100);
  assert.equal(repos[0].languages[0].size, 300, 'input must not be mutated');
});

test('uptime counts whole months', () => {
  const u = uptime('2018-11-29T07:00:10Z', Date.parse('2026-09-28T00:00:00Z'));
  assert.equal(u.years, 7);
  assert.equal(u.months, 9);
});
