import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const englishPath = path.join(projectRoot, 'content', 'en', 'strings.json');
const english = JSON.parse(await readFile(englishPath, 'utf8'));

const locales = [
  { code: 'ne', prefix: '[NE] ', selfName: '[NE] नेपाली' },
  { code: 'ur', prefix: '[UR] ', selfName: '[UR] اردو' },
];

for (const locale of locales) {
  const generated = Object.fromEntries(
    Object.entries(english).map(([key, value]) => [key, `${locale.prefix}${value}`]),
  );
  generated['language.selfName'] = locale.selfName;

  const directory = path.join(projectRoot, 'content', locale.code);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'strings.json'),
    `${JSON.stringify(generated, null, 2)}\n`,
    'utf8',
  );
}

console.log('Generated prefixed ne and ur test dictionaries.');

