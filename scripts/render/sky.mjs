// The contribution calendar re-drawn as a planisphere seen through a yurt's
// shanyrak: the year wraps around the crown, weekdays are rings, active days
// are stars sized by count, and nearby stars join into constellations.

import {
  C, FONT_MONO, FONT_SANS, esc, rng, r2, svgDoc, sparkle, cardFrame, shanyrak, TWINKLE_CSS,
} from '../lib/svg.mjs';

const W = 1200;
const H = 540;
const CX = 300;
const CY = 272;
const R_IN = 78;
const R_OUT = 196;
const R_RIM = 226;
const MAX_LINK = 78;
const MONTHS_KK = ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'];

const polar = (angle, radius) => [r2(CX + Math.cos(angle) * radius), r2(CY + Math.sin(angle) * radius)];
const angleOf = (i, n) => -Math.PI / 2 + (n ? i / n : 0) * Math.PI * 2;

/** Places each day on the disc: day of year -> angle, weekday -> radius. */
export function placeDays(days) {
  const n = days.length;
  return days.map((d, i) => {
    const rand = rng(d.date);
    const weekday = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    const radius = R_IN + 12 + weekday * ((R_OUT - R_IN - 20) / 6) + (rand() - 0.5) * 12;
    const angle = angleOf(i, n) + (rand() - 0.5) * 0.012;
    const [x, y] = polar(angle, radius);
    return { ...d, index: i, angle, x, y };
  });
}

/** Minimum spanning forest over active stars, dropping edges longer than maxLen. */
export function constellationSegments(placed, maxLen = MAX_LINK) {
  const nodes = placed.filter((d) => d.count > 0);
  if (nodes.length < 2) return [];
  const inTree = new Array(nodes.length).fill(false);
  const best = new Array(nodes.length).fill(Infinity);
  const from = new Array(nodes.length).fill(-1);
  best[0] = 0;
  const segs = [];
  for (let k = 0; k < nodes.length; k++) {
    let u = -1;
    for (let i = 0; i < nodes.length; i++) if (!inTree[i] && (u === -1 || best[i] < best[u])) u = i;
    inTree[u] = true;
    if (from[u] !== -1 && best[u] <= maxLen) segs.push([nodes[from[u]], nodes[u]]);
    for (let v = 0; v < nodes.length; v++) {
      if (inTree[v]) continue;
      const dist = Math.hypot(nodes[u].x - nodes[v].x, nodes[u].y - nodes[v].y);
      if (dist < best[v]) { best[v] = dist; from[v] = u; }
    }
  }
  return segs;
}

function rim(placed) {
  const n = placed.length;
  let ticks = '';
  const spans = [];
  placed.forEach((d, i) => {
    const m = new Date(`${d.date}T00:00:00Z`).getUTCMonth();
    const isNew = !spans.length || spans[spans.length - 1].m !== m;
    if (isNew) spans.push({ m, start: i, end: i });
    else spans[spans.length - 1].end = i;
    const a = angleOf(i, n);
    const [x1, y1] = polar(a, R_RIM - (isNew ? 14 : 5));
    const [x2, y2] = polar(a, R_RIM);
    ticks += `<path d="M${x1} ${y1} L${x2} ${y2}" ${isNew ? `stroke="${C.gold}" stroke-width="1.4"` : ''}/>`;
  });
  // Label each month at the middle of the days it covers, rotated
  // tangentially and kept upright. Stub months at the edges get no label.
  const labels = spans.filter((sp) => sp.end - sp.start >= 9).map((sp) => {
    const mid = angleOf((sp.start + sp.end) / 2, n);
    const [lx, ly] = polar(mid, R_RIM + 16);
    let deg = (mid * 180) / Math.PI + 90;
    if (deg > 90 && deg < 270) deg += 180;
    return `<text x="${lx}" y="${ly}" transform="rotate(${r2(deg)} ${lx} ${ly})" dy="4">${MONTHS_KK[sp.m]}</text>`;
  }).join('');
  return { ticks, labels };
}

function statBlock(x, y, value, label, sub) {
  return `<g transform="translate(${x} ${y})">
  <path d="${sparkle(0, -9, 8)}" fill="${C.gold}"/>
  <text x="18" y="0" font-family="${FONT_SANS}" font-size="30" font-weight="700" fill="${C.snow}">${esc(value)}</text>
  <text x="18" y="22" font-family="${FONT_MONO}" font-size="11" letter-spacing="1.5" fill="${C.fog}">${esc(label)}</text>
  <text x="18" y="38" font-family="${FONT_MONO}" font-size="11" fill="${C.dim}">${esc(sub)}</text>
</g>`;
}

export function renderSky({ snapshot, stats }) {
  const placed = placeDays(snapshot.days);
  const n = placed.length;
  const max = Math.max(1, ...placed.map((d) => d.count));
  const segs = constellationSegments(placed);
  const brightest = placed.length
    ? placed.reduce((b, d) => (d.count > b.count ? d : b), placed[0])
    : { date: '-', count: 0, x: CX, y: CY };
  const { ticks, labels } = rim(placed);

  const rings = Array.from({ length: 7 }, (_, i) =>
    `<circle cx="${CX}" cy="${CY}" r="${r2(R_IN + 12 + i * ((R_OUT - R_IN - 20) / 6))}"/>`).join('');
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const [x1, y1] = polar((i / 12) * Math.PI * 2, R_IN);
    const [x2, y2] = polar((i / 12) * Math.PI * 2, R_RIM - 14);
    return `<path d="M${x1} ${y1} L${x2} ${y2}"/>`;
  }).join('');

  const dust = placed.filter((d) => d.count === 0)
    .map((d) => `<circle cx="${d.x}" cy="${d.y}" r=".8"/>`).join('');

  const stars = placed.filter((d) => d.count > 0).map((d, i) => {
    const k = Math.sqrt(d.count / max);
    const r = r2(1.7 + k * 4.4);
    const color = k > 0.6 ? C.goldHi : k > 0.3 ? C.snow : C.turqHi;
    const sp = k > 0.42 ? `<path d="${sparkle(d.x, d.y, r * 3)}" fill="${color}" opacity=".9"/>` : '';
    return `<g class="st" style="animation-delay:${(0.4 + i * 0.05).toFixed(2)}s">`
      + `<circle cx="${d.x}" cy="${d.y}" r="${r2(r * 3.6)}" fill="url(#sg)"/>`
      + `<circle class="tw" cx="${d.x}" cy="${d.y}" r="${r}" fill="${color}" style="animation-delay:-${(i % 9) * 0.6}s"/>${sp}</g>`;
  }).join('');

  const lines = segs.map(([a, b], i) =>
    `<path d="M${a.x} ${a.y} L${b.x} ${b.y}" pathLength="1" style="animation-delay:${(1.4 + i * 0.06).toFixed(2)}s"/>`).join('');

  const [tx1, ty1] = polar(angleOf(n - 1, n), R_IN - 4);
  const [tx2, ty2] = polar(angleOf(n - 1, n), R_RIM - 16);
  const [bx, by] = [brightest.x, brightest.y];

  const frame = cardFrame({ width: W, height: H, id: 'sky', accent: C.gold });
  const style = `${TWINKLE_CSS}
.st { opacity: 0; animation: pop .6s ease-out forwards; }
@keyframes pop { from { opacity: 0; } to { opacity: 1; } }
.cn path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.2s ease-out forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }
.sweep { transform-origin: ${CX}px ${CY}px; animation: sweep 14s linear infinite; }
@keyframes sweep { to { transform: rotate(360deg); } }
.crown { transform-origin: ${CX}px ${CY}px; animation: sweep 160s linear infinite reverse; }
.ring { transform-box: fill-box; transform-origin: center; animation: spinr 12s linear infinite; }
@keyframes spinr { to { transform: rotate(360deg); } }
.fade { opacity: 0; animation: pop 1s ease-out forwards; }`;

  const s = stats;
  const RX = 610;
  const body = `${frame.body}
<circle cx="${CX}" cy="${CY}" r="${R_RIM + 40}" fill="url(#discGlow)"/>
<circle cx="${CX}" cy="${CY}" r="${R_RIM}" fill="#070C14" stroke="${C.line}"/>
<g fill="none" stroke="${C.turq}" stroke-width=".6" opacity=".18" stroke-dasharray="1 5">${rings}</g>
<g stroke="${C.turq}" stroke-width=".6" opacity=".14">${spokes}</g>
<g class="sweep"><path d="M${CX} ${CY} L${CX} ${CY - R_RIM} A${R_RIM} ${R_RIM} 0 0 1 ${r2(CX + R_RIM * Math.sin(0.5))} ${r2(CY - R_RIM * Math.cos(0.5))} Z" fill="url(#sweepG)"/></g>
<g stroke="${C.fog}" stroke-width=".8" opacity=".6">${ticks}</g>
<circle cx="${CX}" cy="${CY}" r="${R_RIM + 30}" fill="none" stroke="${C.gold}" stroke-width=".8" opacity=".35"/>
<g font-family="${FONT_MONO}" font-size="11" fill="${C.sand}" text-anchor="middle" opacity=".85">${labels}</g>
<g fill="${C.fog}" opacity=".4">${dust}</g>
<g class="cn" fill="none" stroke="${C.turqHi}" stroke-width="1" opacity=".6">${lines}</g>
${stars}
<path d="M${tx1} ${ty1} L${tx2} ${ty2}" stroke="${C.ember}" stroke-width="1.2" stroke-dasharray="3 3"/>
<text x="${r2(tx1 + 8)}" y="${r2(ty1 - 18)}" font-family="${FONT_MONO}" font-size="10" fill="${C.ember}">бүгін</text>
<circle cx="${CX}" cy="${CY}" r="${R_IN - 6}" fill="${C.night}" stroke="${C.line}"/>
<g class="crown">${shanyrak({ cx: CX, cy: CY, r: R_IN - 26, stroke: C.gold, width: 1.8 })}</g>
${brightest.count ? `<circle class="ring" cx="${bx}" cy="${by}" r="15" fill="none" stroke="${C.gold}" stroke-dasharray="2 3"/>` : ''}

<text x="${RX}" y="78" font-family="${FONT_MONO}" font-size="16" letter-spacing="6" fill="${C.gold}">ЖҰЛДЫЗДАР</text>
<text x="${RX}" y="106" font-family="${FONT_SANS}" font-size="24" font-weight="600" fill="${C.snow}">A year of commits, seen through the shanyrak</text>
<text x="${RX}" y="132" font-family="${FONT_MONO}" font-size="12" fill="${C.fog}">The year wraps clockwise from the top. Rings are weekdays.</text>
<text x="${RX}" y="150" font-family="${FONT_MONO}" font-size="12" fill="${C.fog}">Each star is a day. Nearby stars join into constellations.</text>
<path d="M${RX} 176 L${W - 50} 176" stroke="${C.line}"/>
${statBlock(RX + 6, 230, s.total, 'CONTRIBUTIONS', 'in the last 365 days')}
${statBlock(RX + 290, 230, s.activeDays, 'BRIGHT NIGHTS', 'days with a commit')}
${statBlock(RX + 6, 318, `${s.longest}d`, 'LONGEST STREAK', 'consecutive days')}
${statBlock(RX + 290, 318, `${s.load[1]}`, 'LAST 30 DAYS', s.current ? `streak: ${s.current}d and counting` : 'the steppe is quiet')}
<path d="M${RX} 384 L${W - 50} 384" stroke="${C.line}"/>
<g class="fade" style="animation-delay:2s">
  <path d="${sparkle(RX + 12, 420, 11)}" fill="${C.goldHi}"/>
  <text x="${RX + 34}" y="416" font-family="${FONT_MONO}" font-size="12" letter-spacing="1" fill="${C.goldHi}">α · THE BRIGHTEST NIGHT</text>
  <text x="${RX + 34}" y="436" font-family="${FONT_MONO}" font-size="12" fill="${C.fog}">${esc(brightest.date)} · ${brightest.count} contributions in one day</text>
</g>
<g transform="translate(${RX} 476)" font-family="${FONT_MONO}" font-size="11" fill="${C.dim}">
  <circle cx="6" cy="-4" r="1.8" fill="${C.turqHi}"/><text x="16" y="0">a few</text>
  <circle cx="80" cy="-4" r="3.4" fill="${C.snow}"/><text x="92" y="0">busy</text>
  <path d="${sparkle(158, -4, 9)}" fill="${C.goldHi}"/><text x="172" y="0">blazing</text>
  <path d="M250 -4 l24 0" stroke="${C.ember}" stroke-dasharray="3 3"/><text x="282" y="0">today</text>
</g>`;

  return svgDoc({
    width: W,
    height: H,
    title: 'Contributions as a star chart',
    desc: `${s.total} contributions in the last year across ${s.activeDays} active days. Longest streak ${s.longest} days. Brightest day ${brightest.date} with ${brightest.count}.`,
    style,
    defs: `${frame.defs}
<radialGradient id="sg"><stop offset="0" stop-color="${C.turqHi}" stop-opacity=".45"/><stop offset="1" stop-color="${C.turqHi}" stop-opacity="0"/></radialGradient>
<radialGradient id="discGlow"><stop offset=".8" stop-color="${C.turq}" stop-opacity=".12"/><stop offset="1" stop-color="${C.turq}" stop-opacity="0"/></radialGradient>
<linearGradient id="sweepG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.turq}" stop-opacity=".22"/><stop offset="1" stop-color="${C.turq}" stop-opacity="0"/></linearGradient>`,
    body,
  });
}
