// Small animated illustrations for project cards. Each draws into a 220 x 220
// box centred on (0, 0) and returns { body, css }. Class names are prefixed
// per art so cards never collide.

import { C, FONT_MONO, r2, rng, sparkle } from '../lib/svg.mjs';

const PIXEL_HERO = [
  '....gg....',
  '...gGGg...',
  '...ssss...',
  '...sese...',
  '...ssss...',
  '..tttttt..',
  '.ttTttTtt.',
  '.s.tttt.s.',
  '...tttt...',
  '...b..b...',
  '...b..b...',
];
const PIXEL_COLORS = { g: C.gold, G: C.goldHi, s: C.sand, e: C.void, t: C.turq, T: C.turqHi, b: '#2B3A55' };

function arena() {
  const px = 9;
  const ox = -45;
  const oy = -50;
  let hero = '';
  PIXEL_HERO.forEach((row, y) => [...row].forEach((ch, x) => {
    if (PIXEL_COLORS[ch]) hero += `<rect x="${ox + x * px}" y="${oy + y * px}" width="${px}" height="${px}" fill="${PIXEL_COLORS[ch]}"/>`;
  }));
  const sword = `<g class="ar-sw"><rect x="42" y="-20" width="5" height="42" fill="${C.snow}"/><rect x="36" y="18" width="17" height="5" fill="${C.gold}"/><rect x="42" y="23" width="5" height="10" fill="${C.ember}"/></g>`;
  const tokens = [0, 1, 2].map((i) =>
    `<text class="ar-tk" x="${-70 + i * 50}" y="-66" style="animation-delay:${i * 1.1}s">+${[42, 7, 120][i]} ✦</text>`).join('');
  return {
    css: `.ar-hero { animation: ar-bob 1.2s steps(2) infinite; }
@keyframes ar-bob { 50% { transform: translateY(-4px); } }
.ar-sw { transform-origin: 44px 22px; animation: ar-swing 2.4s ease-in-out infinite; }
@keyframes ar-swing { 0%,60%,100% { transform: rotate(0); } 70% { transform: rotate(-70deg); } 80% { transform: rotate(20deg); } }
.ar-tk { opacity: 0; animation: ar-rise 3.3s ease-out infinite; }
@keyframes ar-rise { 0% { opacity: 0; transform: translateY(10px); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-26px); } }`,
    body: `<rect x="-100" y="52" width="200" height="4" fill="${C.line}"/>
<g fill="${C.panelHi}">${Array.from({ length: 10 }, (_, i) => `<rect x="${-100 + i * 20}" y="56" width="18" height="10" opacity="${0.4 + (i % 3) * 0.2}"/>`).join('')}</g>
<g class="ar-hero">${hero}${sword}</g>
<g font-family="${FONT_MONO}" font-size="12" fill="${C.goldHi}">${tokens}</g>
<g transform="translate(-100 78)"><rect width="200" height="24" rx="4" fill="${C.void}" stroke="${C.line}"/>
<text x="8" y="16" font-family="${FONT_MONO}" font-size="10.5" fill="${C.sand}">"a bard who fears water"</text></g>`,
  };
}

function radar() {
  const rand = rng('radar');
  const kinds = [['fs', C.turqHi], ['git', C.gold], ['exec', C.ember], ['test', C.snow]];
  const blips = Array.from({ length: 9 }, (_, i) => {
    const a = rand() * Math.PI * 2;
    const r = 25 + rand() * 60;
    const [name, col] = kinds[i % kinds.length];
    const x = r2(Math.cos(a) * r);
    const y = r2(Math.sin(a) * r);
    const delay = r2(((a + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * 4);
    return `<g class="ra-b" style="animation-delay:${delay}s"><circle cx="${x}" cy="${y}" r="3" fill="${col}"/><text x="${x + 6}" y="${y + 4}" fill="${col}">${name}</text></g>`;
  }).join('');
  return {
    css: `.ra-sw { animation: ra-spin 4s linear infinite; }
@keyframes ra-spin { to { transform: rotate(360deg); } }
.ra-b { opacity: .15; animation: ra-ping 4s ease-out infinite; }
@keyframes ra-ping { 0% { opacity: 1; } 60% { opacity: .15; } 100% { opacity: .15; } }`,
    body: `<g fill="none" stroke="${C.turq}" opacity=".35">${[30, 60, 90].map((r) => `<circle r="${r}"/>`).join('')}<path d="M-95 0 H95 M0 -95 V95" stroke-dasharray="2 4"/></g>
<g class="ra-sw"><path d="M0 0 L0 -92 A92 92 0 0 1 65 -65 Z" fill="url(#ra-g)"/><path d="M0 0 L0 -92" stroke="${C.turqHi}" stroke-width="1.5"/></g>
<g font-family="${FONT_MONO}" font-size="9">${blips}</g>
<circle r="4" fill="${C.turqHi}"/>`,
    defs: `<linearGradient id="ra-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.turq}" stop-opacity=".5"/><stop offset="1" stop-color="${C.turq}" stop-opacity="0"/></linearGradient>`,
  };
}

function pin() {
  const rand = rng('pin');
  const dots = Array.from({ length: 140 }, () => {
    const x = -100 + rand() * 200;
    const y = -60 + rand() * 120;
    // Keep dots roughly inside an oval "country" silhouette.
    if ((x / 100) ** 2 + (y / 62) ** 2 > 1) return '';
    return `<circle cx="${r2(x)}" cy="${r2(y)}" r="1.3"/>`;
  }).join('');
  return {
    css: `.pn-drop { animation: pn-drop 3.6s cubic-bezier(.3,1.6,.5,1) infinite; }
@keyframes pn-drop { 0% { transform: translateY(-60px); opacity: 0; } 15% { transform: translateY(0); opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
.pn-line { stroke-dasharray: 90; stroke-dashoffset: 90; animation: pn-line 3.6s ease-out infinite; }
@keyframes pn-line { 0%,20% { stroke-dashoffset: 90; } 45%,100% { stroke-dashoffset: 0; } }
.pn-ring { transform-box: fill-box; transform-origin: center; animation: pn-ring 1.8s ease-out infinite; }
@keyframes pn-ring { from { transform: scale(.3); opacity: .9; } to { transform: scale(2.4); opacity: 0; } }
.pn-score { opacity: 0; animation: pn-score 3.6s ease-out infinite; }
@keyframes pn-score { 0%,45% { opacity: 0; transform: translateY(6px); } 55%,90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; } }`,
    body: `<g fill="${C.fog}" opacity=".35">${dots}</g>
<circle class="pn-ring" cx="38" cy="10" r="8" fill="none" stroke="${C.gold}"/>
<path d="M38 10 L-30 -12" class="pn-line" stroke="${C.snow}" stroke-dasharray="4 4" fill="none"/>
<g class="pn-drop"><path d="M-30 -12 c-9 -12 -14 -18 -14 -24 a14 14 0 0 1 28 0 c0 6 -5 12 -14 24 z" fill="${C.turq}"/><circle cx="-30" cy="-36" r="5" fill="${C.void}"/></g>
<path d="${sparkle(38, 10, 9)}" fill="${C.goldHi}"/>
<g class="pn-score" font-family="${FONT_MONO}"><text x="0" y="78" text-anchor="middle" font-size="20" font-weight="700" fill="${C.goldHi}">4 873</text><text x="0" y="94" text-anchor="middle" font-size="10" fill="${C.fog}">pts · 38 km off</text></g>`,
  };
}

function city() {
  // Baiterek: lattice trunk opening into a cradle that holds a golden sphere.
  const street = (d, i) => `<path d="${d}" class="ct-st" style="animation-delay:${i * 0.9}s"/>`;
  const streets = ['M-100 40 L100 10', 'M-100 70 L100 40', 'M-60 90 L-10 -10', 'M10 95 L60 -5', 'M-100 10 L100 -18'];
  return {
    css: `.ct-st { stroke-dasharray: 8 260; stroke-dashoffset: 268; animation: ct-flow 4.5s linear infinite; }
@keyframes ct-flow { to { stroke-dashoffset: 0; } }
.ct-orb { animation: ct-glow 3s ease-in-out infinite; }
@keyframes ct-glow { 50% { opacity: .55; } }`,
    body: `<g stroke="${C.line}" stroke-width="2" fill="none">${streets.map((d) => `<path d="${d}"/>`).join('')}</g>
<g stroke="${C.turqHi}" stroke-width="2.4" fill="none" stroke-linecap="round">${streets.map(street).join('')}</g>
<g fill="none" stroke="${C.sand}" stroke-width="2">
  <path d="M-6 92 L-3 -30 M6 92 L3 -30"/>
  <path d="M-3 -30 C-30 -40 -30 -70 -14 -84 M3 -30 C30 -40 30 -70 14 -84 M0 -30 C-14 -50 -14 -72 -6 -86 M0 -30 C14 -50 14 -72 6 -86"/>
  <path d="M-5 80 L5 70 M-5 60 L5 50 M-5 40 L5 30 M-4 20 L4 10 M5 80 L-5 70 M5 60 L-5 50 M5 40 L-5 30 M4 20 L-4 10" stroke-width="1" opacity=".6"/>
</g>
<circle cx="0" cy="-64" r="26" fill="url(#ct-g)" class="ct-orb"/>
<circle cx="0" cy="-64" r="15" fill="${C.goldHi}"/>
<text x="0" y="112" text-anchor="middle" font-family="${FONT_MONO}" font-size="10" fill="${C.fog}">көше · street · улица</text>`,
    defs: `<radialGradient id="ct-g"><stop offset="0" stop-color="${C.goldHi}" stop-opacity=".8"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient>`,
  };
}

function room() {
  // Isometric room: floor, two walls, desk, glowing monitor, lamp cone.
  const iso = (x, y, z) => [r2((x - y) * 0.866), r2((x + y) * 0.5 - z)];
  const poly = (pts) => pts.map((p) => iso(...p).join(' ')).join(' L');
  return {
    css: `.rm { animation: rm-float 5s ease-in-out infinite; }
@keyframes rm-float { 50% { transform: translateY(-5px); } }
.rm-scr { animation: rm-flick 3s steps(3) infinite; }
@keyframes rm-flick { 50% { opacity: .75; } }
.rm-dust { animation: rm-dust 6s linear infinite; }
@keyframes rm-dust { from { transform: translateY(0); opacity: 0; } 30% { opacity: .9; } to { transform: translateY(-40px); opacity: 0; } }`,
    body: `<g transform="translate(0 38) scale(.78)"><g class="rm">
  <path d="M${poly([[-70, -70, 0], [70, -70, 0], [70, 70, 0], [-70, 70, 0]])} Z" fill="#1A2436"/>
  <path d="M${poly([[-70, -70, 0], [-70, 70, 0], [-70, 70, 90], [-70, -70, 90]])} Z" fill="#13203A"/>
  <path d="M${poly([[-70, -70, 0], [70, -70, 0], [70, -70, 90], [-70, -70, 90]])} Z" fill="#0F1A2E"/>
  <path d="M${poly([[-60, -60, 34], [10, -60, 34], [10, -20, 34], [-60, -20, 34]])} Z" fill="${C.sand}" opacity=".85"/>
  <path d="M${poly([[-60, -20, 34], [10, -20, 34], [10, -20, 30], [-60, -20, 30]])} Z" fill="#8A7B60"/>
  <path class="rm-scr" d="M${poly([[-50, -66, 40], [0, -66, 40], [0, -66, 70], [-50, -66, 70]])} Z" fill="${C.turq}"/>
  <path d="M${poly([[-45, -65, 46], [-10, -65, 46]])} M${poly([[-45, -65, 54], [-20, -65, 54]])} M${poly([[-45, -65, 62], [-5, -65, 62]])}" stroke="${C.void}" stroke-width="1.5" opacity=".6"/>
  <path d="M${poly([[-66, 20, 60], [-66, 60, 60]])}" stroke="${C.gold}" stroke-width="3"/>
  <path d="M${poly([[-66, 30, 88], [-30, 40, 34], [-30, 70, 34]])} Z" fill="${C.goldHi}" opacity=".12"/>
  <g fill="${C.goldHi}">${[[-20, -30, 50], [0, 10, 60], [20, -10, 40]].map((p, i) => `<circle class="rm-dust" cx="${iso(...p)[0]}" cy="${iso(...p)[1]}" r="1.4" style="animation-delay:-${i * 2}s"/>`).join('')}</g>
</g>
</g><text x="0" y="104" text-anchor="middle" font-family="${FONT_MONO}" font-size="10" fill="${C.fog}">~30 draw calls · 0 lights</text>`,
  };
}

function run() {
  const pts = [[-100, 40], [-80, 30], [-65, 36], [-45, 10], [-30, 18], [-10, -20], [5, -8], [25, -40], [40, -30], [60, -10], [80, 5], [100, -5]];
  const d = `M${pts.map((p) => p.join(' ')).join(' L')}`;
  return {
    css: `.rn-line { stroke-dasharray: 400; stroke-dashoffset: 400; animation: rn-draw 5s ease-in-out infinite; }
@keyframes rn-draw { 0% { stroke-dashoffset: 400; } 70%,100% { stroke-dashoffset: 0; } }`,
    body: `<path d="${d} L100 60 L-100 60 Z" fill="url(#rn-g)"/>
<path d="${d}" class="rn-line" fill="none" stroke="${C.turqHi}" stroke-width="2.4" stroke-linejoin="round"/>
<g font-family="${FONT_MONO}" font-size="9" fill="${C.dim}">${[0, 10, 21, 42].map((k, i) => `<text x="${-100 + i * 66}" y="76">${k}k</text>`).join('')}</g>
<circle r="5" fill="${C.goldHi}"><animateMotion dur="5s" repeatCount="indefinite" path="${d}" keyPoints="0;1;1" keyTimes="0;.7;1" calcMode="linear"/></circle>
<g transform="translate(-100 -84)"><rect width="92" height="30" rx="6" fill="${C.void}" stroke="${C.gold}" stroke-opacity=".5"/>
<text x="10" y="20" font-family="${FONT_MONO}" font-size="13" fill="${C.goldHi}">ELO 1847</text></g>
<g transform="translate(20 -84)"><rect width="80" height="30" rx="6" fill="${C.void}" stroke="${C.line}"/>
<text x="10" y="20" font-family="${FONT_MONO}" font-size="12" fill="${C.snow}">3:12:48</text></g>`,
    defs: `<linearGradient id="rn-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.turq}" stop-opacity=".35"/><stop offset="1" stop-color="${C.turq}" stop-opacity="0"/></linearGradient>`,
  };
}

function nfc() {
  const dests = [['menu', -60], ['review', 0], ['wifi', 60]];
  return {
    css: `.nf-w { fill: none; stroke: ${C.turqHi}; transform-box: fill-box; transform-origin: center; animation: nf-w 2.4s ease-out infinite; opacity: 0; }
@keyframes nf-w { from { transform: scale(.4); opacity: .9; } to { transform: scale(1.6); opacity: 0; } }
.nf-d { opacity: .25; animation: nf-d 6s steps(1) infinite; }
@keyframes nf-d { 0%,33% { opacity: 1; } 34%,100% { opacity: .25; } }
.nf-a { animation: nf-a 6s steps(1) infinite; }`,
    body: `<g transform="translate(-50 0)">
  ${[0, 0.8, 1.6].map((dl) => `<circle class="nf-w" r="30" style="animation-delay:${dl}s"/>`).join('')}
  <rect x="-22" y="-22" width="44" height="44" rx="8" fill="${C.panelHi}" stroke="${C.gold}"/>
  <text y="5" text-anchor="middle" font-family="${FONT_MONO}" font-size="11" fill="${C.goldHi}">NFC</text>
  <text y="44" text-anchor="middle" font-family="${FONT_MONO}" font-size="9" fill="${C.dim}">/r/7F3K29</text>
</g>
${dests.map(([name, y], i) => `<g class="nf-d" style="animation-delay:${i * 2}s">
  <path d="M-20 0 C20 0 20 ${y} 50 ${y}" fill="none" stroke="${C.turqHi}" stroke-width="1.6"/>
  <rect x="52" y="${y - 12}" width="54" height="24" rx="5" fill="${C.void}" stroke="${C.turq}"/>
  <text x="79" y="${y + 4}" text-anchor="middle" font-family="${FONT_MONO}" font-size="10" fill="${C.snow}">${name}</text></g>`).join('')}`,
  };
}

function wave() {
  const rand = rng('wave');
  const bars = Array.from({ length: 23 }, (_, i) => {
    const h = 10 + rand() * 50;
    return `<rect class="wv" x="${-99 + i * 9}" y="${r2(-h / 2)}" width="5" height="${r2(h)}" rx="2.5" style="animation-delay:-${r2(rand() * 1.2)}s"/>`;
  }).join('');
  return {
    css: `.wv { transform-box: fill-box; transform-origin: center; animation: wv 1.2s ease-in-out infinite; }
@keyframes wv { 0%,100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }
.wv-t { animation: wv-type 5s steps(16) infinite; }
@keyframes wv-type { 0% { clip-path: inset(0 100% 0 0); } 60%,100% { clip-path: inset(0 0 0 0); } }`,
    body: `<g transform="translate(0 -20)" fill="url(#wv-g)">${bars}</g>
<g transform="translate(-100 44)"><rect width="200" height="40" rx="6" fill="${C.void}" stroke="${C.line}"/>
<text x="10" y="16" font-family="${FONT_MONO}" font-size="9" fill="${C.dim}">stt ▸ transcript</text>
<text class="wv-t" x="10" y="31" font-family="${FONT_MONO}" font-size="11" fill="${C.snow}">"сәлем! қалайсың?"</text></g>`,
    defs: `<linearGradient id="wv-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.turqHi}"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>`,
  };
}

export const ART = { arena, radar, pin, city, room, run, nfc, wave };
