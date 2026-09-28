// Renders every SVG in assets/ from data/profile.json plus live GitHub data.
// With GITHUB_TOKEN set it refreshes data/snapshot.json first; without it (or
// if the API fails) it renders from the last committed snapshot.

import { readFile, writeFile } from 'node:fs/promises';
import { fetchSnapshot, loadSnapshot, saveSnapshot } from './lib/github.mjs';
import { deriveStats } from './lib/stats.mjs';
import { renderHero } from './render/hero.mjs';
import { renderTerminal } from './render/terminal.mjs';
import { renderSky } from './render/sky.mjs';
import { renderProjectCard } from './render/projects.mjs';
import { renderHtop } from './render/htop.mjs';
import { renderJourney } from './render/journey.mjs';
import { renderFooter } from './render/footer.mjs';
import { renderDivider, renderStarButton } from './render/misc.mjs';

const SECTIONS = { work: 'selected work', sky: 'night sky', system: 'system monitor', road: 'the road', guestbook: 'guestbook' };

const SNAPSHOT = 'data/snapshot.json';
const readJson = async (p, fallback) => {
  try { return JSON.parse(await readFile(p, 'utf8')); } catch (err) {
    if (fallback !== undefined && err.code === 'ENOENT') return fallback;
    throw err;
  }
};

async function getSnapshot(login) {
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    try {
      const snap = await fetchSnapshot({ login, token });
      await saveSnapshot(SNAPSHOT, snap);
      console.log(`fetched live data: ${snap.totalContributions} contributions, ${snap.publicRepos} repos`);
      return snap;
    } catch (err) {
      console.warn(`live fetch failed (${err.message}); falling back to ${SNAPSHOT}`);
    }
  }
  return loadSnapshot(SNAPSHOT);
}

const profile = await readJson('data/profile.json');
const guests = await readJson('data/guests.json', []);
const snapshot = await getSnapshot(profile.login);
const stats = deriveStats(snapshot);
const ctx = { profile, snapshot, stats, guests };

const renders = {
  'hero.svg': () => renderHero({ login: profile.login, taglines: profile.taglines }),
  'terminal.svg': renderTerminal,
  'sky.svg': renderSky,
  'htop.svg': renderHtop,
  'journey.svg': renderJourney,
  'footer.svg': renderFooter,
  'button-star.svg': renderStarButton,
  ...Object.fromEntries(Object.entries(SECTIONS).map(([k, label]) => [`divider-${k}.svg`, () => renderDivider(label)])),
  ...Object.fromEntries(profile.projects.map((p) => [`project-${p.name}.svg`, () => renderProjectCard(p)])),
};

for (const [file, render] of Object.entries(renders)) {
  await writeFile(`assets/${file}`, render(ctx));
  console.log(`rendered assets/${file}`);
}
