import type { LanguageDefinition } from '@/src/types/content';

type TranslationStage = 'downloading' | 'translating';

const ROMANIAN_LANGUAGE = 'ro';

export function isOnDeviceTranslationAvailable(_language: LanguageDefinition): boolean {
  return false;
}

export function translateOnDevice(
  text: string,
  language: LanguageDefinition,
  _onStage?: (stage: TranslationStage) => void,
): Promise<string> {
  if (language.code === ROMANIAN_LANGUAGE) {
    return Promise.resolve(text);
  }
  return Promise.reject(new Error('E_ON_DEVICE_TRANSLATION_UNAVAILABLE'));
}

export function deletePreviousTranslationModel(
  _previous: LanguageDefinition | undefined,
  _next: LanguageDefinition,
): Promise<void> {
  return Promise.resolve();
}
