// ============================================================================
// useLeadCaptureTrigger
// ============================================================================
// Decides whether and when to fire the lead-capture popup. Calls `onTrigger`
// with the source that fired it.
//
// Trigger signals:
//   - Desktop exit-intent: cursor leaves the viewport from the top.
//   - Time fallback (all devices): real wall-clock time on site, measured
//     once on mount and NOT reset by route changes.
//
// Suppression (any of these short-circuits the entire hook):
//   - Already shown this session
//   - Within DISMISS_COOLDOWN_DAYS of a prior dismiss
//   - User already submitted on this device
//   - User is currently signed in
//   - Current route is in SUPPRESSED_ROUTE_PREFIXES (checked at fire-time,
//     so navigating into /cart at second 55 just makes us skip; the timer
//     itself isn't reset by navigation)
// ============================================================================

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { LEAD_CAPTURE, type LeadCaptureSource } from '../utils/constants';
import {
  hasAlreadySubmitted,
  hasBeenShownThisSession,
  isInDismissCooldown,
  markShownThisSession,
} from '../utils/leadCaptureStorage';

const isRouteSuppressed = (): boolean => {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname;
  return LEAD_CAPTURE.SUPPRESSED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
};

// Desktop = has a fine pointer (mouse). Touch-only devices have no real
// equivalent of exit-intent, so we only rely on the timer there.
const hasFinePointer = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: fine)').matches;
};

interface UseLeadCaptureTriggerArgs {
  onTrigger: (source: LeadCaptureSource) => void;
  /**
   * When the popup is already open or the caller doesn't want further
   * triggers, set this to true to disable all listeners.
   */
  paused: boolean;
}

export const useLeadCaptureTrigger = ({
  onTrigger,
  paused,
}: UseLeadCaptureTriggerArgs): void => {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  // Track auth state. Null means "not yet known" — we wait for it before
  // arming any listeners, so we don't flash the popup to logged-in users.
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setIsSignedIn(Boolean(data.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    if (isSignedIn === null) return; // wait for auth check
    if (isSignedIn) return;
    if (hasBeenShownThisSession()) return;
    if (hasAlreadySubmitted()) return;
    if (isInDismissCooldown()) return;

    let alreadyFired = false;

    const tryFire = (source: LeadCaptureSource) => {
      if (alreadyFired) return;
      // Route is checked at fire-time (not setup-time) so that navigation
      // does not reset the timer. If the user happens to be on a suppressed
      // route at the moment of firing, we silently skip — exit-intent or a
      // future session will catch them.
      if (isRouteSuppressed()) return;
      alreadyFired = true;
      markShownThisSession();
      onTrigger(source);
    };

    const timerId = window.setTimeout(
      () => tryFire('time_trigger'),
      LEAD_CAPTURE.TIMER_DELAY_MS,
    );

    let cleanupExitIntent: (() => void) | undefined;

    if (hasFinePointer()) {
      const onMouseLeave = (e: MouseEvent) => {
        // Only fire when leaving from the top edge — that's the "going to
        // close the tab / switch tab" signal. Side/bottom exits are usually
        // just reaching for the scrollbar or dock.
        if (e.clientY > LEAD_CAPTURE.EXIT_INTENT_THRESHOLD_PX) return;
        // relatedTarget is null when the cursor leaves the document entirely
        // (rather than entering another element).
        if (e.relatedTarget !== null) return;

        tryFire('exit_intent');
      };

      document.addEventListener('mouseleave', onMouseLeave);
      cleanupExitIntent = () => {
        document.removeEventListener('mouseleave', onMouseLeave);
      };
    }

    return () => {
      window.clearTimeout(timerId);
      cleanupExitIntent?.();
    };
  }, [paused, isSignedIn, onTrigger]);
};
