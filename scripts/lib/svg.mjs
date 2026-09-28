// Shared SVG primitives: palette, fonts, escaping, seeded randomness, ornaments.

export const C = Object.freeze({
  void: '#05070D',
  night: '#0B1118',
  panel: '#111C2C',
  panelHi: '#16243A',
  line: '#1F3150',
  turq: '#00A6A6',
  turqHi: '#3FE0D0',
  gold: '#D6A84F',
  goldHi: '#F2CD7A',
  sand: '#D9C7A3',
  snow: '#F5F7FA',
  fog: '#9AA8B8',
  dim: '#5B6B80',
  ember: '#FF7A45',
  rose: '#E86A92',
});

export const FONT_MONO =
  "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace";
export const FONT_SANS =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);
}

/** Deterministic PRNG (mulberry32) so regenerated art only changes when data does. */
export function rng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed));
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const r2 = (n) => Math.round(n * 100) / 100;

export function svgDoc({ width, height, title, desc, style = '', defs = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>${style}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<defs>${defs}</defs>
${body}
</svg>
`;
}

/**
 * Koshkar-muiz ("ram's horn"), the core Kazakh ornament: two mirrored spirals
 * rising from a shared stem. One unit is 40 x 20, centred on (0, 0).
 */
export function hornUnit() {
  return 'M-18 8 C-18 -4 -8 -9 -2 -4 C2 -1 -1 4 -5 3 C-8 2 -7 -2 -4 -2 '
    + 'M18 8 C18 -4 8 -9 2 -4 C-2 -1 1 4 5 3 C8 2 7 -2 4 -2 '
    + 'M-2 -4 L0 -8 L2 -4';
}

/** Horizontal ornament band: repeated horn units with a travelling shimmer. */
export function ornamentBand({ x, y, width, id, color = C.gold, opacity = 0.8, scale = 0.6 }) {
  const step = 44 * scale;
  const count = Math.floor(width / step);
  const offset = x + (width - count * step) / 2 + step / 2;
  let units = '';
  for (let i = 0; i < count; i++) {
    const flip = i % 2 ? ' scale(1,-1)' : '';
    units += `<path d="${hornUnit()}" transform="translate(${r2(offset + i * step)} ${y}) scale(${scale})${flip}"/>`;
  }
  return `<linearGradient id="${id}-g" x1="0" x2="1" y1="0" y2="0">
  <stop offset="0" stop-color="${color}" stop-opacity="0.35"/>
  <stop offset="0.45" stop-color="${color}" stop-opacity="0.35"/>
  <stop offset="0.5" stop-color="${C.goldHi}" stop-opacity="1"/>
  <stop offset="0.55" stop-color="${color}" stop-opacity="0.35"/>
  <stop offset="1" stop-color="${color}" stop-opacity="0.35"/>
  <animate attributeName="x1" values="-1;1" dur="6s" repeatCount="indefinite"/>
  <animate attributeName="x2" values="0;2" dur="6s" repeatCount="indefinite"/>
</linearGradient>
<g fill="none" stroke="url(#${id}-g)" stroke-width="${r2(2.2 / scale * 0.6)}" stroke-linecap="round" opacity="${opacity}">${units}</g>`;
}

/**
 * Shanyrak: the crown of a yurt, seen from inside. Rendered as a ring with
 * two sets of crossed arched laths (kulderish). Used as the moon / logo.
 */
export function shanyrak({ cx, cy, r, stroke = C.gold, width = 2.5 }) {
  const inner = r * 0.78;
  const arcs = [];
  for (const sign of [-1, 1]) {
    for (const k of [-0.34, 0, 0.34]) {
      const dx = k * inner;
      // Vertical-ish arches bowing outward, crossed by horizontal ones.
      arcs.push(`M${r2(cx + dx)} ${r2(cy - Math.sqrt(inner * inner - dx * dx))} Q${r2(cx + dx + sign * inner * 0.12)} ${cy} ${r2(cx + dx)} ${r2(cy + Math.sqrt(inner * inner - dx * dx))}`);
      arcs.push(`M${r2(cx - Math.sqrt(inner * inner - dx * dx))} ${r2(cy + dx)} Q${cx} ${r2(cy + dx + sign * inner * 0.12)} ${r2(cx + Math.sqrt(inner * inner - dx * dx))} ${r2(cy + dx)}`);
    }
  }
  const spokes = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    spokes.push(`M${r2(cx + Math.cos(a) * r)} ${r2(cy + Math.sin(a) * r)} L${r2(cx + Math.cos(a) * r * 1.18)} ${r2(cy + Math.sin(a) * r * 1.18)}`);
  }
  return `<g fill="none" stroke="${stroke}" stroke-linecap="round">
  <circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="${width * 1.3}"/>
  <circle cx="${cx}" cy="${cy}" r="${r2(inner)}" stroke-width="${width * 0.6}" opacity="0.7"/>
  <path d="${arcs.join(' ')}" stroke-width="${width * 0.8}"/>
  <path d="${spokes.join(' ')}" stroke-width="${width * 0.7}" opacity="0.8"/>
</g>`;
}

/** Four-point sparkle star path centred on (x, y). */
export function sparkle(x, y, s) {
  const k = s * 0.22;
  return `M${r2(x)} ${r2(y - s)} L${r2(x + k)} ${r2(y - k)} L${r2(x + s)} ${r2(y)} L${r2(x + k)} ${r2(y + k)} L${r2(x)} ${r2(y + s)} L${r2(x - k)} ${r2(y + k)} L${r2(x - s)} ${r2(y)} L${r2(x - k)} ${r2(y - k)} Z`;
}

/** Scattered twinkling background stars. */
export function starField({ seed, count, x0 = 0, y0 = 0, w, h, cls = 'tw', maxR = 1.4 }) {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + rand() * w;
    const y = y0 + Math.pow(rand(), 1.4) * h;
    const r = 0.3 + Math.pow(rand(), 3) * maxR;
    const delay = (rand() * 6).toFixed(2);
    const dur = (2.5 + rand() * 4).toFixed(2);
    const fill = rand() > 0.9 ? C.goldHi : rand() > 0.8 ? C.turqHi : C.snow;
    out += `<circle class="${cls}" cx="${r2(x)}" cy="${r2(y)}" r="${r2(r)}" fill="${fill}" style="animation-delay:-${delay}s;animation-duration:${dur}s"/>`;
  }
  return out;
}

export const TWINKLE_CSS = `
.tw { animation: tw 4s ease-in-out infinite; }
@keyframes tw { 0%,100% { opacity: .25 } 50% { opacity: 1 } }`;

/** Rounded dark card frame with a subtle top highlight and corner ornaments. */
export function cardFrame({ width, height, id, accent = C.turq }) {
  const corner = (x, y, sx, sy) =>
    `<path d="M0 14 L0 0 L14 0 M5 18 C5 9 9 5 18 5" transform="translate(${x} ${y}) scale(${sx} ${sy})"/>`;
  return {
    defs: `<linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.panel}"/><stop offset="1" stop-color="${C.night}"/>
</linearGradient>
<linearGradient id="${id}-edge" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${accent}" stop-opacity="0"/>
  <stop offset="0.5" stop-color="${accent}" stop-opacity="0.9"/>
  <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
</linearGradient>`,
    body: `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="14" fill="url(#${id}-bg)" stroke="${C.line}"/>
<rect x="40" y="1" width="${width - 80}" height="1.5" fill="url(#${id}-edge)"/>
<g fill="none" stroke="${C.gold}" stroke-width="1.4" opacity="0.55">
  ${corner(10, 10, 1, 1)}${corner(width - 10, 10, -1, 1)}${corner(10, height - 10, 1, -1)}${corner(width - 10, height - 10, -1, -1)}
</g>`,
  };
}
