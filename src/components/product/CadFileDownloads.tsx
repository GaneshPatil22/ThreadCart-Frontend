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
  /** Denser layout for inline use (e.g. expandable row). */
  compact?: boolean;
}

/**
 * Per-file-type visual treatment.
 *
 * Tailwind needs class names as literal strings to include them in the
 * generated CSS, so we list explicit classes rather than templating.
 */
const TYPE_THEME: Record<
  CadFileType,
  { iconBg: string; iconColor: string; border: string; ringHover: string }
> = {
  step: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    border: 'border-blue-200',
    ringHover: 'hover:ring-blue-300',
  },
  pdf: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-700',
    border: 'border-red-200',
    ringHover: 'hover:ring-red-300',
  },
  sldprt: {
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-700',
    border: 'border-orange-200',
    ringHover: 'hover:ring-orange-300',
  },
  stl: {
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700',
    border: 'border-purple-200',
    ringHover: 'hover:ring-purple-300',
  },
};

const TypeIcon = ({
  type,
  className,
}: {
  type: CadFileType;
  className?: string;
}) => {
  const props = {
    className,
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.8,
  };
  switch (type) {
    case 'step':
      // Cube — 3D model
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
          />
        </svg>
      );
    case 'pdf':
      // Document with lines
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'sldprt':
      // Wrench — mechanical / native CAD
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.7 6.3a4 4 0 11-5.4 5.4l-6 6 2.8 2.8 6-6a4 4 0 005.4-5.4l-2.4 2.4-2.8-2.8 2.4-2.4z"
          />
        </svg>
      );
    case 'stl':
      // Stacked layers — mesh
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4l9 5-9 5-9-5 9-5zm0 8l9 5-9 5-9-5 9-5z"
          />
        </svg>
      );
  }
};

const formatSize = (bytes: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function CadFileDownloads({
  productId,
  compact = false,
}: CadFileDownloadsProps) {
  const [files, setFiles] = useState<CadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'register' | null>(null);

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

    setDownloadingId(cadFile.id);
    const result = await getCadFileDownloadUrl(cadFile);
    setDownloadingId(null);

    if (!result.success) {
      setError(result.message);
      return;
    }

    const a = document.createElement('a');
    a.href = result.url;
    a.download = cadFile.original_filename;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const availableFiles = CAD_FILE_TYPE_ORDER
    .map((type) => files.find((f) => f.file_type === type))
    .filter((f): f is CadFile => Boolean(f));

  if (loading || availableFiles.length === 0) {
    return null;
  }

  // ---------------------------------------------------------------------
  // Compact layout — used inside the expandable product-list row
  // ---------------------------------------------------------------------
  if (compact) {
    return (
      <>
        <div className="mt-3 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50/40 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                CAD Downloads
              </span>
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                Free
              </span>
            </div>
            {!isAuthed && (
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Sign in →
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableFiles.map((file) => {
              const type = file.file_type as CadFileType;
              const theme = TYPE_THEME[type];
              const isDownloading = downloadingId === file.id;
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
                  className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white border ${theme.border} text-xs font-semibold text-gray-800 shadow-sm hover:shadow transition-all disabled:opacity-50`}
                >
                  <span
                    className={`w-5 h-5 rounded ${theme.iconBg} ${theme.iconColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <TypeIcon type={type} className="w-3 h-3" />
                  </span>
                  <span>{CAD_FILES.TYPES[type].label}</span>
                  {isDownloading && (
                    <svg className="animate-spin h-3 w-3 text-primary" viewBox="0 0 24 24">
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
            <div className="mt-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
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

  // ---------------------------------------------------------------------
  // Full layout — used in ProductDetailView (modal)
  // ---------------------------------------------------------------------
  return (
    <>
      <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-blue-50/40 p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Engineering Downloads
                </h3>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  FREE
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                Get the original CAD files for your design and 3D printing workflow.
              </p>
            </div>
          </div>
        </div>

        {/* Sign-in banner (anonymous only) */}
        {isAuthed === false && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-sm font-medium text-amber-900 truncate">
                Sign in to download CAD files — free
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-xs font-bold px-3 py-1.5 rounded-md bg-primary text-white hover:bg-red-600 transition-colors"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white border border-primary text-primary hover:bg-primary/5 transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        )}

        {/* File grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {availableFiles.map((file) => {
            const type = file.file_type as CadFileType;
            const theme = TYPE_THEME[type];
            const config = CAD_FILES.TYPES[type];
            const isDownloading = downloadingId === file.id;
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
                className={`group relative bg-white border-2 ${theme.border} rounded-xl p-4 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0`}
              >
                <div
                  className={`w-10 h-10 rounded-lg ${theme.iconBg} ${theme.iconColor} flex items-center justify-center mb-3`}
                >
                  <TypeIcon type={type} className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {config.label}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {config.description}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 font-mono">
                  {config.ext}
                  {file.file_size_bytes ? ` · ${formatSize(file.file_size_bytes)}` : ''}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold ${
                      isAuthed ? 'text-primary' : 'text-gray-500'
                    }`}
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
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
                        Preparing…
                      </>
                    ) : (
                      <>
                        Download
                        <svg
                          className="w-3 h-3 group-hover:translate-y-0.5 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
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
