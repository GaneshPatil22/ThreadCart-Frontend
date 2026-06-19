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
  EMAIL: 'info@threadcart.in',

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
// SINGLE-TYPE PRODUCT DEFAULTS
// ============================================================================
// Sentinel values for spec fields when sub-category type is "single".
// These fields are hidden in the UI and auto-filled so DB constraints are met.
// Display logic in productSpecUtils filters these out automatically.
// ============================================================================

export const SINGLE_PRODUCT_DEFAULTS = {
  STRING: 'DEFAULT', // For varchar/text spec fields
  NUMBER: null, // For numeric spec fields (all nullable in DB)
} as const;

// Fields hidden for single-type sub-category products
export const SINGLE_TYPE_HIDDEN_FIELDS = [
  'thread_style',
  'thread_size_pitch',
  'fastener_length',
  'head_height',
  'Grade',
  'Coating',
  'Material',
] as const;

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

// ============================================================================
// LEAD CAPTURE POPUP CONFIGURATION
// ============================================================================
// Newsletter / lead-capture popup shown on exit-intent (desktop) or after a
// timer fallback (all devices). Designed to be non-intrusive: shown at most
// once per session, cooled down for 7 days after a dismiss, never again after
// a successful submit, and suppressed entirely on transactional routes and
// for logged-in users.
// ============================================================================

export const LEAD_CAPTURE = {
  HEADLINE: 'Get the ThreadCart Fastener Guide — Free',
  SUBHEADLINE:
    'Drop your email and instantly download our free technical guide. We’ll also keep you posted on new-product alerts and exclusive updates. No spam, ever.',
  CTA_LABEL: 'Download Guide',
  PRIVACY_NOTE: 'No spam. Unsubscribe anytime.',

  // Free guide PDF (served from /public). Downloaded automatically on submit.
  GUIDE_FILE_URL: '/free_guide.pdf',
  GUIDE_FILE_NAME: 'ThreadCart-Fastener-Guide.pdf',

  // Trigger timing
  TIMER_DELAY_MS: 30_000, // show after 30s of browsing as a fallback
  EXIT_INTENT_THRESHOLD_PX: 10, // mouse must leave within this many px of viewport top

  // Suppression
  DISMISS_COOLDOWN_DAYS: 1, // after a dismiss, don't show for 1 day
  SUPPRESSED_ROUTE_PREFIXES: [
    '/cart',
    '/checkout',
    '/order',
    '/orders',
    '/confirm-email',
    '/add_item',
  ] as readonly string[],

  // Interest options offered as checkboxes
  INTERESTS: [
    { id: 'tech_guides', label: 'Technical guides & spec sheets' },
    { id: 'new_arrivals', label: 'New product arrivals' },
    { id: 'offers', label: 'Special offers & bulk pricing' },
  ] as const,

  // Default interests pre-checked
  DEFAULT_INTERESTS: ['tech_guides', 'new_arrivals'] as readonly string[],

  // Storage keys
  STORAGE_KEYS: {
    SESSION_SHOWN: 'tc_lead_capture_shown_session',
    DISMISSED_AT: 'tc_lead_capture_dismissed_at',
    SUBMITTED: 'tc_lead_capture_submitted',
  },
} as const;

export type LeadCaptureSource = 'exit_intent' | 'time_trigger' | 'manual';

// ============================================================================
// CAD FILES CONFIGURATION
// ============================================================================
// Engineering downloads attached to a product (STEP, PDF drawing, SolidWorks
// part, STL). Files live in Cloudflare R2; only metadata is in the DB.
// The Supabase Edge Function `cad-file-url` brokers all access — frontend
// never holds R2 credentials and download requires an authenticated session.
// ============================================================================

export const CAD_FILES = {
  // Storage bucket name in Cloudflare R2
  BUCKET: 'threadcart-cad-files',

  // How long a presigned URL stays valid (seconds)
  SIGNED_URL_TTL_SECONDS: 300,

  // Name of the deployed Supabase Edge Function that brokers R2 access
  EDGE_FUNCTION_NAME: 'cad-file-url',

  // Supported file types — extend by:
  //   1. adding here
  //   2. adding to the CHECK constraint in supabase_cad_files.sql
  TYPES: {
    step: {
      label: 'STEP',
      description: '3D model (universal CAD)',
      ext: '.step',
      acceptExtensions: ['.step', '.stp'],
      mimeType: 'application/octet-stream',
      maxSizeMB: 20,
    },
    pdf: {
      label: 'PDF Drawing',
      description: '2D technical drawing',
      ext: '.pdf',
      acceptExtensions: ['.pdf'],
      mimeType: 'application/pdf',
      maxSizeMB: 10,
    },
    sldprt: {
      label: 'SolidWorks Part',
      description: 'Native SolidWorks file',
      ext: '.sldprt',
      acceptExtensions: ['.sldprt'],
      mimeType: 'application/octet-stream',
      maxSizeMB: 20,
    },
    stl: {
      label: 'STL',
      description: '3D printing mesh',
      ext: '.stl',
      acceptExtensions: ['.stl'],
      mimeType: 'application/octet-stream',
      maxSizeMB: 50,
    },
  },
} as const;

export type CadFileType = keyof typeof CAD_FILES.TYPES;

// ============================================================================
// QUOTE REQUEST CONFIGURATION
// ============================================================================
// Allowed attachment types for the customer-facing Get Quote / Bulk Quote
// modal. The same allow-list MUST be reflected in supabase_quotes_storage.sql
// (`allowed_mime_types` on the `quotes` bucket) or uploads will be rejected
// at the storage layer.
// ============================================================================

export const QUOTE_REQUEST = {
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ] as readonly string[],
  ALLOWED_LABEL: 'PDF, JPG, PNG, WebP',
  ACCEPT_ATTRIBUTE: '.pdf,application/pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
} as const;

export const isImageMimeType = (mimeType: string): boolean =>
  mimeType.startsWith('image/');

// Ordered list — used for stable display order in UI
export const CAD_FILE_TYPE_ORDER: readonly CadFileType[] = [
  'step',
  'pdf',
  'sldprt',
  'stl',
] as const;

/**
 * Builds the R2 storage key for a product+file combination.
 * Format: products/{product_id}/{file_type}{ext}
 * Example: products/42/step.step
 */
export const buildCadStorageKey = (
  productId: number,
  fileType: CadFileType,
  originalFilename: string
): string => {
  // Preserve the original extension (e.g. .step vs .stp both valid for STEP)
  const dotIdx = originalFilename.lastIndexOf('.');
  const ext = dotIdx >= 0 ? originalFilename.slice(dotIdx).toLowerCase() : CAD_FILES.TYPES[fileType].ext;
  return `products/${productId}/${fileType}${ext}`;
};
