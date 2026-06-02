// ============================================================================
// LEAD CAPTURE POPUP
// ============================================================================
// Newsletter / lead-capture modal triggered by useLeadCaptureTrigger. Mounted
// once at the app root so it works on every route. The trigger hook owns the
// "when to show" logic; this component owns the "what it looks like and how
// it submits" logic.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Mail, Phone, User, Sparkles, Check, Download } from 'lucide-react';
import { LEAD_CAPTURE, type LeadCaptureSource } from '../../utils/constants';
import {
  markDismissed,
  markSubmitted,
} from '../../utils/leadCaptureStorage';
import { submitLeadCapture } from '../../services/leadCapture.service';
import { useLeadCaptureTrigger } from '../../hooks/useLeadCaptureTrigger';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const SUCCESS_AUTO_CLOSE_MS = 3500;

const triggerGuideDownload = () => {
  const a = document.createElement('a');
  a.href = LEAD_CAPTURE.GUIDE_FILE_URL;
  a.download = LEAD_CAPTURE.GUIDE_FILE_NAME;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const LeadCapturePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<LeadCaptureSource>('time_trigger');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [interests, setInterests] = useState<string[]>([
    ...LEAD_CAPTURE.DEFAULT_INTERESTS,
  ]);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleTrigger = useCallback((firedFrom: LeadCaptureSource) => {
    setSource(firedFrom);
    setIsOpen(true);
  }, []);

  useLeadCaptureTrigger({ onTrigger: handleTrigger, paused: isOpen });

  // Focus the email input when the modal opens, and lock body scroll.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Defer focus to next tick so the input is in the DOM.
    const focusTimer = window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    if (status === 'submitting') return;
    if (status !== 'success') {
      // Only count it as a dismissal if they didn't successfully submit.
      // (markSubmitted on success already suppresses future shows forever.)
      markDismissed();
    }
    setIsOpen(false);
    // Reset transient state so a future open starts clean (only matters in
    // dev when we manually clear suppression).
    setStatus('idle');
    setErrorMsg(null);
  }, [status]);

  // Auto-close after success.
  useEffect(() => {
    if (status !== 'success') return;
    const t = window.setTimeout(() => setIsOpen(false), SUCCESS_AUTO_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [status]);

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMsg(null);

    const result = await submitLeadCapture({
      email,
      phone: phone || undefined,
      name: name || undefined,
      interests,
      source,
    });

    if (result.success) {
      markSubmitted();
      setStatus('success');
      triggerGuideDownload();
    } else {
      setStatus('error');
      setErrorMsg(result.message);
    }
  };

  if (!isOpen) return null;

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-capture-headline"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Close */}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isSubmitting}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Accent band */}
          <div className="bg-gradient-to-r from-primary to-primary-hover px-6 pt-6 pb-5 text-white">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Free guide inside
            </div>
            <h2
              id="lead-capture-headline"
              className="text-xl font-bold leading-tight sm:text-2xl"
            >
              {LEAD_CAPTURE.HEADLINE}
            </h2>
            <p className="mt-1.5 text-sm text-white/90">
              {LEAD_CAPTURE.SUBHEADLINE}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {isSuccess ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  You&apos;re in! Your guide is downloading.
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Didn&apos;t start automatically?{' '}
                  <a
                    href={LEAD_CAPTURE.GUIDE_FILE_URL}
                    download={LEAD_CAPTURE.GUIDE_FILE_NAME}
                    className="font-medium text-primary hover:underline"
                  >
                    Click here to download
                  </a>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Email */}
                <div>
                  <label htmlFor="lc-email" className="sr-only">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={emailInputRef}
                      id="lc-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-border bg-white px-9 py-2.5 text-sm text-text-primary placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Name + Phone — optional, side by side on >sm */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lc-name" className="sr-only">
                      Name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="lc-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-border bg-white px-9 py-2.5 text-sm text-text-primary placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lc-phone" className="sr-only">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="lc-phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="Phone (optional)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-border bg-white px-9 py-2.5 text-sm text-text-primary placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <fieldset className="space-y-1.5 pt-1">
                  <legend className="mb-1 text-xs font-medium text-text-secondary">
                    Send me:
                  </legend>
                  {LEAD_CAPTURE.INTERESTS.map((opt) => {
                    const checked = interests.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-text-primary"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleInterest(opt.id)}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </fieldset>

                {errorMsg && (
                  <p className="text-sm text-primary" role="alert">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    'Preparing your download…'
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {LEAD_CAPTURE.CTA_LABEL}
                    </>
                  )}
                </button>

                <p className="pt-1 text-center text-xs text-text-secondary">
                  {LEAD_CAPTURE.PRIVACY_NOTE}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
