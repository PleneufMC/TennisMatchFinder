/**
 * API Route: Manage user's Passkeys
 * 
 * GET /api/auth/passkey - List user's passkeys
 * DELETE /api/auth/passkey - Delete a passkey
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPasskeys, deletePasskey } from '@/lib/webauthn/server';
import { getDeviceName } from '@/lib/webauthn/config';

// GET: List user's passkeys
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const passkeys = await getUserPasskeys(session.user.id);

    // Format for frontend
    const formattedPasskeys = passkeys.map(p => ({
      id: p.id,
      name: p.name || getDeviceName(p.transports),
      createdAt: p.createdAt,
      lastUsedAt: p.lastUsedAt,
      credentialBackedUp: p.credentialBackedUp,
      deviceType: p.credentialDeviceType,
    }));

    return NextResponse.json({ passkeys: formattedPasskeys });
  } catch (error) {
    console.error('Error fetching passkeys:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des passkeys' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a passkey
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const passkeyId = searchParams.get('id');

    if (!passkeyId) {
      return NextResponse.json(
        { error: 'ID de passkey manquant' },
        { status: 400 }
      );
    }

    const deleted = await deletePasskey(session.user.id, passkeyId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Passkey non trouvée ou non autorisée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Passkey supprimée',
    });
  } catch (error) {
    console.error('Error deleting passkey:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
