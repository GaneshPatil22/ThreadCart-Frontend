// ============================================================================
// SUPABASE EDGE FUNCTION: UPLOAD IMAGE TO IMAGEKIT
// ============================================================================
// Securely uploads images to ImageKit using private key (server-side only)
// The private key never reaches the frontend, ensuring security
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ============================================================================
// TYPES
// ============================================================================

interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  filePath: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  fileId?: string;
  error?: string;
}

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// IMAGEKIT CONFIGURATION
// ============================================================================

const IMAGEKIT_PRIVATE_KEY = Deno.env.get('IMAGEKIT_PRIVATE_KEY') || '';
const IMAGEKIT_PUBLIC_KEY = Deno.env.get('IMAGEKIT_PUBLIC_KEY') || '';
const IMAGEKIT_URL_ENDPOINT = Deno.env.get('IMAGEKIT_URL_ENDPOINT') || 'https://ik.imagekit.io/fq27eon0z';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates a unique filename to avoid collisions
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseName}_${timestamp}_${randomStr}.${extension}`;
}

/**
 * Validates the file type
 */
function isValidFileType(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return allowedTypes.includes(mimeType);
}

/**
 * Uploads file to ImageKit using their Upload API
 */
async function uploadToImageKit(
  fileBase64: string,
  fileName: string,
  folder: string
): Promise<ImageKitUploadResponse> {
  const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';

  // Create form data for ImageKit upload
  const formData = new FormData();
  formData.append('file', fileBase64);
  formData.append('fileName', fileName);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'false'); // We already generate unique names

  // ImageKit uses Basic Auth with private key
  const authHeader = 'Basic ' + btoa(IMAGEKIT_PRIVATE_KEY + ':');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImageKit upload failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate ImageKit configuration
    if (!IMAGEKIT_PRIVATE_KEY) {
      console.error('IMAGEKIT_PRIVATE_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'threadcart/uploads';

    // Validate file presence
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    if (!isValidFileType(file.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'File too large. Maximum size is 5MB'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const base64WithPrefix = `data:${file.type};base64,${base64}`;

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(file.name);

    // Upload to ImageKit
    const uploadResult = await uploadToImageKit(base64WithPrefix, uniqueFileName, folder);

    // Return success response
    const result: UploadResult = {
      success: true,
      url: uploadResult.url,
      filePath: uploadResult.filePath,
      fileId: uploadResult.fileId,
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Upload failed';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
