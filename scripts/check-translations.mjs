#!/usr/bin/env node
// Every language except en/ro must be real text: no value left identical to the
// English one (unless allow-listed), no "[XX] " test prefixes, and the same
// {{placeholders}} as English. Usage: node scripts/check-translations.mjs [lang…]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => JSON.parse(readFileSync(path.join(root, relative), 'utf8'));
const index = read('content/index.json');
const en = read('content/en/strings.json');
const allow = read('scripts/translation-allowlist.json');
const only = process.argv.slice(2);
const placeholders = (value) => [...value.matchAll(/\{\{\w+\}\}/g)].map(([match]) => match).sort().join(' ');

let failures = 0;
for (const { code } of index.languages) {
  if (code === 'en' || code === 'ro' || (only.length && !only.includes(code))) continue;
  const strings = read(`content/${code}/strings.json`);
  const allowed = new Set([...(allow['*'] ?? []), ...(allow[code] ?? [])]);
  const untranslated = [];
  const problems = [];
  for (const [key, english] of Object.entries(en)) {
    const value = strings[key];
    if (typeof value !== 'string' || !value.trim()) { problems.push(`${key}: missing`); continue; }
    if (/^\[[A-Z]{2}\] /.test(value)) problems.push(`${key}: test prefix`);
    if (placeholders(value) !== placeholders(english)) problems.push(`${key}: placeholders ${placeholders(value) || '-'} ≠ ${placeholders(english) || '-'}`);
    // Legal-template tokens such as <LEGAL_TEMPLATE_…> are identifiers, not text.
    if (value === english && !allowed.has(key) && !/^<[^>]+>$/.test(english)) untranslated.push(key);
  }
  for (const key of Object.keys(strings)) if (!(key in en)) problems.push(`${key}: not in English`);
  const status = untranslated.length || problems.length ? 'FAIL' : 'OK';
  console.log(`${code}: ${status} — ${untranslated.length} identical to English, ${problems.length} other problems`);
  if (untranslated.length) console.log(`  identical: ${untranslated.join(', ')}`);
  for (const problem of problems) console.log(`  ${problem}`);
  if (status === 'FAIL') failures += 1;
}
if (failures) process.exit(1);
console.log('All languages are real text.');
