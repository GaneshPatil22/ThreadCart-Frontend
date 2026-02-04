// ============================================================================
// IMAGE UTILITIES
// ============================================================================
// Unified image handling utilities for ThreadCart
// All images are now hosted on ImageKit CDN
// ============================================================================

import { IMAGEKIT } from './constants';

// ============================================================================
// PLACEHOLDER IMAGE
// ============================================================================

/**
 * Fallback image URL for broken images - using data URI to prevent network failures
 */
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='Arial' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

// ============================================================================
// URL TYPE DETECTION
// ============================================================================

/**
 * Checks if a URL is an ImageKit URL
 */
export function isImageKitUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith(IMAGEKIT.URL_ENDPOINT) || url.includes('ik.imagekit.io');
}

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Gets the display URL for an image
 * Returns the URL as-is if valid, or placeholder if empty/null
 *
 * @param url - The image URL
 * @returns The display-ready URL
 */
export function getDisplayUrl(url: string | null | undefined): string {
  if (!url || url.trim() === '') return PLACEHOLDER_IMAGE;
  return url;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handles image error by setting placeholder - prevents infinite loops
 * by checking if src is already the placeholder
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const target = e.currentTarget;
  // Prevent infinite loop - only set placeholder if not already set
  if (target.src !== PLACEHOLDER_IMAGE) {
    target.src = PLACEHOLDER_IMAGE;
  }
}
