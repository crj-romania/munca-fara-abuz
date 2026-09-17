export type ComplaintDraft = {
  id: string;
  categoryId: string | null;
  selectedViolationIds: string[];
  selectedPartyIds: string[];
  values: Record<string, string>;
  textLanguage: string;
  translations: Record<string, ComplaintTranslation>;
  attachments: ComplaintAttachment[];
};

export type ComplaintTranslation = {
  original: string;
  translated: string;
  sourceLanguage: string;
  engine: 'mlkit' | 'manual' | 'original';
};

export type ComplaintAttachment = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export type ComplaintRoute = {
  institutionIds: string[];
  destinationNames: string[];
  recipients: string[];
  unresolvedInstitutionIds: string[];
};

export type GeneratedComplaint = {
  uri: string;
  fileName: string;
  categoryId: string;
  categoryLabel: string;
  destinationLabel: string;
  recipients: string[];
  emailSubject: string;
  emailBody: string;
  templateReady: boolean;
  createdAt: string;
  attachments: ComplaintAttachment[];
};

export type StoredComplaintDocument = {
  uri: string;
  fileName: string;
  createdAt: number;
  attachments: ComplaintAttachment[];
};
