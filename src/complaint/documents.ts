import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import {
  clearAllComplaintCaches,
  isOwnedDraftAttachmentUri,
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
} from '@/src/complaint/attachments';
import type {
  ComplaintAttachment,
  StoredComplaintDocument,
} from '@/src/complaint/types';

const DOCUMENTS_DIRECTORY = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}complaints/`
  : null;
const METADATA_FILE_NAME = 'attachments.json';
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp',
};

type StoredAttachmentMetadata = {
  id: string;
  fileName: string;
  name: string;
  mimeType: string;
  size: number;
};
type AttachmentMetadataFile = { version: 1; attachments: StoredAttachmentMetadata[] };

function ensureStorageAvailable(): string {
  if (!DOCUMENTS_DIRECTORY) throw new Error('Complaint document storage is unavailable.');
  return DOCUMENTS_DIRECTORY;
}

function isSafePdfFileName(fileName: string): boolean {
  return /^[a-z0-9_-]+(?:_[0-9]+)?\.pdf$/i.test(fileName);
}

function documentUriFor(fileName: string): string {
  return `${ensureStorageAvailable()}${fileName}`;
}

function companionDirectoryFor(fileName: string): string {
  if (!isSafePdfFileName(fileName)) throw new Error('Invalid complaint document file name.');
  return `${ensureStorageAvailable()}${fileName.slice(0, -4)}.attachments/`;
}

function extensionFor(name: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match?.[1]?.toLowerCase() ?? null;
}

function safeDisplayName(name: string): string {
  return name.replace(/^.*[\\/]/, '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
}

function attachmentStorageName(index: number, extension: string): string {
  return `file-${index + 1}.${extension}`;
}

function assertAttachmentShape(attachment: ComplaintAttachment): { extension: string; name: string } {
  const name = safeDisplayName(attachment.name);
  const extension = extensionFor(name);
  if (
    !isOwnedDraftAttachmentUri(attachment.uri) ||
    !/^[a-z0-9-]{8,120}$/i.test(attachment.id) ||
    !extension || MIME_BY_EXTENSION[extension] !== attachment.mimeType ||
    !Number.isFinite(attachment.size) || attachment.size <= 0
  ) {
    throw new Error('Invalid complaint attachment.');
  }
  return { extension, name };
}

async function ensureDocumentsDirectory(): Promise<string> {
  const directory = ensureStorageAvailable();
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  return directory;
}

async function nextAvailableUri(directory: string, baseName: string): Promise<{ uri: string; fileName: string }> {
  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const numberedSuffix = suffix === 1 ? '' : `_${suffix}`;
    const fileName = `${baseName}${numberedSuffix}.pdf`;
    const uri = `${directory}${fileName}`;
    if (
      !(await FileSystem.getInfoAsync(uri)).exists &&
      !(await FileSystem.getInfoAsync(companionDirectoryFor(fileName))).exists
    ) {
      return { uri, fileName };
    }
  }
  throw new Error('Could not create a unique complaint file name.');
}

async function removeOwnedPersistedPath(uri: string): Promise<void> {
  if (!DOCUMENTS_DIRECTORY || !uri.startsWith(DOCUMENTS_DIRECTORY)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

async function readAttachmentsForDocument(fileName: string): Promise<ComplaintAttachment[]> {
  const companionDirectory = companionDirectoryFor(fileName);
  if (!(await FileSystem.getInfoAsync(companionDirectory)).exists) {
    // PDFs saved before attachments deliberately have no companion directory.
    return [];
  }
  const metadataUri = `${companionDirectory}${METADATA_FILE_NAME}`;
  let parsed: unknown;
  try {
    parsed = JSON.parse(await FileSystem.readAsStringAsync(metadataUri));
  } catch {
    throw new Error('Stored complaint attachments are missing or corrupted.');
  }
  if (
    !parsed || typeof parsed !== 'object' ||
    (parsed as AttachmentMetadataFile).version !== 1 ||
    !Array.isArray((parsed as AttachmentMetadataFile).attachments)
  ) {
    throw new Error('Stored complaint attachments are missing or corrupted.');
  }

  const metadata = (parsed as AttachmentMetadataFile).attachments;
  if (metadata.length > MAX_ATTACHMENTS) {
    throw new Error('Stored complaint attachments are missing or corrupted.');
  }
  const ids = new Set(metadata.map((item) => item.id));
  const storageNames = new Set(metadata.map((item) => item.fileName));
  if (ids.size !== metadata.length || storageNames.size !== metadata.length) {
    throw new Error('Stored complaint attachments are missing or corrupted.');
  }

  return Promise.all(metadata.map(async (item) => {
    const displayName = typeof item.name === 'string' ? safeDisplayName(item.name) : '';
    const extension = typeof item.fileName === 'string' ? extensionFor(item.fileName) : null;
    const storageIndex = typeof item.fileName === 'string'
      ? Number(/^file-([1-9][0-9]?)\.(pdf|jpg|jpeg|png|webp)$/i.exec(item.fileName)?.[1] ?? 0) : 0;
    if (
      !/^[a-z0-9-]{8,120}$/i.test(item.id) ||
      !item.fileName || storageIndex < 1 || storageIndex > MAX_ATTACHMENTS ||
      !extension || MIME_BY_EXTENSION[extension] !== item.mimeType ||
      !displayName || displayName !== item.name ||
      !Number.isFinite(item.size) || item.size <= 0
    ) {
      throw new Error('Stored complaint attachments are missing or corrupted.');
    }
    const uri = `${companionDirectory}${item.fileName}`;
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.size !== item.size) {
      throw new Error('Stored complaint attachments are missing or corrupted.');
    }
    return { id: item.id, uri, name: item.name, mimeType: item.mimeType, size: item.size };
  }));
}

function fileNameFromManagedDocumentUri(uri: string): string | null {
  if (!DOCUMENTS_DIRECTORY || !uri.startsWith(DOCUMENTS_DIRECTORY)) return null;
  const fileName = uri.slice(DOCUMENTS_DIRECTORY.length);
  return isSafePdfFileName(fileName) && uri === documentUriFor(fileName) ? fileName : null;
}

export async function assertComplaintFilesAvailable(
  pdfUri: string,
  attachments: ComplaintAttachment[],
): Promise<void> {
  try {
    const fileName = fileNameFromManagedDocumentUri(pdfUri);
    if (!fileName || !(await FileSystem.getInfoAsync(pdfUri)).exists) {
      throw new Error('missing');
    }
    const savedAttachments = await readAttachmentsForDocument(fileName);
    if (savedAttachments.length !== attachments.length) {
      throw new Error('missing');
    }
    const savedById = new Map(savedAttachments.map((attachment) => [attachment.id, attachment]));
    for (const attachment of attachments) {
      const saved = savedById.get(attachment.id);
      if (
        !saved || saved.uri !== attachment.uri || saved.name !== attachment.name ||
        saved.mimeType !== attachment.mimeType || saved.size !== attachment.size
      ) {
        throw new Error('missing');
      }
    }
  } catch {
    throw new Error('attachment.error.missing');
  }
}

export async function persistGeneratedPdf(
  temporaryUri: string,
  categoryId: string,
  isoDate: string,
  attachments: ComplaintAttachment[] = [],
): Promise<{ uri: string; fileName: string; attachments: ComplaintAttachment[] }> {
  const directory = await ensureDocumentsDirectory();
  const safeCategory = categoryId.replace(/[^a-z0-9_-]/gi, '_');
  const safeDate = isoDate.slice(0, 10).replace(/[^0-9-]/g, '');
  const destination = await nextAvailableUri(directory, `plangere_${safeCategory}_${safeDate}`);
  const companionDirectory = companionDirectoryFor(destination.fileName);
  let pdfMoved = false;
  let companionDirectoryCreated = false;

  try {
    if (attachments.length > MAX_ATTACHMENTS) {
      throw new Error('Too many complaint attachments.');
    }
    const totalAttachmentSize = attachments.reduce((sum, item) => sum + item.size, 0);
    if (!Number.isFinite(totalAttachmentSize) || totalAttachmentSize > MAX_TOTAL_SIZE) {
      throw new Error('Complaint attachments exceed the allowed total size.');
    }
    for (const attachment of attachments) {
      assertAttachmentShape(attachment);
      if (attachment.size > MAX_FILE_SIZE) {
        throw new Error('Complaint attachment exceeds the allowed file size.');
      }
    }
    await FileSystem.moveAsync({ from: temporaryUri, to: destination.uri });
    pdfMoved = true;
    if (attachments.length === 0) return { ...destination, attachments: [] };

    await FileSystem.makeDirectoryAsync(companionDirectory, { intermediates: false });
    companionDirectoryCreated = true;
    const storedAttachments: ComplaintAttachment[] = [];
    const metadata: StoredAttachmentMetadata[] = [];
    for (const [index, attachment] of attachments.entries()) {
      const { extension, name } = assertAttachmentShape(attachment);
      if (attachment.size > MAX_FILE_SIZE) {
        throw new Error('Complaint attachment exceeds the allowed file size.');
      }
      const fileName = attachmentStorageName(index, extension);
      const uri = `${companionDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: attachment.uri, to: uri });
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists || info.size !== attachment.size) {
        throw new Error('Copied complaint attachment could not be verified.');
      }
      storedAttachments.push({ ...attachment, uri, name });
      metadata.push({ id: attachment.id, fileName, name, mimeType: attachment.mimeType, size: attachment.size });
    }
    await FileSystem.writeAsStringAsync(
      `${companionDirectory}${METADATA_FILE_NAME}`,
      JSON.stringify({ version: 1, attachments: metadata } satisfies AttachmentMetadataFile),
    );
    return { ...destination, attachments: storedAttachments };
  } catch (error) {
    if (companionDirectoryCreated) await removeOwnedPersistedPath(companionDirectory);
    if (pdfMoved) await removeOwnedPersistedPath(destination.uri);
    throw error;
  }
}

export async function listComplaintDocuments(): Promise<StoredComplaintDocument[]> {
  if (!DOCUMENTS_DIRECTORY || !(await FileSystem.getInfoAsync(DOCUMENTS_DIRECTORY)).exists) return [];
  const names = (await FileSystem.readDirectoryAsync(DOCUMENTS_DIRECTORY))
    .filter(isSafePdfFileName).sort().reverse();
  return Promise.all(names.map(async (fileName) => {
    const uri = documentUriFor(fileName);
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return {
      uri,
      fileName,
      createdAt: fileInfo.exists && typeof fileInfo.modificationTime === 'number'
        ? fileInfo.modificationTime * 1000 : 0,
      attachments: await readAttachmentsForDocument(fileName),
    };
  }));
}

async function shareFile(uri: string, mimeType: string, dialogTitle: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable.');
  await Sharing.shareAsync(uri, { dialogTitle, mimeType });
}

export async function shareComplaintDocument(uri: string): Promise<void> {
  // A PDF is intentionally shared by itself; its evidence companions remain separate files.
  await shareFile(uri, 'application/pdf', 'PDF');
}

export async function openComplaintDocument(uri: string): Promise<void> {
  if (Platform.OS === 'android') {
    const contentUri = await FileSystem.getContentUriAsync(uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri, type: 'application/pdf', flags: 1,
    });
    return;
  }
  await shareComplaintDocument(uri);
}

export async function shareComplaintAttachment(attachment: ComplaintAttachment): Promise<void> {
  await shareFile(attachment.uri, attachment.mimeType, attachment.name);
}

export async function openComplaintAttachment(attachment: ComplaintAttachment): Promise<void> {
  if (Platform.OS === 'android') {
    const contentUri = await FileSystem.getContentUriAsync(attachment.uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri, type: attachment.mimeType, flags: 1,
    });
    return;
  }
  await shareComplaintAttachment(attachment);
}

export async function deleteComplaintDocument(uri: string): Promise<void> {
  if (!DOCUMENTS_DIRECTORY || !uri.startsWith(DOCUMENTS_DIRECTORY)) {
    throw new Error('Refusing to delete a document outside app storage.');
  }
  const fileName = uri.slice(DOCUMENTS_DIRECTORY.length);
  if (!isSafePdfFileName(fileName)) throw new Error('Refusing to delete an invalid complaint document.');
  await FileSystem.deleteAsync(uri, { idempotent: true });
  // This deterministic direct child is the only companion directory this PDF owns.
  await FileSystem.deleteAsync(companionDirectoryFor(fileName), { idempotent: true });
}

// "Delete everything": every saved complaint PDF with its attachments, and all
// temporary complaint files. Originals elsewhere on the phone are untouched.
export async function deleteAllComplaintData(): Promise<void> {
  const results = await Promise.allSettled([
    DOCUMENTS_DIRECTORY
      ? FileSystem.deleteAsync(DOCUMENTS_DIRECTORY, { idempotent: true })
      : Promise.resolve(),
    clearAllComplaintCaches(),
  ]);
  if (results.some((result) => result.status === 'rejected')) {
    throw new Error('Not all complaint data could be deleted.');
  }
}
