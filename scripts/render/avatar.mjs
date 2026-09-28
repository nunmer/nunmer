// Profile avatar: a golden shanyrak against the night sky, framed by a ring
// of koshkar-muiz ornament. Designed to survive GitHub's circular crop.

import { C, hornUnit, r2, rng, svgDoc, shanyrak, sparkle } from '../lib/svg.mjs';

const S = 1024;
const MID = S / 2;

function ornamentRing(radius, count, scale) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const deg = (i / count) * 360;
    const flip = i % 2 ? ' scale(1,-1)' : '';
    out += `<path d="${hornUnit()}" transform="rotate(${r2(deg)} ${MID} ${MID}) translate(${MID} ${MID - radius}) scale(${scale})${flip}"/>`;
  }
  return out;
}

function stars() {
  const rand = rng('avatar');
  let out = '';
  for (let i = 0; i < 90; i++) {
    const a = rand() * Math.PI * 2;
    const d = 250 + rand() * 250;
    const x = MID + Math.cos(a) * d;
    const y = MID + Math.sin(a) * d;
    out += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(0.8 + rand() ** 3 * 3)}" opacity="${r2(0.3 + rand() * 0.7)}"/>`;
  }
  return out;
}

export function renderAvatar() {
  return svgDoc({
    width: S,
    height: S,
    title: 'nunmer avatar',
    desc: 'A golden shanyrak (yurt crown) glowing against a starry night sky, ringed by Kazakh ornament.',
    defs: `<radialGradient id="av-bg" cx=".5" cy=".42" r=".75">
  <stop offset="0" stop-color="#15304A"/><stop offset=".55" stop-color="${C.night}"/><stop offset="1" stop-color="#02040A"/>
</radialGradient>
<radialGradient id="av-halo"><stop offset=".3" stop-color="${C.gold}" stop-opacity=".5"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient>
<radialGradient id="av-turq"><stop offset=".6" stop-color="${C.turq}" stop-opacity="0"/><stop offset=".85" stop-color="${C.turq}" stop-opacity=".35"/><stop offset="1" stop-color="${C.turq}" stop-opacity="0"/></radialGradient>
<filter id="av-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    body: `<rect width="${S}" height="${S}" fill="url(#av-bg)"/>
<g fill="${C.snow}">${stars()}</g>
<circle cx="${MID}" cy="${MID}" r="470" fill="url(#av-turq)"/>
<circle cx="${MID}" cy="${MID}" r="380" fill="url(#av-halo)"/>
<g fill="none" stroke="${C.gold}" stroke-width="3.5" stroke-linecap="round" opacity=".75">${ornamentRing(430, 28, 1.7)}</g>
<circle cx="${MID}" cy="${MID}" r="392" fill="none" stroke="${C.gold}" stroke-width="2" opacity=".45"/>
<circle cx="${MID}" cy="${MID}" r="250" fill="#0A1420"/>
<g filter="url(#av-glow)">${shanyrak({ cx: MID, cy: MID, r: 230, stroke: C.goldHi, width: 11 })}</g>
<path d="${sparkle(MID + 300, MID - 300, 26)}" fill="${C.snow}"/>
<path d="${sparkle(MID - 330, MID + 250, 16)}" fill="${C.turqHi}"/>`,
  });
}
