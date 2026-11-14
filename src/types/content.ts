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
  // While a category's legal template is still provisional, its complaints are
  // emailed only to this address, stating the authority they would reach.
  testRecipient?: string;
};

export type ComplaintFieldType =
  | 'text'
  | 'date'
  | 'monthYear'
  | 'select'
  | 'county'
  | 'freetext';

export type ComplaintFieldOption = {
  value: string;
  labelKey: string;
};

export type ComplaintField = {
  id: string;
  type: ComplaintFieldType;
  required: boolean;
  labelKey: string;
  hintKey?: string;
  // Longer help shown on demand behind an (i) button next to the label.
  infoKey?: string;
  options?: ComplaintFieldOption[];
  visibleWhen?: {
    field: string;
    values: string[];
  };
  requiredWhen?: {
    field: string;
    values: string[];
  };
  visibleWhenViolationIds?: string[];
  requiredWhenViolationIds?: string[];
  requiredAnyOf?: string[];
  validation?: 'email' | 'phone' | 'cnp';
  allowUnknown?: boolean;
  notBeforeField?: string;
  notFuture?: boolean;
};

export type ComplaintViolation = {
  id: string;
  labelKey: string;
  sentenceKey: string;
  // Optional sentence fragments appended after the main sentence: included only
  // when `field` is filled (and, if `values` is set, has one of those values).
  details?: ComplaintSentenceDetail[];
  // Alternative main sentences: the first one whose field matches replaces
  // `sentenceKey` (e.g. "The employer keeps my passport" vs. "The agency …").
  variants?: ComplaintSentenceDetail[];
  emergencyBanner?: boolean;
};

export type ComplaintSentenceDetail = {
  field: string;
  values?: string[];
  sentenceKey: string;
};

export type ComplaintStatusQuestion = {
  labelKey: string;
  options: string[];
};

export type ComplaintCategory = {
  id: string;
  labelKey: string;
  requiresEmployer: boolean;
  // Work situations that make sense for this category (default: all).
  employmentStatuses?: string[];
  suggestedPartyIds: string[];
  violations: ComplaintViolation[];
  fields: ComplaintField[];
  destinations: {
    default: string[];
  };
  routingCountyFields?: Record<string, string>;
  templateKey: string;
};

export type ComplaintContent = {
  statusQuestions: {
    employment: ComplaintStatusQuestion;
  };
  commonFields: ComplaintField[];
  workFields: ComplaintField[];
  employerFields: ComplaintField[];
  partyTypes: {
    id: string;
    labelKey: string;
    fields: ComplaintField[];
  }[];
  categories: ComplaintCategory[];
};

export type ContentBundle = {
  index: ContentIndex;
  strings: Record<string, StringDictionary>;
  documents: Record<string, unknown>;
  source: 'bundled' | 'cache';
};
