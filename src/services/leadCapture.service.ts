// ============================================================================
// LEAD CAPTURE SERVICE
// ============================================================================
// Inserts a row into public.email_subscribers. Duplicate emails are treated
// as success ("already subscribed") — the unique constraint on email column
// is the source of truth for dedup, and we never leak whether a given email
// existed beforehand.
// ============================================================================

import { supabase } from '../utils/supabase';
import type { LeadCaptureSource } from '../utils/constants';

export interface LeadCaptureInput {
  email: string;
  phone?: string;
  name?: string;
  interests: string[];
  source: LeadCaptureSource;
}

export interface LeadCaptureResult {
  success: boolean;
  alreadySubscribed?: boolean;
  message: string;
}

// Postgres unique-violation error code
const PG_UNIQUE_VIOLATION = '23505';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizePhone = (phone?: string): string | undefined => {
  const trimmed = phone?.trim();
  return trimmed ? trimmed : undefined;
};

export const submitLeadCapture = async (
  input: LeadCaptureInput
): Promise<LeadCaptureResult> => {
  const email = normalizeEmail(input.email);

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const payload = {
    email,
    phone: normalizePhone(input.phone) ?? null,
    name: input.name?.trim() || null,
    interests: input.interests,
    source: input.source,
    page_url: typeof window !== 'undefined' ? window.location.pathname : null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  };

  const { error } = await supabase.from('email_subscribers').insert(payload);

  if (!error) {
    return { success: true, message: "Thanks! You're on the list." };
  }

  if (error.code === PG_UNIQUE_VIOLATION) {
    // Already subscribed — treat as success so we don't reveal whether the
    // email exists, and so the user gets a polite confirmation.
    return {
      success: true,
      alreadySubscribed: true,
      message: "You're already subscribed — thanks for being with us!",
    };
  }

  return {
    success: false,
    message: 'Something went wrong. Please try again in a moment.',
  };
};
