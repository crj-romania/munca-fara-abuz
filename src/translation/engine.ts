import type { LanguageDefinition } from '@/src/types/content';
import MigrantTranslation from '@/modules/migrant-translation';

type TranslationStage = 'downloading' | 'translating';

const ROMANIAN_LANGUAGE = 'ro';
const ENGLISH_LANGUAGE = 'en';

// Keep each model operation exclusive. A rejected operation is deliberately swallowed for
// the queue tail, so a later language switch or translation can still run.
let nativeOperationTail: Promise<void> = Promise.resolve();

function enqueueNativeOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = nativeOperationTail.catch(() => undefined).then(operation);
  nativeOperationTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function mlKitLanguageCode(language: LanguageDefinition): string | undefined {
  const capability = language.mt;
  if (typeof capability !== 'string' || !capability.startsWith('mlkit:')) {
    return undefined;
  }

  const code = capability.slice('mlkit:'.length);
  return code.length > 0 ? code : undefined;
}

function supportedNativeLanguages(): ReadonlySet<string> {
  if (!MigrantTranslation) {
    return new Set();
  }

  try {
    return new Set(MigrantTranslation.getSupportedLanguages());
  } catch {
    return new Set();
  }
}

function unavailable(): Error {
  return new Error('E_ON_DEVICE_TRANSLATION_UNAVAILABLE');
}

export function isOnDeviceTranslationAvailable(language: LanguageDefinition): boolean {
  const source = mlKitLanguageCode(language);
  const supported = supportedNativeLanguages();
  return source !== undefined && supported.has(source) && supported.has(ROMANIAN_LANGUAGE);
}

export function translateOnDevice(
  text: string,
  language: LanguageDefinition,
  onStage?: (stage: TranslationStage) => void,
): Promise<string> {
  const source = mlKitLanguageCode(language);
  if (language.code === ROMANIAN_LANGUAGE) {
    return Promise.resolve(text);
  }
  const nativeModule = MigrantTranslation;
  const supported = supportedNativeLanguages();
  if (
    !nativeModule ||
    source === undefined ||
    !supported.has(source) ||
    !supported.has(ROMANIAN_LANGUAGE)
  ) {
    return Promise.reject(unavailable());
  }

  return enqueueNativeOperation(async () => {
    onStage?.('downloading');
    await nativeModule.prepare(source, ROMANIAN_LANGUAGE);
    onStage?.('translating');
    return nativeModule.translate(text, source, ROMANIAN_LANGUAGE);
  });
}

export function deletePreviousTranslationModel(
  previous: LanguageDefinition | undefined,
  next: LanguageDefinition,
): Promise<void> {
  const previousSource = previous && mlKitLanguageCode(previous);
  const nextSource = mlKitLanguageCode(next);
  const nativeModule = MigrantTranslation;
  if (
    !nativeModule ||
    previousSource === undefined ||
    previousSource === ROMANIAN_LANGUAGE ||
    previousSource === ENGLISH_LANGUAGE ||
    previousSource === nextSource
  ) {
    return Promise.resolve();
  }

  return enqueueNativeOperation(() => nativeModule.deleteModel(previousSource));
}
