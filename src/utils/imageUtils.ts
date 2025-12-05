/**
 * Converts Google Drive sharing URLs to direct thumbnail URLs
 * Supports both /d/FILE_ID/ and id=FILE_ID formats
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return "https://via.placeholder.com/200x128?text=No+Image";

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
 * Fallback image URL for broken images
 */
export const PLACEHOLDER_IMAGE = "https://via.placeholder.com/200x128?text=No+Image";
