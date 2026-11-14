import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { ComplaintAttachment } from '@/src/complaint/types';

// Workers send many phone photos and screenshots: allow enough files, and keep
// the total under what common email providers accept once encoded (~25 MB).
export const MAX_ATTACHMENTS = 20;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 15 * 1024 * 1024;
// Photos are re-encoded as JPEG with this longest side: a photographed A4 page
// stays readable while a 4-6 MB camera photo shrinks to a few hundred KB.
const MAX_IMAGE_DIMENSION = 2000;
const IMAGE_COMPRESSION = 0.7;

const DRAFT_ATTACHMENTS_DIRECTORY = FileSystem.cacheDirectory
  ? `${FileSystem.cacheDirectory}draft-attachments/`
  : null;
const DOCUMENT_PICKER_CACHE_DIRECTORY = FileSystem.cacheDirectory
  ? `${FileSystem.cacheDirectory}DocumentPicker/`
  : null;
// Temporary copies made by the photo picker/camera and by the image compressor.
const IMAGE_CACHE_DIRECTORIES = FileSystem.cacheDirectory
  ? [`${FileSystem.cacheDirectory}ImagePicker/`, `${FileSystem.cacheDirectory}ImageManipulator/`]
  : [];
let abandonedCacheCleanup: Promise<void> | null = null;

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
// Accepted only as input: they are always converted to JPEG before attaching.
const CONVERTIBLE_IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  heic: 'image/heic',
  heif: 'image/heif',
};

type PickedAsset = {
  uri: string;
  name: string;
  mimeType: string | null | undefined;
  size?: number | null;
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
  return /^[a-z0-9_-]+\.(pdf|jpg|jpeg|png|webp|heic|heif)$/i.test(fileName);
}

function isVerifiedImageCacheUri(uri: string): boolean {
  return IMAGE_CACHE_DIRECTORIES.some((directory) => uri.startsWith(directory) &&
    /^[a-z0-9_-]+\.(jpg|jpeg|png|webp|heic|heif)$/i.test(uri.slice(directory.length)));
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
  if (!isVerifiedDocumentPickerCacheUri(uri) && !isVerifiedImageCacheUri(uri)) {
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

async function clearAbandonedPickerCache(directory: string | null): Promise<void> {
  if (!directory) {
    return;
  }
  const directoryInfo = await FileSystem.getInfoAsync(directory);
  if (!directoryInfo.exists) {
    return;
  }
  const names = await FileSystem.readDirectoryAsync(directory);
  await Promise.all(names.map((name) =>
    removeVerifiedDocumentPickerCacheUri(`${directory}${name}`),
  ));
}

export function initializeComplaintAttachmentCache(): Promise<void> {
  if (!abandonedCacheCleanup) {
    abandonedCacheCleanup = Promise.all([
      clearAbandonedDraftAttachmentCache(),
      clearAbandonedPickerCache(DOCUMENT_PICKER_CACHE_DIRECTORY),
      ...IMAGE_CACHE_DIRECTORIES.map(clearAbandonedPickerCache),
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

function isImageInput(name: string, mimeType: string | null | undefined): boolean {
  const extension = extensionFor(name);
  const declared = mimeType?.toLowerCase();
  if (!extension || !declared) return false;
  return (MIME_BY_EXTENSION[extension] === declared && declared.startsWith('image/')) ||
    CONVERTIBLE_IMAGE_MIME_BY_EXTENSION[extension] === declared;
}

function assertExistingAttachments(existing: ComplaintAttachment[]): void {
  if (existing.length >= MAX_ATTACHMENTS) {
    throw new Error('attachment.error.tooMany');
  }
  const total = existing.reduce((sum, item) => sum + item.size, 0);
  if (!Number.isFinite(total) || total < 0 || total > MAX_TOTAL_SIZE) {
    throw new Error('attachment.error.totalSize');
  }
}

async function prepareUse(existing: ComplaintAttachment[]): Promise<void> {
  if (Platform.OS === 'web') {
    throw unavailable();
  }
  try {
    await initializeComplaintAttachmentCache();
  } catch {
    throw unavailable();
  }
  assertExistingAttachments(existing);
}

async function sizeOf(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && typeof info.size === 'number' ? info.size : 0;
}

type ReleasableRef = { release?: () => void };

// Re-encodes a photo/screenshot as JPEG no larger than MAX_IMAGE_DIMENSION.
// Returns the compressor's temporary output and whether it had to be downscaled.
async function compressImage(uri: string): Promise<{ uri: string; resized: boolean }> {
  const context = ImageManipulator.manipulate(uri);
  const references: ReleasableRef[] = [context as ReleasableRef];
  try {
    let image = await context.renderAsync();
    references.push(image as ReleasableRef);
    const resized = Math.max(image.width, image.height) > MAX_IMAGE_DIMENSION;
    if (resized) {
      context.resize(image.width >= image.height
        ? { width: MAX_IMAGE_DIMENSION }
        : { height: MAX_IMAGE_DIMENSION });
      image = await context.renderAsync();
      references.push(image as ReleasableRef);
    }
    const saved = await image.saveAsync({ compress: IMAGE_COMPRESSION, format: SaveFormat.JPEG });
    return { uri: saved.uri, resized };
  } finally {
    for (const reference of references) {
      try { reference.release?.(); } catch { /* already released */ }
    }
  }
}

// The compressor writes a fresh file in the app cache for every call; whatever
// was not moved into the draft folder is deleted right away.
async function removeCompressorOutput(uri: string): Promise<void> {
  if (!FileSystem.cacheDirectory || !uri.startsWith(FileSystem.cacheDirectory) ||
    !/\.jpe?g$/i.test(uri) || isSafeOwnedUri(uri)) {
    return;
  }
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

function jpegName(name: string): string {
  const base = name.replace(/\.[a-z0-9]+$/i, '') || 'photo';
  return `${base}.jpg`;
}

async function importPickedAssets(
  existing: ComplaintAttachment[],
  assets: PickedAsset[],
): Promise<ComplaintAttachment[]> {
  const copied: ComplaintAttachment[] = [];
  const copiedUris: string[] = [];
  const temporaryUris: string[] = [];
  try {
    if (existing.length + assets.length > MAX_ATTACHMENTS) {
      throw new Error('attachment.error.tooMany');
    }
    // Only documents keep their original size; photos are reduced below.
    if (assets.some((asset) => typeof asset.size === 'number' && asset.size > MAX_FILE_SIZE &&
      !isImageInput(safeDisplayName(asset.name), asset.mimeType))) {
      throw new Error('attachment.error.tooLarge');
    }
    const directory = await ensureDraftAttachmentsDirectory();
    for (const asset of assets) {
      let name = safeDisplayName(asset.name);
      let sourceUri = asset.uri;
      let moveSource = false;
      if (isImageInput(name, asset.mimeType)) {
        const convertible = Boolean(CONVERTIBLE_IMAGE_MIME_BY_EXTENSION[extensionFor(name) ?? '']);
        let compressed: { uri: string; resized: boolean } | null = null;
        try {
          compressed = await compressImage(asset.uri);
          temporaryUris.push(compressed.uri);
        } catch {
          if (convertible) throw new Error('attachment.error.type');
        }
        if (compressed) {
          const originalSize = typeof asset.size === 'number' && asset.size > 0
            ? asset.size : await sizeOf(asset.uri);
          const compressedSize = await sizeOf(compressed.uri);
          // A small, already-efficient image is kept as it is.
          const keepOriginal = !convertible && !compressed.resized && originalSize > 0 &&
            originalSize <= MAX_FILE_SIZE && originalSize <= compressedSize;
          if (!keepOriginal && compressedSize > 0) {
            name = jpegName(name);
            sourceUri = compressed.uri;
            moveSource = true;
          }
        }
      }
      const { extension, mimeType } = assertAllowedType(name, sourceUri === asset.uri ? asset.mimeType : 'image/jpeg');
      const destination = await nextStorageUri(directory, extension);
      copiedUris.push(destination);
      if (moveSource) {
        await FileSystem.moveAsync({ from: sourceUri, to: destination });
      } else {
        await FileSystem.copyAsync({ from: sourceUri, to: destination });
      }
      const size = await sizeOf(destination);
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
    // Picker and compressor copies are temporary; a failed cleanup is retried by
    // the restart sweep. Never discard valid picked files for it.
    await Promise.all([
      ...assets.map((asset) => removeVerifiedDocumentPickerCacheUri(asset.uri).catch(() => {})),
      ...temporaryUris.map((uri) => removeCompressorOutput(uri).catch(() => {})),
    ]);
  }
}

// Documents (PDF) or images, through the system file picker.
export async function pickComplaintAttachments(
  existing: ComplaintAttachment[],
): Promise<ComplaintAttachment[]> {
  await prepareUse(existing);
  const result = await DocumentPicker.getDocumentAsync({
    multiple: true,
    copyToCacheDirectory: true,
    type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  });
  if (result.canceled) {
    return [];
  }
  return importPickedAssets(existing, result.assets.map((asset) => ({
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType,
    size: asset.size,
  })));
}

function imagePickerAssets(assets: ImagePicker.ImagePickerAsset[]): PickedAsset[] {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, '');
  return assets.map((asset, index) => {
    const uriName = asset.uri.replace(/^.*[\\/]/, '').replace(/[?#].*$/, '');
    const name = asset.fileName?.trim() || uriName || `photo-${stamp}-${index + 1}.jpg`;
    const extension = extensionFor(name);
    const mimeType = asset.mimeType ??
      (extension ? MIME_BY_EXTENSION[extension] ?? CONVERTIBLE_IMAGE_MIME_BY_EXTENSION[extension] : undefined);
    return { uri: asset.uri, name, mimeType, size: asset.fileSize };
  });
}

// Several photos or screenshots at once, through the system photo picker.
export async function pickComplaintPhotos(
  existing: ComplaintAttachment[],
): Promise<ComplaintAttachment[]> {
  await prepareUse(existing);
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: MAX_ATTACHMENTS - existing.length,
    quality: 1,
    exif: false,
  });
  if (result.canceled || !result.assets?.length) {
    return [];
  }
  return importPickedAssets(existing, imagePickerAssets(result.assets));
}

// A new photo, e.g. of a paper contract.
export async function takeComplaintPhoto(
  existing: ComplaintAttachment[],
): Promise<ComplaintAttachment[]> {
  await prepareUse(existing);
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('attachment.error.camera');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  });
  if (result.canceled || !result.assets?.length) {
    return [];
  }
  return importPickedAssets(existing, imagePickerAssets(result.assets));
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

// "Delete everything": the app's own temporary folders for complaint files —
// draft copies, picker/camera/compressor copies and expo-print temporary PDFs.
export async function clearAllComplaintCaches(): Promise<void> {
  if (!FileSystem.cacheDirectory) return;
  const directories = [
    DRAFT_ATTACHMENTS_DIRECTORY,
    DOCUMENT_PICKER_CACHE_DIRECTORY,
    ...IMAGE_CACHE_DIRECTORIES,
    `${FileSystem.cacheDirectory}Print/`,
  ].filter((directory): directory is string => Boolean(directory));
  await Promise.all(directories.map((directory) =>
    FileSystem.deleteAsync(directory, { idempotent: true })));
}

export function isOwnedDraftAttachmentUri(uri: string): boolean {
  return isSafeOwnedUri(uri);
}
