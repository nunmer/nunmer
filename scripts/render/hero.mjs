// Hero banner: the handle drawn as a constellation over the Alatau at night,
// a shanyrak for a moon, aurora, a yurt with a lit door, and a rider crossing.

import {
  C, FONT_MONO, FONT_SANS, esc, rng, r2, svgDoc, shanyrak, sparkle, starField,
  TWINKLE_CSS, ornamentBand,
} from '../lib/svg.mjs';

const W = 1200;
const H = 540;
const HORIZON = 420;

// Constellation glyphs on a 4 x 6 grid. Each glyph is a list of strokes.
const GLYPHS = {
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  U: [[[0, 0], [0, 4.6], [1.1, 6], [2.9, 6], [4, 4.6], [4, 0]]],
  M: [[[0, 6], [0, 0], [2, 3.4], [4, 0], [4, 6]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  R: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[1.6, 3], [4, 6]]],
};

function constellationWord(word, { x, y, unit, gap }) {
  const rand = rng(`word-${word}`);
  let lines = '';
  let stars = '';
  let order = 0;
  const seen = new Set();
  [...word].forEach((ch, li) => {
    const ox = x + li * (4 * unit + gap);
    for (const stroke of GLYPHS[ch]) {
      const pts = stroke.map(([gx, gy]) => [r2(ox + gx * unit), r2(y + gy * unit)]);
      const d = `M${pts.map((p) => p.join(' ')).join(' L')}`;
      const delay = (0.25 + order * 0.32).toFixed(2);
      lines += `<path class="cl" d="${d}" pathLength="1" style="animation-delay:${delay}s"/>`;
      order++;
      pts.forEach(([px, py], i) => {
        const key = `${px},${py}`;
        if (seen.has(key)) return;
        seen.add(key);
        const big = i === 0 || i === pts.length - 1 || rand() > 0.6;
        const r = big ? 3.4 : 2.3;
        const sd = (Number(delay) + i * 0.08).toFixed(2);
        stars += `<g class="cs" style="animation-delay:${sd}s">`
          + `<circle cx="${px}" cy="${py}" r="${r * 3.2}" fill="url(#starGlow)"/>`
          + `<circle cx="${px}" cy="${py}" r="${r}" fill="${C.snow}"/>`
          + (big && rand() > 0.55 ? `<path d="${sparkle(px, py, r * 3.4)}" fill="${C.snow}" opacity=".85"/>` : '')
          + '</g>';
      });
    }
  });
  return `<g fill="none" stroke="${C.turqHi}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".75" filter="url(#softGlow)">${lines}</g>${stars}`;
}

/** Deterministic mountain ridge from layered sines plus a few gaussian peaks. */
function ridge({ seed, base, amp, peaks, step = 8 }) {
  // peaks: list of [centerX, width, heightFactor]
  const rand = rng(seed);
  const waves = Array.from({ length: 4 }, (_, i) => ({
    f: (0.004 + rand() * 0.006) * (i + 1),
    p: rand() * Math.PI * 2,
    a: amp / (i + 1.6),
  }));
  const bumps = peaks.map(([c, w, k]) => ({ c, w, a: amp * k }));
  const pts = [];
  for (let x = 0; x <= W; x += step) {
    let y = base;
    for (const w of waves) y -= Math.sin(x * w.f + w.p) * w.a;
    for (const b of bumps) y -= b.a * Math.exp(-((x - b.c) ** 2) / (2 * b.w * b.w));
    y -= (rand() - 0.5) * amp * 0.08;
    pts.push([x, r2(y)]);
  }
  return `M0 ${HORIZON + 40} L${pts.map((p) => p.join(' ')).join(' L')} L${W} ${HORIZON + 40} Z`;
}

function aurora() {
  // Paths share command structure so SMIL can morph between them.
  const curtain = (y1, y2, y3, y4) =>
    `M-50 ${y1} C200 ${y2} 400 ${y3} 620 ${y2} S1000 ${y4} 1260 ${y1} L1260 ${y1 + 150} C1000 ${y4 + 170} 800 ${y2 + 150} 620 ${y2 + 170} S200 ${y3 + 140} -50 ${y1 + 150} Z`;
  const band = (id, frames, dur, fill, op) =>
    `<path fill="${fill}" opacity="${op}" filter="url(#auroraBlur)" d="${frames[0]}">
  <animate attributeName="d" dur="${dur}s" repeatCount="indefinite" calcMode="spline"
    keySplines="0.45 0 0.55 1;0.45 0 0.55 1" keyTimes="0;0.5;1" values="${frames[0]};${frames[1]};${frames[0]}"/>
</path>`;
  return `<g class="aur">
${band('a1', [curtain(150, 90, 190, 120), curtain(170, 140, 110, 180)], 18, 'url(#auroraA)', 0.55)}
${band('a2', [curtain(200, 170, 130, 210), curtain(180, 120, 200, 150)], 23, 'url(#auroraB)', 0.4)}
</g>`;
}

function chartGrid() {
  // Faint celestial coordinate arcs, like an old star atlas.
  let arcs = '';
  for (let i = 0; i < 6; i++) {
    const ry = 380 + i * 120;
    arcs += `<ellipse cx="600" cy="${HORIZON + 380}" rx="${900 + i * 40}" ry="${ry}" />`;
  }
  for (let i = -4; i <= 4; i++) {
    arcs += `<path d="M600 ${HORIZON + 380} L${600 + i * 260} -60" />`;
  }
  return `<g fill="none" stroke="${C.turq}" stroke-width=".6" stroke-dasharray="2 7" opacity=".16">${arcs}</g>`;
}

function milkyWay() {
  const rand = rng('milky');
  let dust = '';
  for (let i = 0; i < 260; i++) {
    const t = rand();
    const x = -40 + t * (W + 80);
    const y = 330 - t * 300 + (rand() - 0.5) * 70 * (1 - Math.abs(t - 0.5));
    dust += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(0.3 + rand() * 0.7)}" opacity="${r2(0.2 + rand() * 0.6)}"/>`;
  }
  return `<path d="M-60 360 Q600 150 1260 20" stroke="url(#milky)" stroke-width="110" fill="none" opacity=".22" filter="url(#auroraBlur)"/>
<g fill="${C.snow}">${dust}</g>`;
}

function yurt(x, y) {
  // Dome + walls, door with flickering hearth light, chimney smoke.
  const puffs = Array.from({ length: 5 }, (_, i) =>
    `<circle class="smoke" cx="${x + 6}" cy="${y - 62}" r="${5 + i}" style="animation-delay:-${i * 1.3}s"/>`).join('');
  return `<g>
  <ellipse cx="${x}" cy="${y + 2}" rx="110" ry="16" fill="url(#hearthPool)" class="hearth"/>
  <path d="M${x - 58} ${y} L${x - 58} ${y - 28} Q${x - 50} ${y - 60} ${x} ${y - 66} Q${x + 50} ${y - 60} ${x + 58} ${y - 28} L${x + 58} ${y} Z" fill="#070B11"/>
  <path d="M${x - 58} ${y - 28} Q${x} ${y - 36} ${x + 58} ${y - 28}" stroke="${C.gold}" stroke-width="1.4" fill="none" opacity=".55"/>
  <path d="M${x - 54} ${y - 16} Q${x} ${y - 22} ${x + 54} ${y - 16}" stroke="${C.gold}" stroke-width="1" fill="none" opacity=".35" stroke-dasharray="3 4"/>
  <rect x="${x - 10}" y="${y - 30}" width="20" height="30" rx="2" fill="${C.ember}" class="hearth"/>
  <rect x="${x - 10}" y="${y - 30}" width="20" height="30" rx="2" fill="url(#doorGlow)"/>
  <circle cx="${x}" cy="${y - 66}" r="5" fill="none" stroke="${C.gold}" stroke-width="1.2" opacity=".7"/>
  <g fill="${C.fog}" filter="url(#smokeBlur)">${puffs}</g>
</g>`;
}

function rider() {
  // Silhouette with a turquoise rim so it reads against the dark ridges.
  const ink = '#03060A';
  const leg = (x1, y1, cls) =>
    `<path class="${cls}" d="M${x1} ${y1} l0 11"/>`;
  return `<g class="ride">
  <g transform="translate(0 ${HORIZON + 30}) scale(1.25)" filter="url(#rim)">
    <g class="gallop" fill="${ink}">
      <ellipse cx="0" cy="-16" rx="12" ry="5.2"/>
      <path d="M8 -19 L14 -29 L20 -28 L21 -25 L16 -24 L12 -15 Z"/>
      <path d="M-11 -18 Q-19 -16 -18 -8" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M-1 -20 L1 -30" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="1.6" cy="-32.6" r="2.6"/>
      <path d="M1 -27 L10 -23" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M-3 -36 L-12 -46" stroke="${C.gold}" stroke-width="1"/>
      <path d="M-12 -46 l7 1 l-5 4 z" fill="${C.ember}"/>
    </g>
    <g stroke="${ink}" stroke-width="2.2" stroke-linecap="round">
      ${leg(-8, -12, 'lg a')}${leg(-5, -12, 'lg b')}${leg(6, -12, 'lg b')}${leg(9, -12, 'lg a')}
    </g>
  </g>
</g>`;
}

function grass() {
  const rand = rng('grass');
  let blades = '';
  for (let i = 0; i < 170; i++) {
    const x = rand() * W;
    const y = HORIZON + 32 + rand() * 58;
    const h = 6 + rand() * 14;
    const lean = (rand() - 0.5) * 8;
    blades += `<path class="gr" d="M${r2(x)} ${r2(y)} q${r2(lean / 2)} ${r2(-h / 2)} ${r2(lean)} ${r2(-h)}" style="animation-delay:-${(rand() * 4).toFixed(2)}s"/>`;
  }
  return `<g stroke="#1B2B24" stroke-width="1.3" fill="none" stroke-linecap="round">${blades}</g>`;
}

function taglines(lines, { x, y }) {
  const slot = 4;
  const total = slot * lines.length;
  const typed = ((1.6 / total) * 100).toFixed(2);
  const hold = (((slot - 0.5) / total) * 100).toFixed(2);
  const gone = ((slot / total) * 100).toFixed(2);
  const style = `
.tl { opacity: 0; animation: tl ${total}s linear infinite both; }
@keyframes tl {
  0% { opacity: 1; clip-path: inset(0 100% 0 0); animation-timing-function: steps(28); }
  ${typed}% { opacity: 1; clip-path: inset(0 0 0 0); }
  ${hold}% { opacity: 1; clip-path: inset(0 0 0 0); }
  ${gone}% { opacity: 0; clip-path: inset(0 0 0 0); }
  100% { opacity: 0; }
}`;
  const texts = lines.map((t, i) =>
    `<text class="tl" x="${x + 22}" y="${y}" style="animation-delay:${i * slot}s">${esc(t)}</text>`).join('');
  return {
    style,
    body: `<g font-family="${FONT_MONO}" font-size="17" fill="${C.turqHi}">
  <text x="${x}" y="${y}" fill="${C.gold}">❯</text>${texts}
</g>`,
  };
}

export function renderHero({ login, taglines: lines }) {
  const word = login.toUpperCase().replace(/[^NUMER]/g, '');
  const tl = taglines(lines, { x: 92, y: 300 });
  const style = `${TWINKLE_CSS}
.cl { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.1s cubic-bezier(.6,0,.3,1) forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }
.cs { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .7s ease-out forwards, pulse 5s ease-in-out 3s infinite; }
@keyframes pop { 0% { opacity: 0; transform: scale(.2); } 70% { opacity: 1; transform: scale(1.35); } 100% { opacity: 1; transform: scale(1); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .65; } }
.moon { transform-box: fill-box; transform-origin: center; animation: spin 120s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.halo { animation: breathe 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes breathe { 0%,100% { opacity: .75; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
.shoot { animation: shoot 11s linear infinite; opacity: 0; }
@keyframes shoot { 0% { transform: translate(0,0); opacity: 0; } 2% { opacity: 1; } 9% { transform: translate(-420px, 190px); opacity: 0; } 100% { opacity: 0; transform: translate(-420px,190px); } }
.ride { animation: ride 46s linear infinite; }
@keyframes ride { from { transform: translateX(-60px); } to { transform: translateX(1260px); } }
.gallop { animation: bob .42s ease-in-out infinite; }
@keyframes bob { 50% { transform: translateY(-1.6px); } }
.lg { transform-box: fill-box; transform-origin: top center; animation: leg .42s ease-in-out infinite; }
.lg.b { animation-delay: -.21s; }
@keyframes leg { 0%,100% { transform: rotate(28deg); } 50% { transform: rotate(-28deg); } }
.gr { transform-box: fill-box; transform-origin: bottom center; animation: sway 4s ease-in-out infinite; }
@keyframes sway { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(6deg); } }
.hearth { animation: flick 1.7s steps(6) infinite; }
@keyframes flick { 0%,100% { opacity: .95; } 30% { opacity: .7; } 55% { opacity: 1; } 80% { opacity: .8; } }
.smoke { opacity: 0; animation: smoke 6.5s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes smoke { 0% { opacity: 0; transform: translate(0,0) scale(.4); } 15% { opacity: .22; } 100% { opacity: 0; transform: translate(26px,-90px) scale(2.4); } }
.fade { opacity: 0; animation: fadeIn 1.2s ease-out forwards; }
@keyframes fadeIn { to { opacity: 1; } }
${tl.style}`;

  const far = ridge({ seed: 'far', base: 362, amp: 34, peaks: [[760, 60, 2.1], [905, 90, 1.3], [1130, 70, 1.6], [430, 130, 0.45]] });
  const mid = ridge({ seed: 'mid', base: 398, amp: 20, peaks: [[250, 120, 0.8], [650, 90, 0.9], [1050, 140, 0.6]] });
  const near = ridge({ seed: 'near', base: 420, amp: 8, peaks: [[150, 200, 0.7], [980, 160, 0.9]] });

  const defs = `
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#02040A"/><stop offset=".45" stop-color="${C.night}"/>
  <stop offset=".72" stop-color="#0E2230"/><stop offset=".8" stop-color="#11403F"/>
</linearGradient>
<radialGradient id="horizonGlow" cx=".5" cy="1" r=".7">
  <stop offset="0" stop-color="${C.turq}" stop-opacity=".45"/><stop offset="1" stop-color="${C.turq}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="auroraA" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.turqHi}" stop-opacity="0"/><stop offset=".4" stop-color="${C.turqHi}" stop-opacity=".55"/>
  <stop offset="1" stop-color="#2B6CB0" stop-opacity="0"/>
</linearGradient>
<linearGradient id="auroraB" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${C.rose}" stop-opacity="0"/><stop offset=".5" stop-color="#8E7CFF" stop-opacity=".45"/>
  <stop offset="1" stop-color="${C.turq}" stop-opacity="0"/>
</linearGradient>
<linearGradient id="milky" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#8E7CFF"/><stop offset=".5" stop-color="${C.sand}"/><stop offset="1" stop-color="${C.turq}"/>
</linearGradient>
<radialGradient id="starGlow"><stop offset="0" stop-color="${C.turqHi}" stop-opacity=".55"/><stop offset="1" stop-color="${C.turqHi}" stop-opacity="0"/></radialGradient>
<radialGradient id="moonHalo"><stop offset=".35" stop-color="${C.gold}" stop-opacity=".35"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient>
<radialGradient id="doorGlow" cx=".5" cy="1" r="1"><stop offset="0" stop-color="${C.goldHi}"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>
<linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.snow}" stop-opacity=".85"/><stop offset=".5" stop-color="${C.sand}" stop-opacity=".25"/><stop offset="1" stop-color="${C.sand}" stop-opacity="0"/>
</linearGradient>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0B1A1C"/><stop offset="1" stop-color="#05080C"/>
</linearGradient>
<linearGradient id="shootG" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${C.snow}"/><stop offset="1" stop-color="${C.snow}" stop-opacity="0"/>
</linearGradient>
<filter id="auroraBlur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>
<clipPath id="farClip"><path d="${far}"/></clipPath>
<filter id="smokeBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="rim" x="-30%" y="-30%" width="160%" height="160%">
  <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="d"/>
  <feFlood flood-color="${C.turqHi}" flood-opacity=".6"/><feComposite in2="d" operator="in" result="o"/>
  <feGaussianBlur in="o" stdDeviation=".7" result="ob"/>
  <feMerge><feMergeNode in="ob"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<radialGradient id="hearthPool"><stop offset="0" stop-color="${C.ember}" stop-opacity=".35"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>`;
  const band = ornamentBand({ x: 40, y: H - 22, width: W - 80, id: 'heroBand', scale: 0.8, opacity: 0.9 });

  const body = `<g clip-path="url(#card)">
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${chartGrid()}
${milkyWay()}
${aurora()}
<g>${starField({ seed: 'hero', count: 230, w: W, h: HORIZON - 40 })}</g>
<g class="shoot"><path d="M1080 40 l110 -48" stroke="url(#shootG)" stroke-width="2" transform="rotate(180 1080 40)"/></g>

<g transform="translate(1010 118)">
  <circle class="halo" cx="0" cy="0" r="120" fill="url(#moonHalo)"/>
  <circle cx="0" cy="0" r="50" fill="#0D1520"/>
  <g class="moon" filter="url(#moonGlow)">${shanyrak({ cx: 0, cy: 0, r: 46, stroke: C.goldHi, width: 2.4 })}</g>
</g>
<text x="1010" y="214" text-anchor="middle" font-family="${FONT_MONO}" font-size="11" letter-spacing="3" fill="${C.gold}" opacity=".7">ШАҢЫРАҚ</text>

<text class="fade" x="92" y="92" font-family="${FONT_MONO}" font-size="15" letter-spacing="1" fill="${C.gold}">сәлем, жолаушы <tspan fill="${C.dim}">// hello, traveler</tspan></text>
${constellationWord(word, { x: 96, y: 122, unit: 15, gap: 32 })}
<text class="fade" x="92" y="262" font-family="${FONT_SANS}" font-size="22" font-weight="600" fill="${C.snow}" style="animation-delay:2.2s">AI &amp; full-stack engineer <tspan fill="${C.fog}" font-weight="400">from the Great Steppe</tspan></text>
${tl.body}
<text x="640" y="214" font-family="${FONT_MONO}" font-size="10" letter-spacing="2" fill="${C.turq}" opacity=".55">α NUNMERIS · RA 43°N 76°E</text>

<rect y="${HORIZON - 150}" width="${W}" height="190" fill="url(#horizonGlow)"/>
<path d="${far}" fill="#122033"/>
<rect x="0" y="262" width="${W}" height="70" fill="url(#snow)" clip-path="url(#farClip)"/>
<path d="${mid}" fill="#0C1826"/>
<path d="${near}" fill="#08111A"/>
<rect y="${HORIZON + 20}" width="${W}" height="${H - HORIZON}" fill="url(#ground)"/>
${rider()}
${grass()}
${yurt(870, HORIZON + 58)}
<rect y="${H - 44}" width="${W}" height="44" fill="#04070B" opacity=".7"/>
${band}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${C.line}"/>`;

  return svgDoc({
    width: W,
    height: H,
    title: `${login} — AI & full-stack engineer from the Great Steppe`,
    desc: 'Animated night sky over the Alatau mountains. The handle is drawn as a constellation, the moon is a shanyrak (yurt crown), and a rider crosses the steppe past a lit yurt.',
    style,
    defs,
    body,
  });
}
