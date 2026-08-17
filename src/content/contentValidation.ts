import type {
  ContentBundle,
  ContentIndex,
  StringDictionary,
} from '@/src/types/content';

const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const SAFE_JSON_PATH_PATTERN = /^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.json$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateIndex(value: unknown): ContentIndex {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error('Unsupported content index.');
  }

  if (
    typeof value.contentVersion !== 'string' ||
    typeof value.legalUpdatedAt !== 'string' ||
    !Array.isArray(value.languages) ||
    !isRecord(value.files)
  ) {
    throw new Error('Invalid content index.');
  }

  const seenCodes = new Set<string>();
  const languages = value.languages.map((candidate) => {
    if (
      !isRecord(candidate) ||
      typeof candidate.code !== 'string' ||
      !LANGUAGE_CODE_PATTERN.test(candidate.code) ||
      typeof candidate.name !== 'string' ||
      typeof candidate.rtl !== 'boolean' ||
      (candidate.mt !== undefined && typeof candidate.mt !== 'string')
    ) {
      throw new Error('Invalid language entry.');
    }

    if (seenCodes.has(candidate.code)) {
      throw new Error('Duplicate language code.');
    }
    seenCodes.add(candidate.code);

    return {
      code: candidate.code,
      name: candidate.name,
      rtl: candidate.rtl,
      mt: candidate.mt as ContentIndex['languages'][number]['mt'],
    };
  });

  if (!seenCodes.has('en')) {
    throw new Error('The bundled English fallback is required.');
  }

  const requiredFileKeys = [
    'info',
    'complaint',
    'institutions',
    'emergency',
  ] as const;
  const files = {} as ContentIndex['files'];

  for (const key of requiredFileKeys) {
    const path = value.files[key];
    if (typeof path !== 'string' || !SAFE_JSON_PATH_PATTERN.test(path)) {
      throw new Error(`Invalid content file path for ${key}.`);
    }
    files[key] = path;
  }

  return {
    schemaVersion: 1,
    contentVersion: value.contentVersion,
    legalUpdatedAt: value.legalUpdatedAt,
    languages,
    files,
  };
}

export function validateStrings(value: unknown): StringDictionary {
  if (!isRecord(value)) {
    throw new Error('Invalid strings dictionary.');
  }

  const dictionary: StringDictionary = {};
  for (const [key, text] of Object.entries(value)) {
    if (typeof text !== 'string') {
      throw new Error(`Invalid string value for ${key}.`);
    }
    dictionary[key] = text;
  }

  if (!dictionary['language.selfName']) {
    throw new Error('language.selfName is required.');
  }

  return dictionary;
}

export function getRequiredContentPaths(index: ContentIndex): string[] {
  const paths = [
    'index.json',
    ...index.languages.map(({ code }) => `${code}/strings.json`),
    ...Object.values(index.files),
  ];
  return [...new Set(paths)];
}

export function isRemoteVersionNewer(
  remoteVersion: string,
  localVersion: string,
): boolean {
  return (
    remoteVersion.localeCompare(localVersion, undefined, {
      numeric: true,
      sensitivity: 'base',
    }) > 0
  );
}

export function validateBundle(
  indexValue: unknown,
  readJson: (path: string) => unknown,
  source: ContentBundle['source'],
): ContentBundle {
  const index = validateIndex(indexValue);
  const strings: ContentBundle['strings'] = {};

  for (const language of index.languages) {
    strings[language.code] = validateStrings(
      readJson(`${language.code}/strings.json`),
    );
  }

  const documents: Record<string, unknown> = {};
  for (const path of Object.values(index.files)) {
    const document = readJson(path);
    if (!isRecord(document)) {
      throw new Error(`Invalid content document: ${path}.`);
    }
    documents[path] = document;
  }

  return { index, strings, documents, source };
}

