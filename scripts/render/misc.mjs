// Small pieces: an ornament divider with a section label, and the guestbook
// call-to-action button.

import { C, FONT_MONO, esc, svgDoc, ornamentBand, sparkle } from '../lib/svg.mjs';

export function renderDivider(label) {
  const W = 1200;
  const H = 56;
  const textW = label.length * 15 + 70;
  const side = (W - textW) / 2;
  return svgDoc({
    width: W,
    height: H,
    title: label,
    desc: `Section: ${label}`,
    body: `${ornamentBand({ x: 0, y: H / 2, width: side - 10, id: 'dl', scale: 0.7, opacity: 0.7 })}
${ornamentBand({ x: side + textW + 10, y: H / 2, width: side - 10, id: 'dr', scale: 0.7, opacity: 0.7 })}
<path d="${sparkle(side + 14, H / 2, 7)}" fill="${C.goldHi}"/>
<path d="${sparkle(side + textW - 14, H / 2, 7)}" fill="${C.goldHi}"/>
<text x="${W / 2}" y="${H / 2 + 6}" text-anchor="middle" font-family="${FONT_MONO}" font-size="17" letter-spacing="4" fill="${C.sand}">${esc(label.toUpperCase())}</text>`,
  });
}

export function renderStarButton() {
  const W = 420;
  const H = 64;
  return svgDoc({
    width: W,
    height: H,
    title: 'Leave a star in my sky',
    desc: 'Opens an issue. Your GitHub handle is added to the guestbook sky.',
    style: `
.sh { animation: sh 3.2s ease-in-out infinite; }
@keyframes sh { 0% { transform: translateX(-160px); } 60%,100% { transform: translateX(${W + 40}px); } }
.sp { transform-box: fill-box; transform-origin: center; animation: sp 4s linear infinite; }
@keyframes sp { to { transform: rotate(360deg); } }`,
    defs: `<linearGradient id="bb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.panelHi}"/><stop offset="1" stop-color="${C.night}"/></linearGradient>
<linearGradient id="bs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.goldHi}" stop-opacity="0"/><stop offset=".5" stop-color="${C.goldHi}" stop-opacity=".28"/><stop offset="1" stop-color="${C.goldHi}" stop-opacity="0"/></linearGradient>
<clipPath id="bc"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="${(H - 4) / 2}"/></clipPath>`,
    body: `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="${(H - 4) / 2}" fill="url(#bb)" stroke="${C.gold}" stroke-width="1.5"/>
<g clip-path="url(#bc)"><rect class="sh" x="0" y="0" width="120" height="${H}" fill="url(#bs)" transform="skewX(-20)"/></g>
<path class="sp" d="${sparkle(40, H / 2, 13)}" fill="${C.goldHi}"/>
<text x="68" y="${H / 2 + 6}" font-family="${FONT_MONO}" font-size="17" fill="${C.snow}">leave a star in my sky <tspan fill="${C.gold}">→</tspan></text>`,
  });
}
