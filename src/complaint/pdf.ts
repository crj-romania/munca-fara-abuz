import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

import { getCountyName } from '@/src/complaint/counties';
import { persistGeneratedPdf } from '@/src/complaint/documents';
import { getCurrentTranslation, getNarrativeError, getNarrativeFields } from '@/src/complaint/freeText';
import { resolveComplaintRoute } from '@/src/complaint/routing';
import type { ComplaintDraft, GeneratedComplaint } from '@/src/complaint/types';
import {
  getActiveComplaintValues,
  getCategoryWorkFields,
  getComplaintFieldError,
  getComplaintFields,
  getVisibleComplaintFields,
} from '@/src/content/complaintContent';
import type {
  ComplaintCategory,
  ComplaintContent,
  ComplaintField,
  InstitutionsContent,
  LanguageDefinition,
  StringDictionary,
} from '@/src/types/content';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function dictionaryText(dictionary: StringDictionary, key: string): string {
  return dictionary[key] ?? key;
}

function firstTranslated(
  dictionary: StringDictionary,
  keys: string[],
  fallback: string,
): string {
  for (const key of keys) {
    if (dictionary[key]) {
      return dictionary[key];
    }
  }
  return fallback;
}

function interpolate(
  template: string,
  values: Record<string, string>,
  missingValue: string,
): string {
  return template.replace(
    /\{\{?([a-zA-Z0-9_]+)\}?\}/g,
    (_match, key: string) => values[key]?.trim() || missingValue,
  );
}

function placeholderNames(template: string): string[] {
  return [...template.matchAll(/\{\{?([a-zA-Z0-9_]+)\}?\}/g)]
    .map((match) => match[1])
    .filter((name): name is string => Boolean(name));
}

// Main sentence of each selected fact, followed by the optional fragments whose
// field is filled (and matches the configured values). Returns the sentences and
// the field ids they consumed, so the same data is not repeated in a table.
function buildFactSentences(
  category: ComplaintCategory,
  draft: ComplaintDraft,
  activeValues: Record<string, string>,
  formattedValues: Record<string, string>,
  ro: StringDictionary,
  missingValue: string,
): { facts: string[]; usedFieldIds: Set<string> } {
  const usedFieldIds = new Set<string>();
  const matches = (part: { field: string; values?: string[] }) => {
    const value = activeValues[part.field]?.trim();
    return Boolean(value) && !isUnknownValue(value!) && (!part.values || part.values.includes(value!));
  };
  const facts = category.violations
    .filter(({ id }) => draft.selectedViolationIds.includes(id))
    .map((violation) => {
      const variant = violation.variants?.find(matches);
      if (variant) usedFieldIds.add(variant.field);
      const templates = [dictionaryText(ro, variant?.sentenceKey ?? violation.sentenceKey)];
      for (const detail of violation.details ?? []) {
        if (!matches(detail)) continue;
        templates.push(dictionaryText(ro, detail.sentenceKey));
        usedFieldIds.add(detail.field);
      }
      templates.forEach((template) => placeholderNames(template).forEach((name) => usedFieldIds.add(name)));
      return templates
        .map((template) => interpolate(template, formattedValues, missingValue))
        .join(' ');
    });
  if (activeValues.contractCopy === 'no') {
    facts.push(dictionaryText(ro, 'complaint.v.common.no_contract_copy.ro'));
  }
  return { facts, usedFieldIds };
}

function isPlaceholder(value: string | undefined): boolean {
  return !value || /^<[^>]+>$/.test(value.trim());
}

function isUnknownValue(value: string): boolean {
  return value.trim().toLowerCase() === 'unknown';
}

function isAccuracyField(field: ComplaintField): boolean {
  return /accuracy$/i.test(field.id) || field.id === 'singleName';
}

function monthYearValue(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  return match ? `${match[2]}/${match[1]}` : value;
}

function accuracyFor(
  field: ComplaintField,
  values: Record<string, string>,
): string | undefined {
  const accuracy = values[`${field.id}Accuracy`]?.trim();
  return accuracy || undefined;
}

function displayValue(
  field: ComplaintField,
  value: string,
  values: Record<string, string>,
  ro: StringDictionary,
): string {
  if (field.id === 'contractCopy') {
    const key = `complaint.pdf.contractCopy.${value}`;
    if (ro[key]) {
      return ro[key];
    }
    if (value === 'no') {
      return 'Nu am primit o copie a contractului de muncă.';
    }
    if (value === 'yes') {
      return 'Am primit o copie a contractului de muncă.';
    }
    return 'Nu știu dacă am primit o copie a contractului de muncă.';
  }

  if (isUnknownValue(value)) {
    return field.type === 'county'
      ? firstTranslated(ro, ['complaint.form.unknownCounty'], 'Județ necunoscut')
      : firstTranslated(ro, ['complaint.form.dateUnknown'], 'Nu știu');
  }

  let displayed = value;
  if (field.type === 'county') {
    displayed = getCountyName(value) ?? value;
  } else if (field.type === 'monthYear') {
    displayed = monthYearValue(value);
  } else if (field.type === 'select') {
    const option = field.options?.find(({ value: candidate }) => candidate === value);
    displayed = option ? dictionaryText(ro, option.labelKey) : value;
  }

  if (field.type === 'monthYear' && accuracyFor(field, values) === 'approximate') {
    const prefix = firstTranslated(
      ro,
      ['complaint.date.approximate'],
      'Aproximativ',
    );
    return `${prefix}: ${displayed}`;
  }
  return displayed;
}

function formattedActiveValues(
  fields: ComplaintField[],
  values: Record<string, string>,
  ro: StringDictionary,
): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.id]?.trim();
    if (!value || isAccuracyField(field)) {
      continue;
    }
    formatted[field.id] = displayValue(field, value, values, ro);
  }
  return formatted;
}

function renderRows(
  fields: ComplaintField[],
  values: Record<string, string>,
  ro: StringDictionary,
): string {
  return fields
    .filter((field) => !isAccuracyField(field) && field.type !== 'freetext')
    .map((field) => {
      const rawValue = values[field.id]?.trim();
      if (!rawValue) {
        return '';
      }
      return `<tr><th>${escapeHtml(dictionaryText(ro, field.labelKey))}</th><td>${escapeHtml(
        displayValue(field, rawValue, values, ro),
      )}</td></tr>`;
    })
    .filter(Boolean)
    .join('');
}

function validateSelection(
  complaint: ComplaintContent,
  category: ComplaintCategory,
  draft: ComplaintDraft,
): void {
  const violations = new Set(category.violations.map(({ id }) => id));
  for (const violationId of draft.selectedViolationIds) {
    if (!violations.has(violationId)) {
      throw new Error(`Unknown complaint violation: ${violationId}.`);
    }
  }
  const narrativeError = getNarrativeError(category, draft);
  if (narrativeError) throw new Error(narrativeError);

  const parties = new Set(complaint.partyTypes.map(({ id }) => id));
  if (draft.selectedPartyIds.length === 0) {
    throw new Error('At least one complaint party is required.');
  }
  for (const partyId of draft.selectedPartyIds) {
    if (!parties.has(partyId)) {
      throw new Error(`Unknown complaint party: ${partyId}.`);
    }
  }
}

function validateActiveFields(
  complaint: ComplaintContent,
  category: ComplaintCategory,
  draft: ComplaintDraft,
): ComplaintField[] {
  const fields = getComplaintFields(complaint, category, draft);
  for (const field of fields) {
    const errorKey = getComplaintFieldError(field, draft.values, draft.selectedViolationIds);
    if (errorKey) {
      throw new Error(`Invalid complaint field ${field.id}: ${errorKey}.`);
    }
  }
  return fields;
}

export function buildComplaintHtml(args: {
  complaint: ComplaintContent;
  category: ComplaintCategory;
  draft: ComplaintDraft;
  institutions: InstitutionsContent;
  ro: StringDictionary;
  createdAt?: Date;
  textLanguage?: LanguageDefinition;
  fontCss?: string;
}): {
  html: string;
  destinationLabel: string;
  recipients: string[];
  subject: string;
  emailBody: string;
  templateReady: boolean;
} {
  const complaint = args.complaint;
  const { category, draft, institutions, ro } = args;
  const createdAt = args.createdAt ?? new Date();
  validateSelection(complaint, category, draft);
  const activeFields = validateActiveFields(complaint, category, draft);
  const activeValues = getActiveComplaintValues(complaint, category, draft);
  const formattedValues = {
    ...activeValues,
    ...formattedActiveValues(activeFields, activeValues, ro),
  };
  const narratives = getNarrativeFields(category, draft).flatMap((field) => {
    const translation = getCurrentTranslation(draft, field.id);
    return translation ? [{ field, translation }] : [];
  });
  // A template can reference a narrative field, but must never insert its foreign original.
  for (const { field, translation } of narratives) {
    formattedValues[field.id] = translation.translated;
  }
  const translatedNarratives = narratives.filter(({ translation }) => translation.engine !== 'original');
  const narrativeSections = narratives.map(({ field, translation }) =>
    `<h3>${escapeHtml(dictionaryText(ro, field.labelKey))}</h3><p class="narrative" lang="ro" dir="ltr">${escapeHtml(translation.translated)}</p>`,
  ).join('');
  const originalAnnex = translatedNarratives.length ? `<section class="original-annex">
    <h2>${escapeHtml(dictionaryText(ro, 'complaint.pdf.originalAnnex'))}</h2>
    <p>${escapeHtml(dictionaryText(ro, 'complaint.pdf.originalLanguage'))}: ${escapeHtml(args.textLanguage?.name ?? draft.textLanguage)}</p>
    ${translatedNarratives.map(({ field, translation }) => `<h3>${escapeHtml(dictionaryText(ro, field.labelKey))}</h3>
      <p class="narrative" lang="${escapeHtml(translation.sourceLanguage)}" dir="${args.textLanguage ? (args.textLanguage.rtl ? 'rtl' : 'ltr') : 'auto'}">${escapeHtml(translation.original)}</p>`).join('')}
    </section>` : '';

  const route = resolveComplaintRoute(
    category,
    { ...draft, values: activeValues },
    institutions,
  );
  const destinationLabel =
    route.destinationNames.join('; ') ||
    dictionaryText(ro, 'complaint.pdf.destinationUnavailable');
  const categoryLabel = dictionaryText(ro, category.labelKey);
  const subject = interpolate(
    dictionaryText(ro, 'complaint.pdf.subject'),
    { category: categoryLabel },
    dictionaryText(ro, 'complaint.pdf.unspecified'),
  );
  const missingValue = dictionaryText(ro, 'complaint.pdf.unspecified');
  const { facts, usedFieldIds } = buildFactSentences(
    category, draft, activeValues, formattedValues, ro, missingValue,
  );

  const categoryTemplate = ro[category.templateKey];
  const requestText = isPlaceholder(categoryTemplate)
    ? dictionaryText(ro, 'complaint.pdf.request')
    : (categoryTemplate ?? dictionaryText(ro, 'complaint.pdf.request'));
  const isDraftTemplate = isPlaceholder(categoryTemplate);
  const petitionerName = [
    activeValues.firstName?.trim(),
    activeValues.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(' ');
  const dateLabel = createdAt.toLocaleDateString('ro-RO');
  const commonFields = getVisibleComplaintFields(complaint.commonFields, activeValues);
  // "No contract copy" is stated among the facts, so it is not repeated here.
  const workFields = getVisibleComplaintFields(getCategoryWorkFields(complaint, category), activeValues)
    .filter((field) => !(field.id === 'contractCopy' && activeValues.contractCopy === 'no'));
  // Data already written into a fact sentence is not repeated in the table.
  const factFields = getVisibleComplaintFields(category.fields, activeValues, draft.selectedViolationIds)
    .filter((field) => field.type !== 'freetext' && !usedFieldIds.has(field.id));
  const partySections = draft.selectedPartyIds
    .map((partyId) => {
      const party = complaint.partyTypes.find(({ id }) => id === partyId);
      if (!party) {
        return '';
      }
      const fields = getVisibleComplaintFields(party.fields, activeValues);
      return `<h2>${escapeHtml(dictionaryText(ro, party.labelKey))}</h2><table>${renderRows(
        fields,
        activeValues,
        ro,
      )}</table>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<style>
  ${args.fontCss ?? ''}
  @page { margin: 20mm; }
  body { font-family: ComplaintLatin, ComplaintDevanagari, ComplaintArabic, ComplaintBengali, ComplaintSinhala, ComplaintTamil, Arial, sans-serif; color: #17212b; font-size: 12pt; line-height: 1.45; }
  h1 { font-size: 18pt; margin: 24px 0; text-align: center; }
  h2 { font-size: 13pt; margin: 22px 0 8px; }
  h3 { font-size: 12pt; margin: 12px 0 6px; }
  p { margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
  th, td { border: 1px solid #cbd5de; padding: 7px; vertical-align: top; text-align: left; overflow-wrap: anywhere; }
  th { width: 34%; background: #f4f7fa; }
  .meta { margin-bottom: 18px; }
  .draft { padding: 10px; border: 1px solid #b42318; color: #b42318; background: #fff1f0; }
  .signature { margin-top: 32px; }
  .narrative { white-space: pre-wrap; overflow-wrap: anywhere; }
  .original-annex { page-break-before: always; }
</style>
</head>
<body>
${isDraftTemplate ? `<p class="draft">${escapeHtml(dictionaryText(ro, 'complaint.pdf.draftBanner'))}</p>` : ''}
<div class="meta">
  <p><strong>${escapeHtml(dictionaryText(ro, 'complaint.pdf.to'))}:</strong> ${escapeHtml(destinationLabel)}</p>
  <p><strong>${escapeHtml(dictionaryText(ro, 'complaint.pdf.date'))}:</strong> ${escapeHtml(dateLabel)}</p>
</div>
<h1>${escapeHtml(subject)}</h1>
<h2>${escapeHtml(dictionaryText(ro, 'complaint.pdf.petitioner'))}</h2>
<table>${renderRows(commonFields, activeValues, ro)}</table>
<h2>${escapeHtml(dictionaryText(ro, 'complaint.pdf.work'))}</h2>
<table>${renderRows(workFields, activeValues, ro)}</table>
<h2>${escapeHtml(dictionaryText(ro, 'complaint.pdf.facts'))}</h2>
${facts.length ? `<ul>${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>` : ''}
${factFields.length > 0 ? `<table>${renderRows(factFields, activeValues, ro)}</table>` : ''}
${narrativeSections}
${translatedNarratives.length ? `<p>${escapeHtml(dictionaryText(ro, 'complaint.pdf.translationNotice'))}</p>` : ''}
${partySections}
<h2>${escapeHtml(dictionaryText(ro, 'complaint.pdf.requestTitle'))}</h2>
<p>${escapeHtml(requestText)}</p>
${draft.attachments.length ? `<h2>${escapeHtml(dictionaryText(ro, 'complaint.pdf.attachments'))}</h2>
<p>${escapeHtml(dictionaryText(ro, 'complaint.pdf.attachmentsSeparate'))}</p>
<ul>${draft.attachments.map((item) => `<li>${escapeHtml(item.name)} (${Math.ceil(item.size / 1024)} KB)</li>`).join('')}</ul>` : ''}
<div class="signature">
  <p><strong>${escapeHtml(dictionaryText(ro, 'complaint.pdf.signature'))}:</strong> ${escapeHtml(petitionerName)}</p>
  <p>${escapeHtml(dictionaryText(ro, 'complaint.pdf.electronicSubmission'))}</p>
</div>
${originalAnnex}
</body>
</html>`;

  return {
    html,
    destinationLabel,
    recipients: route.recipients,
    subject,
    emailBody: dictionaryText(ro, 'complaint.email.body'),
    templateReady: !isDraftTemplate,
  };
}

export async function generateComplaintPdf(args: {
  complaint: ComplaintContent;
  category: ComplaintCategory;
  draft: ComplaintDraft;
  institutions: InstitutionsContent;
  ro: StringDictionary;
  categoryLabel: string;
  textLanguage?: LanguageDefinition;
}): Promise<GeneratedComplaint> {
  const createdAt = new Date();
  const { getPdfFontCss } = await import('@/src/complaint/pdfFonts');
  const fontCss = await getPdfFontCss(Object.values(getActiveComplaintValues(args.complaint, args.category, args.draft)).join('\n'));
  const rendered = buildComplaintHtml({ ...args, createdAt, fontCss });
  const temporary = await Print.printToFileAsync({ html: rendered.html });
  try {
    const stored = await persistGeneratedPdf(
      temporary.uri,
      args.category.id,
      createdAt.toISOString(),
      args.draft.attachments,
    );
    return {
      ...stored,
      categoryId: args.category.id,
      categoryLabel: args.categoryLabel,
      destinationLabel: rendered.destinationLabel,
      recipients: rendered.recipients,
      emailSubject: rendered.subject,
      emailBody: rendered.emailBody,
      templateReady: rendered.templateReady,
      createdAt: createdAt.toISOString(),
    };
  } finally {
    // Only the temporary PDF returned by expo-print, never an original attachment.
    if (FileSystem.cacheDirectory && temporary.uri.startsWith(FileSystem.cacheDirectory) && temporary.uri.endsWith('.pdf')) {
      await FileSystem.deleteAsync(temporary.uri, { idempotent: true }).catch(() => {});
    }
  }
}
