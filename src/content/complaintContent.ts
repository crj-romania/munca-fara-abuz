import type {
  ComplaintCategory,
  ComplaintContent,
  ComplaintField,
  ContentBundle
} from '@/src/types/content';
import type { ComplaintDraft } from '@/src/complaint/types';
import { getCountyName } from '@/src/complaint/counties';

export function getComplaintContent(content: ContentBundle): ComplaintContent {
  return content.documents[content.index.files.complaint] as ComplaintContent;
}

export function findComplaintCategory(
  complaint: ComplaintContent,
  categoryId: string | null,
): ComplaintCategory | null {
  if (!categoryId) {
    return null;
  }
  return (
    complaint.categories.find((category) => category.id === categoryId) ?? null
  );
}

export function getPhase3Fields(fields: ComplaintField[]): ComplaintField[] {
  return fields.filter((field) => field.type !== 'freetext');
}

function matchesViolationCondition(
  violationIds: string[] | undefined,
  selectedViolationIds: string[],
): boolean {
  return !violationIds || violationIds.some((id) => selectedViolationIds.includes(id));
}

export function isComplaintFieldRequired(
  field: ComplaintField,
  values: Record<string, string>,
  selectedViolationIds: string[] = [],
): boolean {
  // A missing violation condition means "no extra requirement", not "always required".
  return field.required || Boolean(
    field.requiredWhen?.values.includes(values[field.requiredWhen.field] ?? ''),
  ) || Boolean(
    field.requiredWhenViolationIds?.length &&
    matchesViolationCondition(field.requiredWhenViolationIds, selectedViolationIds),
  );
}

export function getVisibleComplaintFields(
  fields: ComplaintField[],
  values: Record<string, string>,
  selectedViolationIds: string[] = [],
): ComplaintField[] {
  return fields.filter((field) =>
    (!field.visibleWhen || field.visibleWhen.values.includes(values[field.visibleWhen.field] ?? '')) &&
    matchesViolationCondition(field.visibleWhenViolationIds, selectedViolationIds),
  );
}
// Accept local digit shapes as well as ASCII; never transliterate names.
export function normalizeComplaintDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹०-९০-৯０-９]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const start = [0x0660, 0x06f0, 0x0966, 0x09e6, 0xff10]
      .find((candidate) => code >= candidate && code <= candidate + 9)!;
    return String(code - start);
  });
}

export function getComplaintFieldError(
  field: ComplaintField,
  values: Record<string, string>,
  selectedViolationIds: string[] = [],
): string | undefined {
  if (!getVisibleComplaintFields([field], values, selectedViolationIds).length) return undefined;
  const value = (values[field.id] ?? '').trim();
  if (isComplaintFieldRequired(field, values, selectedViolationIds) && !value) return 'complaint.validation.required';  if (field.requiredAnyOf && !field.requiredAnyOf.some((id) => values[id]?.trim())) return 'complaint.validation.oneOf';
  if (!value) return undefined;
  if (field.type === 'freetext' && value.length > 1000) return 'complaint.text.tooLong';
  if (field.type === 'select' && !field.options?.some((option) => option.value === value)) return 'complaint.validation.required';
  if (field.type === 'county' && !(field.allowUnknown && value === 'unknown') && !getCountyName(value)) return 'complaint.validation.required';
  const digits = normalizeComplaintDigits(value);
  if (field.validation === 'cnp' && !/^\d{13}$/.test(digits)) return 'complaint.validation.cnp';
  if (field.validation === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'complaint.validation.email';
  if (field.validation === 'phone') {
    const count = digits.replace(/\D/g, '').length;
    if (!/^\+?[\d\s().-]+$/.test(digits) || count < 5 || count > 20) return 'complaint.validation.phone';
  }
  if (field.type === 'monthYear' && value !== 'unknown') {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(digits) || Number(digits.slice(0, 4)) < 1) return 'complaint.validation.date';
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (field.notFuture && digits > currentMonth) return 'complaint.validation.futureDate';
    const earlier = field.notBeforeField ? values[field.notBeforeField] : undefined;
    if (earlier && /^\d{4}-(0[1-9]|1[0-2])$/.test(earlier) && digits < earlier) return 'complaint.validation.dateOrder';
  }
  return undefined;
}

export function getSelectedPartyFields(complaint: ComplaintContent, draft: ComplaintDraft): ComplaintField[] {
  return complaint.partyTypes.filter((party) => draft.selectedPartyIds.includes(party.id))
    .flatMap((party) => getVisibleComplaintFields(party.fields, draft.values));
}

// Work fields as seen by a category: the employment status only offers the
// situations that make sense for it (e.g. "termination" → only "stopped").
export function getCategoryWorkFields(complaint: ComplaintContent, category: ComplaintCategory): ComplaintField[] {
  const allowed = category.employmentStatuses;
  if (!allowed?.length) return complaint.workFields;
  return complaint.workFields.map((field) => field.id === 'employmentStatus'
    ? { ...field, options: field.options?.filter((option) => allowed.includes(option.value)) }
    : field);
}

export function getInitialCategoryValues(category: ComplaintCategory): Record<string, string> {
  const [only, ...others] = category.employmentStatuses ?? [];
  return only && others.length === 0 ? { employmentStatus: only } : {};
}

export function getComplaintFields(complaint: ComplaintContent, category: ComplaintCategory, draft: ComplaintDraft): ComplaintField[] {
  return [
    ...getVisibleComplaintFields(complaint.commonFields, draft.values),
    ...getVisibleComplaintFields(getCategoryWorkFields(complaint, category), draft.values),
    ...getVisibleComplaintFields(category.fields, draft.values, draft.selectedViolationIds),
    ...getSelectedPartyFields(complaint, draft),
  ];
}

export function getActiveComplaintValues(complaint: ComplaintContent, category: ComplaintCategory, draft: ComplaintDraft): Record<string, string> {
  return Object.fromEntries(getComplaintFields(complaint, category, draft)
    .map((field) => [field.id, (draft.values[field.id] ?? '').trim()]));
}

export function isPhase3CategoryAvailable(
  category: ComplaintCategory,
): boolean {
  return category.violations.length > 0 || category.fields.some((field) => field.type === 'freetext');
}
