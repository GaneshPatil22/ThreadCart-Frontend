/**
 * CRUD operations on the `product_cad_files` table.
 *
 * This module is a thin DB layer. It does NOT touch R2 — file upload/download
 * goes through src/services/storage/storage.service.ts.
 *
 * Typical flow:
 *  - Admin upload:    uploadFile() → addCadFile()
 *  - Admin delete:    deleteCadFile() → storage.deleteFile()
 *  - User download:   getDownloadUrl() → incrementDownloadCount()
 */

import supabase from '../utils/supabase';
import {
  buildCadStorageKey,
  CAD_FILES,
  type CadFileType,
} from '../utils/constants';
import * as storage from './storage/storage.service';
import type { CadFile, CadFileInsert } from '../types/cad-files.types';

const TABLE = 'product_cad_files';

/** Fetch all CAD files attached to a product. */
export const getCadFilesForProduct = async (
  productId: number
): Promise<CadFile[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('product_id', productId);

  if (error) {
    console.error('getCadFilesForProduct:', error);
    return [];
  }
  return (data ?? []) as CadFile[];
};

/** Fetch CAD files for many products in one query (used in product list). */
export const getCadFilesForProducts = async (
  productIds: number[]
): Promise<Map<number, CadFile[]>> => {
  const grouped = new Map<number, CadFile[]>();
  if (productIds.length === 0) return grouped;

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .in('product_id', productIds);

  if (error) {
    console.error('getCadFilesForProducts:', error);
    return grouped;
  }

  for (const row of (data ?? []) as CadFile[]) {
    const list = grouped.get(row.product_id) ?? [];
    list.push(row);
    grouped.set(row.product_id, list);
  }
  return grouped;
};

interface UploadCadFileParams {
  productId: number;
  fileType: CadFileType;
  file: File;
}

/**
 * Full admin upload flow:
 *  1. Validate file (extension + size)
 *  2. Upload to R2 via presigned URL
 *  3. Upsert DB row (replaces if same product+type exists)
 */
export const uploadCadFile = async ({
  productId,
  fileType,
  file,
}: UploadCadFileParams): Promise<{ success: true; cadFile: CadFile } | { success: false; message: string }> => {
  const typeConfig = CAD_FILES.TYPES[fileType];

  // Validate extension
  const lower = file.name.toLowerCase();
  const validExt = typeConfig.acceptExtensions.some((ext) => lower.endsWith(ext));
  if (!validExt) {
    return {
      success: false,
      message: `Invalid extension. Expected: ${typeConfig.acceptExtensions.join(', ')}`,
    };
  }

  // Validate size
  const maxBytes = typeConfig.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      success: false,
      message: `File too large. Max ${typeConfig.maxSizeMB}MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  const storageKey = buildCadStorageKey(productId, fileType, file.name);

  try {
    await storage.uploadFile(storageKey, file);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Upload failed',
    };
  }

  // Get current user id for audit
  const { data: userData } = await supabase.auth.getUser();

  const payload: CadFileInsert = {
    product_id: productId,
    file_type: fileType,
    storage_key: storageKey,
    original_filename: file.name,
    file_size_bytes: file.size,
    uploaded_by: userData.user?.id ?? null,
  };

  // Upsert by (product_id, file_type) to replace existing entry.
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'product_id,file_type' })
    .select()
    .single();

  if (error || !data) {
    // Best-effort cleanup of orphaned R2 object (don't fail the whole call if cleanup fails)
    storage.deleteFile(storageKey).catch(() => {});
    return {
      success: false,
      message: error?.message ?? 'Failed to save file metadata',
    };
  }

  return { success: true, cadFile: data as CadFile };
};

/**
 * Delete a CAD file (admin only).
 * Removes from R2 first, then DB. If R2 delete fails, DB row remains so admin can retry.
 */
export const deleteCadFile = async (
  cadFileId: number
): Promise<{ success: boolean; message?: string }> => {
  // Fetch the row first so we know the storage_key
  const { data: row, error: fetchErr } = await supabase
    .from(TABLE)
    .select('storage_key')
    .eq('id', cadFileId)
    .single();

  if (fetchErr || !row) {
    return { success: false, message: fetchErr?.message ?? 'CAD file not found' };
  }

  try {
    await storage.deleteFile(row.storage_key as string);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to delete file from storage',
    };
  }

  const { error: deleteErr } = await supabase.from(TABLE).delete().eq('id', cadFileId);
  if (deleteErr) {
    return { success: false, message: deleteErr.message };
  }
  return { success: true };
};

/**
 * Get a short-lived download URL for a CAD file and increment the counter.
 * Caller is expected to be authenticated (the edge function enforces this).
 */
export const getCadFileDownloadUrl = async (
  cadFile: CadFile
): Promise<{ success: true; url: string } | { success: false; message: string }> => {
  try {
    const { url } = await storage.getDownloadUrl(
      cadFile.storage_key,
      cadFile.original_filename
    );

    // Fire-and-forget counter bump
    supabase.rpc('increment_cad_download_count', { p_cad_file_id: cadFile.id }).then(
      ({ error }) => {
        if (error) console.warn('increment_cad_download_count failed:', error.message);
      }
    );

    return { success: true, url };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to get download URL',
    };
  }
};
