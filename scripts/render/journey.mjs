// "Жол" (the road): the years so far as a caravan route across the steppe.
// A dashed trail draws itself between waypoints; a caravan walks along it.

import { C, FONT_MONO, FONT_SANS, esc, r2, svgDoc, cardFrame, sparkle } from '../lib/svg.mjs';

const W = 1200;
const H = 300;

export function renderJourney({ profile }) {
  const stops = profile.journey;
  const x0 = 90;
  const x1 = W - 90;
  const pts = stops.map((s, i) => {
    const x = x0 + (stops.length > 1 ? i / (stops.length - 1) : 0.5) * (x1 - x0);
    const y = 170 + Math.sin(i * 1.3) * 34;
    return { ...s, x: r2(x), y: r2(y) };
  });
  // Smooth trail through the points (Catmull-Rom converted to cubic Béziers).
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${r2(p1.x + (p2.x - p0.x) / 6)} ${r2(p1.y + (p2.y - p0.y) / 6)} ${r2(p2.x - (p3.x - p1.x) / 6)} ${r2(p2.y - (p3.y - p1.y) / 6)} ${p2.x} ${p2.y}`;
  }

  const waypoints = pts.map((p, i) => {
    const last = i === pts.length - 1;
    const above = i % 2 === 0;
    const ty = above ? p.y - 38 : p.y + 44;
    const delay = (0.3 + (i / Math.max(pts.length - 1, 1)) * 3.2).toFixed(2);
    return `<g class="wp" style="animation-delay:${delay}s">
  ${last ? `<circle cx="${p.x}" cy="${p.y}" r="18" fill="none" stroke="${C.gold}" class="ping"/>` : ''}
  <circle cx="${p.x}" cy="${p.y}" r="${last ? 8 : 6}" fill="${last ? C.goldHi : C.night}" stroke="${last ? C.goldHi : C.turqHi}" stroke-width="2"/>
  <path d="M${p.x} ${p.y + (above ? -8 : 8)} L${p.x} ${ty + (above ? 28 : -32)}" stroke="${C.line}"/>
  <text x="${p.x}" y="${ty - 14}" text-anchor="middle" font-family="${FONT_MONO}" font-size="12" letter-spacing="2" fill="${last ? C.goldHi : C.gold}">${esc(p.year)}</text>
  <text x="${p.x}" y="${ty + 4}" text-anchor="middle" font-family="${FONT_SANS}" font-size="15" font-weight="600" fill="${C.snow}">${esc(p.title)}</text>
  <text x="${p.x}" y="${ty + 20}" text-anchor="middle" font-family="${FONT_MONO}" font-size="10.5" fill="${C.fog}">${esc(p.note)}</text>
</g>`;
  }).join('');

  const camel = `<g fill="${C.sand}">
  <path d="M-12 -8 Q-10 -18 -4 -14 Q0 -22 5 -14 Q9 -12 10 -8 L14 -14 L17 -13 L15 -6 L10 -3 L-12 -3 Z"/>
  <path d="M-10 -3 l0 8 M-6 -3 l0 8 M4 -3 l0 8 M8 -3 l0 8" stroke="${C.sand}" stroke-width="1.6"/>
</g>`;

  const frame = cardFrame({ width: W, height: H, id: 'jr', accent: C.gold });
  return svgDoc({
    width: W,
    height: H,
    title: 'The road so far',
    desc: stops.map((s) => `${s.year}: ${s.title}, ${s.note}`).join('. '),
    style: `
.trail { stroke-dasharray: 2400; stroke-dashoffset: 2400; animation: trail 3.6s ease-in-out forwards; }
@keyframes trail { to { stroke-dashoffset: 0; } }
.wp { opacity: 0; animation: wp .6s ease-out forwards; }
@keyframes wp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.ping { transform-box: fill-box; transform-origin: center; animation: ping 2s ease-out infinite; }
@keyframes ping { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }`,
    defs: frame.defs,
    body: `${frame.body}
<text x="40" y="46" font-family="${FONT_MONO}" font-size="15" letter-spacing="6" fill="${C.gold}">ЖОЛ</text>
<text x="100" y="46" font-family="${FONT_MONO}" font-size="13" fill="${C.dim}">// the road so far</text>
<path d="${d}" fill="none" stroke="${C.line}" stroke-width="6" stroke-linecap="round"/>
<path d="${d}" class="trail" fill="none" stroke="${C.turq}" stroke-width="2" stroke-linecap="round"/>
<path d="${d}" fill="none" stroke="${C.night}" stroke-width="2.4" stroke-dasharray="1 9" opacity=".8"/>
${waypoints}
<g>${camel}<animateMotion dur="24s" repeatCount="indefinite" path="${d}" rotate="auto"/></g>
<path d="${sparkle(W - 70, 44, 8)}" fill="${C.goldHi}" opacity=".8"/>`,
  });
}
