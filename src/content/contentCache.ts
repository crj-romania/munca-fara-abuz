import * as FileSystem from 'expo-file-system/legacy';

import {
  getRequiredContentPaths,
  isRemoteVersionNewer,
  validateBundle,
  validateIndex,
} from '@/src/content/contentValidation';
import {
  CONTENT_BASE_URL,
  CONTENT_FETCH_TIMEOUT_MS,
} from '@/src/config/content';
import type { ContentBundle, ContentIndex } from '@/src/types/content';

const CACHE_ROOT = FileSystem.cacheDirectory
  ? `${FileSystem.cacheDirectory}munca-fara-abuz-content/`
  : null;
const ACTIVE_DIRECTORY = CACHE_ROOT ? `${CACHE_ROOT}active/` : null;
const STAGING_DIRECTORY = CACHE_ROOT ? `${CACHE_ROOT}staging/` : null;
const BACKUP_DIRECTORY = CACHE_ROOT ? `${CACHE_ROOT}backup/` : null;

async function exists(uri: string): Promise<boolean> {
  return (await FileSystem.getInfoAsync(uri)).exists;
}

async function removeIfPresent(uri: string): Promise<void> {
  if (await exists(uri)) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

async function recoverInterruptedSwap(): Promise<void> {
  if (!CACHE_ROOT || !ACTIVE_DIRECTORY || !BACKUP_DIRECTORY || !STAGING_DIRECTORY) {
    return;
  }

  await FileSystem.makeDirectoryAsync(CACHE_ROOT, { intermediates: true });
  const activeExists = await exists(ACTIVE_DIRECTORY);
  const backupExists = await exists(BACKUP_DIRECTORY);

  if (!activeExists && backupExists) {
    await FileSystem.moveAsync({ from: BACKUP_DIRECTORY, to: ACTIVE_DIRECTORY });
  } else if (activeExists && backupExists) {
    await removeIfPresent(BACKUP_DIRECTORY);
  }

  await removeIfPresent(STAGING_DIRECTORY);
}

async function readJsonFile(directory: string, path: string): Promise<unknown> {
  const text = await FileSystem.readAsStringAsync(`${directory}${path}`);
  return JSON.parse(text) as unknown;
}

async function loadBundleFromDirectory(
  directory: string,
): Promise<ContentBundle> {
  const indexValue = await readJsonFile(directory, 'index.json');
  const index = validateIndex(indexValue);
  const values = new Map<string, unknown>();

  for (const path of getRequiredContentPaths(index)) {
    values.set(path, path === 'index.json' ? indexValue : await readJsonFile(directory, path));
  }

  return validateBundle(
    indexValue,
    (path) => {
      if (!values.has(path)) {
        throw new Error(`Missing cached content file: ${path}.`);
      }
      return values.get(path);
    },
    'cache',
  );
}

export async function loadCachedContent(): Promise<ContentBundle | null> {
  if (!ACTIVE_DIRECTORY) {
    return null;
  }

  try {
    await recoverInterruptedSwap();
    if (!(await exists(ACTIVE_DIRECTORY))) {
      return null;
    }
    return await loadBundleFromDirectory(ACTIVE_DIRECTORY);
  } catch {
    return null;
  }
}

function buildRemoteUrl(path: string): string {
  return `${CONTENT_BASE_URL.replace(/\/+$/, '')}/${path}`;
}

async function fetchText(path: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(buildRemoteUrl(path), { signal });
  if (!response.ok) {
    throw new Error(`Content request failed: ${response.status}.`);
  }
  return response.text();
}

async function writeStagedFile(path: string, text: string): Promise<void> {
  if (!STAGING_DIRECTORY) {
    throw new Error('Content cache is unavailable.');
  }

  const separatorIndex = path.lastIndexOf('/');
  if (separatorIndex >= 0) {
    await FileSystem.makeDirectoryAsync(
      `${STAGING_DIRECTORY}${path.slice(0, separatorIndex + 1)}`,
      { intermediates: true },
    );
  }
  await FileSystem.writeAsStringAsync(`${STAGING_DIRECTORY}${path}`, text);
}

async function swapStagingIntoActive(): Promise<void> {
  if (!ACTIVE_DIRECTORY || !STAGING_DIRECTORY || !BACKUP_DIRECTORY) {
    throw new Error('Content cache is unavailable.');
  }

  await removeIfPresent(BACKUP_DIRECTORY);
  const hadActiveCache = await exists(ACTIVE_DIRECTORY);

  try {
    if (hadActiveCache) {
      await FileSystem.moveAsync({ from: ACTIVE_DIRECTORY, to: BACKUP_DIRECTORY });
    }
    await FileSystem.moveAsync({ from: STAGING_DIRECTORY, to: ACTIVE_DIRECTORY });
    await removeIfPresent(BACKUP_DIRECTORY);
  } catch (error) {
    await removeIfPresent(ACTIVE_DIRECTORY);
    if (hadActiveCache && (await exists(BACKUP_DIRECTORY))) {
      await FileSystem.moveAsync({ from: BACKUP_DIRECTORY, to: ACTIVE_DIRECTORY });
    }
    throw error;
  }
}

let activeRefresh: Promise<ContentBundle | null> | null = null;

async function performRefresh(
  localVersion: string,
): Promise<ContentBundle | null> {
  if (
    !CONTENT_BASE_URL ||
    !CACHE_ROOT ||
    !ACTIVE_DIRECTORY ||
    !STAGING_DIRECTORY
  ) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONTENT_FETCH_TIMEOUT_MS);

  try {
    await recoverInterruptedSwap();
    await FileSystem.makeDirectoryAsync(STAGING_DIRECTORY, { intermediates: true });

    const indexText = await fetchText('index.json', controller.signal);
    const remoteIndex = validateIndex(JSON.parse(indexText) as unknown);
    if (!isRemoteVersionNewer(remoteIndex.contentVersion, localVersion)) {
      await removeIfPresent(STAGING_DIRECTORY);
      return null;
    }

    await writeStagedFile('index.json', indexText);
    const remainingPaths = getRequiredContentPaths(remoteIndex).filter(
      (path) => path !== 'index.json',
    );
    const downloadResults = await Promise.allSettled(
      remainingPaths.map(async (path) => {
        const text = await fetchText(path, controller.signal);
        JSON.parse(text);
        await writeStagedFile(path, text);
      }),
    );
    if (downloadResults.some(({ status }) => status === 'rejected')) {
      throw new Error('The content update is incomplete.');
    }

    const stagedBundle = await loadBundleFromDirectory(STAGING_DIRECTORY);
    await swapStagingIntoActive();
    return stagedBundle;
  } catch {
    controller.abort();
    await removeIfPresent(STAGING_DIRECTORY);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function refreshRemoteContent(
  localVersion: string,
): Promise<ContentBundle | null> {
  if (!activeRefresh) {
    activeRefresh = performRefresh(localVersion).finally(() => {
      activeRefresh = null;
    });
  }
  return activeRefresh;
}

export function selectNewestLocalContent(
  bundled: ContentBundle,
  cached: ContentBundle | null,
): ContentBundle {
  if (
    cached &&
    !isRemoteVersionNewer(
      bundled.index.contentVersion,
      cached.index.contentVersion,
    )
  ) {
    return cached;
  }
  return bundled;
}
