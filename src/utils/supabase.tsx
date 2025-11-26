
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with default session persistence
// This handles automatic session restoration and token refresh
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,      // ✅ Enables automatic session persistence
    autoRefreshToken: true,    // ✅ Automatically refreshes expired tokens
    detectSessionInUrl: true,  // ✅ Handles OAuth redirects
  }
});

export default supabase;
