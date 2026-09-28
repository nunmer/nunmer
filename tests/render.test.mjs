import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { esc, rng } from '../scripts/lib/svg.mjs';
import { deriveStats } from '../scripts/lib/stats.mjs';
import { placeDays, constellationSegments } from '../scripts/render/sky.mjs';
import { wrap, renderProjectCard } from '../scripts/render/projects.mjs';
import { relativeAge } from '../scripts/render/htop.mjs';
import { renderHero } from '../scripts/render/hero.mjs';
import { renderTerminal } from '../scripts/render/terminal.mjs';
import { renderSky } from '../scripts/render/sky.mjs';
import { renderHtop } from '../scripts/render/htop.mjs';
import { renderJourney } from '../scripts/render/journey.mjs';
import { renderFooter } from '../scripts/render/footer.mjs';
import { renderDivider, renderStarButton } from '../scripts/render/misc.mjs';

const profile = JSON.parse(readFileSync('data/profile.json', 'utf8'));
const snapshot = JSON.parse(readFileSync('data/snapshot.json', 'utf8'));
const stats = deriveStats(snapshot, Date.parse('2026-09-28T00:00:00Z'));
const ctx = { profile, snapshot, stats, guests: [{ login: 'nunmer', at: 't' }] };

/** Cheap well-formedness checks that catch the usual hand-written SVG bugs. */
function assertSvg(svg, name) {
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="\d+" height="\d+"/, `${name}: integer size`);
  assert.ok(svg.trimEnd().endsWith('</svg>'), `${name}: closed`);
  assert.doesNotMatch(svg, /&(?!amp;|lt;|gt;|quot;|#39;)/, `${name}: bare ampersand`);
  assert.doesNotMatch(svg, /undefined|NaN|\[object Object\]/, `${name}: leaked value`);
  assert.doesNotMatch(svg, /<script|href="http/i, `${name}: no scripts or external refs`);
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${name}: duplicate ids ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);
  const open = (svg.match(/<g[\s>]/g) ?? []).length;
  const close = (svg.match(/<\/g>/g) ?? []).length;
  assert.equal(open, close, `${name}: unbalanced <g>`);
}

test('esc neutralises markup', () => {
  assert.equal(esc(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('rng is deterministic per seed', () => {
  const a = rng('seed');
  const b = rng('seed');
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

test('wrap respects the width and keeps every word', () => {
  const text = 'Persistent 2.5D pixel world where you describe your hero in plain language';
  const lines = wrap(text, 20);
  assert.ok(lines.every((l) => l.length <= 20));
  assert.equal(lines.join(' '), text);
});

test('relativeAge picks sensible units', () => {
  const now = Date.parse('2026-09-28T12:00:00Z');
  assert.equal(relativeAge('2026-09-28T11:30:00Z', now), '30m');
  assert.equal(relativeAge('2026-09-27T12:00:00Z', now), '24h');
  assert.equal(relativeAge('2026-09-18T12:00:00Z', now), '10d');
  assert.equal(relativeAge('2026-05-01T12:00:00Z', now), '5mo');
});

test('sky places every day inside the chart and links only nearby stars', () => {
  const placed = placeDays(snapshot.days);
  assert.equal(placed.length, snapshot.days.length);
  for (const d of placed) assert.ok(Math.hypot(d.x - 300, d.y - 272) < 200, d.date);
  const segs = constellationSegments(placed);
  const active = placed.filter((d) => d.count > 0).length;
  assert.ok(segs.length < Math.max(active, 1));
  for (const [a, b] of segs) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) <= 78);
});

test('every renderer produces a well-formed SVG', () => {
  const outputs = {
    hero: renderHero({ login: profile.login, taglines: profile.taglines }),
    terminal: renderTerminal(ctx),
    sky: renderSky(ctx),
    htop: renderHtop(ctx),
    journey: renderJourney(ctx),
    footer: renderFooter(ctx),
    divider: renderDivider('selected work'),
    button: renderStarButton(),
    ...Object.fromEntries(profile.projects.map((p) => [p.name, renderProjectCard(p)])),
  };
  for (const [name, svg] of Object.entries(outputs)) assertSvg(svg, name);
});

test('renderers survive empty or minimal data', () => {
  const empty = { ...snapshot, days: [], repos: [], totalContributions: 0 };
  const emptyStats = deriveStats(empty, Date.parse('2026-09-28T00:00:00Z'));
  assertSvg(renderSky({ snapshot: empty, stats: emptyStats }), 'empty sky');
  assertSvg(renderHtop({ snapshot: empty, stats: emptyStats, profile }), 'empty htop');
  const oneStop = { ...profile, journey: [profile.journey[0]] };
  assertSvg(renderJourney({ profile: oneStop }), 'single-stop journey');
});

test('hidden repos never reach the process table', () => {
  const svg = renderHtop(ctx);
  for (const name of profile.hide) assert.ok(!svg.includes(`>${name}<`), name);
});
