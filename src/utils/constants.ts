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
} as const;
