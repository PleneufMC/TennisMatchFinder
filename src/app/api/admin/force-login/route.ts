import { NextRequest, NextResponse } from 'next/server';
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
    const jwtSecret = process.env.NEXTAUTH_SECRET || 'k8s2mP9xR4wQ7vN3jL6yT1uZ5cB0aE8fHgJkLmNpQrStUvWx';
    
    const token = await encode({
      token: {
        id: userId,
        email: userEmail,
        name: userName,
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      },
      secret: jwtSecret,
      maxAge: 30 * 24 * 60 * 60,
    });
    
    // Créer la réponse de redirection
    const baseUrl = request.nextUrl.origin;
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    
    // Définir les cookies avec Set-Cookie header
    const cookieOptions = `Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
    
    // Définir les deux variantes du cookie
    response.headers.append('Set-Cookie', `next-auth.session-token=${token}; ${cookieOptions}`);
    response.headers.append('Set-Cookie', `__Secure-next-auth.session-token=${token}; ${cookieOptions}`);
    
    return response;
  } catch (error) {
    console.error('Force login error:', error);
    return NextResponse.json({ 
      error: 'Failed to create session', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
