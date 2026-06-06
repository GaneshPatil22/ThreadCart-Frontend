// ============================================================================
// SUPABASE EDGE FUNCTION: CAD FILE URL BROKER
// ============================================================================
// Issues short-lived Cloudflare R2 presigned URLs for the ThreadCart CAD-files
// download/upload flow. Never returns the R2 access key to the client.
//
// Operations:
//   - upload   (admin only): presigned PUT URL
//   - download (any logged-in user): presigned GET URL
//   - delete   (admin only): performs the R2 DELETE server-side
//
// Required environment variables (set with `supabase secrets set ...`):
//   R2_ACCOUNT_ID
//   R2_ACCESS_KEY_ID
//   R2_SECRET_ACCESS_KEY
//   R2_BUCKET                (default: threadcart-cad-files)
//   ADMIN_EMAIL              (default: superadmin@threadcart.com)
//   SIGNED_URL_TTL_SECONDS   (default: 300)
// ============================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID') ?? '';
const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID') ?? '';
const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '';
const R2_BUCKET = Deno.env.get('R2_BUCKET') ?? 'threadcart-cad-files';
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'superadmin@threadcart.com';
const SIGNED_URL_TTL_SECONDS = Number(Deno.env.get('SIGNED_URL_TTL_SECONDS') ?? '300');

// R2 S3-compatible endpoint
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Operation = 'upload' | 'download' | 'delete';

interface RequestBody {
  operation: Operation;
  storageKey: string;
  contentType?: string;       // for upload
  downloadFilename?: string;  // for download (Content-Disposition)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const error = (message: string, status = 400) => json({ error: message }, status);

/** Reject anything that escapes the products/ prefix. */
const isValidStorageKey = (key: string): boolean =>
  typeof key === 'string' &&
  key.length > 0 &&
  key.length < 500 &&
  key.startsWith('products/') &&
  !key.includes('..');

const isAdmin = (email: string | undefined | null): boolean =>
  !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: 's3',
  region: 'auto',
});

/**
 * Generates a presigned URL by signing a request with `aws4fetch` and the
 * `X-Amz-Expires` query parameter — the S3-compatible presigning convention.
 */
async function presign(
  method: 'GET' | 'PUT',
  storageKey: string,
  opts: { contentType?: string; downloadFilename?: string } = {}
): Promise<string> {
  const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET}/${storageKey}`);
  url.searchParams.set('X-Amz-Expires', String(SIGNED_URL_TTL_SECONDS));

  // Force download with original filename
  if (method === 'GET' && opts.downloadFilename) {
    url.searchParams.set(
      'response-content-disposition',
      `attachment; filename="${opts.downloadFilename.replace(/"/g, '')}"`
    );
  }

  const headers: HeadersInit = {};
  if (method === 'PUT' && opts.contentType) {
    headers['Content-Type'] = opts.contentType;
  }

  const signed = await r2.sign(
    new Request(url.toString(), { method, headers }),
    { aws: { signQuery: true } }
  );

  return signed.url;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return error('Method not allowed', 405);

  // ---- Config sanity ----
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('R2 env vars missing');
    return error('Storage not configured', 500);
  }

  // ---- AuthN: verify caller is logged in ----
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return error('Authentication required', 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return error('Invalid session', 401);
  }
  const userEmail = userData.user.email;

  // ---- Parse body ----
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return error('Invalid JSON body');
  }

  const { operation, storageKey, contentType, downloadFilename } = body;

  if (!operation || !storageKey) {
    return error('Missing operation or storageKey');
  }
  if (!isValidStorageKey(storageKey)) {
    return error('Invalid storageKey');
  }

  // ---- AuthZ + dispatch ----
  try {
    switch (operation) {
      case 'download': {
        const url = await presign('GET', storageKey, { downloadFilename });
        return json({
          url,
          expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
        });
      }

      case 'upload': {
        if (!isAdmin(userEmail)) return error('Admin only', 403);
        const url = await presign('PUT', storageKey, { contentType });
        return json({
          url,
          expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
        });
      }

      case 'delete': {
        if (!isAdmin(userEmail)) return error('Admin only', 403);
        // For DELETE we sign and execute the request server-side rather than
        // returning a presigned URL — that way the browser never sees R2 at all
        // for destructive ops.
        const res = await r2.fetch(`${R2_ENDPOINT}/${R2_BUCKET}/${storageKey}`, {
          method: 'DELETE',
        });
        if (!res.ok && res.status !== 404) {
          const text = await res.text().catch(() => '');
          console.error('R2 delete failed:', res.status, text);
          return error(`Delete failed: ${res.status}`, 502);
        }
        return json({ ok: true });
      }

      default:
        return error(`Unknown operation: ${operation}`);
    }
  } catch (err) {
    console.error('cad-file-url error:', err);
    return error(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
