import type { CadFileType } from '../utils/constants';

/**
 * Row in the `product_cad_files` table.
 * Mirrors the SQL schema in `supabase_cad_files.sql`.
 */
export interface CadFile {
  id: number;
  product_id: number;
  file_type: CadFileType;
  storage_key: string;
  original_filename: string;
  file_size_bytes: number | null;
  uploaded_at: string;
  uploaded_by: string | null;
  download_count: number;
}

/** Insert payload — DB fills id, uploaded_at, download_count. */
export interface CadFileInsert {
  product_id: number;
  file_type: CadFileType;
  storage_key: string;
  original_filename: string;
  file_size_bytes: number | null;
  uploaded_by: string | null;
}

/**
 * Edge-function response shapes.
 * The `cad-file-url` function returns a short-lived presigned URL.
 */
export interface PresignedUrlResponse {
  url: string;
  expiresAt: string;
}

export type { CadFileType };
