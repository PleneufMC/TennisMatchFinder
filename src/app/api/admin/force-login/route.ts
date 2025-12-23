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
    
    // Au lieu de rediriger, retourner une page HTML qui set le cookie côté client
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Connexion en cours...</title>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0;">
  <div style="text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h1 style="color: #16a34a;">🎾 TennisMatchFinder</h1>
    <p id="status">Connexion en cours...</p>
    <script>
      // Set cookies
      document.cookie = "next-auth.session-token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=lax";
      document.cookie = "__Secure-next-auth.session-token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=lax";
      
      document.getElementById('status').innerHTML = '✅ Cookie créé ! Redirection...';
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    </script>
    <noscript>
      <p>JavaScript requis. <a href="/dashboard">Cliquez ici</a> pour continuer.</p>
    </noscript>
  </div>
</body>
</html>
    `;
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Force login error:', error);
    return NextResponse.json({ 
      error: 'Failed to create session', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
