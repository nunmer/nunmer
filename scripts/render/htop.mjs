// htop-style system monitor: languages as CPU meters, recently pushed repos
// as the process table, and the familiar function-key bar at the bottom.

import { C, FONT_MONO, esc, svgDoc, cardFrame, hashString } from '../lib/svg.mjs';

const W = 1200;
const H = 410;
const HEX = /^#[0-9a-f]{3,8}$/i;
const color = (c) => (HEX.test(c ?? '') ? c : C.fog);
const CH = 9; // monospace advance at 15px
const FS = 15;

export function relativeAge(iso, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}

function meter(i, lang, x, y, width) {
  // "1 TypeScript [|||||||||||        48.9%]" with the bar in the language colour.
  const nameW = 13 * CH;
  const barX = 2 * CH + nameW + CH;
  const inner = width - barX - 9 * CH;
  const fill = Math.max(3, (lang.pct / 100) * inner);
  const delay = (0.2 + i * 0.12).toFixed(2);
  return `<g transform="translate(${x} ${y})">
  <text x="0" y="0" fill="${C.turqHi}">${i + 1}</text>
  <text x="${2 * CH}" y="0" fill="${color(lang.color)}">${esc(lang.name.slice(0, 12))}</text>
  <text x="${barX - CH}" y="0" fill="${C.snow}">[</text>
  <rect x="${barX}" y="-11" width="${fill.toFixed(1)}" height="13" rx="1" fill="${color(lang.color)}" class="bar" style="animation-delay:${delay}s"/>
  <text x="${width - 2 * CH}" y="0" text-anchor="end" fill="${C.fog}">${lang.pct.toFixed(1)}%</text>
  <text x="${width - CH}" y="0" fill="${C.snow}">]</text>
</g>`;
}

export function renderHtop({ snapshot, stats, profile }, now = Date.now()) {
  const hidden = new Set(profile.hide ?? []);
  const procs = snapshot.repos.filter((r) => !hidden.has(r.name)).slice(0, 7);
  const langs = stats.languages.slice(0, 7);
  const half = Math.ceil(langs.length / 2);
  const colW = 520;

  const meters = langs.map((l, i) =>
    meter(i, l, i < half ? 36 : 36 + colW + 40, 62 + (i % half) * 22, colW)).join('');

  const infoX = 36;
  const infoY = 62 + half * 22 + 18;
  const info = `<g transform="translate(${infoX} ${infoY})">
  <text x="0" y="0"><tspan fill="${C.turqHi}">Tasks: </tspan><tspan fill="${C.snow}" font-weight="700">${snapshot.publicRepos}</tspan><tspan fill="${C.fog}"> repos, </tspan><tspan fill="${C.snow}" font-weight="700">${stats.stars}</tspan><tspan fill="${C.fog}"> stars; </tspan><tspan fill="${C.goldHi}" font-weight="700">1</tspan><tspan fill="${C.fog}"> running (the marathon)</tspan></text>
  <text x="${colW + 40}" y="0"><tspan fill="${C.turqHi}">Load average: </tspan><tspan fill="${C.snow}" font-weight="700">${stats.load.join(' ')}</tspan>   <tspan fill="${C.turqHi}">Uptime: </tspan><tspan fill="${C.snow}" font-weight="700">${stats.uptime.days} days</tspan></text>
</g>`;

  const tableY = infoY + 30;
  const header = `<rect x="20" y="${tableY - 15}" width="${W - 40}" height="21" fill="${C.turq}"/>
<text x="36" y="${tableY}" fill="${C.void}" font-weight="700" xml:space="preserve">${esc('  PID USER     PRI  NI  LANG         TIME+   S  COMMAND')}</text>`;
  const rows = procs.map((r, i) => {
    const y = tableY + 24 + i * 21;
    const pid = String(1000 + (hashString(r.name) % 9000)).padStart(5);
    const lang = (r.languages[0]?.name ?? '—').slice(0, 11).padEnd(11);
    const age = relativeAge(r.pushedAt, now).padStart(6);
    const state = i === 0 ? 'R' : 'S';
    const sel = i === 0 ? `<rect x="20" y="${y - 15}" width="${W - 40}" height="21" fill="${C.panelHi}" class="sel"/>` : '';
    return `${sel}<text x="36" y="${y}" xml:space="preserve" class="row" style="animation-delay:${(0.9 + i * 0.1).toFixed(2)}s"><tspan fill="${C.fog}">${pid}</tspan> <tspan fill="${C.snow}">nunmer</tspan>   <tspan fill="${C.fog}">20   0</tspan>  <tspan fill="${color(r.languages[0]?.color)}">${esc(lang)}</tspan>  <tspan fill="${C.fog}">${age}</tspan>   <tspan fill="${state === 'R' ? C.turqHi : C.fog}">${state}</tspan>  <tspan fill="${i === 0 ? C.goldHi : C.snow}" font-weight="${i === 0 ? 700 : 400}">${esc(r.name)}</tspan></text>`;
  }).join('');

  const keys = [['F1', 'Сәлем'], ['F2', 'Stack'], ['F3', 'Sky'], ['F4', 'Projects'], ['F5', 'Journey'], ['F9', 'Guestbook'], ['F10', 'Жол болсын']];
  let kx = 44;
  const fkeys = keys.map(([k, label]) => {
    const out = `<text x="${kx}" y="${H - 22}" fill="${C.snow}" font-weight="700">${k}</text>`
      + `<rect x="${kx + k.length * CH + 2}" y="${H - 37}" width="${label.length * CH + 12}" height="21" fill="${C.turq}"/>`
      + `<text x="${kx + k.length * CH + 8}" y="${H - 22}" fill="${C.void}">${esc(label)}</text>`;
    kx += k.length * CH + label.length * CH + 26;
    return out;
  }).join('');

  const frame = cardFrame({ width: W, height: H, id: 'htop' });
  const style = `
.bar { transform-box: fill-box; transform-origin: left; animation: grow 1s cubic-bezier(.2,.8,.2,1) both; }
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.row { animation: fade .4s ease-out both; }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
.sel { animation: sel 3s ease-in-out infinite; }
@keyframes sel { 50% { opacity: .55; } }`;

  return svgDoc({
    width: W,
    height: H,
    title: 'htop for a GitHub profile',
    desc: `Languages: ${langs.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(', ')}. Recently pushed: ${procs.map((p) => p.name).join(', ')}.`,
    style,
    defs: frame.defs,
    body: `${frame.body}
<text x="36" y="36" font-family="${FONT_MONO}" font-size="12" fill="${C.dim}">nunmer@steppe:~$ <tspan fill="${C.snow}">htop --user nunmer --sort-key PUSHED</tspan></text>
<g font-family="${FONT_MONO}" font-size="${FS}">${meters}${info}${header}${rows}${fkeys}</g>`,
  });
}
