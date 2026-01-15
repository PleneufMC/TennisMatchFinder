/**
 * API Route: Register a new Passkey
 * 
 * POST /api/auth/passkey/register
 * - Requires authenticated user
 * - Registers a new passkey (Touch ID, Face ID, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from '@/lib/webauthn/server';
import { getDeviceName } from '@/lib/webauthn/config';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

// GET: Generate registration options
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour ajouter une Passkey' },
        { status: 401 }
      );
    }

    const options = await generatePasskeyRegistrationOptions(
      session.user.id,
      session.user.email,
      session.user.name || undefined
    );

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des options' },
      { status: 500 }
    );
  }
}

// POST: Verify registration and save passkey
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour ajouter une Passkey' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { response, name } = body as { 
      response: RegistrationResponseJSON; 
      name?: string;
    };

    if (!response) {
      return NextResponse.json(
        { error: 'Réponse WebAuthn manquante' },
        { status: 400 }
      );
    }

    // Auto-generate name if not provided
    const passkeyName = name || getDeviceName(
      response.response.transports
    );

    const result = await verifyPasskeyRegistration(
      session.user.id,
      response,
      passkeyName
    );

    return NextResponse.json({
      success: true,
      message: 'Passkey enregistrée avec succès !',
      credentialId: result.credentialId,
    });
  } catch (error) {
    console.error('Error registering passkey:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement' },
      { status: 500 }
    );
  }
}
