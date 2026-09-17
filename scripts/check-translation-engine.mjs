#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engineEntry = path.join(projectRoot, 'src/translation/engine.ts');
const podspecPath = path.join(projectRoot, 'modules/migrant-translation/ios/MigrantTranslation.podspec');
const androidBuildPath = path.join(projectRoot, 'modules/migrant-translation/android/build.gradle');

const languages = {
  en: { code: 'en', name: 'English', rtl: false, mt: 'mlkit:en' },
  ro: { code: 'ro', name: 'Română', rtl: false, mt: 'mlkit:ro' },
  ur: { code: 'ur', name: 'اردو', rtl: true, mt: 'mlkit:ur' },
  missing: { code: 'ne', name: 'नेपाली', rtl: false, mt: 'mlkit:ne' },
  none: { code: 'ne', name: 'नेपाली', rtl: false, mt: 'none' },
  unspecified: { code: 'xx', name: 'Unknown', rtl: false },
};

function assertUnavailable(promise) {
  return assert.rejects(promise, (error) => error?.message === 'E_ON_DEVICE_TRANSLATION_UNAVAILABLE');
}

function assertSameData(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function waitForCall(calls, expected) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (calls.includes(expected)) {
      return;
    }
    await Promise.resolve();
  }
  throw new Error(`Timed out waiting for ${expected}.`);
}

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
  for (const candidate of [
    unresolved,
    `${unresolved}.ts`,
    `${unresolved}.tsx`,
    path.join(unresolved, 'index.ts'),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  throw new Error(`Cannot resolve ${request} from ${parentPath}.`);
}

function loadEngine(nativeModule) {
  const moduleCache = new Map();

  function loadModule(request, parentPath = engineEntry) {
    if (request === 'expo-modules-core') {
      return { requireOptionalNativeModule: () => nativeModule };
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
      Error,
      Promise,
      Set,
    };
    vm.runInNewContext(compiled, context, { filename });
    return module.exports;
  }

  return loadModule('@/src/translation/engine');
}

function mockNative({ supported = ['en', 'ro', 'ur'], prepare, translate, deleteModel } = {}) {
  const calls = [];
  return {
    calls,
    getSupportedLanguages() {
      calls.push('supported');
      return supported;
    },
    prepare: prepare ?? (async (source, target) => { calls.push(`prepare:${source}:${target}`); }),
    translate: translate ?? (async (text, source, target) => {
      calls.push(`translate:${text}:${source}:${target}`);
      return `ro:${text}`;
    }),
    deleteModel: deleteModel ?? (async (language) => { calls.push(`delete:${language}`); }),
  };
}

const podspec = readFileSync(podspecPath, 'utf8');
assert.match(podspec, /s\.platforms = \{ :ios => '15\.5' \}/);
assert.match(podspec, /s\.dependency 'GoogleMLKit\/Translate', '8\.0\.0'/);
const androidBuild = readFileSync(androidBuildPath, 'utf8');
assert.match(androidBuild, /com\.google\.mlkit:translate:17\.0\.3/);
assert.doesNotMatch(androidBuild, /\bminSdk(?:Version)?\b/);

// Expo Go has no local native module. Loading and using the adapter must remain safe.
const absentEngine = loadEngine(null);
assert.equal(absentEngine.isOnDeviceTranslationAvailable(languages.en), false);
await assertUnavailable(absentEngine.translateOnDevice('hello', languages.en));

const gateNative = mockNative({ supported: ['en', 'ro', 'ur'] });
const gateEngine = loadEngine(gateNative);
assert.equal(gateEngine.isOnDeviceTranslationAvailable(languages.en), true);
assert.equal(gateEngine.isOnDeviceTranslationAvailable(languages.missing), false);
assert.equal(gateEngine.isOnDeviceTranslationAvailable(languages.none), false);
assert.equal(gateEngine.isOnDeviceTranslationAvailable(languages.unspecified), false);

// Reading availability and selecting Romanian must not download or create a model.
const roNative = mockNative();
const roEngine = loadEngine(roNative);
assert.equal(roEngine.isOnDeviceTranslationAvailable(languages.ur), true);
assert.equal(await roEngine.translateOnDevice('deja română', languages.ro), 'deja română');
assertSameData(roNative.calls, ['supported']);

const sequenceNative = mockNative();
const sequenceEngine = loadEngine(sequenceNative);
assertSameData(sequenceNative.calls, []);
const stages = [];
assert.equal(await sequenceEngine.translateOnDevice('hello', languages.en, (stage) => stages.push(stage)), 'ro:hello');
assertSameData(stages, ['downloading', 'translating']);
assertSameData(sequenceNative.calls, [
  'supported',
  'prepare:en:ro',
  'translate:hello:en:ro',
]);

const deletionNative = mockNative();
const deletionEngine = loadEngine(deletionNative);
await deletionEngine.deletePreviousTranslationModel(languages.ro, languages.en);
await deletionEngine.deletePreviousTranslationModel(languages.en, languages.ur);
await deletionEngine.deletePreviousTranslationModel(languages.ur, languages.ur);
await deletionEngine.deletePreviousTranslationModel(languages.none, languages.en);
await deletionEngine.deletePreviousTranslationModel(undefined, languages.en);
assertSameData(deletionNative.calls, []);
await deletionEngine.deletePreviousTranslationModel(languages.ur, languages.en);
assertSameData(deletionNative.calls, ['delete:ur']);

const pendingPrepare = deferred();
const queuedNative = mockNative({
  prepare: async (source, target) => {
    queuedNative.calls.push(`prepare:${source}:${target}`);
    await pendingPrepare.promise;
  },
});
const queuedEngine = loadEngine(queuedNative);
const queuedTranslation = queuedEngine.translateOnDevice('queue', languages.ur);
await waitForCall(queuedNative.calls, 'prepare:ur:ro');
const queuedDeletion = queuedEngine.deletePreviousTranslationModel(languages.ur, languages.en);
assertSameData(queuedNative.calls, ['supported', 'prepare:ur:ro']);
pendingPrepare.resolve();
assert.equal(await queuedTranslation, 'ro:queue');
await queuedDeletion;
assertSameData(queuedNative.calls, [
  'supported',
  'prepare:ur:ro',
  'translate:queue:ur:ro',
  'delete:ur',
]);

const recoveryNative = mockNative({
  prepare: async (source, target) => {
    recoveryNative.calls.push(`prepare:${source}:${target}`);
    throw new Error('E_MODEL_DOWNLOAD_FAILED');
  },
});
const recoveryEngine = loadEngine(recoveryNative);
const failedTranslation = recoveryEngine.translateOnDevice('retry', languages.ur);
const recoveryDeletion = recoveryEngine.deletePreviousTranslationModel(languages.ur, languages.en);
await assert.rejects(failedTranslation, (error) => error?.message === 'E_MODEL_DOWNLOAD_FAILED');
await recoveryDeletion;
assertSameData(recoveryNative.calls, [
  'supported',
  'prepare:ur:ro',
  'delete:ur',
]);

console.log('Translation engine regression OK: fallback, gates, lazy download, staging, deletion, queue ordering, and recovery.');
