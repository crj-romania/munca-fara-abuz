import { validateBundle } from '@/src/content/contentValidation';
import type { ContentBundle } from '@/src/types/content';

const bundledJson = require.context('../../content', true, /^\.\/.*\.json$/);

function unwrapJsonModule(value: unknown): unknown {
  if (
    typeof value === 'object' &&
    value !== null &&
    'default' in value &&
    Object.keys(value).length === 1
  ) {
    return (value as { default: unknown }).default;
  }
  return value;
}

function readBundledJson(path: string): unknown {
  const key = `./${path}`;
  if (!bundledJson.keys().includes(key)) {
    throw new Error(`Missing bundled content file: ${path}.`);
  }
  return unwrapJsonModule(bundledJson(key));
}

export function loadBundledContent(): ContentBundle {
  return validateBundle(
    readBundledJson('index.json'),
    readBundledJson,
    'bundled',
  );
}

