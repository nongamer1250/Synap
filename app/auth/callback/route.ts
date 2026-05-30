import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth callback handler.
 * Supabase redirects here after Google OAuth completes.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // Determine redirect origin dynamically using standard proxy headers
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || requestUrl.host;
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  
  // Enforce HTTP for localhost development, HTTPS for production
  const protocol = host.includes('localhost') ? 'http' : proto;
  const appUrl = `${protocol}://${host}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[OAuth Callback] Code exchange failed:', error.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, appUrl));
    }
    console.log('[OAuth Callback] Session exchange successful.');
  } else {
    console.warn('[OAuth Callback] No authorization code found in callback URL.');
  }

  const next = requestUrl.searchParams.get('next') || '/dashboard';
  return NextResponse.redirect(new URL(next, appUrl));
}
