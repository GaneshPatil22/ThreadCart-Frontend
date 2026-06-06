import supabase from '../../utils/supabase';
import { CAD_FILES } from '../../utils/constants';
import type { PresignedUrl, StorageProvider } from './storage.types';

/**
 * Cloudflare R2 implementation of StorageProvider.
 *
 * All actual R2 calls go through the Supabase Edge Function named in
 * CAD_FILES.EDGE_FUNCTION_NAME. The function holds the R2 access key
 * and returns short-lived presigned URLs.
 */
class R2StorageProvider implements StorageProvider {
  private async invokeEdgeFunction<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke(
      CAD_FILES.EDGE_FUNCTION_NAME,
      { body }
    );

    if (error) {
      // Edge function errors arrive here — surface the user-facing message.
      throw new Error(
        error instanceof Error ? error.message : 'Storage request failed'
      );
    }
    return data as T;
  }

  async getUploadUrl(storageKey: string, contentType: string): Promise<PresignedUrl> {
    return this.invokeEdgeFunction<PresignedUrl>({
      operation: 'upload',
      storageKey,
      contentType,
    });
  }

  async getDownloadUrl(storageKey: string, downloadFilename?: string): Promise<PresignedUrl> {
    return this.invokeEdgeFunction<PresignedUrl>({
      operation: 'download',
      storageKey,
      downloadFilename,
    });
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.invokeEdgeFunction<{ ok: true }>({
      operation: 'delete',
      storageKey,
    });
  }
}

export const r2StorageProvider: StorageProvider = new R2StorageProvider();
