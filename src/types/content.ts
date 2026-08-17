export type TranslationCapability = `mlkit:${string}` | 'none';

export type LanguageDefinition = {
  code: string;
  name: string;
  rtl: boolean;
  mt?: TranslationCapability;
};

export type ContentIndex = {
  schemaVersion: number;
  contentVersion: string;
  legalUpdatedAt: string;
  languages: LanguageDefinition[];
  files: {
    info: string;
    complaint: string;
    institutions: string;
    emergency: string;
  };
};

export type StringDictionary = Record<string, string>;

export type ContentBundle = {
  index: ContentIndex;
  strings: Record<string, StringDictionary>;
  documents: Record<string, unknown>;
  source: 'bundled' | 'cache';
};

