#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Values returned by the VM have different prototypes, but the same JSON data.
function assertSameData(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}
const moduleCache = new Map();
const mockedModules = {
  'expo-file-system/legacy': { cacheDirectory: 'file:///mock/', deleteAsync: async () => {} },
  'expo-print': {
    printToFileAsync: async () => ({ uri: 'file:///mock/complaint.pdf' }),
  },
  '@/src/complaint/documents': {
    persistGeneratedPdf: async () => ({
      uri: 'file:///mock/complaint.pdf',
      fileName: 'complaint.pdf',
      createdAt: Date.now(),
      attachments: [],
    }),
  },
  '@/src/complaint/pdfFonts': { getPdfFontCss: async () => '' },
};

function sourcePath(request, parentPath) {
  if (request.startsWith('@/')) {
    return path.join(projectRoot, request.slice(2));
  }
  if (request.startsWith('.')) {
    return path.resolve(path.dirname(parentPath), request);
  }
  return null;
}

function resolveSource(request, parentPath) {
  const unresolved = sourcePath(request, parentPath);
  if (!unresolved) {
    return null;
  }
  for (const candidate of [unresolved, `${unresolved}.ts`, `${unresolved}.tsx`, path.join(unresolved, 'index.ts')]) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Cannot resolve ${request} from ${parentPath}.`);
}

function loadModule(request, parentPath = path.join(projectRoot, 'scripts/check-complaint-flow.mjs')) {
  if (mockedModules[request]) {
    return mockedModules[request];
  }
  const filename = resolveSource(request, parentPath);
  if (!filename) {
    throw new Error(`Unexpected runtime dependency ${request} from ${parentPath}.`);
  }
  if (moduleCache.has(filename)) {
    return moduleCache.get(filename).exports;
  }

  const source = readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      sourceMap: false,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  moduleCache.set(filename, module);
  const context = {
    module,
    exports: module.exports,
    require: (dependency) => loadModule(dependency, filename),
    __filename: filename,
    __dirname: path.dirname(filename),
    console,
    Date,
    Error,
    Math,
    Object,
    RegExp,
    Set,
    Map,
    Array,
  };
  vm.runInNewContext(compiled, context, { filename });
  return module.exports;
}

function field(id, type = 'text', extra = {}) {
  return { id, type, required: false, labelKey: `label.${id}`, ...extra };
}

const complaint = {
  statusQuestions: { employment: { labelKey: 'label.employmentStatus', options: ['working', 'stopped', 'not_started'] } },
  commonFields: [
    field('lastName', 'text', { required: true }),
    field('singleName', 'select', { required: true, options: [{ value: 'yes', labelKey: 'single.yes' }, { value: 'no', labelKey: 'single.no' }] }),
    field('firstName', 'text', { required: true, visibleWhen: { field: 'singleName', values: ['no'] } }),
    field('idType', 'select', { required: true, options: [{ value: 'passport', labelKey: 'passport' }, { value: 'trc', labelKey: 'trc' }] }),
    field('idNumber', 'text', { required: true }),
    field('cnp', 'text', { validation: 'cnp', requiredWhen: { field: 'idType', values: ['trc'] } }),
    field('address', 'text', { required: true }),
    field('addressCounty', 'county', { required: true }),
    field('phone', 'text', { requiredAnyOf: ['phone', 'email'], validation: 'phone' }),
    field('email', 'text', { requiredAnyOf: ['phone', 'email'], validation: 'email' }),
  ],
  workFields: [
    field('employmentStatus', 'select', { required: true, options: ['working', 'stopped', 'not_started'].map((value) => ({ value, labelKey: `status.${value}` })) }),
    field('occupation', 'text', { required: true }),
    field('workStart', 'monthYear', { required: true, visibleWhen: { field: 'employmentStatus', values: ['working', 'stopped'] }, notFuture: true }),
    field('workStartAccuracy', 'select', { options: [{ value: 'exact', labelKey: 'exact' }, { value: 'approximate', labelKey: 'approximate' }], visibleWhen: { field: 'employmentStatus', values: ['working', 'stopped'] } }),
    field('workEnd', 'monthYear', { required: true, visibleWhen: { field: 'employmentStatus', values: ['stopped'] }, notBeforeField: 'workStart', notFuture: true }),
    field('workEndAccuracy', 'select', { options: [{ value: 'exact', labelKey: 'exact' }, { value: 'approximate', labelKey: 'approximate' }], visibleWhen: { field: 'employmentStatus', values: ['stopped'] } }),
    field('expectedStart', 'monthYear', { required: true, visibleWhen: { field: 'employmentStatus', values: ['not_started'] } }),
    field('expectedStartAccuracy', 'select', { options: [{ value: 'exact', labelKey: 'exact' }, { value: 'approximate', labelKey: 'approximate' }], visibleWhen: { field: 'employmentStatus', values: ['not_started'] } }),
    field('contractCopy', 'select', { required: true, options: [{ value: 'yes', labelKey: 'complaint.pdf.contractCopy.yes' }, { value: 'no', labelKey: 'complaint.pdf.contractCopy.no' }, { value: 'unknown', labelKey: 'complaint.pdf.contractCopy.unknown' }] }),
  ],
  employerFields: [],
  partyTypes: [
    { id: 'employer', labelKey: 'party.employer', fields: [field('employerName', 'text', { requiredAnyOf: ['employerName', 'employerDetails'] }), field('employerCounty', 'county', { required: true, allowUnknown: true }), field('employerDetails', 'text', { requiredAnyOf: ['employerName', 'employerDetails'] })] },
    { id: 'agency', labelKey: 'party.agency', fields: [field('agencyName'), field('agencyCounty', 'county', { required: true, allowUnknown: true }), field('agencyDetails', 'text')] },
  ],
  categories: [],
};

const category = {
  id: 'documents_withheld',
  labelKey: 'category.documents',
  requiresEmployer: true,
  suggestedPartyIds: ['employer'],
  violations: [
    { id: 'no_contract_copy', labelKey: 'violation.noCopy', sentenceKey: 'fact.noCopy' },
    { id: 'passport_kept', labelKey: 'violation.passport', sentenceKey: 'fact.passport' },
  ],
  fields: [field('period', 'text', { required: true }), field('staleHidden', 'text', { visibleWhen: { field: 'employmentStatus', values: ['not_started'] } })],
  destinations: { default: ['itm'] },
  templateKey: 'template.documents',
};
complaint.categories = [category];

const institutions = {
  institutions: [
    { id: 'itm', nameRo: 'ITM', labelKey: 'inst.itm', perCounty: true, countyBasis: 'employer', emails: { AB: 'itm-ab@example.test' } },
    { id: 'national', nameRo: 'National', labelKey: 'inst.national', perCounty: false, emails: { '*': 'national@example.test' } },
    { id: 'broken', nameRo: 'Broken', labelKey: 'inst.broken', perCounty: false, emails: { '*': '<placeholder>' } },
  ],
};

const ro = {
  'label.employmentStatus': 'Situație', 'label.firstName': 'Prenume', 'label.lastName': 'Nume', 'label.contractCopy': 'Copie contract',
  'party.employer': 'Angajator', 'party.agency': 'Agenție', 'category.documents': 'Documente', 'violation.noCopy': 'Fără copie', 'violation.passport': 'Pașaport',
  'fact.noCopy': 'Nu am primit copia pentru {{workStart}}.', 'fact.passport': 'Pașaport reținut pentru {{staleHidden}}.', 'template.documents': 'Solicitare neutră.',
  'complaint.pdf.contractCopy.yes': 'Am primit o copie a contractului de muncă.', 'complaint.pdf.contractCopy.no': 'Nu am primit o copie a contractului de muncă.', 'complaint.pdf.contractCopy.unknown': 'Nu știu dacă am primit o copie a contractului de muncă.',
  'complaint.date.approximate': 'Aproximativ', 'complaint.form.dateUnknown': 'Nu știu', 'complaint.form.unknownCounty': 'Județ necunoscut', 'complaint.pdf.destinationUnavailable': 'Destinatar neconfigurat', 'complaint.pdf.subject': 'Petiție: {{category}}', 'complaint.pdf.unspecified': 'nespecificat', 'complaint.pdf.to': 'Către', 'complaint.pdf.date': 'Data', 'complaint.pdf.petitioner': 'Petent', 'complaint.pdf.status': 'Situație', 'complaint.pdf.work': 'Muncă', 'complaint.pdf.facts': 'Fapte', 'complaint.pdf.requestTitle': 'Solicitare', 'complaint.pdf.request': 'Verificați situația.', 'complaint.pdf.signature': 'Nume', 'complaint.pdf.electronicSubmission': 'Transmis electronic.', 'complaint.pdf.draftBanner': 'DRAFT', 'complaint.email.body': 'Mesaj',
  ...Object.fromEntries(['lastName', 'singleName', 'firstName', 'idType', 'idNumber', 'cnp', 'address', 'addressCounty', 'phone', 'email', 'employmentStatus', 'occupation', 'workStart', 'workStartAccuracy', 'workEnd', 'workEndAccuracy', 'expectedStart', 'expectedStartAccuracy', 'contractCopy', 'employerName', 'employerCounty', 'employerDetails', 'period', 'staleHidden'].map((id) => [`label.${id}`, id])),
  'single.yes': 'Da', 'single.no': 'Nu', passport: 'Pașaport', trc: 'TRC', 'status.working': 'Lucrez', 'status.stopped': 'Am încetat', 'status.not_started': 'Nu am început', exact: 'Exactă', approximate: 'Aproximativă',
};

function baseDraft(overrides = {}) {
  return {
    id: 'test-draft',
    textLanguage: 'en',
    translations: {},
    attachments: [],
    categoryId: category.id,
    selectedViolationIds: ['passport_kept'],
    selectedPartyIds: ['employer'],
    values: {
      lastName: 'Popescu', singleName: 'no', firstName: 'Ana', idType: 'passport', idNumber: 'P123', address: 'Strada 1', addressCounty: 'AB', phone: '+40123456789',
      employmentStatus: 'working', occupation: 'muncă', workStart: '2024-01', workStartAccuracy: 'approximate', contractCopy: 'yes', employerName: 'Firma', employerCounty: 'AB', period: '2024', staleHidden: 'SECRET-HIDDEN',
    },
    ...overrides,
  };
}

function expectThrows(fn, fragment = '') {
  assert.throws(fn, (error) => !fragment || String(error?.message).includes(fragment));
}

const contentHelpers = loadModule('@/src/content/complaintContent');
const contentValidation = loadModule('@/src/content/contentValidation');
const pdf = loadModule('@/src/complaint/pdf');
const routing = loadModule('@/src/complaint/routing');

const bundledIndex = JSON.parse(readFileSync(path.join(projectRoot, 'content/index.json'), 'utf8'));
const bundledReadJson = (relativePath) => JSON.parse(readFileSync(path.join(projectRoot, 'content', relativePath), 'utf8'));
const validatedBundle = contentValidation.validateBundle(bundledIndex, bundledReadJson, 'bundled');
assert.equal(validatedBundle.source, 'bundled');
expectThrows(() => contentValidation.validateBundle({ ...bundledIndex, schemaVersion: 1 }, bundledReadJson, 'cache'));

assert.equal(contentHelpers.getActiveComplaintValues(complaint, category, baseDraft()).workStart, '2024-01');
assert.equal(contentHelpers.getActiveComplaintValues(complaint, category, baseDraft()).staleHidden, undefined);

const workingHtml = pdf.buildComplaintHtml({ complaint, category, draft: baseDraft(), institutions, ro, createdAt: new Date('2026-01-02T00:00:00Z') }).html;
assert.match(workingHtml, /Aproximativ: 01\/2024/);
assert.doesNotMatch(workingHtml, /2024-01-01|01\/01\/2024/);
assert.doesNotMatch(workingHtml, /SECRET-HIDDEN/);

const stopped = baseDraft({ selectedViolationIds: ['passport_kept'], values: { ...baseDraft().values, employmentStatus: 'stopped', workEnd: 'unknown', workEndAccuracy: 'approximate' } });
const stoppedHtml = pdf.buildComplaintHtml({ complaint, category, draft: stopped, institutions, ro }).html;
assert.match(stoppedHtml, /Nu știu/);

const notStarted = baseDraft({ selectedViolationIds: ['passport_kept'], values: { ...baseDraft().values, employmentStatus: 'not_started', expectedStart: '2027-04', expectedStartAccuracy: 'exact', workStart: 'stale', workEnd: 'stale' } });
pdf.buildComplaintHtml({ complaint, category, draft: notStarted, institutions, ro });
const futureWorkStart = baseDraft({ values: { ...baseDraft().values, workStart: '2099-01' } });
expectThrows(() => pdf.buildComplaintHtml({ complaint, category, draft: futureWorkStart, institutions, ro }), 'futureDate');

const passportDraft = baseDraft({ values: { ...baseDraft().values, idType: 'passport', cnp: '' } });
pdf.buildComplaintHtml({ complaint, category, draft: passportDraft, institutions, ro });
const trcDraft = baseDraft({ values: { ...baseDraft().values, idType: 'trc', cnp: '1234567890123' } });
pdf.buildComplaintHtml({ complaint, category, draft: trcDraft, institutions, ro });
const internationalContact = baseDraft({ values: { ...baseDraft().values, phone: '', email: 'person@example.test' } });
pdf.buildComplaintHtml({ complaint, category, draft: internationalContact, institutions, ro });
const unknownPartyDetails = baseDraft({ values: { ...baseDraft().values, employerName: '', employerDetails: 'Telefon necunoscut', employerCounty: 'unknown' } });
pdf.buildComplaintHtml({ complaint, category, draft: unknownPartyDetails, institutions, ro });

const mononym = baseDraft({ values: { ...baseDraft().values, singleName: 'yes', firstName: 'STALE' } });
const mononymHtml = pdf.buildComplaintHtml({ complaint, category, draft: mononym, institutions, ro }).html;
assert.doesNotMatch(mononymHtml, /STALE/);

const reversed = baseDraft({ values: { ...baseDraft().values, employmentStatus: 'stopped', workEnd: '2023-12', workEndAccuracy: 'exact' } });
expectThrows(() => pdf.buildComplaintHtml({ complaint, category, draft: reversed, institutions, ro }), 'dateOrder');
expectThrows(() => pdf.buildComplaintHtml({ complaint, category, draft: baseDraft({ selectedViolationIds: ['no_contract_copy'], values: { ...baseDraft().values, contractCopy: 'yes' } }), institutions, ro }), 'contractCopyConflict');
expectThrows(() => pdf.buildComplaintHtml({ complaint, category, draft: baseDraft({ selectedPartyIds: [] }), institutions, ro }), 'party');
expectThrows(() => pdf.buildComplaintHtml({ complaint, category, draft: baseDraft({ selectedViolationIds: ['missing'] }), institutions, ro }), 'violation');

const missingCounty = baseDraft({ values: { ...baseDraft().values, employerCounty: 'unknown' } });
const missingCountyRoute = routing.resolveComplaintRoute(category, missingCounty, institutions);
assertSameData(missingCountyRoute.recipients, []);
assertSameData(routing.resolveComplaintRoute({ ...category, destinations: { default: ['itm', 'broken'] } }, baseDraft(), institutions).recipients, []);
assertSameData(routing.resolveComplaintRoute(category, baseDraft({ selectedPartyIds: ['agency'] }), institutions).recipients, []);
const agencyRoute = routing.resolveComplaintRoute(
  { ...category, suggestedPartyIds: ['agency'], routingCountyFields: { itm: 'agencyCounty' } },
  baseDraft({ selectedPartyIds: ['agency'], values: { ...baseDraft().values, agencyCounty: 'AB' } }),
  institutions,
);
assertSameData(agencyRoute.recipients, ['itm-ab@example.test']);
assertSameData(routing.resolveComplaintRoute({ ...category, destinations: { default: ['national'] } }, baseDraft(), institutions).recipients, ['national@example.test']);

const multipleParties = baseDraft({ selectedPartyIds: ['employer', 'agency'], values: { ...baseDraft().values, agencyName: 'Agenție', agencyCounty: 'AB' } });
const multiplePartyHtml = pdf.buildComplaintHtml({ complaint, category, draft: multipleParties, institutions, ro }).html;
assert.match(multiplePartyHtml, /Angajator/);
assert.match(multiplePartyHtml, /Agenție/);

const renderDraft = (draft) => pdf.buildComplaintHtml({ complaint, category, draft, institutions, ro });
expectThrows(() => renderDraft(baseDraft({ values: { ...baseDraft().values, idType: 'trc', cnp: '' } })), 'cnp');
expectThrows(() => renderDraft(baseDraft({ values: { ...baseDraft().values, cnp: '123' } })), 'cnp');
expectThrows(() => renderDraft(baseDraft({ values: { ...baseDraft().values, phone: '', email: '' } })), 'oneOf');
expectThrows(() => renderDraft(baseDraft({ values: { ...baseDraft().values, email: 'invalid' } })), 'email');
expectThrows(() => renderDraft(baseDraft({ values: { ...baseDraft().values, workStart: '2024-' } })), 'date');
for (const phone of ['+977 (980) 123-4567', '0094 77 123 4567', '+٩٧٧ ٩٨٠١٢٣٤٥٦٧']) {
  renderDraft(baseDraft({ values: { ...baseDraft().values, phone } }));
}
const copyNo = renderDraft(baseDraft({ selectedViolationIds: ['no_contract_copy'], values: { ...baseDraft().values, contractCopy: 'no' } })).html;
assert.match(copyNo, /Nu am primit o copie a contractului de muncă\./);
assert.doesNotMatch(copyNo, /muncă la negru|nu am semnat|fără contract/i);
assert.match(renderDraft(baseDraft({ values: { ...baseDraft().values, contractCopy: 'unknown' } })).html,
  /Nu știu dacă am primit o copie a contractului de muncă\./);
assert.doesNotMatch(renderDraft(baseDraft({ values: { ...baseDraft().values, agencyName: 'DESELECTED-AGENCY', workEnd: 'DESELECTED-END' } })).html,
  /DESELECTED-AGENCY|DESELECTED-END/);
assert.match(renderDraft(unknownPartyDetails).html, /Telefon necunoscut/);
assert.doesNotMatch(renderDraft(notStarted).html, /<td>stale<\/td>/);
assert.equal(contentHelpers.getActiveComplaintValues(complaint, category, notStarted).workStart, undefined);
assert.equal(contentHelpers.getActiveComplaintValues(complaint, category, notStarted).workEnd, undefined);
assertSameData(routing.resolveComplaintRoute({ ...category, destinations: { default: ['foundation', 'national'] } }, baseDraft(), institutions).recipients,
  ['national@example.test']);

// Exercise the production JSON as well as the small synthetic fixtures above.
const actualComplaint = validatedBundle.documents[bundledIndex.files.complaint];
const actualCategory = actualComplaint.categories.find((item) => item.id === 'unpaid_wages');
const actualRo = validatedBundle.strings.ro;
const actualDraft = baseDraft({ categoryId: actualCategory.id, selectedViolationIds: ['no_salary'],
  values: { ...baseDraft().values, citizenship: 'Nepal' } });
const actualHtml = pdf.buildComplaintHtml({ complaint: actualComplaint, category: actualCategory, draft: actualDraft,
  institutions: validatedBundle.documents[bundledIndex.files.institutions], ro: actualRo }).html;
assert.match(actualHtml, /Nepal/);
assert.doesNotMatch(actualHtml, /complaint\.[a-zA-Z]/);
const malformed = structuredClone(actualComplaint);
malformed.workFields.push({ ...malformed.commonFields[0] });
expectThrows(() => contentValidation.validateBundle(bundledIndex,
  (path) => path === bundledIndex.files.complaint ? malformed : bundledReadJson(path), 'cache'), 'Duplicate active');

// Phase 4: optional additions, narrative-only complaints, translation freshness and privacy.
const freeText = loadModule('@/src/complaint/freeText');
const narrativeCategory = { ...category, fields: [...category.fields, field('freeText', 'freetext')] };
const renderNarrative = (draft, extra = {}) => pdf.buildComplaintHtml({ complaint, category: narrativeCategory, draft, institutions, ro: actualRo, ...extra });
assert.equal(freeText.getNarrativeError(narrativeCategory, baseDraft()), undefined);
assert.equal(freeText.getNarrativeError(narrativeCategory, baseDraft({ selectedViolationIds: [] })), 'complaint.text.required');
expectThrows(() => renderNarrative(baseDraft({ selectedViolationIds: [] })), 'complaint.text.required');
const original = 'Original <script>alert("x")</script> & încă o linie\nनेपाल';
const romanianText = 'Text românesc <b>neinterpretat</b>.\nNu am primit plata.';
const translatedDraft = (engine) => baseDraft({ values: { ...baseDraft().values, freeText: original },
  translations: { freeText: { original, translated: romanianText, sourceLanguage: 'en', engine } } });
for (const engine of ['manual', 'mlkit']) {
  const result = renderNarrative(translatedDraft(engine));
  const [body, annex] = result.html.split('<section class="original-annex">');
  assert.ok(annex, `${engine} must preserve the original annex`);
  assert.match(body, /Text românesc &lt;b&gt;neinterpretat&lt;\/b&gt;/);
  assert.match(body, /traduse automat/);
  assert.doesNotMatch(body, /Original &lt;script|नेपाल/);
  assert.match(annex, /Original &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp;/);
  assert.match(annex, /नेपाल/);
  assert.doesNotMatch(result.html, /<script>|<b>neinterpretat<\/b>/);
  renderNarrative({ ...translatedDraft(engine), selectedViolationIds: [] });
}
const directRomanian = baseDraft({ textLanguage: 'ro', selectedViolationIds: [],
  values: { ...baseDraft().values, freeText: 'Explicație direct în română.' } });
const directHtml = renderNarrative(directRomanian).html;
assert.match(directHtml, /Explicație direct în română/);
assert.doesNotMatch(directHtml, /<section class="original-annex">|traduse automat/);
for (const invalid of [
  { ...translatedDraft('manual'), values: { ...translatedDraft('manual').values, freeText: original + ' edit' } },
  { ...translatedDraft('manual'), textLanguage: 'ur' },
  { ...translatedDraft('manual'), translations: {} },
  { ...translatedDraft('manual'), translations: { freeText: { original, translated: ' ', sourceLanguage: 'en', engine: 'manual' } } },
  { ...translatedDraft('manual'), translations: { freeText: { original, translated: 'x'.repeat(5001), sourceLanguage: 'en', engine: 'manual' } } },
]) expectThrows(() => renderNarrative(invalid), 'translationRequired');
expectThrows(() => renderNarrative({ ...directRomanian, values: { ...directRomanian.values, freeText: 'x'.repeat(1001) } }), 'tooLong');
const emptyOriginal = { ...translatedDraft('manual'), values: { ...baseDraft().values, freeText: ' ' } };
assert.doesNotMatch(renderNarrative(emptyOriginal).html, /Original &lt;script|Text românesc &lt;b/);
assert.equal(freeText.getNarrativeError({ ...narrativeCategory, fields: [field('freeText', 'freetext', { required: true })] }, baseDraft()), 'complaint.text.required');
const hiddenCategory = { ...narrativeCategory, fields: [field('freeText', 'freetext', { visibleWhen: { field: 'employmentStatus', values: ['not_started'] } })] };
assert.doesNotMatch(pdf.buildComplaintHtml({ complaint, category: hiddenCategory, draft: translatedDraft('manual'), institutions, ro: actualRo }).html, /Original &lt;script|Text românesc &lt;b/);
const translatedPlaceholder = { ...narrativeCategory, violations: [{ id: 'in_text', labelKey: 'fact.label', sentenceKey: 'fact.text' }] };
const interpolation = pdf.buildComplaintHtml({ complaint, category: translatedPlaceholder,
  draft: { ...translatedDraft('manual'), selectedViolationIds: ['in_text'] }, institutions,
  ro: { ...actualRo, 'fact.text': 'Detalii: {{freeText}}' } }).html.split('<section class="original-annex">')[0];
assert.match(interpolation, /Detalii: Text românesc/);
assert.doesNotMatch(interpolation, /Original &lt;script/);
const withAttachment = { ...directRomanian, attachments: [{ id: 'attachment-test', uri: 'file:///cache/private-evidence', name: 'dovadă <test>.pdf', mimeType: 'application/pdf', size: 2048 }] };
const evidenceHtml = renderNarrative(withAttachment).html;
assert.match(evidenceHtml, /dovadă &lt;test&gt;\.pdf \(2 KB\)/);
assert.doesNotMatch(evidenceHtml, /file:\/\/\/cache/);
const otherCategory = actualComplaint.categories.find((item) => item.id === 'other');
assert.equal(contentHelpers.isPhase3CategoryAvailable(otherCategory), true);
const otherDraft = { ...actualDraft, textLanguage: 'ro', categoryId: 'other', selectedViolationIds: [],
  values: { ...actualDraft.values, freeText: 'Altă problemă.' } };
const otherResult = pdf.buildComplaintHtml({ complaint: actualComplaint, category: otherCategory, draft: otherDraft,
  institutions: validatedBundle.documents[bundledIndex.files.institutions], ro: actualRo });
assertSameData(otherResult.recipients, []); // Do not guess an authority or email the foundation.
assert.equal(otherResult.templateReady, false);
const url = new URL(freeText.getGoogleTranslateUrl('ne'));
assert.equal(url.origin, 'https://translate.google.com');
assert.equal(url.searchParams.get('sl'), 'ne');
assert.equal(url.searchParams.get('tl'), 'ro');
assert.equal(url.searchParams.has('text'), false);
assert.equal(new URL(freeText.getGoogleTranslateUrl('en&text=PRIVATE')).searchParams.get('sl'), 'auto');
await pdf.generateComplaintPdf({ complaint, category: narrativeCategory, draft: directRomanian, institutions, ro: actualRo, categoryLabel: 'Test' });
console.log('Complaint flow regression OK: structured facts, optional/free-text-only complaints, translation freshness, original annex, PDF privacy, selected parties and fail-safe routing.');
