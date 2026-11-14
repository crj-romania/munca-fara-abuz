import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const packageJson = JSON.parse(read('package.json'));
for (const dependency of ['expo-document-picker', 'expo-clipboard', 'expo-dev-client']) {
  assert.ok(packageJson.dependencies[dependency], `Missing ${dependency}`);
}
const textScreen = read('app/complaint/text.tsx');
assert.match(textScreen, /getNarrativeError/);
assert.match(textScreen, /Clipboard\.setStringAsync\(original\)/);
assert.doesNotMatch(textScreen, /Clipboard\.getString|console\.(log|error|warn)|https?:\/\/[^'" ]*text=/);
// What happened is asked before personal data: text → identity → status → parties.
assert.match(textScreen, /router\.navigate\('\/complaint\/identity'\)/);
assert.match(read('app/complaint/index.tsx'), /'\/complaint\/violations' : '\/complaint\/details'/);
assert.doesNotMatch(read('app/complaint/index.tsx'), /\/complaint\/identity/);
assert.match(read('app/complaint/identity.tsx'), /\/complaint\/status/);
assert.match(read('app/complaint/status.tsx'), /\/complaint\/employer/);
assert.match(read('app/complaint/employer.tsx'), /\/complaint\/attachments/);
assert.match(read('app/complaint/attachments.tsx'), /\/complaint\/review/);
const preview = read('app/complaint/preview.tsx');
assert.match(preview, /assertComplaintFilesAvailable\(generated\.uri, generated\.attachments\)/);
assert.match(preview, /attachments: \[generated\.uri, \.\.\.generated\.attachments\.map/);
assert.match(preview, /generated\.testMode/);
assert.doesNotMatch(preview, /!generated\.templateReady/, 'Provisional templates no longer block email; they use the test address.');
assert.match(read('src/content/ContentProvider.tsx'), /deletePreviousTranslationModel/);
// Statistics: opt-in only, fixed event names, never form values or free text.
const analyticsSource = read('src/analytics/analytics.ts');
assert.match(analyticsSource, /consent !== 'granted'/);
assert.doesNotMatch(analyticsSource, /from '@\/src\/complaint/, 'Statistics must not import complaint data.');
const trackedFiles = ['app/_layout.tsx', 'app/complaint/index.tsx', 'app/complaint/preview.tsx', 'app/complaint/text.tsx',
  'app/emergency.tsx', 'app/contact.tsx', 'app/info/[...path].tsx', 'src/components/LanguageGrid.tsx', 'src/components/DeleteAllData.tsx'];
for (const file of trackedFiles) {
  for (const [, call] of read(file).matchAll(/track\(([^;]*?)\);/gs)) {
    assert.doesNotMatch(call, /draft\.values|values\[|freeText|\.original|\.translated|lastName|firstName|idNumber|\.email\b|phone/i, `${file}: ${call}`);
  }
}
assert.match(read('src/complaint/pdfFonts.ts'), /data:font\/ttf;base64/);
assert.doesNotMatch(read('src/complaint/pdfFonts.ts'), /https?:\/\//);
const dictionaries = ['en', 'ro', 'ne', 'ur'].map((code) => JSON.parse(read(`content/${code}/strings.json`)));
for (const dictionary of dictionaries) {
  for (const key of ['complaint.text.downloading', 'complaint.text.translating', 'complaint.pdf.translationNotice', 'attachment.error.missing']) {
    assert.ok(dictionary[key]);
  }
}

// Exercise the production provider's async-result guards with a minimal hook harness.
// This tests state transitions, not React Native rendering or native file handling.
const slots = [];
let cursor = 0;
const removed = [];
const react = {
  createContext: () => ({ Provider: 'Provider' }),
  useContext: () => undefined,
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useEffect: () => { cursor += 1; },
  useRef: (initial) => {
    const position = cursor++;
    slots[position] ??= { current: initial };
    return slots[position];
  },
  useState: (initial) => {
    const position = cursor++;
    slots[position] ??= { value: typeof initial === 'function' ? initial() : initial };
    return [slots[position].value, (value) => {
      slots[position].value = typeof value === 'function' ? value(slots[position].value) : value;
    }];
  },
};
const mocks = {
  react,
  'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
  '@/src/complaint/attachments': {
    initializeComplaintAttachmentCache: async () => {},
    clearDraftAttachments: async (items) => { removed.push(...items.map((item) => item.id)); },
    removeDraftAttachment: async (item) => { removed.push(item.id); },
  },
};
const module = { exports: {} };
const compiled = ts.transpileModule(read('src/complaint/ComplaintProvider.tsx'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(compiled, { module, exports: module.exports, require: (name) => {
  assert.ok(mocks[name], `Unexpected dependency ${name}`);
  return mocks[name];
} });
const render = () => {
  cursor = 0;
  return module.exports.ComplaintProvider({ children: null }).props.value;
};
let state = render();
state.startComplaint('unpaid_wages', ['employer'], 'en');
state = render();
const firstId = state.draft.id;
state.setFieldValue('freeText', 'Original');
state.setTranslation('freeText', { original: 'Original', translated: 'Traducere', sourceLanguage: 'en', engine: 'manual' }, firstId);
state = render();
assert.equal(state.draft.translations.freeText.translated, 'Traducere');
state.setFieldValue('freeText', 'Changed');
state = render();
assert.equal(state.draft.translations.freeText, undefined);
state.setTranslation('freeText', { original: 'Original', translated: 'STALE', sourceLanguage: 'en', engine: 'mlkit' }, firstId);
state = render();
assert.equal(state.draft.translations.freeText, undefined);
state.setTextLanguage('ur');
state.setTranslation('freeText', { original: 'Changed', translated: 'STALE', sourceLanguage: 'en', engine: 'mlkit' }, firstId);
state = render();
assert.equal(state.draft.translations.freeText, undefined);
state.addAttachments([{ id: 'first-file' }], firstId);
state = render();
const oldSnapshot = state.draft;
state.startComplaint('other', ['other'], 'ro');
state.addAttachments([{ id: 'stale-picker-file' }], firstId);
state = render();
assert.equal(state.draft.attachments.length, 0);
assert.ok(removed.includes('first-file') && removed.includes('stale-picker-file'));
assert.equal(state.completeGeneration({ uri: 'old.pdf' }, oldSnapshot), false);
state = render();
assert.equal(state.draft.categoryId, 'other');
const beforeEdit = state.draft;
state.setFieldValue('freeText', 'No lost edits');
assert.equal(state.completeGeneration({ uri: 'old.pdf' }, beforeEdit), false);
state = render();
state.addAttachments([{ id: 'saved-file' }], state.draft.id);
state = render();
assert.equal(state.completeGeneration({ uri: 'saved.pdf', attachments: [{ id: 'saved-file' }] }, state.draft), true);
state = render();
assert.equal(state.draft.categoryId, null);
assert.equal(state.draft.values.freeText, undefined);
assert.equal(Object.keys(state.draft.translations).length, 0);
assert.equal(state.generated.uri, 'saved.pdf');
assert.ok(removed.includes('saved-file'));
state.clearComplaint();
state = render();
assert.equal(state.generated, null);
console.log('Phase 4 integration OK: screen/email wiring, dictionary keys, provider translation/picker/generation race guards and cleanup.');
