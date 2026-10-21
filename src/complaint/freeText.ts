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

// Above this length the link opens without the text and the user pastes it
// (very long URLs can be rejected by the browser or by Google).
export const GOOGLE_TRANSLATE_URL_LIMIT = 8000;

// Opens Google Translate with the text already filled in (decision 2026-10-09:
// for this audience the copy/paste round trip costs more than it protects —
// the text reaches Google either way). The user is warned before opening.
export function getGoogleTranslateLink(
  sourceLanguage: string,
  text = '',
): { url: string; includesText: boolean } {
  const source = /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(sourceLanguage) ? sourceLanguage : 'auto';
  const base = `https://translate.google.com/?sl=${encodeURIComponent(source)}&tl=ro&op=translate`;
  const trimmed = text.trim();
  if (!trimmed) return { url: base, includesText: false };
  const withText = `${base}&text=${encodeURIComponent(trimmed)}`;
  return withText.length <= GOOGLE_TRANSLATE_URL_LIMIT
    ? { url: withText, includesText: true }
    : { url: base, includesText: false };
}
