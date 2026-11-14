import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readText(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isPlaceholder(value) {
  return typeof value !== 'string' || /^<[^>]+>$/.test(value.trim());
}

const index = await readJson('content/index.json');
const complaint = await readJson(`content/${index.files.complaint}`);
const institutions = await readJson(`content/${index.files.institutions}`);
const ro = await readJson('content/ro/strings.json');
const packageJson = await readJson('package.json');

const expectedRoutes = [
  'app/complaint/index.tsx',
  'app/complaint/status.tsx',
  'app/complaint/violations.tsx',
  'app/complaint/identity.tsx',
  'app/complaint/employer.tsx',
  'app/complaint/details.tsx',
  'app/complaint/text.tsx',
  'app/complaint/attachments.tsx',
  'app/complaint/review.tsx',
  'app/complaint/preview.tsx',
  'app/complaint/complete.tsx',
  'app/documents.tsx',
];
await Promise.all(expectedRoutes.map((relativePath) => readText(relativePath)));

for (const dependency of ['expo-print', 'expo-mail-composer', 'expo-sharing']) {
  assert(packageJson.dependencies?.[dependency], `Missing Phase 3 dependency: ${dependency}.`);
}

const home = await readText('app/home.tsx');
assert(home.includes("router.push('/complaint')"), 'Home does not open S7.');
assert(home.includes("router.push('/documents')"), 'Home does not open S14.');

const commonFields = new Map(complaint.commonFields.map((field) => [field.id, field]));
for (const fieldId of [
  'lastName',
  'citizenship',
  'idType',
  'idNumber',
  'address',
  'addressCounty',
  'singleName',
]) {
  assert(commonFields.get(fieldId)?.required === true, `Required identity field missing: ${fieldId}.`);
}
assert(commonFields.get('cnp')?.required === false, 'CNP must remain optional.');
assert(commonFields.get('cnp')?.requiredWhen?.values.includes('trc'), 'CNP must be required for TRC.');
for (const fieldId of ['phone', 'email']) {
  assert(commonFields.get(fieldId)?.required === false, `${fieldId} must be an alternative contact.`);
  assert(JSON.stringify(commonFields.get(fieldId)?.requiredAnyOf) === JSON.stringify(['phone', 'email']), 'At least one contact is required.');
}
assert(commonFields.has('firstName'), 'First-name field missing.');
assert(
  commonFields.get('firstName')?.requiredWhen?.field === 'singleName',
  'First-name visibility must follow the mononym answer.',
);

assert(Array.isArray(complaint.workFields), 'Complaint workFields are missing.');
assert(Array.isArray(complaint.partyTypes) && complaint.partyTypes.length > 0, 'Complaint party types are missing.');
const partyTypeById = new Map(complaint.partyTypes.map((party) => [party.id, party]));
assert(partyTypeById.size === complaint.partyTypes.length, 'Complaint party type ids must be unique.');
assert(Array.isArray(complaint.categories) && complaint.categories.length > 0, 'Complaint categories must not be empty.');
const institutionById = new Map(
  institutions.institutions.map((institution) => [institution.id, institution]),
);
let draftTemplateCount = 0;
let phase3CategoryCount = 0;
for (const category of complaint.categories) {
  assert(category.destinations.default.length > 0, `Category ${category.id} has no destination.`);
  const availableFields = new Set([
    ...complaint.commonFields.map((field) => field.id),
    ...complaint.workFields.map((field) => field.id),
    ...category.fields.map((field) => field.id),
    ...complaint.partyTypes.flatMap((party) => party.fields.map((field) => field.id)),
  ]);

  assert(Array.isArray(category.suggestedPartyIds), `Category ${category.id} has no suggestedPartyIds.`);
  for (const partyId of category.suggestedPartyIds) {
    assert(partyTypeById.has(partyId), `Category ${category.id} suggests unknown party ${partyId}.`);
  }

  if (category.violations.length > 0) {
    phase3CategoryCount += 1;
    for (const violation of category.violations) {
      assert(
        typeof ro[violation.sentenceKey] === 'string' && ro[violation.sentenceKey],
        `Romanian PDF sentence missing: ${violation.sentenceKey}.`,
      );
    }
  } else {
    assert(category.fields.some((field) => field.type === 'freetext' && field.required),
      `Category ${category.id} must have required free text when no predefined facts exist.`);
  }

  for (const institutionId of category.destinations.default) {
    const institution = institutionById.get(institutionId);
    assert(institution, `Unknown complaint destination: ${institutionId}.`);
    if (institution.perCounty) {
      const defaultField =
        institution.countyBasis === 'employer'
          ? 'employerCounty'
          : 'addressCounty';
      const routingField =
        category.routingCountyFields?.[institutionId] ?? defaultField;
      assert(
        availableFields.has(routingField),
        `Category ${category.id} cannot provide county field ${routingField} for ${institutionId}.`,
      );
    }
  }

  if (isPlaceholder(ro[category.templateKey])) {
    draftTemplateCount += 1;
  }
}
assert(phase3CategoryCount > 0, 'No category can run without Phase 4 translation.');

const expectedCountyCodes = [
  'AB', 'AR', 'AG', 'BC', 'BH', 'BN', 'BT', 'BV', 'BR', 'BZ', 'CS', 'CL',
  'CJ', 'CT', 'CV', 'DB', 'DJ', 'GL', 'GR', 'GJ', 'HR', 'HD', 'IL', 'IS',
  'IF', 'MM', 'MH', 'MS', 'NT', 'OT', 'PH', 'SM', 'SJ', 'SB', 'SV', 'TR',
  'TM', 'TL', 'VS', 'VL', 'VN', 'B',
];
assert(
  ro['complaint.email.body'].includes('\n') &&
    !ro['complaint.email.body'].includes('\\n'),
  'Email body must contain real newlines, not visible slash-n sequences.',
);
const itm = institutionById.get('itm');
assert(itm?.perCounty && itm.countyBasis === 'employer', 'ITM county routing is invalid.');
assert(
  JSON.stringify(Object.keys(itm.emails).sort()) ===
    JSON.stringify([...expectedCountyCodes].sort()),
  'ITM must have exactly the 42 county/Bucharest addresses.',
);
for (const [countyCode, email] of Object.entries(itm.emails)) {
  assert(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    `Invalid ITM email for ${countyCode}.`,
  );
}
const igi = institutionById.get('igi');
assert(igi?.perCounty && igi.countyBasis === 'worker', 'IGI must route by worker county.');

const routingSource = await readText('src/complaint/routing.ts');
assert(
  routingSource.includes("id !== 'foundation'"),
  'Foundation is not excluded from complaint submission routing.',
);
assert(
  routingSource.includes('category.routingCountyFields?.[institutionId]'),
  'Category-specific county routing is not implemented.',
);
assert(routingSource.includes('selectedPartyIds'), 'Routing must verify selected party ownership.');
assert(routingSource.includes('unresolved.length ? []'), 'Unresolved routes must disable all recipients.');

const phase3ContentSource = await readText('src/content/complaintContent.ts');
assert(
  phase3ContentSource.includes("field.type !== 'freetext'"),
  'Structured facts and free-text editors must remain separate.',
);
assert(
  phase3ContentSource.includes('category.violations.length > 0'),
  'Complaint category availability helper is missing.',
);
for (const marker of [
  'getVisibleComplaintFields',
  'getComplaintFieldError',
  'getComplaintFields',
  'getSelectedPartyFields',
  'getActiveComplaintValues',
]) {
  assert(phase3ContentSource.includes(`export function ${marker}`), `Missing shared helper: ${marker}.`);
}

const pdfSource = await readText('src/complaint/pdf.ts');
assert(pdfSource.includes('Print.printToFileAsync'), 'PDF generation is missing.');
assert(pdfSource.includes('persistGeneratedPdf'), 'Generated PDFs are not persisted locally.');
assert(pdfSource.includes('export function buildComplaintHtml'), 'PDF HTML builder is not exported for tests.');
assert(pdfSource.includes('complaint.pdf.contractCopy.'), 'PDF contract-copy fact is missing.');
assert(!pdfSource.includes('category.requiresEmployer'), 'PDF must render selected parties, not requiresEmployer.');
assert(pdfSource.includes("content.strings.ro") === false, 'PDF module must receive Romanian strings explicitly.');

const draftTypesSource = await readText('src/complaint/types.ts');
assert(!draftTypesSource.includes('employmentStatus: string | null'), 'employmentStatus must live in draft.values.');
await readText('scripts/check-complaint-flow.mjs');

const previewSource = await readText('app/complaint/preview.tsx');
assert(previewSource.includes('MailComposer.composeAsync'), 'Mail composer is missing.');
assert(previewSource.includes('attachments: [generated.uri,'), 'Email does not attach the PDF and companion files.');
assert(previewSource.includes('generated.testMode'), 'Provisional templates must be sent in test mode only.');
assert(pdfSource.includes('const testMode = isDraftTemplate;'), 'A provisional template must switch the complaint to test mode.');
assert(previewSource.includes('shareComplaintDocument'), 'Share sheet action is missing.');

const providerSource = await readText('src/complaint/ComplaintProvider.tsx');
assert(
  providerSource.includes('updateDraft(() => emptyDraft())'),
  'Personal form data is not cleared from React memory.',
);
const complaintRuntime = (
  await Promise.all(
    [
      'src/complaint/ComplaintProvider.tsx',
      'src/complaint/documents.ts',
      'src/complaint/pdf.ts',
      ...expectedRoutes,
    ].map((relativePath) => readText(relativePath)),
  )
).join('\n');
assert(!complaintRuntime.includes('AsyncStorage'), 'Complaint data must not use AsyncStorage.');

const documentsSource = await readText('src/complaint/documents.ts');
for (const marker of [
  'FileSystem.documentDirectory',
  'Sharing.shareAsync',
  'FileSystem.deleteAsync',
  "uri.startsWith(DOCUMENTS_DIRECTORY)",
]) {
  assert(documentsSource.includes(marker), `Local document safeguard missing: ${marker}.`);
}

console.log(
  `Phase 3 OK: ${phase3CategoryCount} predefined complaint categories, ${expectedCountyCodes.length} ITM routes, PDF/email/share/local documents wired.`,
);
console.log(
  `Content readiness: ${draftTemplateCount} legal templates remain draft; their complaints go only to the test address (test mode).`,
);
