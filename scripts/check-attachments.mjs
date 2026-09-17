#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = 'file:///cache/';
const DOCUMENTS = 'file:///documents/';
const files = new Map();
const directories = new Set([CACHE, DOCUMENTS]);
const deleted = [];
const copies = [];
const shared = [];
const intents = [];
let pickerResult = { canceled: true, assets: null };
let failCopyAfterWrite = false;
const platform = { OS: 'ios' };

function parentDirectory(uri) {
  return uri.slice(0, uri.lastIndexOf('/') + 1);
}

function addFile(uri, value) {
  const data = typeof value === 'number' ? 'x'.repeat(value) : value;
  directories.add(parentDirectory(uri));
  files.set(uri, { data, size: Buffer.byteLength(data) });
}

function resetFs() {
  files.clear();
  directories.clear();
  directories.add(CACHE);
  directories.add(DOCUMENTS);
  deleted.length = 0;
  copies.length = 0;
  shared.length = 0;
  intents.length = 0;
  pickerResult = { canceled: true, assets: null };
  failCopyAfterWrite = false;
  platform.OS = 'ios';
}

function immediateChildren(directory) {
  const children = new Set();
  for (const uri of [...files.keys(), ...directories]) {
    if (!uri.startsWith(directory) || uri === directory) continue;
    const tail = uri.slice(directory.length);
    const child = tail.split('/')[0];
    if (child) children.add(child);
  }
  return [...children];
}

const fileSystem = {
  cacheDirectory: CACHE,
  documentDirectory: DOCUMENTS,
  async makeDirectoryAsync(uri, options = {}) {
    if (directories.has(uri) && !options.intermediates) {
      throw new Error(`Directory already exists: ${uri}`);
    }
    directories.add(uri);
  },
  async getInfoAsync(uri) {
    const file = files.get(uri);
    if (file) return { exists: true, size: file.size, modificationTime: 1 };
    return { exists: directories.has(uri), modificationTime: 1 };
  },
  async copyAsync({ from, to }) {
    const source = files.get(from);
    if (!source) throw new Error(`Missing source: ${from}`);
    copies.push({ from, to });
    addFile(to, source.data);
    if (failCopyAfterWrite) {
      failCopyAfterWrite = false;
      throw new Error('Mock copy failure after destination creation.');
    }
  },
  async moveAsync({ from, to }) {
    const source = files.get(from);
    if (!source) throw new Error(`Missing source: ${from}`);
    addFile(to, source.data);
    files.delete(from);
  },
  async deleteAsync(uri, { idempotent } = {}) {
    const exists = files.has(uri) || directories.has(uri);
    if (!exists && !idempotent) throw new Error(`Missing target: ${uri}`);
    deleted.push(uri);
    files.delete(uri);
    for (const candidate of [...files.keys()]) {
      if (candidate.startsWith(uri)) files.delete(candidate);
    }
    for (const candidate of [...directories]) {
      if (candidate === uri || candidate.startsWith(uri)) directories.delete(candidate);
    }
  },
  async readDirectoryAsync(uri) {
    if (!directories.has(uri)) throw new Error(`Missing directory: ${uri}`);
    return immediateChildren(uri);
  },
  async readAsStringAsync(uri) {
    const file = files.get(uri);
    if (!file) throw new Error(`Missing file: ${uri}`);
    return file.data;
  },
  async writeAsStringAsync(uri, data) {
    addFile(uri, data);
  },
  async getContentUriAsync(uri) {
    if (!files.has(uri)) throw new Error(`Missing file: ${uri}`);
    return `content://${uri.slice('file:///'.length)}`;
  },
};

const moduleCache = new Map();
const mockedModules = {
  'expo-document-picker': { getDocumentAsync: async () => pickerResult },
  'expo-file-system/legacy': fileSystem,
  'expo-sharing': {
    isAvailableAsync: async () => true,
    shareAsync: async (uri, options) => { shared.push({ uri, options }); },
  },
  'expo-intent-launcher': {
    startActivityAsync: async (action, options) => { intents.push({ action, options }); },
  },
  'react-native': { Platform: platform },
};

function sourcePath(request, parentPath) {
  if (request.startsWith('@/')) return path.join(projectRoot, request.slice(2));
  if (request.startsWith('.')) return path.resolve(path.dirname(parentPath), request);
  return null;
}

function resolveSource(request, parentPath) {
  const unresolved = sourcePath(request, parentPath);
  if (!unresolved) return null;
  for (const candidate of [unresolved, `${unresolved}.ts`, `${unresolved}.tsx`, path.join(unresolved, 'index.ts')]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot resolve ${request} from ${parentPath}.`);
}

function loadModule(request, parentPath = path.join(projectRoot, 'scripts/check-attachments.mjs')) {
  if (mockedModules[request]) return mockedModules[request];
  const filename = resolveSource(request, parentPath);
  if (!filename) throw new Error(`Unexpected dependency ${request} from ${parentPath}.`);
  if (moduleCache.has(filename)) return moduleCache.get(filename).exports;

  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  moduleCache.set(filename, module);
  vm.runInNewContext(compiled, {
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
    JSON,
    Number,
    Promise,
  }, { filename });
  return module.exports;
}

function source(uri, size) {
  addFile(uri, size);
  return uri;
}

function pickerAsset(name, mimeType, uri, size = 1) {
  return { name, mimeType, uri: uri ?? source(`file:///picker/${name}`, size), size: 1 };
}

async function expectReject(promise, message) {
  await assert.rejects(promise, (error) => error instanceof Error && error.message === message);
}

const attachments = loadModule('@/src/complaint/attachments');
const documents = loadModule('@/src/complaint/documents');

resetFs();
addFile(`${CACHE}draft-attachments/attachment-abandoned-123.pdf`, 'sensitive');
addFile(`${CACHE}DocumentPicker/picker-original.pdf`, 'original');
addFile(`${CACHE}draft-attachments/unknown.txt`, 'leave-me');
await attachments.initializeComplaintAttachmentCache();
assert.equal(files.has(`${CACHE}draft-attachments/attachment-abandoned-123.pdf`), false, 'Restart cleanup must remove exact owned cache files.');
assert.equal(files.has(`${CACHE}DocumentPicker/picker-original.pdf`), false, 'Restart cleanup must remove verified DocumentPicker temporary copies.');
assert.equal(files.has(`${CACHE}draft-attachments/unknown.txt`), true, 'Restart cleanup must leave unknown entries untouched.');

resetFs();
platform.OS = 'web';
await expectReject(attachments.pickComplaintAttachments([]), 'attachment.error.unavailable');
assert.equal(copies.length, 0);

resetFs();
assert.equal(JSON.stringify(await attachments.pickComplaintAttachments([])), '[]');
assert.equal(copies.length, 0, 'Cancel must not create a cache copy.');
assert.equal(directories.has(`${CACHE}draft-attachments/`), false, 'Cancel must not create the owned directory.');

resetFs();
pickerResult = {
  canceled: false,
  assets: [pickerAsset('../../payload.exe', 'application/pdf', source('file:///picker/payload.exe', 10))],
};
await expectReject(attachments.pickComplaintAttachments([]), 'attachment.error.type');
assert.equal(copies.length, 0, 'Executable/path spoof must be rejected before copy.');

resetFs();
const pickerTemporary = source(`${CACHE}DocumentPicker/3f2f1a2b-0d91-4c1e-91b5-55af1f2a7c10.pdf`, 10);
pickerResult = { canceled: false, assets: [pickerAsset('temp.pdf', 'application/pdf', pickerTemporary)] };
const copiedTemporary = await attachments.pickComplaintAttachments([]);
assert.equal(files.has(pickerTemporary), false, 'Successful selection must remove its verified picker cache copy.');
assert.equal(files.has(copiedTemporary[0].uri), true, 'Successful selection must retain only the owned draft copy.');

resetFs();
const failedPickerTemporary = source(`${CACHE}DocumentPicker/3f2f1a2b-0d91-4c1e-91b5-55af1f2a7c11.pdf`, 10);
pickerResult = { canceled: false, assets: [pickerAsset('failed.pdf', 'application/pdf', failedPickerTemporary)] };
failCopyAfterWrite = true;
await assert.rejects(attachments.pickComplaintAttachments([]), /Mock copy failure/);
assert.equal(files.has(failedPickerTemporary), false, 'Failed selection must remove its verified picker cache copy.');
assert.equal([...files.keys()].some((uri) => uri.startsWith(`${CACHE}draft-attachments/`)), false, 'A destination created before copy failure must be rolled back.');

resetFs();
pickerResult = {
  canceled: false,
  assets: [pickerAsset('sixth.pdf', 'application/pdf', source('file:///picker/sixth.pdf', 10))],
};
const fiveExisting = Array.from({ length: 5 }, (_, index) => ({
  id: `attachment-existing-${index}`,
  uri: `file:///not-owned/${index}.pdf`,
  name: `${index}.pdf`,
  mimeType: 'application/pdf',
  size: 1,
}));
await expectReject(attachments.pickComplaintAttachments(fiveExisting), 'attachment.error.tooMany');
assert.equal(copies.length, 0, 'The sixth attachment must be rejected before copy.');

resetFs();
const rejectedPickerTemporary = source(`${CACHE}DocumentPicker/oversized-selection.pdf`, 10);
pickerResult = { canceled: false, assets: [pickerAsset('sixth.pdf', 'application/pdf', rejectedPickerTemporary)] };
await expectReject(attachments.pickComplaintAttachments(fiveExisting), 'attachment.error.tooMany');
assert.equal(files.has(rejectedPickerTemporary), false, 'Too-many selection must also clean picker-created copies.');

resetFs();
const largePickerTemporary = source(`${CACHE}DocumentPicker/known-large.pdf`, 11 * 1024 * 1024);
pickerResult = { canceled: false, assets: [{ ...pickerAsset('large.pdf', 'application/pdf', largePickerTemporary), size: 11 * 1024 * 1024 }] };
await expectReject(attachments.pickComplaintAttachments([]), 'attachment.error.tooLarge');
assert.equal(copies.length, 0, 'A known oversized file must not be copied a second time.');
assert.equal(files.has(largePickerTemporary), false);

resetFs();
pickerResult = {
  canceled: false,
  assets: [pickerAsset('large.pdf', 'application/pdf', source('file:///picker/large.pdf', 10 * 1024 * 1024 + 1))],
};
await expectReject(attachments.pickComplaintAttachments([]), 'attachment.error.tooLarge');
assert.equal([...files.keys()].some((uri) => uri.startsWith(`${CACHE}draft-attachments/`)), false, 'Oversize copy must roll back.');

resetFs();
pickerResult = {
  canceled: false,
  assets: [
    pickerAsset('one.pdf', 'application/pdf', source('file:///picker/one.pdf', 8 * 1024 * 1024)),
    pickerAsset('two.pdf', 'application/pdf', source('file:///picker/two.pdf', 8 * 1024 * 1024)),
  ],
};
await expectReject(attachments.pickComplaintAttachments([]), 'attachment.error.totalSize');
assert.equal([...files.keys()].some((uri) => uri.startsWith(`${CACHE}draft-attachments/`)), false, 'Total-size failure must roll back the batch.');

resetFs();
pickerResult = {
  canceled: false,
  assets: [pickerAsset('valid.pdf', 'application/pdf', source('file:///picker/valid.pdf', 20)), pickerAsset('bad.exe', 'application/pdf', source('file:///picker/bad.exe', 20))],
};
await expectReject(attachments.pickComplaintAttachments([]), 'attachment.error.type');
assert.equal([...files.keys()].some((uri) => uri.startsWith(`${CACHE}draft-attachments/`)), false, 'A later invalid item must clean earlier copies.');
assert.equal(files.has('file:///picker/valid.pdf'), true, 'Picker source must remain untouched.');

resetFs();
pickerResult = {
  canceled: false,
  assets: [pickerAsset('evidence.pdf', 'application/pdf', source('file:///picker/evidence.pdf', 100))],
};
const draftAttachments = await attachments.pickComplaintAttachments([]);
assert.equal(draftAttachments.length, 1);
const [draftAttachment] = draftAttachments;
assert.ok(draftAttachment.uri.startsWith(`${CACHE}draft-attachments/`));
await attachments.removeDraftAttachment({ ...draftAttachment, uri: 'file:///picker/evidence.pdf' });
assert.equal(files.has('file:///picker/evidence.pdf'), true, 'Removal must never delete an unowned URI.');
await attachments.removeDraftAttachment(draftAttachment);
assert.equal(files.has(draftAttachment.uri), false, 'Owned cache copies must be removable.');

resetFs();
pickerResult = {
  canceled: false,
  assets: [pickerAsset('dovadă.pdf', 'application/pdf', source('file:///picker/dovada.pdf', 120))],
};
const selected = await attachments.pickComplaintAttachments([]);
const saved = await documents.persistGeneratedPdf(
  source('file:///temporary/complaint.pdf', 500),
  'unpaid_wages',
  '2026-09-08T12:00:00.000Z',
  selected,
);
assert.equal(saved.attachments.length, 1);
assert.ok(files.has(saved.uri), 'The generated PDF must persist.');
assert.ok(files.has(saved.attachments[0].uri), 'The saved companion must persist.');
assert.equal(files.has(selected[0].uri), true, 'Persisting must copy, not consume, the draft cache file.');
const metadataUri = `${DOCUMENTS}complaints/${saved.fileName.slice(0, -4)}.attachments/attachments.json`;
assert.ok(files.has(metadataUri), 'Companion metadata is required.');
assert.doesNotMatch(files.get(metadataUri).data, /"values"/, 'Metadata must not include form data.');
await documents.assertComplaintFilesAvailable(saved.uri, saved.attachments);
platform.OS = 'android';
await documents.openComplaintAttachment(saved.attachments[0]);
assert.equal(intents.at(-1)?.options.type, 'application/pdf', 'Android must open a saved companion with its MIME type.');
platform.OS = 'ios';
await documents.shareComplaintAttachment(saved.attachments[0]);
assert.equal(shared.at(-1)?.uri, saved.attachments[0].uri, 'Attachments must be shared one at a time.');
await attachments.clearDraftAttachments(selected);
assert.equal(files.has(selected[0].uri), false, 'Clearing the draft may only remove the cache copy.');
assert.equal(files.has(saved.attachments[0].uri), true, 'Clearing the draft must preserve saved companions.');

resetFs();
addFile(`${DOCUMENTS}complaints/plangere_legacy_2026-01-01.pdf`, 'old');
const legacy = await documents.listComplaintDocuments();
assert.equal(legacy.length, 1);
assert.equal(JSON.stringify(legacy[0].attachments), '[]', 'Old PDFs must load with no attachments.');

resetFs();
addFile(`${DOCUMENTS}complaints/plangere_broken_2026-01-01.pdf`, 'pdf');
directories.add(`${DOCUMENTS}complaints/plangere_broken_2026-01-01.attachments/`);
await expectReject(documents.listComplaintDocuments(), 'Stored complaint attachments are missing or corrupted.');

resetFs();
addFile(`${DOCUMENTS}complaints/plangere_corrupt_2026-01-01.pdf`, 'pdf');
const corruptDirectory = `${DOCUMENTS}complaints/plangere_corrupt_2026-01-01.attachments/`;
directories.add(corruptDirectory);
addFile(`${corruptDirectory}attachments.json`, JSON.stringify({
  version: 1,
  attachments: [{ id: 'attachment-abcdefgh', fileName: 'file-1.pdf', name: 'evidence.pdf', mimeType: 'application/pdf', size: 20 }],
}));
addFile(`${corruptDirectory}file-1.pdf`, 'tiny');
await expectReject(documents.listComplaintDocuments(), 'Stored complaint attachments are missing or corrupted.');

resetFs();
pickerResult = {
  canceled: false,
  assets: [pickerAsset('photo.png', 'image/png', source('file:///picker/photo.png', 90))],
};
const sourceAttachment = (await attachments.pickComplaintAttachments([]))[0];
const stored = await documents.persistGeneratedPdf(
  source('file:///temporary/delete.pdf', 500), 'unpaid_wages', '2026-09-08T12:00:00.000Z', [sourceAttachment],
);
await documents.deleteComplaintDocument(stored.uri);
assert.equal(files.has(sourceAttachment.uri), true, 'Deleting saved evidence must never delete the draft source.');
assert.equal(files.has(stored.uri), false);
assert.equal(files.has(stored.attachments[0].uri), false, 'Deleting a PDF must delete its exact companion directory.');

resetFs();
pickerResult = {
  canceled: false,
  assets: [pickerAsset('email.pdf', 'application/pdf', source('file:///picker/email.pdf', 90))],
};
const emailSource = await attachments.pickComplaintAttachments([]);
const emailDocument = await documents.persistGeneratedPdf(
  source('file:///temporary/email.pdf', 500), 'unpaid_wages', '2026-09-08T12:00:00.000Z', emailSource,
);
await documents.assertComplaintFilesAvailable(emailDocument.uri, emailDocument.attachments);
await fileSystem.deleteAsync(emailDocument.attachments[0].uri, { idempotent: true });
await expectReject(
  documents.assertComplaintFilesAvailable(emailDocument.uri, emailDocument.attachments),
  'attachment.error.missing',
);

platform.OS = 'android';
await documents.openComplaintAttachment(emailDocument.attachments[0]).catch(() => {});
assert.equal(intents.length, 0, 'Missing attachments must not open through Android.');
await documents.shareComplaintDocument(emailDocument.uri);
assert.equal(shared.length, 1, 'A PDF share remains a single-file share.');

const attachmentScreen = readFileSync(path.join(projectRoot, 'app/complaint/attachments.tsx'), 'utf8');
assert.match(attachmentScreen, /selectionInFlight\.current/, 'Attachment screen needs a synchronous picker guard.');
assert.match(attachmentScreen, /disabled=\{selecting\}/, 'Continue must be disabled while the picker is active.');

console.log('Attachment regressions OK: picker limits, owned-cache rollback, companion integrity, safe deletion, and email preflight.');
