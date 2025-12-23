import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';

// Route temporaire pour connexion admin initiale
// À SUPPRIMER après la première connexion réussie
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');
  
  // Vérifier le secret pour éviter les abus
  if (secret !== 'tennis2024admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = '2255df4c-5ff2-40a8-af10-26545d816f91';
  const userEmail = 'pfermanian@gmail.com';
  const userName = 'Pierre Fermanian';
  
  try {
    // Créer un JWT token
    const token = await encode({
      token: {
        id: userId,
        email: userEmail,
        name: userName,
        sub: userId,
      },
      secret: process.env.NEXTAUTH_SECRET || 'k8s2mP9xR4wQ7vN3jL6yT1uZ5cB0aE8fHgJkLmNpQrStUvWx',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    // Définir le cookie de session
    const cookieStore = await cookies();
    
    // NextAuth utilise différents noms selon l'environnement
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';
    
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    // Aussi définir sans le préfixe __Secure- au cas où
    cookieStore.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
    
    // Rediriger vers le dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Force login error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
