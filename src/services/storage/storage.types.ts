/**
 * Storage provider abstraction.
 *
 * Implementations broker access to a binary blob store (Cloudflare R2,
 * Backblaze B2, AWS S3, etc). Frontend code depends ONLY on this interface,
 * so swapping providers is a one-line import change.
 *
 * Provider implementations themselves never hold cloud credentials in the
 * browser — they call a server-side function (Supabase Edge Function) that
 * holds the secrets and returns presigned URLs.
 */

export type StorageOperation = 'upload' | 'download' | 'delete';

export interface PresignedUrl {
  /** Pre-signed URL that the browser can use directly */
  url: string;
  /** ISO timestamp when the URL expires */
  expiresAt: string;
}

export interface StorageProvider {
  /**
   * Returns a presigned URL the browser can PUT a file to.
   * The caller uploads with fetch(url, { method: 'PUT', body: file }).
   */
  getUploadUrl(storageKey: string, contentType: string): Promise<PresignedUrl>;

  /**
   * Returns a presigned URL the browser can GET (download) the file from.
   * Short TTL — generate fresh on each download click.
   */
  getDownloadUrl(storageKey: string, downloadFilename?: string): Promise<PresignedUrl>;

  /**
   * Deletes the object. Server-side, admin-gated.
   */
  deleteObject(storageKey: string): Promise<void>;
}
