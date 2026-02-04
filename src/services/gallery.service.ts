// ============================================================================
// GALLERY SERVICE
// ============================================================================
// Service for managing gallery images - upload, fetch, delete
// Images are stored in ImageKit and referenced in Supabase
// ============================================================================

import { supabase } from '../utils/supabase';
import { IMAGEKIT } from '../utils/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface GalleryImage {
  id: string;
  image_url: string;
  file_id: string;
  title: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryUploadResult {
  success: boolean;
  image?: GalleryImage;
  error?: string;
}

export interface GalleryDeleteResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// FETCH GALLERY IMAGES
// ============================================================================

/**
 * Fetch all gallery images sorted by sort_order
 */
export const getGalleryImages = async (): Promise<GalleryImage[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery images:', error);
      return [];
    }

    return data as GalleryImage[];
  } catch (err) {
    console.error('Error fetching gallery images:', err);
    return [];
  }
};

// ============================================================================
// UPLOAD GALLERY IMAGE
// ============================================================================

/**
 * Upload an image to ImageKit and save reference in database
 */
export const uploadGalleryImage = async (
  file: File,
  title?: string,
  description?: string
): Promise<GalleryUploadResult> => {
  try {
    // Get current session for auth
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', IMAGEKIT.FOLDERS.GALLERY);

    // Upload to ImageKit via Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/upload-image`, {
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

    const uploadResult = await response.json();

    if (!uploadResult.success || !uploadResult.url || !uploadResult.fileId) {
      return {
        success: false,
        error: uploadResult.error || 'Upload failed - missing data',
      };
    }

    // Get max sort_order for new image
    const { data: maxOrderData } = await supabase
      .from('gallery')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (maxOrderData?.sort_order ?? -1) + 1;

    // Save to database
    const { data: galleryImage, error: dbError } = await supabase
      .from('gallery')
      .insert({
        image_url: uploadResult.url,
        file_id: uploadResult.fileId,
        title: title || null,
        description: description || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving gallery image to database:', dbError);
      // Note: Image is now in ImageKit but not in DB - may need manual cleanup
      return {
        success: false,
        error: 'Failed to save image reference to database',
      };
    }

    return {
      success: true,
      image: galleryImage as GalleryImage,
    };

  } catch (err) {
    console.error('Error uploading gallery image:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
};

// ============================================================================
// DELETE GALLERY IMAGE
// ============================================================================

/**
 * Delete an image from both ImageKit and database
 */
export const deleteGalleryImage = async (
  imageId: string,
  fileId: string
): Promise<GalleryDeleteResult> => {
  try {
    // Get current session for auth
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    // Delete from ImageKit via Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const deleteResponse = await fetch(`${supabaseUrl}/functions/v1/delete-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}));
      console.error('Failed to delete from ImageKit:', errorData);
      // Continue with database deletion even if ImageKit fails
      // Admin can manually clean up ImageKit if needed
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('gallery')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      console.error('Error deleting gallery image from database:', dbError);
      return {
        success: false,
        error: 'Failed to delete image from database',
      };
    }

    return { success: true };

  } catch (err) {
    console.error('Error deleting gallery image:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
};

// ============================================================================
// UPDATE GALLERY IMAGE
// ============================================================================

/**
 * Update gallery image title/description
 */
export const updateGalleryImage = async (
  imageId: string,
  updates: { title?: string; description?: string; sort_order?: number }
): Promise<GalleryUploadResult> => {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating gallery image:', error);
      return {
        success: false,
        error: 'Failed to update image',
      };
    }

    return {
      success: true,
      image: data as GalleryImage,
    };

  } catch (err) {
    console.error('Error updating gallery image:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
};
