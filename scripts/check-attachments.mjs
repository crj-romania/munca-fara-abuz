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
// Image mocks: decoded size per URI (default: a small image), compressor output
// proportional to the pixels, photo picker and camera results.
const imageInfo = new Map();
const manipulatorCalls = [];
const documentPickerCalls = [];
const imagePickerCalls = [];
let manipulatorFails = false;
let manipulatorCounter = 0;
let imagePickerResult = { canceled: true, assets: null };
let cameraResult = { canceled: true, assets: null };
let cameraGranted = true;
let cameraLaunched = false;

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
  imageInfo.clear();
  manipulatorCalls.length = 0;
  documentPickerCalls.length = 0;
  imagePickerCalls.length = 0;
  manipulatorFails = false;
  imagePickerResult = { canceled: true, assets: null };
  cameraResult = { canceled: true, assets: null };
  cameraGranted = true;
  cameraLaunched = false;
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

const imageManipulator = {
  ImageManipulator: {
    manipulate(uri) {
      const state = { width: imageInfo.get(uri)?.width ?? 800, height: imageInfo.get(uri)?.height ?? 600 };
      const context = {
        resize({ width, height }) {
          const ratio = state.width / state.height;
          if (width) { state.width = width; state.height = Math.round(width / ratio); }
          else if (height) { state.height = height; state.width = Math.round(height * ratio); }
          return context;
        },
        async renderAsync() {
          if (manipulatorFails || !files.has(uri)) throw new Error('Mock decode failure');
          const { width, height } = state;
          return {
            width, height, release() {},
            async saveAsync(options) {
              const out = `${CACHE}ImageManipulator/out-${++manipulatorCounter}.jpg`;
              addFile(out, Math.max(1, Math.round((width * height) / 40)));
              manipulatorCalls.push({ uri, width, height, options });
              return { uri: out, width, height };
            },
          };
        },
        release() {},
      };
      return context;
    },
  },
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
};
const imagePicker = {
  launchImageLibraryAsync: async (options) => { imagePickerCalls.push(options); return imagePickerResult; },
  launchCameraAsync: async () => { cameraLaunched = true; return cameraResult; },
  requestCameraPermissionsAsync: async () => ({ granted: cameraGranted }),
};

const moduleCache = new Map();
const mockedModules = {
  'expo-document-picker': { getDocumentAsync: async (options) => { documentPickerCalls.push(options); return pickerResult; } },
  'expo-image-manipulator': imageManipulator,
  'expo-image-picker': imagePicker,
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

const existingAttachments = (count) => Array.from({ length: count }, (_, index) => ({
  id: `attachment-existing-${index}`,
  uri: `file:///not-owned/${index}.pdf`,
  name: `${index}.pdf`,
  mimeType: 'application/pdf',
  size: 1,
}));

resetFs();
pickerResult = {
  canceled: false,
  assets: [pickerAsset('extra.pdf', 'application/pdf', source('file:///picker/extra.pdf', 10))],
};
await expectReject(attachments.pickComplaintAttachments(existingAttachments(20)), 'attachment.error.tooMany');
assert.equal(copies.length, 0, 'The 21st attachment must be rejected before copy.');
assert.equal(documentPickerCalls.length, 0, 'A full list must not open the picker at all.');
await expectReject(attachments.pickComplaintPhotos(existingAttachments(20)), 'attachment.error.tooMany');
await expectReject(attachments.takeComplaintPhoto(existingAttachments(20)), 'attachment.error.tooMany');
assert.equal(imagePickerCalls.length + Number(cameraLaunched), 0);

resetFs();
const rejectedPickerTemporary = source(`${CACHE}DocumentPicker/oversized-selection.pdf`, 10);
const secondRejectedTemporary = source(`${CACHE}DocumentPicker/oversized-selection-2.pdf`, 10);
pickerResult = { canceled: false, assets: [
  pickerAsset('a.pdf', 'application/pdf', rejectedPickerTemporary),
  pickerAsset('b.pdf', 'application/pdf', secondRejectedTemporary),
] };
await expectReject(attachments.pickComplaintAttachments(existingAttachments(19)), 'attachment.error.tooMany');
assert.equal(files.has(rejectedPickerTemporary) || files.has(secondRejectedTemporary), false,
  'Too-many selection must also clean picker-created copies.');
assert.equal(copies.length, 0);

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

// Photos: a camera-size JPEG is downscaled to 2000 px and re-encoded as JPEG.
const ownedDraftFiles = () => [...files.keys()].filter((uri) => uri.startsWith(`${CACHE}draft-attachments/`));
const compressorLeftovers = () => [...files.keys()].filter((uri) => uri.startsWith(`${CACHE}ImageManipulator/`));
resetFs();
const bigPhoto = source(`${CACHE}DocumentPicker/big-photo.jpg`, 5 * 1024 * 1024);
imageInfo.set(bigPhoto, { width: 4000, height: 3000 });
pickerResult = { canceled: false, assets: [{ ...pickerAsset('IMG_0001.jpg', 'image/jpeg', bigPhoto), size: 5 * 1024 * 1024 }] };
const [bigResult] = await attachments.pickComplaintAttachments([]);
assert.equal(bigResult.name, 'IMG_0001.jpg');
assert.equal(bigResult.mimeType, 'image/jpeg');
assert.equal(bigResult.size, Math.round((2000 * 1500) / 40), 'The stored photo must be the compressed one.');
assert.deepEqual([manipulatorCalls[0].width, manipulatorCalls[0].height], [2000, 1500]);
assert.equal(manipulatorCalls[0].options.format, 'jpeg');
assert.ok(manipulatorCalls[0].options.compress < 1);
assert.equal(files.has(bigPhoto), false, 'The picker copy must be removed.');
assert.equal(compressorLeftovers().length, 0, 'The compressor output must be moved, not left in the cache.');

// A photo larger than the per-file limit is accepted, because it is reduced first.
resetFs();
const hugePhoto = source('file:///picker/huge.jpg', 12 * 1024 * 1024);
imageInfo.set(hugePhoto, { width: 9000, height: 12000 });
pickerResult = { canceled: false, assets: [{ ...pickerAsset('huge.jpg', 'image/jpeg', hugePhoto), size: 12 * 1024 * 1024 }] };
const [hugeResult] = await attachments.pickComplaintAttachments([]);
assert.deepEqual([manipulatorCalls[0].width, manipulatorCalls[0].height], [1500, 2000], 'Portrait photos are limited by height.');
assert.ok(hugeResult.size < 1024 * 1024);
assert.equal(files.has(hugePhoto), true, 'An original outside the picker cache must never be deleted.');

// A PNG screenshot becomes a JPEG; a small efficient image stays as it is.
resetFs();
const screenshot = source('file:///picker/Screenshot_1.png', 2 * 1024 * 1024);
imageInfo.set(screenshot, { width: 1080, height: 2400 });
const tinyPng = source('file:///picker/tiny.png', 90);
pickerResult = { canceled: false, assets: [pickerAsset('Screenshot_1.png', 'image/png', screenshot), pickerAsset('tiny.png', 'image/png', tinyPng)] };
const [screenshotResult, tinyResult] = await attachments.pickComplaintAttachments([]);
assert.equal(screenshotResult.name, 'Screenshot_1.jpg');
assert.equal(screenshotResult.mimeType, 'image/jpeg');
assert.equal(tinyResult.name, 'tiny.png');
assert.equal(tinyResult.mimeType, 'image/png');
assert.equal(tinyResult.size, 90);
assert.equal(compressorLeftovers().length, 0, 'An unused compressor output must be deleted.');

// HEIC is converted; if it cannot be decoded it is refused like any unknown type.
resetFs();
const heic = source('file:///picker/IMG_0002.heic', 3 * 1024 * 1024);
imageInfo.set(heic, { width: 4032, height: 3024 });
pickerResult = { canceled: false, assets: [pickerAsset('IMG_0002.heic', 'image/heic', heic)] };
const [heicResult] = await attachments.pickComplaintAttachments([]);
assert.equal(heicResult.name, 'IMG_0002.jpg');
assert.equal(heicResult.mimeType, 'image/jpeg');
resetFs();
manipulatorFails = true;
pickerResult = { canceled: false, assets: [pickerAsset('IMG_0003.heic', 'image/heic', source('file:///picker/IMG_0003.heic', 100))] };
await expectReject(attachments.pickComplaintAttachments([]), 'attachment.error.type');
assert.equal(ownedDraftFiles().length, 0);
// A JPEG that cannot be decoded is still attached unchanged.
pickerResult = { canceled: false, assets: [pickerAsset('odd.jpg', 'image/jpeg', source('file:///picker/odd.jpg', 100))] };
const [oddResult] = await attachments.pickComplaintAttachments([]);
assert.equal(oddResult.size, 100);

// Gallery: several photos at once, limited to the remaining slots; picker copies are cleaned.
resetFs();
const galleryOne = source(`${CACHE}ImagePicker/0f1e2d3c-aaaa-4bbb-8ccc-111111111111.jpeg`, 4 * 1024 * 1024);
const galleryTwo = source(`${CACHE}ImagePicker/0f1e2d3c-aaaa-4bbb-8ccc-222222222222.png`, 900 * 1024);
imageInfo.set(galleryOne, { width: 4000, height: 3000 });
imageInfo.set(galleryTwo, { width: 1080, height: 2400 });
imagePickerResult = { canceled: false, assets: [
  { uri: galleryOne, fileName: 'contract-page-1.jpg', mimeType: 'image/jpeg', fileSize: 4 * 1024 * 1024, width: 4000, height: 3000 },
  { uri: galleryTwo, fileName: null, mimeType: undefined, fileSize: 900 * 1024, width: 1080, height: 2400 },
] };
const gallery = await attachments.pickComplaintPhotos(existingAttachments(3));
assert.equal(imagePickerCalls[0].allowsMultipleSelection, true);
assert.equal(imagePickerCalls[0].selectionLimit, 17);
assert.equal(JSON.stringify(gallery.map(({ name }) => name)), JSON.stringify(['contract-page-1.jpg', '0f1e2d3c-aaaa-4bbb-8ccc-222222222222.jpg']));
assert.equal(files.has(galleryOne) || files.has(galleryTwo), false, 'Photo picker copies must be removed.');

// Camera: refused permission explains itself and never opens the camera.
resetFs();
cameraGranted = false;
await expectReject(attachments.takeComplaintPhoto([]), 'attachment.error.camera');
assert.equal(cameraLaunched, false);
resetFs();
const cameraShot = source(`${CACHE}ImagePicker/0f1e2d3c-aaaa-4bbb-8ccc-333333333333.jpg`, 3 * 1024 * 1024);
imageInfo.set(cameraShot, { width: 3000, height: 4000 });
cameraResult = { canceled: false, assets: [{ uri: cameraShot, fileName: null, mimeType: 'image/jpeg', fileSize: 3 * 1024 * 1024 }] };
const [shot] = await attachments.takeComplaintPhoto([]);
assert.equal(shot.mimeType, 'image/jpeg');
assert.ok(shot.size < 200 * 1024);
assert.equal(files.has(cameraShot), false);

// Restart sweep also covers photo picker and compressor leftovers.
resetFs();
addFile(`${CACHE}ImagePicker/left-over.jpeg`, 'photo');
addFile(`${CACHE}ImageManipulator/left-over.jpg`, 'photo');
addFile(`${CACHE}ImagePicker/notes.txt`, 'leave-me');
moduleCache.delete(path.join(projectRoot, 'src/complaint/attachments.ts'));
await loadModule('@/src/complaint/attachments').initializeComplaintAttachmentCache();
assert.equal(files.has(`${CACHE}ImagePicker/left-over.jpeg`), false, 'Restart cleanup must remove photo picker copies.');
assert.equal(files.has(`${CACHE}ImageManipulator/left-over.jpg`), false, 'Restart cleanup must remove compressor leftovers.');
assert.equal(files.has(`${CACHE}ImagePicker/notes.txt`), true, 'Restart cleanup must leave unknown entries untouched.');

// Twenty compressed photos fit in one complaint and come back from storage.
resetFs();
const twenty = [];
for (let index = 0; index < 20; index += 1) {
  const uri = source(`file:///picker/page-${index}.jpg`, 4 * 1024 * 1024);
  imageInfo.set(uri, { width: 4000, height: 3000 });
  pickerResult = { canceled: false, assets: [pickerAsset(`page-${index}.jpg`, 'image/jpeg', uri)] };
  twenty.push(...await attachments.pickComplaintAttachments(twenty));
}
assert.equal(twenty.length, 20);
const twentySaved = await documents.persistGeneratedPdf(
  source('file:///temporary/twenty.pdf', 500), 'unpaid_wages', '2026-11-02T12:00:00.000Z', twenty,
);
assert.equal(twentySaved.attachments.at(-1).uri.endsWith('file-20.jpg'), true);
const [listedTwenty] = await documents.listComplaintDocuments();
assert.equal(listedTwenty.attachments.length, 20);
await documents.assertComplaintFilesAvailable(twentySaved.uri, twentySaved.attachments);
await assert.rejects(documents.persistGeneratedPdf(source('file:///temporary/too-many.pdf', 500), 'unpaid_wages',
  '2026-11-02T12:00:00.000Z', [...twenty, twenty[0]]), /Too many/);

// "Delete everything" removes saved complaints, their companions and every
// temporary complaint folder, but nothing outside the app's own folders.
resetFs();
addFile(`${DOCUMENTS}complaints/plangere_a_2026-11-02.pdf`, 'pdf');
addFile(`${DOCUMENTS}complaints/plangere_a_2026-11-02.attachments/file-1.jpg`, 'jpg');
addFile(`${DOCUMENTS}other-app-data.json`, 'keep');
for (const folder of ['draft-attachments', 'DocumentPicker', 'ImagePicker', 'ImageManipulator', 'Print']) {
  addFile(`${CACHE}${folder}/x.jpg`, 'tmp');
}
addFile(`${CACHE}unrelated/keep.txt`, 'keep');
addFile('file:///picker/original.jpg', 'original');
await documents.deleteAllComplaintData();
assert.equal([...files.keys()].some((uri) => uri.startsWith(`${DOCUMENTS}complaints/`)), false, 'All saved complaints must be deleted.');
for (const folder of ['draft-attachments', 'DocumentPicker', 'ImagePicker', 'ImageManipulator', 'Print']) {
  assert.equal(files.has(`${CACHE}${folder}/x.jpg`), false, `${folder} must be emptied.`);
}
assert.ok(files.has(`${DOCUMENTS}other-app-data.json`) && files.has(`${CACHE}unrelated/keep.txt`) &&
  files.has('file:///picker/original.jpg'), 'Delete everything must not touch anything else.');
assert.equal(JSON.stringify(await documents.listComplaintDocuments()), '[]');
await documents.deleteAllComplaintData(); // idempotent

const attachmentScreen = readFileSync(path.join(projectRoot, 'app/complaint/attachments.tsx'), 'utf8');
assert.match(attachmentScreen, /selectionInFlight\.current/, 'Attachment screen needs a synchronous picker guard.');
assert.match(attachmentScreen, /disabled=\{selecting\}/, 'Continue must be disabled while the picker is active.');

console.log('Attachment regressions OK: 20-file limits, photo compression (JPEG/PNG/HEIC), gallery and camera, owned-cache rollback, companion integrity, safe deletion, and email preflight.');
