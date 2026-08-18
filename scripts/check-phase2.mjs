import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readText(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function inspectInfoNode(node, depth, stats) {
  assert(typeof node.id === 'string' && node.id, 'Every info node needs an id.');
  assert(
    typeof node.labelKey === 'string' && node.labelKey,
    `Info node ${node.id} needs labelKey.`,
  );
  stats.maxDepth = Math.max(stats.maxDepth, depth);

  if (Array.isArray(node.items)) {
    assert(node.items.length > 0, `Info branch ${node.id} cannot be empty.`);
    node.items.forEach((child) => inspectInfoNode(child, depth + 1, stats));
    return;
  }

  assert(typeof node.bodyKey === 'string', `Info leaf ${node.id} needs bodyKey.`);
  assert(Array.isArray(node.steps), `Info leaf ${node.id} needs steps.`);
  assert(
    Array.isArray(node.institutionIds),
    `Info leaf ${node.id} needs institutionIds.`,
  );
  assert(typeof node.refs === 'string', `Info leaf ${node.id} needs string refs.`);
  stats.leaves += 1;
}

const index = await readJson('content/index.json');
const info = await readJson(`content/${index.files.info}`);
const emergency = await readJson(`content/${index.files.emergency}`);
const institutions = await readJson(`content/${index.files.institutions}`);
const stats = { leaves: 0, maxDepth: 0 };

assert(Array.isArray(info.categories) && info.categories.length > 0, 'S4 has no categories.');
for (const category of info.categories) {
  assert(typeof category.icon === 'string' && category.icon, 'S4 category icon missing.');
  inspectInfoNode(category, 1, stats);
}
assert(stats.leaves > 0, 'S6 has no leaf cards.');
assert(stats.maxDepth >= 3, 'Recursive info navigation is not exercised by test content.');

assert(Array.isArray(emergency.contacts), 'S3 contacts are missing.');
for (const id of ['112', 'anitp']) {
  const contact = emergency.contacts.find((candidate) => candidate.id === id);
  assert(contact, `Emergency contact ${id} is missing.`);
  assert(contact.action === 'call', `Emergency contact ${id} must be callable.`);
  assert(!/^<[^>]+>$/.test(contact.value), `Emergency contact ${id} is still a placeholder.`);
}

const institutionIds = new Set(institutions.institutions.map(({ id }) => id));
function checkInstitutions(node) {
  if (Array.isArray(node.items)) {
    node.items.forEach(checkInstitutions);
    return;
  }
  node.institutionIds.forEach((id) =>
    assert(institutionIds.has(id), `Unknown institution in info.json: ${id}.`),
  );
}
info.categories.forEach(checkInstitutions);

const contentConfig = await readText('src/config/content.ts');
assert(
  contentConfig.includes('EXPO_PUBLIC_CONTENT_BASE_URL'),
  'Remote content URL is not environment-configurable.',
);
const workflow = await readText('.github/workflows/deploy-content-pages.yml');
assert(workflow.includes('path: content'), 'GitHub Pages does not publish content/.');

const home = await readText('app/home.tsx');
assert(home.includes("router.push('/info')"), 'Home does not open S4.');
assert(home.includes("router.push('/emergency')"), 'Home does not open S3.');

console.log(
  `Phase 2 OK: ${info.categories.length} categories, ${stats.leaves} cards, depth ${stats.maxDepth}, ${emergency.contacts.length} emergency contacts.`,
);
console.log('Remote content contract OK: Expo public URL + GitHub Pages content artifact.');
