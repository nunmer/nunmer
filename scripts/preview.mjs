// Dev helper: screenshot every generated SVG (after animations have run) with
// headless Chrome, so the artwork can be reviewed without pushing to GitHub.
// Each SVG is inlined into an HTML page that seeks every CSS and SMIL
// animation to a fixed time, which makes the screenshots deterministic.
// Usage: node scripts/preview.mjs [outDir] [seekMs]

import { execFileSync } from 'node:child_process';
import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const chrome = CANDIDATES.find((p) => existsSync(p));
if (!chrome) throw new Error('Chrome not found; set CHROME_PATH');

const outDir = path.resolve(process.argv[2] ?? 'preview');
const seek = Number(process.argv[3] ?? 8000);
await mkdir(outDir, { recursive: true });

for (const file of (await readdir('assets')).filter((f) => f.endsWith('.svg'))) {
  const svg = await readFile(path.join('assets', file), 'utf8');
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/) ?? [];
  const out = path.join(outDir, file.replace('.svg', '.png'));
  const page = path.join(outDir, file.replace('.svg', '.html'));
  await writeFile(page, `<!doctype html><html><body style="margin:0;background:#0d1117">${svg}
<script>
  document.querySelector('svg').setCurrentTime(${seek / 1000});
  document.querySelector('svg').pauseAnimations();
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${seek}; }
</script></body></html>`);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, `--screenshot=${out}`, pathToFileURL(page).href,
  ], { stdio: 'ignore' });
  console.log(`preview ${out}`);
}
