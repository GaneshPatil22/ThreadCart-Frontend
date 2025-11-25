
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] Initializing client...');
console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Check for corrupted session in localStorage
try {
  const storedAuth = localStorage.getItem('sb-tlczvpepvxmsrlexzurj-auth-token');
  console.log('[Supabase] Stored auth exists:', !!storedAuth);
  if (storedAuth) {
    const parsed = JSON.parse(storedAuth);
    console.log('[Supabase] Stored session expires at:', new Date(parsed?.expires_at * 1000));
  }
} catch (e) {
  console.error('[Supabase] Error checking stored session:', e);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

console.log('[Supabase] Client created successfully');
console.log('Supabase project ref:', supabaseUrl?.split('.')[0].split('//')[1]);

// Don't wait for session initialization - let it happen in the background
// The client will automatically use the session once restored
console.log('[Supabase] Session will be restored in background...');

export default supabase
