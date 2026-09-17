import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { ComplaintAttachment } from '@/src/complaint/types';

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;

const DRAFT_ATTACHMENTS_DIRECTORY = FileSystem.cacheDirectory
  ? `${FileSystem.cacheDirectory}draft-attachments/`
  : null;
const DOCUMENT_PICKER_CACHE_DIRECTORY = FileSystem.cacheDirectory
  ? `${FileSystem.cacheDirectory}DocumentPicker/`
  : null;
let abandonedCacheCleanup: Promise<void> | null = null;

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function unavailable(): Error {
  return new Error('attachment.error.unavailable');
}

function isSafeOwnedUri(uri: string): boolean {
  if (!DRAFT_ATTACHMENTS_DIRECTORY || !uri.startsWith(DRAFT_ATTACHMENTS_DIRECTORY)) {
    return false;
  }
  const fileName = uri.slice(DRAFT_ATTACHMENTS_DIRECTORY.length);
  return /^attachment-[a-z0-9-]+\.(pdf|jpg|jpeg|png|webp)$/i.test(fileName);
}

function isVerifiedDocumentPickerCacheUri(uri: string): boolean {
  if (!DOCUMENT_PICKER_CACHE_DIRECTORY || !uri.startsWith(DOCUMENT_PICKER_CACHE_DIRECTORY)) {
    return false;
  }
  const fileName = uri.slice(DOCUMENT_PICKER_CACHE_DIRECTORY.length);
  return /^[a-z0-9_-]+\.(pdf|jpg|jpeg|png|webp)$/i.test(fileName);
}

function extensionFor(name: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match?.[1]?.toLowerCase() ?? null;
}

function safeDisplayName(name: string): string {
  const basename = name.replace(/^.*[\\/]/, '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return basename || 'attachment';
}

function storageName(extension: string): string {
  const random = Math.random().toString(36).slice(2, 12);
  return `attachment-${Date.now().toString(36)}-${random}.${extension}`;
}

async function nextStorageUri(directory: string, extension: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const uri = `${directory}${storageName(extension)}`;
    if (!(await FileSystem.getInfoAsync(uri)).exists) {
      return uri;
    }
  }
  throw new Error('attachment.error.selection');
}

async function ensureDraftAttachmentsDirectory(): Promise<string> {
  if (!DRAFT_ATTACHMENTS_DIRECTORY) {
    throw unavailable();
  }
  await FileSystem.makeDirectoryAsync(DRAFT_ATTACHMENTS_DIRECTORY, {
    intermediates: true,
  });
  return DRAFT_ATTACHMENTS_DIRECTORY;
}

async function removeOwnedUri(uri: string): Promise<void> {
  if (!isSafeOwnedUri(uri)) {
    return;
  }
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

async function removeVerifiedDocumentPickerCacheUri(uri: string): Promise<void> {
  if (!isVerifiedDocumentPickerCacheUri(uri)) {
    return;
  }
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && typeof info.size === 'number') {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

async function clearAbandonedDraftAttachmentCache(): Promise<void> {
  if (!DRAFT_ATTACHMENTS_DIRECTORY) {
    return;
  }
  const directoryInfo = await FileSystem.getInfoAsync(DRAFT_ATTACHMENTS_DIRECTORY);
  if (!directoryInfo.exists) {
    return;
  }
  const names = await FileSystem.readDirectoryAsync(DRAFT_ATTACHMENTS_DIRECTORY);
  await Promise.all(names.map(async (name) => {
    const uri = `${DRAFT_ATTACHMENTS_DIRECTORY}${name}`;
    const info = await FileSystem.getInfoAsync(uri);
    // A deterministic, direct-child file only. Unknown cache entries stay untouched.
    if (isSafeOwnedUri(uri) && info.exists && typeof info.size === 'number') {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  }));
}

async function clearAbandonedDocumentPickerCache(): Promise<void> {
  if (!DOCUMENT_PICKER_CACHE_DIRECTORY) {
    return;
  }
  const directoryInfo = await FileSystem.getInfoAsync(DOCUMENT_PICKER_CACHE_DIRECTORY);
  if (!directoryInfo.exists) {
    return;
  }
  const names = await FileSystem.readDirectoryAsync(DOCUMENT_PICKER_CACHE_DIRECTORY);
  await Promise.all(names.map((name) =>
    removeVerifiedDocumentPickerCacheUri(`${DOCUMENT_PICKER_CACHE_DIRECTORY}${name}`),
  ));
}

export function initializeComplaintAttachmentCache(): Promise<void> {
  if (!abandonedCacheCleanup) {
    abandonedCacheCleanup = Promise.all([
      clearAbandonedDraftAttachmentCache(),
      clearAbandonedDocumentPickerCache(),
    ]).then(() => undefined).catch((error) => {
      abandonedCacheCleanup = null;
      throw error;
    });
  }
  return abandonedCacheCleanup;
}

function assertAllowedType(name: string, mimeType: string | null | undefined): {
  extension: string;
  mimeType: string;
} {
  const extension = extensionFor(name);
  if (!extension || !mimeType || MIME_BY_EXTENSION[extension] !== mimeType.toLowerCase()) {
    throw new Error('attachment.error.type');
  }
  return { extension, mimeType: MIME_BY_EXTENSION[extension] };
}

function assertExistingAttachments(existing: ComplaintAttachment[]): void {
  if (existing.length > MAX_ATTACHMENTS) {
    throw new Error('attachment.error.tooMany');
  }
  const total = existing.reduce((sum, item) => sum + item.size, 0);
  if (!Number.isFinite(total) || total < 0 || total > MAX_TOTAL_SIZE) {
    throw new Error('attachment.error.totalSize');
  }
}

export async function pickComplaintAttachments(
  existing: ComplaintAttachment[],
): Promise<ComplaintAttachment[]> {
  if (Platform.OS === 'web') {
    throw unavailable();
  }
  try {
    await initializeComplaintAttachmentCache();
  } catch {
    throw unavailable();
  }
  assertExistingAttachments(existing);

  const result = await DocumentPicker.getDocumentAsync({
    multiple: true,
    copyToCacheDirectory: true,
    type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  });
  if (result.canceled) {
    return [];
  }
  const copied: ComplaintAttachment[] = [];
  const copiedUris: string[] = [];
  try {
    if (existing.length + result.assets.length > MAX_ATTACHMENTS) {
      throw new Error('attachment.error.tooMany');
    }
    if (result.assets.some((asset) => typeof asset.size === 'number' && asset.size > MAX_FILE_SIZE)) {
      throw new Error('attachment.error.tooLarge');
    }
    const directory = await ensureDraftAttachmentsDirectory();
    for (const asset of result.assets) {
      const name = safeDisplayName(asset.name);
      const { extension, mimeType } = assertAllowedType(name, asset.mimeType);
      const destination = await nextStorageUri(directory, extension);
      copiedUris.push(destination);
      await FileSystem.copyAsync({ from: asset.uri, to: destination });
      const info = await FileSystem.getInfoAsync(destination);
      const size = info.exists && typeof info.size === 'number' ? info.size : 0;
      if (!Number.isFinite(size) || size <= 0) {
        throw new Error('attachment.error.selection');
      }
      if (size > MAX_FILE_SIZE) {
        throw new Error('attachment.error.tooLarge');
      }
      copied.push({
        id: `attachment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
        uri: destination,
        name,
        mimeType,
        size,
      });
    }

    const total = [...existing, ...copied].reduce((sum, item) => sum + item.size, 0);
    if (!Number.isFinite(total) || total > MAX_TOTAL_SIZE) {
      throw new Error('attachment.error.totalSize');
    }
    return copied;
  } catch (error) {
    await Promise.all(copiedUris.map((uri) => removeOwnedUri(uri).catch(() => {})));
    throw error;
  } finally {
    // Also covers an oversized selection and a failure to create the draft folder.
    // A failed cleanup is retried by the restart sweep; never discard valid picked files for it.
    await Promise.all(result.assets.map((asset) => removeVerifiedDocumentPickerCacheUri(asset.uri).catch(() => {})));
  }
}

export async function removeDraftAttachment(
  attachment: ComplaintAttachment,
): Promise<void> {
  await removeOwnedUri(attachment.uri);
}

export async function clearDraftAttachments(
  attachments: ComplaintAttachment[],
): Promise<void> {
  await Promise.all(attachments.map((attachment) => removeOwnedUri(attachment.uri)));
}

export function isOwnedDraftAttachmentUri(uri: string): boolean {
  return isSafeOwnedUri(uri);
}
