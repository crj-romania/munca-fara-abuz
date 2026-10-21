import type {
  ComplaintCategory,
  ComplaintContent,
  ComplaintField,
  ComplaintFieldOption,
  ComplaintSentenceDetail,
  ComplaintStatusQuestion,
  ComplaintViolation,
  ContentBundle,
  ContentIndex,
  EmergencyContact,
  EmergencyContent,
  InfoCategory,
  InfoContent,
  InfoNode,
  Institution,
  InstitutionsContent,
  StringDictionary,
} from '@/src/types/content';

const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const SAFE_JSON_PATH_PATTERN = /^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.json$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  value: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const result = value[key];
  if (typeof result !== 'string' || result.length === 0) {
    throw new Error(`${context}.${key} must be a non-empty string.`);
  }
  return result;
}

function requireStringArray(
  value: Record<string, unknown>,
  key: string,
  context: string,
): string[] {
  const result = value[key];
  if (!Array.isArray(result) || result.some((item) => typeof item !== 'string')) {
    throw new Error(`${context}.${key} must be a string array.`);
  }
  return result;
}

function validateInfoNode(value: unknown, context: string, depth: number): InfoNode {
  if (!isRecord(value) || depth > 20) {
    throw new Error(`Invalid or excessively deep info node: ${context}.`);
  }

  const id = requireString(value, 'id', context);
  const labelKey = requireString(value, 'labelKey', context);

  if ('items' in value) {
    if (!Array.isArray(value.items) || value.items.length === 0) {
      throw new Error(`${context}.items must be a non-empty array.`);
    }
    const seenIds = new Set<string>();
    const items = value.items.map((item, index) => {
      const parsed = validateInfoNode(item, `${context}.items[${index}]`, depth + 1);
      if (seenIds.has(parsed.id)) {
        throw new Error(`Duplicate info node id in ${context}: ${parsed.id}.`);
      }
      seenIds.add(parsed.id);
      return parsed;
    });
    const icon = value.icon;
    if (icon !== undefined && typeof icon !== 'string') {
      throw new Error(`${context}.icon must be a string.`);
    }
    return { id, labelKey, ...(icon ? { icon } : {}), items };
  }

  return {
    id,
    labelKey,
    bodyKey: requireString(value, 'bodyKey', context),
    steps: requireStringArray(value, 'steps', context),
    institutionIds: requireStringArray(value, 'institutionIds', context),
    refs: requireString(value, 'refs', context),
  };
}

function validateInfoContent(value: unknown): InfoContent {
  if (!isRecord(value) || !Array.isArray(value.categories)) {
    throw new Error('Invalid info document.');
  }
  const seenIds = new Set<string>();
  const categories = value.categories.map((category, index) => {
    const parsed = validateInfoNode(category, `info.categories[${index}]`, 0);
    if (!('items' in parsed) || !parsed.icon) {
      throw new Error('Every info category must have an icon and items.');
    }
    if (seenIds.has(parsed.id)) {
      throw new Error(`Duplicate info category id: ${parsed.id}.`);
    }
    seenIds.add(parsed.id);
    return parsed as InfoCategory;
  });
  return { categories };
}

function validateEmergencyContent(value: unknown): EmergencyContent {
  if (!isRecord(value) || !Array.isArray(value.contacts)) {
    throw new Error('Invalid emergency document.');
  }
  const contacts = value.contacts.map((contact, index) => {
    const context = `emergency.contacts[${index}]`;
    if (!isRecord(contact)) {
      throw new Error(`Invalid emergency contact: ${context}.`);
    }
    const action = contact.action;
    if (action !== 'call' && action !== 'url') {
      throw new Error(`${context}.action is invalid.`);
    }
    if (typeof contact.primary !== 'boolean') {
      throw new Error(`${context}.primary must be boolean.`);
    }
    return {
      id: requireString(contact, 'id', context),
      labelKey: requireString(contact, 'labelKey', context),
      descriptionKey: requireString(contact, 'descriptionKey', context),
      value: requireString(contact, 'value', context),
      action: action as EmergencyContact['action'],
      primary: contact.primary,
    };
  });
  return {
    titleKey: requireString(value, 'titleKey', 'emergency'),
    bodyKey: requireString(value, 'bodyKey', 'emergency'),
    contacts,
  };
}

function validateInstitutionsContent(value: unknown): InstitutionsContent {
  if (!isRecord(value) || !Array.isArray(value.institutions)) {
    throw new Error('Invalid institutions document.');
  }
  const institutions = value.institutions.map((institution, index) => {
    const context = `institutions[${index}]`;
    if (!isRecord(institution) || !isRecord(institution.emails)) {
      throw new Error(`Invalid institution: ${context}.`);
    }
    if (typeof institution.perCounty !== 'boolean') {
      throw new Error(`${context}.perCounty must be boolean.`);
    }
    const countyBasis = institution.countyBasis;
    if (
      (institution.perCounty && countyBasis === undefined) ||
      (countyBasis !== undefined &&
        countyBasis !== 'employer' &&
        countyBasis !== 'worker')
    ) {
      throw new Error(`${context}.countyBasis is invalid.`);
    }
    const emails = Object.fromEntries(
      Object.entries(institution.emails).map(([county, email]) => {
        if (typeof email !== 'string') {
          throw new Error(`${context}.emails.${county} must be a string.`);
        }
        return [county, email];
      }),
    );
    const whatsapp = institution.whatsapp;
    if (whatsapp !== undefined && typeof whatsapp !== 'string') {
      throw new Error(`${context}.whatsapp must be a string.`);
    }
    return {
      id: requireString(institution, 'id', context),
      nameRo: requireString(institution, 'nameRo', context),
      labelKey: requireString(institution, 'labelKey', context),
      perCounty: institution.perCounty,
      ...(countyBasis ? { countyBasis } : {}),
      emails,
      ...(whatsapp ? { whatsapp } : {}),
    } as Institution;
  });
  return { institutions };
}

// ---------------------------------------------------------------------------
// Complaint document. Remote content is published without an app release, so a
// malformed complaint.json must be rejected here (falling back to the previous
// valid content) instead of crashing the complaint flow at runtime.
// ---------------------------------------------------------------------------

const FIELD_TYPES = ['text', 'date', 'monthYear', 'select', 'county', 'freetext'];
const EMPLOYMENT_OPTIONS = ['working', 'stopped', 'not_started'];

function requireUniqueNonEmpty(values: string[], context: string): string[] {
  if (values.length === 0 || new Set(values).size !== values.length) {
    throw new Error(`${context} must be non-empty and unique.`);
  }
  return values;
}

function validateFieldCondition(value: unknown, context: string) {
  if (!isRecord(value)) {
    throw new Error(`${context} must be an object.`);
  }
  const field = requireString(value, 'field', context);
  const values = requireUniqueNonEmpty(
    requireStringArray(value, 'values', context),
    `${context}.values`,
  );
  return { field, values };
}

function validateOptionalIdList(value: unknown, context: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${context} must be a string array.`);
  }
  return requireUniqueNonEmpty(value as string[], context);
}

function validateComplaintField(value: unknown, context: string): ComplaintField {
  if (!isRecord(value)) {
    throw new Error(`Invalid complaint field: ${context}.`);
  }
  const type = value.type;
  if (typeof type !== 'string' || !FIELD_TYPES.includes(type)) {
    throw new Error(`${context}.type is invalid.`);
  }
  if (typeof value.required !== 'boolean') {
    throw new Error(`${context}.required must be boolean.`);
  }
  const hintKey = value.hintKey;
  if (hintKey !== undefined && typeof hintKey !== 'string') {
    throw new Error(`${context}.hintKey must be a string.`);
  }
  const visibleWhen = value.visibleWhen === undefined
    ? undefined
    : validateFieldCondition(value.visibleWhen, `${context}.visibleWhen`);
  const requiredWhen = value.requiredWhen === undefined
    ? undefined
    : validateFieldCondition(value.requiredWhen, `${context}.requiredWhen`);
  const requiredAnyOf = validateOptionalIdList(value.requiredAnyOf, `${context}.requiredAnyOf`);
  const visibleWhenViolationIds = validateOptionalIdList(
    value.visibleWhenViolationIds,
    `${context}.visibleWhenViolationIds`,
  );
  const requiredWhenViolationIds = validateOptionalIdList(
    value.requiredWhenViolationIds,
    `${context}.requiredWhenViolationIds`,
  );

  const validation = value.validation;
  if (
    validation !== undefined &&
    validation !== 'email' &&
    validation !== 'phone' &&
    validation !== 'cnp'
  ) {
    throw new Error(`${context}.validation is invalid.`);
  }
  if (validation !== undefined && type !== 'text') {
    throw new Error(`${context}.validation is only supported for text fields.`);
  }
  const allowUnknown = value.allowUnknown;
  if (allowUnknown !== undefined && (type !== 'county' || typeof allowUnknown !== 'boolean')) {
    throw new Error(`${context}.allowUnknown is only supported as a boolean for county fields.`);
  }
  const notBeforeField = value.notBeforeField;
  if (
    notBeforeField !== undefined &&
    (typeof notBeforeField !== 'string' ||
      notBeforeField.length === 0 ||
      (type !== 'date' && type !== 'monthYear'))
  ) {
    throw new Error(`${context}.notBeforeField is invalid.`);
  }
  const notFuture = value.notFuture;
  if (notFuture !== undefined && (typeof notFuture !== 'boolean' || type !== 'monthYear')) {
    throw new Error(`${context}.notFuture is only supported as a boolean for monthYear fields.`);
  }

  let options: ComplaintFieldOption[] | undefined;
  if (type === 'select') {
    if (!Array.isArray(value.options) || value.options.length === 0) {
      throw new Error(`${context}.options must be a non-empty array.`);
    }
    const seen = new Set<string>();
    options = value.options.map((option, index) => {
      const optionContext = `${context}.options[${index}]`;
      if (!isRecord(option)) {
        throw new Error(`Invalid complaint option: ${optionContext}.`);
      }
      const parsed = {
        value: requireString(option, 'value', optionContext),
        labelKey: requireString(option, 'labelKey', optionContext),
      };
      if (seen.has(parsed.value)) {
        throw new Error(`Duplicate option value in ${context}: ${parsed.value}.`);
      }
      seen.add(parsed.value);
      return parsed;
    });
  } else if (value.options !== undefined) {
    throw new Error(`${context}.options is only supported for select fields.`);
  }

  return {
    id: requireString(value, 'id', context),
    type: type as ComplaintField['type'],
    required: value.required,
    labelKey: requireString(value, 'labelKey', context),
    ...(hintKey ? { hintKey } : {}),
    ...(options ? { options } : {}),
    ...(visibleWhen ? { visibleWhen } : {}),
    ...(requiredWhen ? { requiredWhen } : {}),
    ...(visibleWhenViolationIds ? { visibleWhenViolationIds } : {}),
    ...(requiredWhenViolationIds ? { requiredWhenViolationIds } : {}),
    ...(requiredAnyOf ? { requiredAnyOf } : {}),
    ...(validation ? { validation } : {}),
    ...(allowUnknown !== undefined ? { allowUnknown } : {}),
    ...(notBeforeField ? { notBeforeField } : {}),
    ...(notFuture !== undefined ? { notFuture } : {}),
  } as ComplaintField;
}

function validateComplaintFields(value: unknown, context: string): ComplaintField[] {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be an array.`);
  }
  const seen = new Set<string>();
  return value.map((item, index) => {
    const field = validateComplaintField(item, `${context}[${index}]`);
    if (seen.has(field.id)) {
      throw new Error(`Duplicate complaint field id in ${context}: ${field.id}.`);
    }
    seen.add(field.id);
    return field;
  });
}

function validateStatusQuestion(value: unknown, context: string): ComplaintStatusQuestion {
  if (!isRecord(value)) {
    throw new Error(`Invalid complaint status question: ${context}.`);
  }
  return {
    labelKey: requireString(value, 'labelKey', context),
    options: requireUniqueNonEmpty(requireStringArray(value, 'options', context), `${context}.options`),
  };
}

function validatePartyTypes(value: unknown): ComplaintContent['partyTypes'] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('complaint.partyTypes must be a non-empty array.');
  }
  const seen = new Set<string>();
  return value.map((party, index) => {
    const context = `complaint.partyTypes[${index}]`;
    if (!isRecord(party)) {
      throw new Error(`Invalid complaint party type: ${context}.`);
    }
    const id = requireString(party, 'id', context);
    if (seen.has(id)) {
      throw new Error(`Duplicate complaint party type id: ${id}.`);
    }
    seen.add(id);
    return {
      id,
      labelKey: requireString(party, 'labelKey', context),
      fields: validateComplaintFields(party.fields, `${context}.fields`),
    };
  });
}

// Shared shape of `details` (appended fragments) and `variants` (replacement
// main sentences): [{ field, values?, sentenceKey }].
function validateSentenceParts(
  value: unknown,
  context: string,
): ComplaintSentenceDetail[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${context} must be a non-empty array.`);
  }
  return value.map((part, index) => {
    const partContext = `${context}[${index}]`;
    if (!isRecord(part)) {
      throw new Error(`Invalid sentence part: ${partContext}.`);
    }
    const values = validateOptionalIdList(part.values, `${partContext}.values`);
    return {
      field: requireString(part, 'field', partContext),
      ...(values ? { values } : {}),
      sentenceKey: requireString(part, 'sentenceKey', partContext),
    };
  });
}

function validateComplaintCategory(
  value: unknown,
  context: string,
  partyIds: Set<string>,
): ComplaintCategory {
  if (!isRecord(value) || !Array.isArray(value.violations) || !isRecord(value.destinations)) {
    throw new Error(`Invalid complaint category: ${context}.`);
  }
  if (typeof value.requiresEmployer !== 'boolean') {
    throw new Error(`${context}.requiresEmployer must be boolean.`);
  }
  const suggestedPartyIds = requireUniqueNonEmpty(
    requireStringArray(value, 'suggestedPartyIds', context),
    `${context}.suggestedPartyIds`,
  );
  const employmentStatuses = validateOptionalIdList(
    value.employmentStatuses,
    `${context}.employmentStatuses`,
  );
  if (employmentStatuses?.some((status) => !EMPLOYMENT_OPTIONS.includes(status))) {
    throw new Error(`${context}.employmentStatuses must use working, stopped, or not_started.`);
  }
  for (const partyId of suggestedPartyIds) {
    if (!partyIds.has(partyId)) {
      throw new Error(`Unknown suggested party type ${partyId} in category ${context}.`);
    }
  }

  const violationIds = new Set<string>();
  const violations: ComplaintViolation[] = value.violations.map((violation, index) => {
    const violationContext = `${context}.violations[${index}]`;
    if (!isRecord(violation)) {
      throw new Error(`Invalid complaint violation: ${violationContext}.`);
    }
    const emergencyBanner = violation.emergencyBanner;
    if (emergencyBanner !== undefined && typeof emergencyBanner !== 'boolean') {
      throw new Error(`${violationContext}.emergencyBanner must be boolean.`);
    }
    const details = validateSentenceParts(violation.details, `${violationContext}.details`);
    const variants = validateSentenceParts(violation.variants, `${violationContext}.variants`);
    const parsed = {
      id: requireString(violation, 'id', violationContext),
      labelKey: requireString(violation, 'labelKey', violationContext),
      sentenceKey: requireString(violation, 'sentenceKey', violationContext),
      ...(details ? { details } : {}),
      ...(variants ? { variants } : {}),
      ...(emergencyBanner !== undefined ? { emergencyBanner } : {}),
    };
    if (violationIds.has(parsed.id)) {
      throw new Error(`Duplicate complaint violation id in ${context}: ${parsed.id}.`);
    }
    violationIds.add(parsed.id);
    return parsed;
  });

  const fields = validateComplaintFields(value.fields, `${context}.fields`);
  if (violations.length === 0 && !fields.some((field) => field.type === 'freetext')) {
    throw new Error(`${context} needs a predefined violation or a free-text field.`);
  }
  for (const field of fields) {
    for (const id of [
      ...(field.visibleWhenViolationIds ?? []),
      ...(field.requiredWhenViolationIds ?? []),
    ]) {
      if (!violationIds.has(id)) {
        throw new Error(`${context}.fields.${field.id} references unknown violation ${id}.`);
      }
    }
  }

  const destinations = requireUniqueNonEmpty(
    requireStringArray(value.destinations, 'default', `${context}.destinations`),
    `${context}.destinations.default`,
  );
  let routingCountyFields: Record<string, string> | undefined;
  if (value.routingCountyFields !== undefined) {
    if (!isRecord(value.routingCountyFields)) {
      throw new Error(`${context}.routingCountyFields must be an object.`);
    }
    routingCountyFields = Object.fromEntries(
      Object.entries(value.routingCountyFields).map(([institutionId, fieldId]) => {
        if (typeof fieldId !== 'string' || fieldId.length === 0) {
          throw new Error(`${context}.routingCountyFields.${institutionId} must be a field id.`);
        }
        return [institutionId, fieldId];
      }),
    );
  }

  return {
    id: requireString(value, 'id', context),
    labelKey: requireString(value, 'labelKey', context),
    requiresEmployer: value.requiresEmployer,
    ...(employmentStatuses ? { employmentStatuses } : {}),
    suggestedPartyIds,
    violations,
    fields,
    destinations: { default: destinations },
    ...(routingCountyFields ? { routingCountyFields } : {}),
    templateKey: requireString(value, 'templateKey', context),
  };
}

// Cross-field references: conditions, alternatives and date order must point
// at fields that exist (and at matching select values).
function validateComplaintReferences(complaint: ComplaintContent): void {
  const groups = [
    { fields: complaint.commonFields, context: 'complaint.commonFields' },
    { fields: complaint.workFields, context: 'complaint.workFields' },
    ...complaint.partyTypes.map((party, index) => ({
      fields: party.fields,
      context: `complaint.partyTypes[${index}].fields`,
    })),
  ];
  const sharedFields = new Map<string, ComplaintField>();
  for (const { fields } of groups) {
    for (const field of fields) {
      if (sharedFields.has(field.id)) {
        throw new Error(`Duplicate active complaint field id: ${field.id}.`);
      }
      sharedFields.set(field.id, field);
    }
  }

  const checkGroup = (
    fields: ComplaintField[],
    context: string,
    available: Map<string, ComplaintField>,
  ) => {
    fields.forEach((field, index) => {
      const fieldContext = `${context}[${index}]`;
      for (const condition of [field.visibleWhen, field.requiredWhen]) {
        if (!condition) continue;
        const target = available.get(condition.field);
        if (!target) {
          throw new Error(`${fieldContext} references unknown condition field ${condition.field}.`);
        }
        if (
          target.type !== 'select' ||
          !target.options ||
          condition.values.some((item) => !target.options?.some((option) => option.value === item))
        ) {
          throw new Error(`${fieldContext} condition values do not match select field ${condition.field}.`);
        }
      }
      for (const id of field.requiredAnyOf ?? []) {
        if (!available.has(id)) {
          throw new Error(`${fieldContext} references unknown requiredAnyOf field ${id}.`);
        }
      }
      if (field.notBeforeField) {
        const target = available.get(field.notBeforeField);
        if (!target) {
          throw new Error(`${fieldContext} references unknown notBeforeField ${field.notBeforeField}.`);
        }
        if (field.type === 'monthYear' && target.type !== 'monthYear') {
          throw new Error(`${fieldContext}.notBeforeField must target a monthYear field.`);
        }
      }
    });
  };

  for (const { fields, context } of groups) {
    checkGroup(fields, context, sharedFields);
  }
  complaint.categories.forEach((category, index) => {
    const available = new Map(sharedFields);
    for (const field of category.fields) {
      if (available.has(field.id)) {
        throw new Error(`Duplicate active complaint field id in category ${category.id}: ${field.id}.`);
      }
      available.set(field.id, field);
    }
    checkGroup(category.fields, `complaint.categories[${index}].fields`, available);
    for (const violation of category.violations) {
      for (const detail of [...(violation.details ?? []), ...(violation.variants ?? [])]) {
        const target = available.get(detail.field);
        const detailContext = `complaint.categories[${index}].violations.${violation.id}.details/variants`;
        if (!target) {
          throw new Error(`${detailContext} references unknown field ${detail.field}.`);
        }
        if (
          detail.values &&
          (target.type !== 'select' ||
            detail.values.some((item) => !target.options?.some((option) => option.value === item)))
        ) {
          throw new Error(`${detailContext} values do not match select field ${detail.field}.`);
        }
      }
    }
  });
}

function validateComplaintContent(value: unknown): ComplaintContent {
  if (!isRecord(value) || !isRecord(value.statusQuestions) || !Array.isArray(value.categories)) {
    throw new Error('Invalid complaint document.');
  }
  const employment = validateStatusQuestion(
    value.statusQuestions.employment,
    'complaint.statusQuestions.employment',
  );
  if (JSON.stringify(employment.options) !== JSON.stringify(EMPLOYMENT_OPTIONS)) {
    throw new Error('complaint.statusQuestions.employment.options must be working, stopped, and not_started.');
  }
  const commonFields = validateComplaintFields(value.commonFields, 'complaint.commonFields');
  const workFields = validateComplaintFields(value.workFields, 'complaint.workFields');
  const employerFields = validateComplaintFields(value.employerFields, 'complaint.employerFields');
  const partyTypes = validatePartyTypes(value.partyTypes);
  const partyIds = new Set(partyTypes.map(({ id }) => id));

  const employmentStatus = workFields.find(({ id }) => id === 'employmentStatus');
  if (
    !employmentStatus ||
    employmentStatus.type !== 'select' ||
    !employmentStatus.required ||
    JSON.stringify(employmentStatus.options?.map(({ value: option }) => option)) !==
      JSON.stringify(EMPLOYMENT_OPTIONS)
  ) {
    throw new Error('complaint.workFields.employmentStatus must be a required select with working, stopped, and not_started options.');
  }

  const categoryIds = new Set<string>();
  const categories = value.categories.map((category, index) => {
    const parsed = validateComplaintCategory(category, `complaint.categories[${index}]`, partyIds);
    if (categoryIds.has(parsed.id)) {
      throw new Error(`Duplicate complaint category id: ${parsed.id}.`);
    }
    categoryIds.add(parsed.id);
    return parsed;
  });
  if (categories.length === 0) {
    throw new Error('complaint.categories cannot be empty.');
  }

  const complaint: ComplaintContent = {
    statusQuestions: { employment },
    commonFields,
    workFields,
    employerFields,
    partyTypes,
    categories,
  };
  validateComplaintReferences(complaint);
  return complaint;
}

// Every destination must exist and, for county-based institutions, be routable
// through a county field that the form actually collects.
function validateComplaintRouting(
  complaint: ComplaintContent,
  institutions: InstitutionsContent,
): void {
  const institutionsById = new Map(institutions.institutions.map((item) => [item.id, item]));
  const sharedFields = new Map<string, ComplaintField>([
    ...complaint.commonFields.map((field) => [field.id, field] as const),
    ...complaint.workFields.map((field) => [field.id, field] as const),
    ...complaint.partyTypes.flatMap((party) => party.fields.map((field) => [field.id, field] as const)),
  ]);
  for (const category of complaint.categories) {
    const available = new Map(sharedFields);
    category.fields.forEach((field) => available.set(field.id, field));
    for (const institutionId of Object.keys(category.routingCountyFields ?? {})) {
      if (!category.destinations.default.includes(institutionId)) {
        throw new Error(`Routing override for non-destination ${institutionId} in category ${category.id}.`);
      }
      const fieldId = category.routingCountyFields?.[institutionId];
      const target = fieldId ? available.get(fieldId) : undefined;
      if (!target || target.type !== 'county') {
        throw new Error(`Routing override for ${institutionId} in category ${category.id} must target a county field.`);
      }
    }
    for (const institutionId of category.destinations.default) {
      const institution = institutionsById.get(institutionId);
      if (!institution) {
        throw new Error(`Unknown complaint destination ${institutionId} in category ${category.id}.`);
      }
      if (institution.perCounty) {
        const defaultField = institution.countyBasis === 'employer' ? 'employerCounty' : 'addressCounty';
        const fieldId = category.routingCountyFields?.[institutionId] ?? defaultField;
        const target = available.get(fieldId);
        if (!target) {
          throw new Error(`Category ${category.id} cannot route ${institutionId}: field ${fieldId} is unavailable.`);
        }
        if (target.type !== 'county') {
          throw new Error(`Category ${category.id} cannot route ${institutionId}: field ${fieldId} is not a county field.`);
        }
      }
    }
  }
}

// Bump together with content/index.json when the content structure changes.
export const SUPPORTED_SCHEMA_VERSION = 2;

export function validateIndex(value: unknown): ContentIndex {
  if (!isRecord(value) || value.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    throw new Error('Unsupported content index.');
  }

  if (
    typeof value.contentVersion !== 'string' ||
    typeof value.legalUpdatedAt !== 'string' ||
    !Array.isArray(value.languages) ||
    !isRecord(value.files)
  ) {
    throw new Error('Invalid content index.');
  }

  const seenCodes = new Set<string>();
  const languages = value.languages.map((candidate) => {
    if (
      !isRecord(candidate) ||
      typeof candidate.code !== 'string' ||
      !LANGUAGE_CODE_PATTERN.test(candidate.code) ||
      typeof candidate.name !== 'string' ||
      typeof candidate.rtl !== 'boolean' ||
      (candidate.mt !== undefined &&
        (typeof candidate.mt !== 'string' ||
          (candidate.mt !== 'none' && !/^mlkit:[a-z]{2,3}(?:-[A-Z]{2})?$/.test(candidate.mt))))
    ) {
      throw new Error('Invalid language entry.');
    }

    if (seenCodes.has(candidate.code)) {
      throw new Error('Duplicate language code.');
    }
    seenCodes.add(candidate.code);

    return {
      code: candidate.code,
      name: candidate.name,
      rtl: candidate.rtl,
      mt: candidate.mt as ContentIndex['languages'][number]['mt'],
    };
  });

  if (!seenCodes.has('en')) {
    throw new Error('The bundled English fallback is required.');
  }
  if (!seenCodes.has('ro')) {
    throw new Error('Romanian strings are required for complaint PDFs.');
  }

  const requiredFileKeys = [
    'info',
    'complaint',
    'institutions',
    'emergency',
  ] as const;
  const files = {} as ContentIndex['files'];

  for (const key of requiredFileKeys) {
    const path = value.files[key];
    if (typeof path !== 'string' || !SAFE_JSON_PATH_PATTERN.test(path)) {
      throw new Error(`Invalid content file path for ${key}.`);
    }
    files[key] = path;
  }

  return {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    contentVersion: value.contentVersion,
    legalUpdatedAt: value.legalUpdatedAt,
    languages,
    files,
  };
}

export function validateStrings(value: unknown): StringDictionary {
  if (!isRecord(value)) {
    throw new Error('Invalid strings dictionary.');
  }

  const dictionary: StringDictionary = {};
  for (const [key, text] of Object.entries(value)) {
    if (typeof text !== 'string') {
      throw new Error(`Invalid string value for ${key}.`);
    }
    dictionary[key] = text;
  }

  if (!dictionary['language.selfName']) {
    throw new Error('language.selfName is required.');
  }

  return dictionary;
}

export function getRequiredContentPaths(index: ContentIndex): string[] {
  const paths = [
    'index.json',
    ...index.languages.map(({ code }) => `${code}/strings.json`),
    ...Object.values(index.files),
  ];
  return [...new Set(paths)];
}

export function isRemoteVersionNewer(
  remoteVersion: string,
  localVersion: string,
): boolean {
  return (
    remoteVersion.localeCompare(localVersion, undefined, {
      numeric: true,
      sensitivity: 'base',
    }) > 0
  );
}

export function validateBundle(
  indexValue: unknown,
  readJson: (path: string) => unknown,
  source: ContentBundle['source'],
): ContentBundle {
  const index = validateIndex(indexValue);
  const strings: ContentBundle['strings'] = {};

  for (const language of index.languages) {
    strings[language.code] = validateStrings(
      readJson(`${language.code}/strings.json`),
    );
  }

  const documents: Record<string, unknown> = {};
  for (const path of Object.values(index.files)) {
    const document = readJson(path);
    if (!isRecord(document)) {
      throw new Error(`Invalid content document: ${path}.`);
    }
    documents[path] = document;
  }

  documents[index.files.info] = validateInfoContent(documents[index.files.info]);
  documents[index.files.emergency] = validateEmergencyContent(
    documents[index.files.emergency],
  );
  const institutions = validateInstitutionsContent(
    documents[index.files.institutions],
  );
  const complaint = validateComplaintContent(documents[index.files.complaint]);
  validateComplaintRouting(complaint, institutions);
  documents[index.files.institutions] = institutions;
  documents[index.files.complaint] = complaint;

  return { index, strings, documents, source };
}
