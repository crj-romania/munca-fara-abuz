import type {
  ContentBundle,
  ContentIndex,
  EmergencyContact,
  EmergencyContent,
  InfoCategory,
  InfoContent,
  InfoNode,
  Institution,
  InstitutionsContent,
  StringDictionary,
} from '@/src/types/content';

const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const SAFE_JSON_PATH_PATTERN = /^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.json$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  value: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const result = value[key];
  if (typeof result !== 'string' || result.length === 0) {
    throw new Error(`${context}.${key} must be a non-empty string.`);
  }
  return result;
}

function requireStringArray(
  value: Record<string, unknown>,
  key: string,
  context: string,
): string[] {
  const result = value[key];
  if (!Array.isArray(result) || result.some((item) => typeof item !== 'string')) {
    throw new Error(`${context}.${key} must be a string array.`);
  }
  return result;
}

function validateInfoNode(value: unknown, context: string, depth: number): InfoNode {
  if (!isRecord(value) || depth > 20) {
    throw new Error(`Invalid or excessively deep info node: ${context}.`);
  }

  const id = requireString(value, 'id', context);
  const labelKey = requireString(value, 'labelKey', context);

  if ('items' in value) {
    if (!Array.isArray(value.items) || value.items.length === 0) {
      throw new Error(`${context}.items must be a non-empty array.`);
    }
    const seenIds = new Set<string>();
    const items = value.items.map((item, index) => {
      const parsed = validateInfoNode(item, `${context}.items[${index}]`, depth + 1);
      if (seenIds.has(parsed.id)) {
        throw new Error(`Duplicate info node id in ${context}: ${parsed.id}.`);
      }
      seenIds.add(parsed.id);
      return parsed;
    });
    const icon = value.icon;
    if (icon !== undefined && typeof icon !== 'string') {
      throw new Error(`${context}.icon must be a string.`);
    }
    return { id, labelKey, ...(icon ? { icon } : {}), items };
  }

  return {
    id,
    labelKey,
    bodyKey: requireString(value, 'bodyKey', context),
    steps: requireStringArray(value, 'steps', context),
    institutionIds: requireStringArray(value, 'institutionIds', context),
    refs: requireString(value, 'refs', context),
  };
}

function validateInfoContent(value: unknown): InfoContent {
  if (!isRecord(value) || !Array.isArray(value.categories)) {
    throw new Error('Invalid info document.');
  }
  const seenIds = new Set<string>();
  const categories = value.categories.map((category, index) => {
    const parsed = validateInfoNode(category, `info.categories[${index}]`, 0);
    if (!('items' in parsed) || !parsed.icon) {
      throw new Error('Every info category must have an icon and items.');
    }
    if (seenIds.has(parsed.id)) {
      throw new Error(`Duplicate info category id: ${parsed.id}.`);
    }
    seenIds.add(parsed.id);
    return parsed as InfoCategory;
  });
  return { categories };
}

function validateEmergencyContent(value: unknown): EmergencyContent {
  if (!isRecord(value) || !Array.isArray(value.contacts)) {
    throw new Error('Invalid emergency document.');
  }
  const contacts = value.contacts.map((contact, index) => {
    const context = `emergency.contacts[${index}]`;
    if (!isRecord(contact)) {
      throw new Error(`Invalid emergency contact: ${context}.`);
    }
    const action = contact.action;
    if (action !== 'call' && action !== 'url') {
      throw new Error(`${context}.action is invalid.`);
    }
    if (typeof contact.primary !== 'boolean') {
      throw new Error(`${context}.primary must be boolean.`);
    }
    return {
      id: requireString(contact, 'id', context),
      labelKey: requireString(contact, 'labelKey', context),
      descriptionKey: requireString(contact, 'descriptionKey', context),
      value: requireString(contact, 'value', context),
      action: action as EmergencyContact['action'],
      primary: contact.primary,
    };
  });
  return {
    titleKey: requireString(value, 'titleKey', 'emergency'),
    bodyKey: requireString(value, 'bodyKey', 'emergency'),
    contacts,
  };
}

function validateInstitutionsContent(value: unknown): InstitutionsContent {
  if (!isRecord(value) || !Array.isArray(value.institutions)) {
    throw new Error('Invalid institutions document.');
  }
  const institutions = value.institutions.map((institution, index) => {
    const context = `institutions[${index}]`;
    if (!isRecord(institution) || !isRecord(institution.emails)) {
      throw new Error(`Invalid institution: ${context}.`);
    }
    if (typeof institution.perCounty !== 'boolean') {
      throw new Error(`${context}.perCounty must be boolean.`);
    }
    const countyBasis = institution.countyBasis;
    if (
      countyBasis !== undefined &&
      countyBasis !== 'employer' &&
      countyBasis !== 'worker'
    ) {
      throw new Error(`${context}.countyBasis is invalid.`);
    }
    const emails = Object.fromEntries(
      Object.entries(institution.emails).map(([county, email]) => {
        if (typeof email !== 'string') {
          throw new Error(`${context}.emails.${county} must be a string.`);
        }
        return [county, email];
      }),
    );
    const whatsapp = institution.whatsapp;
    if (whatsapp !== undefined && typeof whatsapp !== 'string') {
      throw new Error(`${context}.whatsapp must be a string.`);
    }
    return {
      id: requireString(institution, 'id', context),
      nameRo: requireString(institution, 'nameRo', context),
      labelKey: requireString(institution, 'labelKey', context),
      perCounty: institution.perCounty,
      ...(countyBasis ? { countyBasis } : {}),
      emails,
      ...(whatsapp ? { whatsapp } : {}),
    } as Institution;
  });
  return { institutions };
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

  documents[index.files.info] = validateInfoContent(documents[index.files.info]);
  documents[index.files.emergency] = validateEmergencyContent(
    documents[index.files.emergency],
  );
  documents[index.files.institutions] = validateInstitutionsContent(
    documents[index.files.institutions],
  );

  return { index, strings, documents, source };
}
