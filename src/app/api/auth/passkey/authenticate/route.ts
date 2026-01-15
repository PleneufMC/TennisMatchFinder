/**
 * API Route: Authenticate with Passkey
 * 
 * POST /api/auth/passkey/authenticate
 * - Authenticates user with their passkey (Touch ID, Face ID, etc.)
 * - Returns user info for session creation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from '@/lib/webauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';

// GET: Generate authentication options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || undefined;

    const options = await generatePasskeyAuthenticationOptions(email);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des options' },
      { status: 500 }
    );
  }
}

// POST: Verify authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { response } = body as { response: AuthenticationResponseJSON };

    if (!response) {
      return NextResponse.json(
        { error: 'Réponse WebAuthn manquante' },
        { status: 400 }
      );
    }

    const result = await verifyPasskeyAuthentication(response);

    return NextResponse.json({
      success: true,
      userId: result.userId,
      email: result.userEmail,
      name: result.userName,
    });
  } catch (error) {
    console.error('Error authenticating with passkey:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Échec de l\'authentification' },
      { status: 401 }
    );
  }
}
