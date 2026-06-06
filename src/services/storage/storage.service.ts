/**
 * Public storage API used by application code.
 *
 * Components import from THIS file, never from a specific provider. To swap
 * providers (e.g. R2 → Backblaze), change the import on the line below and
 * implement a new provider. No component code changes.
 */

import { r2StorageProvider } from './r2-storage.provider';
import type { PresignedUrl, StorageProvider } from './storage.types';

const provider: StorageProvider = r2StorageProvider;

/** Upload a single file via a presigned PUT URL. */
export const uploadFile = async (
  storageKey: string,
  file: File
): Promise<void> => {
  const { url } = await provider.getUploadUrl(storageKey, file.type || 'application/octet-stream');

  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
  }
};

/** Get a short-lived download URL. */
export const getDownloadUrl = (
  storageKey: string,
  downloadFilename?: string
): Promise<PresignedUrl> => provider.getDownloadUrl(storageKey, downloadFilename);

/** Delete an object. Admin-gated server-side. */
export const deleteFile = (storageKey: string): Promise<void> =>
  provider.deleteObject(storageKey);

export type { PresignedUrl };
