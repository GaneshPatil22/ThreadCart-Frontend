import { useEffect, useState } from 'react';
import supabase from '../../utils/supabase';
import {
  CAD_FILES,
  CAD_FILE_TYPE_ORDER,
  type CadFileType,
} from '../../utils/constants';
import {
  getCadFileDownloadUrl,
  getCadFilesForProduct,
} from '../../services/cad-files.service';
import type { CadFile } from '../../types/cad-files.types';
import AuthModal from '../auth/AuthModal';

interface CadFileDownloadsProps {
  productId: number;
  /** Compact layout for inline use (e.g. expandable row); default is comfortable. */
  compact?: boolean;
}

/**
 * Customer-facing CAD downloads section.
 *
 * Visibility: shown to everyone (logged-in or not).
 * Action: clicking a download button checks auth. If not authenticated,
 * opens the existing AuthModal. After successful auth the modal closes,
 * the user remains on this page, and can click the button again to download.
 */
export default function CadFileDownloads({
  productId,
  compact = false,
}: CadFileDownloadsProps) {
  const [files, setFiles] = useState<CadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingType, setDownloadingType] = useState<CadFileType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'register' | null>(null);

  // Load CAD files for this product
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

  // Track auth state so the buttons reflect it without a round-trip on click
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleDownload = async (cadFile: CadFile) => {
    setError(null);

    if (!isAuthed) {
      setAuthMode('signin');
      return;
    }

    setDownloadingType(cadFile.file_type as CadFileType);
    const result = await getCadFileDownloadUrl(cadFile);
    setDownloadingType(null);

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Trigger browser download. Using a synthetic <a> click keeps it in-page
    // and avoids popup blockers.
    const a = document.createElement('a');
    a.href = result.url;
    a.download = cadFile.original_filename;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Only show types that actually have a file
  const availableFiles = CAD_FILE_TYPE_ORDER
    .map((type) => files.find((f) => f.file_type === type))
    .filter((f): f is CadFile => Boolean(f));

  if (loading) {
    return (
      <div className={compact ? 'text-xs text-gray-400' : 'text-sm text-gray-500'}>
        Loading downloads…
      </div>
    );
  }

  if (availableFiles.length === 0) {
    // Don't render anything if no CAD files — keeps existing product layouts clean
    return null;
  }

  return (
    <>
      <div className={compact ? 'mt-3' : 'mt-4'}>
        <h4
          className={`font-semibold text-gray-700 flex items-center gap-2 ${
            compact ? 'text-xs' : 'text-sm'
          } mb-2`}
        >
          <svg
            className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Engineering Downloads
          {!isAuthed && (
            <span className="text-[10px] font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              Sign in required
            </span>
          )}
        </h4>

        <div className="flex flex-wrap gap-2">
          {availableFiles.map((file) => {
            const config = CAD_FILES.TYPES[file.file_type as CadFileType];
            const isDownloading = downloadingType === file.file_type;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => handleDownload(file)}
                disabled={isDownloading}
                title={
                  isAuthed
                    ? `Download ${file.original_filename}`
                    : 'Sign in to download'
                }
                className={`group inline-flex items-center gap-2 rounded-lg border transition-colors disabled:opacity-50 ${
                  compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
                } ${
                  isAuthed
                    ? 'border-primary/30 bg-white text-primary hover:bg-primary hover:text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-primary/40 hover:text-primary'
                }`}
              >
                <svg
                  className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h11l5 5v7a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="font-medium">{config.label}</span>
                {isDownloading && (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            className={`mt-2 text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 ${
              compact ? 'text-[11px]' : 'text-xs'
            }`}
          >
            {error}
          </div>
        )}
      </div>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={() =>
            setAuthMode(authMode === 'signin' ? 'register' : 'signin')
          }
        />
      )}
    </>
  );
}
