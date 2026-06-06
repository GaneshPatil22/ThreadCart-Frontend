import { useEffect, useRef, useState } from 'react';
import {
  CAD_FILES,
  CAD_FILE_TYPE_ORDER,
  type CadFileType,
} from '../../utils/constants';
import {
  deleteCadFile,
  getCadFilesForProduct,
  uploadCadFile,
} from '../../services/cad-files.service';
import type { CadFile } from '../../types/cad-files.types';

interface CadFilesManagerProps {
  productId: number;
}

/**
 * Admin UI: one upload slot per CAD file type for a given product.
 *
 * Designed to live inside the product edit form. The product must already
 * exist (we need its id to build storage keys), so for the "Add Product"
 * flow we display a hint instead of upload slots.
 */
export default function CadFilesManager({ productId }: CadFilesManagerProps) {
  const [files, setFiles] = useState<CadFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCadFilesForProduct(productId).then((result) => {
      if (!mounted) return;
      setFiles(result);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [productId]);

  const fileByType = (type: CadFileType): CadFile | undefined =>
    files.find((f) => f.file_type === type);

  const handleAfterUpload = (cadFile: CadFile) => {
    setFiles((prev) => {
      const without = prev.filter((f) => f.file_type !== cadFile.file_type);
      return [...without, cadFile];
    });
  };

  const handleAfterDelete = (cadFileId: number) => {
    setFiles((prev) => prev.filter((f) => f.id !== cadFileId));
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        CAD Files (Engineering Downloads)
      </h3>

      <p className="text-xs text-gray-500 mb-3">
        Upload up to one file per type. All are optional. Files are stored privately
        and only downloadable by logged-in users.
      </p>

      {loading ? (
        <div className="text-sm text-gray-500 py-2">Loading CAD files…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CAD_FILE_TYPE_ORDER.map((type) => (
            <CadFileSlot
              key={type}
              productId={productId}
              type={type}
              existing={fileByType(type)}
              onUploaded={handleAfterUpload}
              onDeleted={handleAfterDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single-slot component
// ---------------------------------------------------------------------------

interface CadFileSlotProps {
  productId: number;
  type: CadFileType;
  existing: CadFile | undefined;
  onUploaded: (file: CadFile) => void;
  onDeleted: (fileId: number) => void;
}

function CadFileSlot({
  productId,
  type,
  existing,
  onUploaded,
  onDeleted,
}: CadFileSlotProps) {
  const config = CAD_FILES.TYPES[type];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilePick = async (file: File) => {
    setError(null);
    setUploading(true);
    const result = await uploadCadFile({ productId, fileType: type, file });
    setUploading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }
    onUploaded(result.cadFile);
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!confirm(`Remove ${config.label} file for this product?`)) return;

    setError(null);
    setDeleting(true);
    const result = await deleteCadFile(existing.id);
    setDeleting(false);

    if (!result.success) {
      setError(result.message ?? 'Delete failed');
      return;
    }
    onDeleted(existing.id);
  };

  const sizeKB = existing?.file_size_bytes
    ? (existing.file_size_bytes / 1024).toFixed(0)
    : null;

  return (
    <div
      className={`border rounded-lg p-3 transition-colors ${
        existing ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-gray-800 text-sm">
            {config.label}
            <span className="ml-2 text-xs font-normal text-gray-500">
              {config.acceptExtensions.join(', ')} · max {config.maxSizeMB}MB
            </span>
          </div>
          <div className="text-xs text-gray-500">{config.description}</div>
        </div>
        {existing && (
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
            Uploaded
          </span>
        )}
      </div>

      {existing ? (
        <div className="mt-2 text-xs text-gray-600 break-all">
          <div className="font-mono">{existing.original_filename}</div>
          {sizeKB && (
            <div className="text-gray-400 mt-0.5">
              {sizeKB} KB · {existing.download_count} downloads
            </div>
          )}
        </div>
      ) : null}

      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {error}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={config.acceptExtensions.join(',')}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFilePick(f);
            // Reset so re-selecting the same file fires onChange again
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || deleting}
          className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : existing ? 'Replace' : 'Upload'}
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading || deleting}
            className="px-3 py-1.5 text-xs font-medium rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  );
}
