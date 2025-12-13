/**
 * Fallback image URL for broken images - using data URI to prevent network failures
 */
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='Arial' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * Converts Google Drive sharing URLs to direct thumbnail URLs
 * Supports both /d/FILE_ID/ and id=FILE_ID formats
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return PLACEHOLDER_IMAGE;

  // Match /d/FILE_ID/ or id=FILE_ID
  const fileIdMatch =
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);

  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    // Use thumbnail endpoint - more reliable than uc?export=view
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  return url;
}

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
