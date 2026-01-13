/**
 * API Route: Super Admin - Change Club
 * POST - Permet à un super admin de changer le club d'un joueur
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { players, clubs, users, notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { isSuperAdminEmail } from '@/lib/constants/admins';

async function isSuperAdmin(playerId: string): Promise<boolean> {
  const [result] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, playerId))
    .limit(1);
  
  return isSuperAdminEmail(result?.email);
}

export async function POST(request: NextRequest) {
  try {
    const currentPlayer = await getServerPlayer();

    if (!currentPlayer) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier si c'est un super admin
    const superAdmin = await isSuperAdmin(currentPlayer.id);
    if (!superAdmin) {
      return NextResponse.json({ error: 'Accès réservé aux super admins' }, { status: 403 });
    }

    const { playerId, targetClubId } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: 'ID du joueur requis' }, { status: 400 });
    }

    // Récupérer le joueur
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    // Si targetClubId est null, retirer le joueur du club
    if (targetClubId === null) {
      await db
        .update(players)
        .set({
          clubId: null,
          isAdmin: false,
          updatedAt: new Date(),
        })
        .where(eq(players.id, playerId));

      // Notifier le joueur
      await db.insert(notifications).values({
        userId: playerId,
        type: 'club_removed',
        title: 'Vous avez été retiré de votre club',
        message: 'Un administrateur vous a retiré de votre club. Vous êtes maintenant un joueur indépendant.',
        link: '/dashboard',
      });

      return NextResponse.json({
        success: true,
        message: `${player.fullName} est maintenant un joueur indépendant`,
      });
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

    // Mettre à jour le club du joueur
    await db
      .update(players)
      .set({
        clubId: targetClubId,
        isAdmin: false, // Reset admin status
        updatedAt: new Date(),
      })
      .where(eq(players.id, playerId));

    // Notifier le joueur
    await db.insert(notifications).values({
      userId: playerId,
      type: 'club_assigned',
      title: 'Vous avez été assigné à un club',
      message: `Vous avez été assigné au club ${targetClub.name}.`,
      link: `/dashboard`,
    });

    return NextResponse.json({
      success: true,
      message: `${player.fullName} a été assigné à ${targetClub.name}`,
      club: {
        id: targetClub.id,
        name: targetClub.name,
        slug: targetClub.slug,
      },
    });
  } catch (error) {
    console.error('Error changing player club:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de club' },
      { status: 500 }
    );
  }
}
