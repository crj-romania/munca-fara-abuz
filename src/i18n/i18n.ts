import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { StringDictionary } from '@/src/types/content';

function toResources(dictionaries: Record<string, StringDictionary>) {
  return Object.fromEntries(
    Object.entries(dictionaries).map(([code, translation]) => [
      code,
      { translation },
    ]),
  );
}

export async function initializeI18n(
  dictionaries: Record<string, StringDictionary>,
  languageCode: string,
): Promise<void> {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: toResources(dictionaries),
      lng: languageCode,
      fallbackLng: 'en',
      compatibilityJSON: 'v4',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
    return;
  }

  replaceI18nResources(dictionaries);
  await i18n.changeLanguage(languageCode);
}

export function replaceI18nResources(
  dictionaries: Record<string, StringDictionary>,
): void {
  for (const [code, translation] of Object.entries(dictionaries)) {
    i18n.addResourceBundle(code, 'translation', translation, true, true);
  }
}

export default i18n;

