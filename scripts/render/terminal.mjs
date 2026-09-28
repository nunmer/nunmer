// Terminal window that types out a short session: whoami, now, stack, motto.
// Each line is revealed with a stepped clip-path so it looks typed.

import { C, FONT_MONO, esc, svgDoc, cardFrame } from '../lib/svg.mjs';

const W = 1200;
const LINE_H = 26;
const CHAR_W = 9.6; // approx advance of a 16px monospace glyph
const PROMPT = 'nunmer@steppe';

/** Builds the scripted session as rows of coloured spans. */
function script(t, stats) {
  const cmd = (text) => ({ kind: 'cmd', spans: [[PROMPT, C.turqHi], [':', C.fog], ['~', C.gold], ['$ ', C.fog], [text, C.snow]] });
  const out = (spans) => ({ kind: 'out', spans });
  const rows = [
    cmd('whoami'),
    out([[t.whoami, C.sand]]),
    { kind: 'gap' },
    cmd('cat now.md'),
    ...t.now.map(([name, what]) => out([['  ▸ ', C.gold], [name.padEnd(18), C.turqHi], [what, C.fog]])),
    { kind: 'gap' },
    cmd('ls ~/stack'),
    out([['  ', C.fog], ...t.stack.flatMap((s, i) => [[s, i % 3 === 0 ? C.turqHi : i % 3 === 1 ? C.snow : C.sand], ['  ', C.fog]])]),
    { kind: 'gap' },
    cmd('uptime'),
    out([
      ['  up ', C.fog], [`${stats.uptime.years}y ${stats.uptime.months}m`, C.goldHi],
      ['  ·  load average: ', C.fog], [stats.load.join(', '), C.turqHi],
      ['  ·  ', C.fog], [`${stats.total}`, C.goldHi], [' contributions this year', C.fog],
    ]),
    { kind: 'gap' },
    cmd('echo $MOTTO'),
    out([['  "', C.dim], [t.motto, C.snow], ['"', C.dim]]),
    { kind: 'caret' },
  ];
  return rows;
}

function spanText(spans) {
  return spans.map(([text, color]) => `<tspan fill="${color}">${esc(text)}</tspan>`).join('');
}

export function renderTerminal({ profile, stats }) {
  const rows = script(profile.terminal, stats);
  const top = 70;
  let y = top;
  let clock = 0.4;
  let lines = '';
  let css = '';

  rows.forEach((row, i) => {
    if (row.kind === 'gap') { y += LINE_H * 0.45; return; }
    if (row.kind === 'caret') {
      lines += `<g style="animation-delay:${clock.toFixed(2)}s" class="appear">`
        + `<text x="36" y="${y}" font-size="16">${spanText(rows[0].spans.slice(0, 4))}</text>`
        + `<rect class="caret" x="${36 + (PROMPT.length + 4) * CHAR_W}" y="${y - 14}" width="9" height="18" fill="${C.turqHi}"/></g>`;
      y += LINE_H;
      return;
    }
    const chars = row.spans.reduce((n, [text]) => n + text.length, 0);
    // Commands are typed slowly; output lines print fast, like a real shell.
    const dur = row.kind === 'cmd' ? Math.max(0.35, chars * 0.035) : 0.25;
    const steps = row.kind === 'cmd' ? chars : 6;
    css += `.l${i} { animation: type ${dur.toFixed(2)}s steps(${steps}) ${clock.toFixed(2)}s both; }\n`;
    lines += `<text class="l${i}" x="36" y="${y}" font-size="16" xml:space="preserve">${spanText(row.spans)}</text>`;
    clock += dur + (row.kind === 'cmd' ? 0.35 : 0.08);
    y += LINE_H;
  });

  const H = Math.round(y + 24);
  const frame = cardFrame({ width: W, height: H, id: 'term' });
  const style = `
@keyframes type { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
.appear { opacity: 0; animation: show .01s linear forwards; }
@keyframes show { to { opacity: 1; } }
.caret { animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.scan { animation: scan 7s linear infinite; }
@keyframes scan { from { transform: translateY(-40px); } to { transform: translateY(${H}px); } }
${css}`;

  const dots = [C.ember, C.gold, C.turq]
    .map((c, i) => `<circle cx="${30 + i * 20}" cy="26" r="6" fill="${c}" opacity=".9"/>`).join('');

  const body = `${frame.body}
<clipPath id="termClip"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14"/></clipPath>
<g clip-path="url(#termClip)">
  <rect x="1" y="1" width="${W - 2}" height="44" fill="${C.panelHi}" opacity=".6"/>
  <rect class="scan" x="0" y="0" width="${W}" height="40" fill="url(#scanG)"/>
</g>
${dots}
<text x="${W / 2}" y="31" text-anchor="middle" font-family="${FONT_MONO}" font-size="13" fill="${C.fog}">${PROMPT}: ~ — zsh — steppe-os</text>
<text x="${W - 30}" y="31" text-anchor="end" font-family="${FONT_MONO}" font-size="12" fill="${C.dim}">UTC+5 · 43.2°N 76.9°E</text>
<g font-family="${FONT_MONO}">${lines}</g>`;

  return svgDoc({
    width: W,
    height: H,
    title: `${profile.login} terminal`,
    desc: `A terminal session. whoami: ${profile.terminal.whoami}. Stack: ${profile.terminal.stack.join(', ')}.`,
    style,
    defs: `${frame.defs}<linearGradient id="scanG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.turq}" stop-opacity="0"/><stop offset="1" stop-color="${C.turq}" stop-opacity=".05"/></linearGradient>`,
    body,
  });
}
