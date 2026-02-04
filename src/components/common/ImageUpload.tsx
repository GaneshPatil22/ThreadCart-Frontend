// ============================================================================
// IMAGE UPLOAD COMPONENT
// ============================================================================
// Reusable single image upload with drag-and-drop, preview, and ImageKit integration
// Used for Categories and SubCategories which have single images
// ============================================================================

import { useState, useRef, useCallback } from 'react';
import { uploadImage, validateImage } from '../../services/imagekit.service';
import { getDisplayUrl, handleImageError } from '../../utils/imageUtils';
import { IMAGEKIT } from '../../utils/constants';

// ============================================================================
// TYPES
// ============================================================================

interface ImageUploadProps {
  /** Current image URL (for edit mode) */
  value?: string;
  /** Callback when image URL changes */
  onChange: (url: string) => void;
  /** Target folder in ImageKit */
  folder: string;
  /** Label for the upload field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Placeholder text when no image */
  placeholder?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const UploadIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
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
// MAIN COMPONENT
// ============================================================================

export const ImageUpload = ({
  value,
  onChange,
  folder,
  label = 'Image',
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Click or drag image to upload',
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFile = useCallback(async (file: File) => {
    // Validate file
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadImage(file, {
        folder,
        onProgress: setUploadProgress,
      });

      if (result.success && result.url) {
        onChange(result.url);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [folder, onChange]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

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

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  // Handle click to upload
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  // Handle remove image
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
  };

  const hasImage = Boolean(value);
  const displayUrl = getDisplayUrl(value);
  const maxSizeMB = IMAGEKIT.MAX_FILE_SIZE / (1024 * 1024);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${hasImage ? 'p-2' : 'p-6'}
        `}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGEKIT.ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        {/* Content */}
        {isUploading ? (
          // Uploading State
          <div className="flex flex-col items-center justify-center py-4">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-gray-500">Uploading... {uploadProgress}%</p>
            <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : hasImage ? (
          // Image Preview
          <div className="relative group">
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-32 object-contain rounded"
              onError={handleImageError}
            />
            {/* Remove Button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove image"
              >
                <RemoveIcon />
              </button>
            )}
            {/* Change overlay */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                <span className="text-white text-sm font-medium">Click to change</span>
              </div>
            )}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center text-center">
            <UploadIcon />
            <p className="mt-2 text-sm text-gray-600">{placeholder}</p>
            <p className="mt-1 text-xs text-gray-400">
              PNG, JPG, WebP, GIF up to {maxSizeMB}MB
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
    </div>
  );
};

export default ImageUpload;
