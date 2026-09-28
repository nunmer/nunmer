// Adds the author of a "leave a star" issue to data/guests.json.
// Only the GitHub login is stored, never free text from the issue, and the
// login is validated against GitHub's username rules before it is written.
// Usage: GUEST_LOGIN=<login> node scripts/guestbook.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const FILE = 'data/guests.json';
const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const KEEP = 200;

export function isValidLogin(login) {
  return typeof login === 'string' && LOGIN_RE.test(login);
}

/** Returns a new guest list with `login` appended, or the same list if present. */
export function addGuest(guests, login, at = new Date().toISOString()) {
  if (!isValidLogin(login)) throw new Error(`invalid login: ${JSON.stringify(login)}`);
  if (guests.some((g) => g.login.toLowerCase() === login.toLowerCase())) return { guests, added: false };
  return { guests: [...guests, { login, at }].slice(-KEEP), added: true };
}

async function main() {
  const login = process.env.GUEST_LOGIN;
  let current = [];
  try {
    current = JSON.parse(await readFile(FILE, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const { guests, added } = addGuest(current, login);
  if (added) await writeFile(FILE, `${JSON.stringify(guests, null, 2)}\n`);
  console.log(added ? `added ${login}` : `${login} already has a star`);
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
