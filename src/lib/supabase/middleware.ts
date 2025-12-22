import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Met à jour la session utilisateur dans le middleware
 * Gère le refresh automatique des tokens
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Récupère l'utilisateur (refresh le token si nécessaire)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Routes publiques (accessibles sans authentification)
  const publicRoutes = ['/', '/pricing', '/login', '/register', '/verify', '/join'];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/join/')
  );

  // Routes d'API publiques
  const isPublicApiRoute =
    pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/cron');

  // Routes protégées (dashboard)
  const isProtectedRoute =
    pathname.startsWith('/classement') ||
    pathname.startsWith('/matchs') ||
    pathname.startsWith('/suggestions') ||
    pathname.startsWith('/forum') ||
    pathname.startsWith('/profil') ||
    pathname.startsWith('/admin') ||
    pathname === '/dashboard';

  // Redirection si non authentifié sur une route protégée
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirection si authentifié sur une page d'auth
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    const redirect = url.searchParams.get('redirect') || '/dashboard';
    url.pathname = redirect;
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  // Vérifie que l'utilisateur a un profil joueur (sauf sur les routes de setup)
  if (user && isProtectedRoute && !pathname.startsWith('/setup-profile')) {
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('id', user.id)
      .single();

    // Si pas de profil, rediriger vers la création de profil
    if (!player) {
      const url = request.nextUrl.clone();
      url.pathname = '/setup-profile';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
