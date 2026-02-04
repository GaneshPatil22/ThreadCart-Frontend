// ============================================================================
// IMAGEKIT SERVICE
// ============================================================================
// Handles image uploads to ImageKit via Supabase Edge Function
// Private key stays server-side for security
// ============================================================================

import { supabase } from '../utils/supabase';
import { IMAGEKIT } from '../utils/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  fileId?: string;
  error?: string;
}

export interface UploadOptions {
  /** Target folder in ImageKit (use IMAGEKIT.FOLDERS constants) */
  folder: string;
  /** Optional callback for upload progress */
  onProgress?: (progress: number) => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Edge function URL for image uploads */
const getUploadFunctionUrl = (): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/upload-image`;
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates file type against allowed types
 */
export function isValidImageType(file: File): boolean {
  return (IMAGEKIT.ALLOWED_TYPES as readonly string[]).includes(file.type);
}

/**
 * Validates file size against maximum allowed
 */
export function isValidImageSize(file: File): boolean {
  return file.size <= IMAGEKIT.MAX_FILE_SIZE;
}

/**
 * Validates a file for upload
 * @returns Error message if invalid, null if valid
 */
export function validateImage(file: File): string | null {
  if (!isValidImageType(file)) {
    return `Invalid file type. Allowed: ${IMAGEKIT.ALLOWED_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')}`;
  }

  if (!isValidImageSize(file)) {
    const maxSizeMB = IMAGEKIT.MAX_FILE_SIZE / (1024 * 1024);
    return `File too large. Maximum size is ${maxSizeMB}MB`;
  }

  return null;
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Uploads a single image to ImageKit via Edge Function
 * @param file - The file to upload
 * @param options - Upload options including target folder
 * @returns Upload result with URL or error
 */
export async function uploadImage(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  // Validate file before upload
  const validationError = validateImage(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    // Get current session for auth
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', options.folder);

    // Upload via Edge Function
    const response = await fetch(getUploadFunctionUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Upload failed with status ${response.status}`,
      };
    }

    const result: UploadResult = await response.json();
    return result;

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Uploads multiple images to ImageKit
 * @param files - Array of files to upload
 * @param options - Upload options including target folder
 * @returns Array of upload results
 */
export async function uploadMultipleImages(
  files: File[],
  options: UploadOptions
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], options);
    results.push(result);

    // Report progress if callback provided
    if (options.onProgress) {
      options.onProgress(((i + 1) / files.length) * 100);
    }
  }

  return results;
}

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Checks if a URL is an ImageKit URL
 */
export function isImageKitUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith(IMAGEKIT.URL_ENDPOINT) || url.includes('ik.imagekit.io');
}

// ============================================================================
// FOLDER HELPERS
// ============================================================================

/**
 * Gets the appropriate ImageKit folder for a given entity type
 */
export function getFolderForEntity(
  entityType: 'category' | 'subcategory' | 'product'
): string {
  switch (entityType) {
    case 'category':
      return IMAGEKIT.FOLDERS.CATEGORIES;
    case 'subcategory':
      return IMAGEKIT.FOLDERS.SUBCATEGORIES;
    case 'product':
      return IMAGEKIT.FOLDERS.PRODUCTS;
    default:
      return 'threadcart/uploads';
  }
}
