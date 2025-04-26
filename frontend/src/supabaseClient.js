import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Initialize Supabase client with proper config for OAuth flows
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'auth-code'
  }
});

// Check for auth response in URL if coming back from OAuth provider
if (window.location.hash && window.location.hash.includes('error')) {
  console.error('OAuth Error detected in URL:', decodeURIComponent(window.location.hash));
}
