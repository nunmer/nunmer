// One SVG card per project: animated illustration on the left, name, status,
// blurb and tags on the right. Cards are separate files so each can link out.

import { C, FONT_MONO, FONT_SANS, esc, svgDoc, cardFrame } from '../lib/svg.mjs';
import { ART } from './art.mjs';

const W = 600;
const H = 260;
const ART_BOX = 230;

const STATUS_COLORS = { live: C.turqHi, public: C.gold, private: C.ember };

export function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function chips(tags, x, y) {
  let cx = x;
  return tags.map((t) => {
    const w = t.length * 7.4 + 18;
    const out = `<g transform="translate(${cx} ${y})"><rect width="${w}" height="22" rx="11" fill="${C.void}" stroke="${C.line}"/>`
      + `<text x="${w / 2}" y="15" text-anchor="middle" font-family="${FONT_MONO}" font-size="11" fill="${C.sand}">${esc(t)}</text></g>`;
    cx += w + 8;
    return out;
  }).join('');
}

export function renderProjectCard(project) {
  const art = ART[project.art]();
  const kind = project.status.split(' ')[0];
  const led = STATUS_COLORS[kind] ?? C.fog;
  const frame = cardFrame({ width: W, height: H, id: 'pc', accent: led });
  const tx = ART_BOX + 22;
  const blurb = wrap(project.blurb, 40).slice(0, 4)
    .map((l, i) => `<text x="${tx}" y="${112 + i * 20}">${esc(l)}</text>`).join('');
  const hint = project.url ? new URL(project.url).host : kind === 'private' ? 'coming soon' : `github.com/nunmer/${project.name}`;

  const body = `${frame.body}
<rect x="14" y="14" width="${ART_BOX - 14}" height="${H - 28}" rx="10" fill="${C.void}" opacity=".7"/>
<clipPath id="artClip"><rect x="14" y="14" width="${ART_BOX - 14}" height="${H - 28}" rx="10"/></clipPath>
<g clip-path="url(#artClip)"><g transform="translate(${(ART_BOX + 14) / 2} ${H / 2}) scale(.92)">${art.body}</g></g>
<text x="${tx}" y="58" font-family="${FONT_SANS}" font-size="26" font-weight="700" fill="${C.snow}">${esc(project.title)}</text>
<g transform="translate(${tx} 72)">
  <circle class="led" cx="5" cy="5" r="4" fill="${led}"/>
  <text x="16" y="9.5" font-family="${FONT_MONO}" font-size="11" letter-spacing="1" fill="${led}">${esc(project.status.toUpperCase())}</text>
</g>
<g font-family="${FONT_SANS}" font-size="14.5" fill="${C.fog}">${blurb}</g>
${chips(project.tags, tx, 196)}
<text x="${W - 26}" y="${H - 20}" text-anchor="end" font-family="${FONT_MONO}" font-size="10.5" fill="${C.dim}">${esc(hint)} ${kind === 'private' ? '🔒' : '↗'}</text>`;

  return svgDoc({
    width: W,
    height: H,
    title: `${project.title} (${project.status})`,
    desc: project.blurb,
    style: `.led { animation: led 2s ease-in-out infinite; } @keyframes led { 50% { opacity: .3; } }\n${art.css}`,
    defs: `${frame.defs}${art.defs ?? ''}`,
    body,
  });
}
