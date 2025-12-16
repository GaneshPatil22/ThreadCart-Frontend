// ============================================================================
// CENTRALIZED CONSTANTS
// ============================================================================
// Single source of truth for contact information and social media links
// Update this file to change information across the entire website
// ============================================================================

// ============================================================================
// CONTACT INFORMATION
// ============================================================================

export const CONTACT = {
  // Primary support email for all customer inquiries
  EMAIL: 'info.threadcart@gmail.com',

  // Primary phone number
  PHONE: '+91 91871 42260',
  PHONE_TEL: 'tel:+919187142260', // For href links

  // Business hours
  BUSINESS_HOURS: {
    WEEKDAYS: 'Monday - Saturday: 9:00 AM - 6:00 PM',
    WEEKEND: 'Sunday: Closed',
  },
} as const;

// ============================================================================
// SOCIAL MEDIA LINKS
// ============================================================================

export const SOCIAL_MEDIA = {
  LINKEDIN: {
    URL: 'https://www.linkedin.com/company/thread-cart/',
    LABEL: 'LinkedIn',
  },
  INSTAGRAM: {
    URL: 'https://www.instagram.com/thread_cart.in?igsh=MXRpMDZscG9vcGd4NA%3D%3D&utm_source=qr',
    LABEL: 'Instagram',
  },
  FACEBOOK: {
    URL: 'https://www.facebook.com/share/17qMtVdMS4/?mibextid=wwXIfr',
    LABEL: 'Facebook',
  },
  // Twitter removed as per business decision
} as const;

// ============================================================================
// COMPANY INFORMATION
// ============================================================================

export const COMPANY = {
  NAME: 'ThreadCart',
  TAGLINE: 'Premium Fasteners & Hardware',
  COPYRIGHT: `© ${new Date().getFullYear()} ThreadCart. All rights reserved.`,

  // Business Registration Details
  UDYAM: 'UDYAM-KR-03-0604566',
  GSTIN: '29CTGPM1143M1ZD',
} as const;

// ============================================================================
// TAX CONFIGURATION
// ============================================================================

export const TAX = {
  GST_RATE: 0.18, // 18% GST for India
  GST_PERCENTAGE: 18,
} as const;

// ============================================================================
// WHATSAPP CONFIGURATION
// ============================================================================

export const WHATSAPP = {
  // WhatsApp Business number (with country code, no + or spaces)
  PHONE_NUMBER: '919187142260',

  // Default message when user opens WhatsApp chat
  DEFAULT_MESSAGE: 'Hi! I have a question about ThreadCart products.',

  // Tooltip text shown on hover
  TOOLTIP_TEXT: 'Chat with us',

  // Position configuration
  POSITION: {
    BOTTOM: '24px',
    RIGHT: '24px',
  },
} as const;

/**
 * Generates WhatsApp Click-to-Chat URL
 * @param message - Optional custom message (defaults to WHATSAPP.DEFAULT_MESSAGE)
 * @param phoneNumber - Optional phone number (defaults to WHATSAPP.PHONE_NUMBER)
 */
export const getWhatsAppUrl = (
  message?: string,
  phoneNumber?: string
): string => {
  const phone = phoneNumber ?? WHATSAPP.PHONE_NUMBER;
  const text = encodeURIComponent(message ?? WHATSAPP.DEFAULT_MESSAGE);
  return `https://wa.me/${phone}?text=${text}`;
};
