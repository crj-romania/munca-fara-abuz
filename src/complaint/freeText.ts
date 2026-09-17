import type { ComplaintDraft, ComplaintTranslation } from '@/src/complaint/types';
import { getVisibleComplaintFields, isComplaintFieldRequired } from '@/src/content/complaintContent';
import type { ComplaintCategory } from '@/src/types/content';

export const FREE_TEXT_LIMIT = 1000;
export const TRANSLATION_LIMIT = 5000;

export function getNarrativeFields(category: ComplaintCategory, draft: ComplaintDraft) {
  return getVisibleComplaintFields(category.fields, draft.values).filter((field) => field.type === 'freetext');
}

export function getCurrentTranslation(draft: ComplaintDraft, fieldId: string): ComplaintTranslation | undefined {
  const original = draft.values[fieldId] ?? '';
  if (!original.trim()) return undefined;
  if (draft.textLanguage === 'ro') {
    return { original, translated: original, sourceLanguage: 'ro', engine: 'original' };
  }
  const translation = draft.translations?.[fieldId];
  return translation && translation.original === original && translation.sourceLanguage === draft.textLanguage &&
    ['mlkit', 'manual'].includes(translation.engine) && translation.translated.trim() &&
    translation.translated.length <= TRANSLATION_LIMIT ? translation : undefined;
}

export function getNarrativeError(category: ComplaintCategory, draft: ComplaintDraft): string | undefined {
  const fields = getNarrativeFields(category, draft);
  const hasFacts = category.violations.some((violation) => draft.selectedViolationIds.includes(violation.id));
  if (!hasFacts && !fields.some((field) => draft.values[field.id]?.trim())) return 'complaint.text.required';
  for (const field of fields) {
    const original = draft.values[field.id] ?? '';
    if (isComplaintFieldRequired(field, draft.values) && !original.trim()) return 'complaint.text.required';
    if (original.length > FREE_TEXT_LIMIT) return 'complaint.text.tooLong';
    if (original.trim() && !getCurrentTranslation(draft, field.id)) return 'complaint.text.translationRequired';
  }
  return undefined;
}

// Never place a complaint or personal text in a URL / browser history.
export function getGoogleTranslateUrl(sourceLanguage: string): string {
  const source = /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(sourceLanguage) ? sourceLanguage : 'auto';
  return `https://translate.google.com/?sl=${encodeURIComponent(source)}&tl=ro&op=translate`;
}
