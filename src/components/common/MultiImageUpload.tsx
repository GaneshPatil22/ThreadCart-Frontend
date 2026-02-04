// ============================================================================
// MULTI-IMAGE UPLOAD COMPONENT
// ============================================================================
// Reusable multiple image upload with drag-and-drop, reordering, and ImageKit integration
// Used for Products which can have multiple images
// ============================================================================

import { useState, useRef, useCallback } from 'react';
import { uploadImage, validateImage } from '../../services/imagekit.service';
import { getDisplayUrl, handleImageError } from '../../utils/imageUtils';
import { IMAGEKIT } from '../../utils/constants';

// ============================================================================
// TYPES
// ============================================================================

interface MultiImageUploadProps {
  /** Current image URLs array */
  value: string[];
  /** Callback when images change */
  onChange: (urls: string[]) => void;
  /** Target folder in ImageKit */
  folder: string;
  /** Label for the upload field */
  label?: string;
  /** Minimum number of images required */
  minImages?: number;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom class name for the container */
  className?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const UploadIcon = () => (
  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <svg className={`animate-spin ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const RemoveIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ============================================================================
// IMAGE THUMBNAIL COMPONENT
// ============================================================================

interface ImageThumbnailProps {
  url: string;
  index: number;
  isUploading?: boolean;
  disabled?: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const ImageThumbnail = ({
  url,
  index,
  isUploading,
  disabled,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: ImageThumbnailProps) => {
  const displayUrl = getDisplayUrl(url);

  return (
    <div className="relative group">
      {/* Image */}
      <div className={`
        w-24 h-24 rounded-lg border-2 overflow-hidden
        ${isUploading ? 'border-primary animate-pulse' : 'border-gray-200'}
      `}>
        {isUploading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <img
            src={displayUrl}
            alt={`Image ${index + 1}`}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        )}
      </div>

      {/* Index Badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
        {index + 1}
      </div>

      {/* Action Buttons (visible on hover) */}
      {!disabled && !isUploading && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
          {/* Move Up */}
          {canMoveUp && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              className="p-1.5 bg-white/90 rounded hover:bg-white text-gray-700"
              title="Move left"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Move Down */}
          {canMoveDown && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              className="p-1.5 bg-white/90 rounded hover:bg-white text-gray-700"
              title="Move right"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Remove */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 bg-red-500 rounded hover:bg-red-600 text-white"
            title="Remove"
          >
            <RemoveIcon />
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MultiImageUpload = ({
  value = [],
  onChange,
  folder,
  label = 'Images',
  minImages = 0,
  maxImages = 10,
  disabled = false,
  className = '',
}: MultiImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingIndexes, setUploadingIndexes] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = value.length < maxImages;

  // Handle file upload
  const handleFiles = useCallback(async (files: FileList) => {
    const filesToUpload = Array.from(files).slice(0, maxImages - value.length);

    if (filesToUpload.length === 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setError(null);

    // Create placeholder entries for uploading files
    const startIndex = value.length;
    const placeholders = filesToUpload.map(() => '');
    const newUrls = [...value, ...placeholders];
    onChange(newUrls);

    // Track uploading indexes
    const newUploadingIndexes = new Set(uploadingIndexes);
    filesToUpload.forEach((_, i) => newUploadingIndexes.add(startIndex + i));
    setUploadingIndexes(newUploadingIndexes);

    // Upload files sequentially
    const uploadedUrls = [...value];
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const uploadIndex = startIndex + i;

      // Validate
      const validationError = validateImage(file);
      if (validationError) {
        setError(`File ${file.name}: ${validationError}`);
        continue;
      }

      try {
        const result = await uploadImage(file, { folder });

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        } else {
          setError(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (err) {
        setError(`Failed to upload ${file.name}`);
      }

      // Remove from uploading set
      newUploadingIndexes.delete(uploadIndex);
      setUploadingIndexes(new Set(newUploadingIndexes));
    }

    // Update with final URLs (filter out empty placeholders)
    onChange(uploadedUrls.filter(url => url !== ''));
  }, [value, onChange, folder, maxImages, uploadingIndexes]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && canAddMore) setIsDragging(true);
  }, [disabled, canAddMore]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || !canAddMore) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, canAddMore, handleFiles]);

  // Handle click to upload
  const handleAddClick = () => {
    if (!disabled && canAddMore && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    e.target.value = '';
  };

  // Handle remove image
  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  // Handle reorder
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newUrls = [...value];
    [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
    onChange(newUrls);
  };

  const handleMoveDown = (index: number) => {
    if (index === value.length - 1) return;
    const newUrls = [...value];
    [newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]];
    onChange(newUrls);
  };

  const maxSizeMB = IMAGEKIT.MAX_FILE_SIZE / (1024 * 1024);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and Counter */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {minImages > 0 && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className="text-xs text-gray-500">
          {value.length} / {maxImages} images
        </span>
      </div>

      {/* Images Grid */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          flex flex-wrap gap-3 p-4 rounded-lg border-2 border-dashed transition-colors min-h-[120px]
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200'}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGEKIT.ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
          disabled={disabled}
          multiple
          className="hidden"
        />

        {/* Existing Images */}
        {value.map((url, index) => (
          <ImageThumbnail
            key={`${url}-${index}`}
            url={url}
            index={index}
            isUploading={uploadingIndexes.has(index)}
            disabled={disabled}
            onRemove={() => handleRemove(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            canMoveUp={index > 0}
            canMoveDown={index < value.length - 1}
          />
        ))}

        {/* Add New Button */}
        {canAddMore && !disabled && (
          <button
            type="button"
            onClick={handleAddClick}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1"
          >
            <UploadIcon />
            <span className="text-xs text-gray-500">Add</span>
          </button>
        )}

        {/* Empty State */}
        {value.length === 0 && !isDragging && (
          <div className="w-full text-center py-4">
            <p className="text-sm text-gray-500">
              Drag images here or click "Add" to upload
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WebP, GIF up to {maxSizeMB}MB each
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Min Images Warning */}
      {minImages > 0 && value.length < minImages && (
        <p className="text-xs text-gray-500">
          Minimum {minImages} image{minImages > 1 ? 's' : ''} required
        </p>
      )}
    </div>
  );
};

export default MultiImageUpload;
