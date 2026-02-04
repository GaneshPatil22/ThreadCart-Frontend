// ============================================================================
// SUPABASE EDGE FUNCTION: DELETE IMAGE FROM IMAGEKIT
// ============================================================================
// Securely deletes images from ImageKit using private key (server-side only)
// Used for gallery image deletion
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

// ============================================================================
// IMAGEKIT CONFIGURATION
// ============================================================================

const IMAGEKIT_PRIVATE_KEY = Deno.env.get('IMAGEKIT_PRIVATE_KEY') || '';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Deletes a file from ImageKit using their Media API
 */
async function deleteFromImageKit(fileId: string): Promise<boolean> {
  const deleteUrl = `https://api.imagekit.io/v1/files/${fileId}`;

  // ImageKit uses Basic Auth with private key
  const authHeader = 'Basic ' + btoa(IMAGEKIT_PRIVATE_KEY + ':');

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': authHeader,
    },
  });

  // 204 No Content = successful deletion
  // 404 = file already deleted (we treat this as success)
  return response.status === 204 || response.status === 404;
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
    // Only allow POST or DELETE requests
    if (req.method !== 'POST' && req.method !== 'DELETE') {
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

    // Parse request body
    const body = await req.json();
    const { fileId } = body;

    // Validate fileId
    if (!fileId) {
      return new Response(
        JSON.stringify({ success: false, error: 'No fileId provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete from ImageKit
    const deleted = await deleteFromImageKit(fileId);

    if (deleted) {
      return new Response(
        JSON.stringify({ success: true, message: 'Image deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete image from ImageKit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Delete error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Delete failed';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
