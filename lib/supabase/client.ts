import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses the anon key — safe to expose in the browser.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createBrowserClient(url, anonKey);
}
