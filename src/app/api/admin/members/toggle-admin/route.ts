/**
 * API Route: Toggle Admin Status
 * POST - Ajoute ou retire les droits admin d'un membre
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const currentPlayer = await getServerPlayer();

    if (!currentPlayer) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!currentPlayer.isAdmin || !currentPlayer.clubId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'ID du membre requis' }, { status: 400 });
    }

    // Vérifier que le membre appartient au même club
    const [member] = await db
      .select()
      .from(players)
      .where(and(eq(players.id, memberId), eq(players.clubId, currentPlayer.clubId)))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }

    // Ne pas permettre de se retirer ses propres droits admin
    if (memberId === currentPlayer.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier vos propres droits admin' },
        { status: 400 }
      );
    }

    // Toggle le statut admin
    const newIsAdmin = !member.isAdmin;
    await db
      .update(players)
      .set({ isAdmin: newIsAdmin, updatedAt: new Date() })
      .where(eq(players.id, memberId));

    return NextResponse.json({
      success: true,
      isAdmin: newIsAdmin,
      message: newIsAdmin
        ? `${member.fullName} est maintenant administrateur`
        : `${member.fullName} n'est plus administrateur`,
    });
  } catch (error) {
    console.error('Error toggling admin:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}
