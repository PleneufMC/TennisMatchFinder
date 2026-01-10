/**
 * API Route: Migrate Member
 * POST - Transfère un membre vers un autre club
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { players, clubs, notifications } from '@/lib/db/schema';
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

    const { memberId, targetClubId } = await request.json();

    if (!memberId || !targetClubId) {
      return NextResponse.json(
        { error: 'ID du membre et club de destination requis' },
        { status: 400 }
      );
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

    // Vérifier que le club de destination existe
    const [targetClub] = await db
      .select()
      .from(clubs)
      .where(and(eq(clubs.id, targetClubId), eq(clubs.isActive, true)))
      .limit(1);

    if (!targetClub) {
      return NextResponse.json({ error: 'Club de destination non trouvé' }, { status: 404 });
    }

    // Ne pas permettre de se migrer soi-même
    if (memberId === currentPlayer.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous migrer vous-même' },
        { status: 400 }
      );
    }

    // Migrer le membre vers le nouveau club
    await db
      .update(players)
      .set({ 
        clubId: targetClubId,
        isAdmin: false, // Reset admin status dans le nouveau club
        updatedAt: new Date() 
      })
      .where(eq(players.id, memberId));

    // Notifier le membre
    await db.insert(notifications).values({
      userId: memberId,
      type: 'club_migrated',
      title: 'Transfert vers un nouveau club',
      message: `Vous avez été transféré vers le club ${targetClub.name}.`,
      link: '/dashboard',
    });

    return NextResponse.json({
      success: true,
      message: `${member.fullName} a été migré vers ${targetClub.name}`,
      targetClub: {
        id: targetClub.id,
        name: targetClub.name,
        slug: targetClub.slug,
      },
    });
  } catch (error) {
    console.error('Error migrating member:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la migration du membre' },
      { status: 500 }
    );
  }
}
