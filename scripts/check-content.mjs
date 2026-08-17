import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(projectRoot, 'content');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(contentRoot, relativePath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function collectReferencedKeys(value, keys = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectReferencedKeys(entry, keys));
    return keys;
  }
  if (!value || typeof value !== 'object') {
    return keys;
  }

  for (const [property, child] of Object.entries(value)) {
    if (property.endsWith('Key') && typeof child === 'string') {
      keys.add(child);
    } else if (property === 'steps' && Array.isArray(child)) {
      child.forEach((key) => keys.add(key));
    }
    collectReferencedKeys(child, keys);
  }
  return keys;
}

const index = await readJson('index.json');
assert(index.schemaVersion === 1, 'schemaVersion must be 1.');
assert(index.languages.some(({ code }) => code === 'en'), 'English fallback is missing.');
assert(new Set(index.languages.map(({ code }) => code)).size === index.languages.length, 'Language codes must be unique.');

const dictionaries = new Map();
for (const language of index.languages) {
  const dictionary = await readJson(`${language.code}/strings.json`);
  assert(dictionary['language.selfName'], `${language.code} has no language.selfName.`);
  dictionaries.set(language.code, dictionary);
}

const englishKeys = Object.keys(dictionaries.get('en')).sort();
for (const [code, dictionary] of dictionaries) {
  const keys = Object.keys(dictionary).sort();
  assert(JSON.stringify(keys) === JSON.stringify(englishKeys), `${code} does not have the complete key set.`);
}

const referencedKeys = new Set();
for (const relativePath of Object.values(index.files)) {
  const document = await readJson(relativePath);
  collectReferencedKeys(document, referencedKeys);
}

const sourceFiles = [
  'app/_layout.tsx',
  'app/language.tsx',
  'app/home.tsx',
  'app/settings.tsx',
  'src/components/LanguageGrid.tsx',
];
for (const relativePath of sourceFiles) {
  const source = await readFile(path.join(projectRoot, relativePath), 'utf8');
  for (const match of source.matchAll(/(?:\bt|\bgetFixedT\([^)]*\))\(\s*['"]([^'"]+)['"]/g)) {
    referencedKeys.add(match[1]);
  }
}

for (const key of referencedKeys) {
  for (const [code, dictionary] of dictionaries) {
    assert(key in dictionary, `${code} is missing referenced key: ${key}.`);
  }
}

const bundledLoader = await readFile(
  path.join(projectRoot, 'src/content/bundledContent.ts'),
  'utf8',
);
const languageGrid = await readFile(
  path.join(projectRoot, 'src/components/LanguageGrid.tsx'),
  'utf8',
);
assert(bundledLoader.includes('require.context'), 'Bundled JSON discovery is not dynamic.');
assert(languageGrid.includes('content.index.languages.map'), 'Language grid is not driven by index.json.');

const runtimeSourcePaths = [
  ...sourceFiles,
  'src/content/ContentProvider.tsx',
  'src/content/bundledContent.ts',
  'src/theme/fonts.ts',
];
const runtimeSource = (
  await Promise.all(
    runtimeSourcePaths.map((relativePath) =>
      readFile(path.join(projectRoot, relativePath), 'utf8'),
    ),
  )
).join('\n');
for (const { code } of index.languages.filter(({ code }) => code !== 'en')) {
  const hardcodedCode = new RegExp(`['"]${code}['"]`);
  assert(
    !hardcodedCode.test(runtimeSource),
    `${code} is hardcoded in runtime source instead of being JSON-driven.`,
  );
}

const urdu = index.languages.find(({ code }) => code === 'ur');
assert(urdu?.rtl === true, 'Urdu must enable RTL.');

console.log(`Content OK: ${index.languages.length} dynamic languages, ${englishKeys.length} complete keys.`);
console.log('Acceptance contract OK: index-driven grid, recursive JSON discovery, no hardcoded test languages.');

