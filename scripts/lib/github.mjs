// Fetches the live data the artwork is drawn from and normalises it into a
// small snapshot. Only public data is used so local and CI renders match.

import { readFile, writeFile } from 'node:fs/promises';

const ENDPOINT = 'https://api.github.com/graphql';

const QUERY = `query($login: String!) {
  user(login: $login) {
    login
    createdAt
    followers { totalCount }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false,
                 orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount
      nodes {
        name
        pushedAt
        stargazerCount
        languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

export async function fetchSnapshot({ login, token }) {
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': `${login}-profile-generator`,
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL responded ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`GitHub GraphQL error: ${json.errors[0].message}`);
  return normalise(json.data.user);
}

export function normalise(user) {
  const cal = user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({
    date: d.date,
    count: d.contributionCount,
  }));
  const repos = user.repositories.nodes.map((r) => ({
    name: r.name,
    pushedAt: r.pushedAt,
    stars: r.stargazerCount,
    languages: r.languages.edges.map((e) => ({ name: e.node.name, color: e.node.color, size: e.size })),
  }));
  return {
    login: user.login,
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    publicRepos: user.repositories.totalCount,
    totalContributions: cal.totalContributions,
    days,
    repos,
  };
}

export async function loadSnapshot(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function saveSnapshot(path, snapshot) {
  await writeFile(path, `${JSON.stringify(snapshot, null, 2)}\n`);
}
