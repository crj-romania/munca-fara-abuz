import { requireOptionalNativeModule } from 'expo';

export type MigrantTranslationNativeModule = {
  getSupportedLanguages(): string[];
  prepare(source: string, target: string): Promise<void>;
  translate(text: string, source: string, target: string): Promise<string>;
  deleteModel(language: string): Promise<void>;
};

// Expo Go does not include this local module. Optional loading keeps the JS bundle usable there.
const MigrantTranslation = requireOptionalNativeModule<MigrantTranslationNativeModule>(
  'MigrantTranslation',
);

export default MigrantTranslation;
