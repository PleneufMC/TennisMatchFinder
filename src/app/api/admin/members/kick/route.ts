/**
 * API Route: Kick Member
 * POST - Retire un membre du club (le rend indépendant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { players, notifications } from '@/lib/db/schema';
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

    // Ne pas permettre de se retirer soi-même
    if (memberId === currentPlayer.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous retirer vous-même du club' },
        { status: 400 }
      );
    }

    // Retirer le membre du club (le rendre indépendant)
    await db
      .update(players)
      .set({ 
        clubId: null, 
        isAdmin: false, // Retirer aussi les droits admin
        updatedAt: new Date() 
      })
      .where(eq(players.id, memberId));

    // Notifier le membre
    await db.insert(notifications).values({
      userId: memberId,
      type: 'club_kicked',
      title: 'Vous avez été retiré du club',
      message: `Un administrateur vous a retiré du club. Vous êtes maintenant un joueur indépendant.`,
      link: '/dashboard',
    });

    return NextResponse.json({
      success: true,
      message: `${member.fullName} a été retiré du club`,
    });
  } catch (error) {
    console.error('Error kicking member:', error);
    return NextResponse.json(
      { error: 'Erreur lors du retrait du membre' },
      { status: 500 }
    );
  }
}
