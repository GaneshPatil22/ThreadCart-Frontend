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
// IMAGEKIT CONFIGURATION
// ============================================================================
// Image hosting and CDN service - replaces Google Drive for reliable image delivery
// Private key is stored securely in Supabase Edge Function (never expose to frontend)
// ============================================================================

export const IMAGEKIT = {
  // Public URL endpoint for displaying images
  URL_ENDPOINT: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/fq27eon0z',

  // Public key for client-side SDK (safe to expose)
  PUBLIC_KEY: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',

  // Folder structure for organized storage
  FOLDERS: {
    CATEGORIES: 'threadcart/categories',
    SUBCATEGORIES: 'threadcart/subcategories',
    PRODUCTS: 'threadcart/products',
    GALLERY: 'threadcart/Gallery',
  },

  // Allowed file types for upload
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  // Maximum file size in bytes (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  // Image transformation presets (can be appended to URLs)
  TRANSFORMS: {
    THUMBNAIL: 'tr=w-200,h-200,fo-auto',
    CARD: 'tr=w-400,h-400,fo-auto',
    FULL: 'tr=w-1000,fo-auto',
  },
} as const;

/**
 * Generates an ImageKit URL with optional transformations
 * @param path - Image path in ImageKit
 * @param transform - Optional transformation preset key
 */
export const getImageKitUrl = (
  path: string,
  transform?: keyof typeof IMAGEKIT.TRANSFORMS
): string => {
  if (!path) return '';

  // If already a full URL, return as-is
  if (path.startsWith('http')) return path;

  const baseUrl = IMAGEKIT.URL_ENDPOINT;
  const transformStr = transform ? `?${IMAGEKIT.TRANSFORMS[transform]}` : '';

  return `${baseUrl}/${path}${transformStr}`;
};

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
