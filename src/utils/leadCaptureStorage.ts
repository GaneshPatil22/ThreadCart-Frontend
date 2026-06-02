// ============================================================================
// LEAD CAPTURE STORAGE HELPERS
// ============================================================================
// Suppression rules for the lead-capture popup. Three layers:
//   1. sessionStorage — once shown in a tab, don't show again until tab closes
//   2. localStorage    — after a dismiss, cool down for N days
//   3. localStorage    — after a submit, never show again on this device
// ============================================================================

import { LEAD_CAPTURE } from './constants';

const KEYS = LEAD_CAPTURE.STORAGE_KEYS;
const COOLDOWN_MS = LEAD_CAPTURE.DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

const safeSessionGet = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSessionSet = (key: string, value: string): void => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage disabled — fail silent */
  }
};

const safeLocalGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage disabled — fail silent */
  }
};

export const hasBeenShownThisSession = (): boolean =>
  safeSessionGet(KEYS.SESSION_SHOWN) === '1';

export const markShownThisSession = (): void => {
  safeSessionSet(KEYS.SESSION_SHOWN, '1');
};

export const isInDismissCooldown = (): boolean => {
  const raw = safeLocalGet(KEYS.DISMISSED_AT);
  if (!raw) return false;

  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;

  return Date.now() - dismissedAt < COOLDOWN_MS;
};

export const markDismissed = (): void => {
  safeLocalSet(KEYS.DISMISSED_AT, String(Date.now()));
};

export const hasAlreadySubmitted = (): boolean =>
  safeLocalGet(KEYS.SUBMITTED) === '1';

export const markSubmitted = (): void => {
  safeLocalSet(KEYS.SUBMITTED, '1');
};
