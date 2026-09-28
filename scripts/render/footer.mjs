// Footer: a campfire on the steppe under the guestbook sky. Every visitor who
// leaves a star (via an issue) appears here as a named star.

import {
  C, FONT_MONO, FONT_SANS, esc, rng, r2, svgDoc, sparkle, starField, TWINKLE_CSS, ornamentBand,
} from '../lib/svg.mjs';

const W = 1200;
const H = 320;
const GROUND = 250;
const MAX_GUESTS = 40;

/** Seeded, collision-avoiding placement for guest stars in the upper sky. */
export function placeGuests(guests) {
  const placed = [];
  for (const g of guests.slice(-MAX_GUESTS)) {
    const rand = rng(`guest-${g.login}`);
    let spot = null;
    for (let attempt = 0; attempt < 60 && !spot; attempt++) {
      const x = 50 + rand() * (W - 190);
      const y = 36 + rand() * 170;
      const clear = placed.every((p) => Math.abs(p.x - x) > 120 || Math.abs(p.y - y) > 28);
      const offTitle = x < 330 || x > 790 || y > 160; // keep the centre title clear
      if (clear && offTitle) spot = { x, y };
    }
    if (spot) placed.push({ ...g, x: r2(spot.x), y: r2(spot.y) });
  }
  return placed;
}

function fire(x, y) {
  const flames = [[0, 26, C.ember], [-5, 20, C.gold], [5, 18, C.goldHi], [0, 12, C.snow]]
    .map(([dx, h, col], i) => `<path class="fl" d="M${x + dx - 7} ${y} Q${x + dx - 6} ${y - h * 0.6} ${x + dx} ${y - h} Q${x + dx + 6} ${y - h * 0.6} ${x + dx + 7} ${y} Z" fill="${col}" style="animation-delay:-${i * 0.23}s"/>`).join('');
  const sparks = Array.from({ length: 6 }, (_, i) =>
    `<circle class="spk" cx="${x + (i - 3) * 3}" cy="${y - 20}" r="1.2" fill="${C.goldHi}" style="animation-delay:-${(i * 0.5).toFixed(1)}s"/>`).join('');
  return `<ellipse cx="${x}" cy="${y}" rx="140" ry="24" fill="url(#firePool)" class="glow"/>
<path d="M${x - 16} ${y + 2} L${x + 16} ${y - 4} M${x - 16} ${y - 4} L${x + 16} ${y + 2}" stroke="#3A2A1A" stroke-width="4" stroke-linecap="round"/>
${flames}${sparks}`;
}

export function renderFooter({ guests }) {
  const stars = placeGuests(guests);
  const guestSvg = stars.map((g, i) => `<g class="gs" style="animation-delay:${(0.3 + i * 0.08).toFixed(2)}s">
  <circle cx="${g.x}" cy="${g.y}" r="10" fill="url(#gGlow)"/>
  <path d="${sparkle(g.x, g.y, 6)}" fill="${C.goldHi}"/>
  <text x="${g.x + 10}" y="${g.y + 16}" font-family="${FONT_MONO}" font-size="10.5" fill="${C.sand}">@${esc(g.login)}</text>
</g>`).join('');

  const count = guests.length;
  const caption = count
    ? `✦ ${count} traveler${count === 1 ? '' : 's'} left a star in this sky`
    : '✦ the guestbook sky is empty · leave the first star';

  const horizon = `M0 ${GROUND} C200 ${GROUND - 14} 380 ${GROUND - 4} 600 ${GROUND - 12} S1000 ${GROUND - 2} ${W} ${GROUND - 10} L${W} ${H} L0 ${H} Z`;

  return svgDoc({
    width: W,
    height: H,
    title: 'Жол болсын! Guestbook sky',
    desc: stars.length ? `Guests who left a star: ${stars.map((g) => g.login).join(', ')}.` : 'A campfire under an empty guestbook sky.',
    style: `${TWINKLE_CSS}
.gs { opacity: 0; animation: gs .8s ease-out forwards; }
@keyframes gs { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.fl { transform-box: fill-box; transform-origin: bottom center; animation: fl .5s ease-in-out infinite alternate; }
@keyframes fl { from { transform: scale(1, 1) skewX(-4deg); } to { transform: scale(.85, 1.15) skewX(5deg); } }
.spk { animation: spk 2.4s ease-out infinite; opacity: 0; }
@keyframes spk { 0% { opacity: 1; transform: translate(0, 0); } 100% { opacity: 0; transform: translate(14px, -70px); } }
.glow { animation: glow 1.4s ease-in-out infinite alternate; }
@keyframes glow { from { opacity: .7; } to { opacity: 1; } }`,
    defs: `<linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}"/><stop offset="1" stop-color="#0E2530"/></linearGradient>
<radialGradient id="gGlow"><stop offset="0" stop-color="${C.gold}" stop-opacity=".6"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient>
<radialGradient id="firePool"><stop offset="0" stop-color="${C.ember}" stop-opacity=".5"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>
<clipPath id="fclip"><rect width="${W}" height="${H}" rx="18"/></clipPath>`,
    body: `<g clip-path="url(#fclip)">
<rect width="${W}" height="${H}" fill="url(#fsky)"/>
${starField({ seed: 'footer', count: 110, w: W, h: GROUND - 20 })}
${guestSvg}
<text x="${W / 2}" y="86" text-anchor="middle" font-family="${FONT_SANS}" font-size="40" font-weight="700" fill="${C.snow}">Жол болсын!</text>
<text x="${W / 2}" y="116" text-anchor="middle" font-family="${FONT_MONO}" font-size="13" fill="${C.fog}">may your road be open · thanks for riding by</text>
<text x="${W / 2}" y="146" text-anchor="middle" font-family="${FONT_MONO}" font-size="12" fill="${C.gold}">${esc(caption)}</text>
<path d="${horizon}" fill="#060A0F"/>
${fire(W / 2, GROUND + 22)}
${ornamentBand({ x: 40, y: H - 18, width: W - 80, id: 'fBand', scale: 0.8 })}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${C.line}"/>`,
  });
}
