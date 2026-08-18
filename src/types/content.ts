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

export type InfoLeaf = {
  id: string;
  labelKey: string;
  bodyKey: string;
  steps: string[];
  institutionIds: string[];
  refs: string;
};

export type InfoBranch = {
  id: string;
  labelKey: string;
  icon?: string;
  items: InfoNode[];
};

export type InfoNode = InfoBranch | InfoLeaf;

export type InfoCategory = InfoBranch & {
  icon: string;
};

export type InfoContent = {
  categories: InfoCategory[];
};

export type EmergencyContact = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  value: string;
  action: 'call' | 'url';
  primary: boolean;
};

export type EmergencyContent = {
  titleKey: string;
  bodyKey: string;
  contacts: EmergencyContact[];
};

export type Institution = {
  id: string;
  nameRo: string;
  labelKey: string;
  perCounty: boolean;
  countyBasis?: 'employer' | 'worker';
  emails: Record<string, string>;
  whatsapp?: string;
};

export type InstitutionsContent = {
  institutions: Institution[];
};

export type ContentBundle = {
  index: ContentIndex;
  strings: Record<string, StringDictionary>;
  documents: Record<string, unknown>;
  source: 'bundled' | 'cache';
};
