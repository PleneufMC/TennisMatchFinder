/**
 * API Admin - Gestion des clubs
 * GET /api/admin/clubs/[clubId] - Récupérer un club
 * PUT /api/admin/clubs/[clubId] - Mettre à jour un club
 * DELETE /api/admin/clubs/[clubId] - Supprimer un club
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, clubs, matches, forumThreads, forumReplies, notifications } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const player = await db
      .select({ isAdmin: players.isAdmin, clubId: players.clubId })
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player[0]?.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { clubId } = await params;

    // Vérifier que l'admin gère ce club
    if (player[0].clubId !== clubId) {
      return NextResponse.json({ error: 'Vous ne pouvez gérer que votre club' }, { status: 403 });
    }

    // Parser les données
    const body = await request.json();
    const { name, description, bannerUrl, logoUrl, contactEmail, websiteUrl, address } = body;

    // Mettre à jour le club
    const updated = await db
      .update(clubs)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(bannerUrl !== undefined && { bannerUrl }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(address !== undefined && { address }),
        updatedAt: new Date(),
      })
      .where(eq(clubs.id, clubId))
      .returning();

    if (!updated[0]) {
      return NextResponse.json({ error: 'Club non trouvé' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating club:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;

    const club = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);

    if (!club[0]) {
      return NextResponse.json({ error: 'Club non trouvé' }, { status: 404 });
    }

    return NextResponse.json(club[0]);
  } catch (error) {
    console.error('Error fetching club:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const player = await db
      .select({ isAdmin: players.isAdmin, clubId: players.clubId })
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player[0]?.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { clubId } = await params;

    // Vérifier que le club existe
    const club = await db
      .select({ id: clubs.id, name: clubs.name })
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);

    if (!club[0]) {
      return NextResponse.json({ error: 'Club non trouvé' }, { status: 404 });
    }

    // Empêcher la suppression de son propre club
    if (player[0].clubId === clubId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre club' },
        { status: 400 }
      );
    }

    // Vérifier qu'il n'y a pas de joueurs dans ce club
    const playersInClub = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(eq(players.clubId, clubId));

    const playerCount = Number(playersInClub[0]?.count || 0);

    if (playerCount > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer ce club : ${playerCount} joueur(s) y sont encore inscrits` },
        { status: 400 }
      );
    }

    // Supprimer le club (les cascades s'occuperont des dépendances)
    await db.delete(clubs).where(eq(clubs.id, clubId));

    return NextResponse.json({
      success: true,
      message: `Club "${club[0].name}" supprimé avec succès`,
    });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du club' },
      { status: 500 }
    );
  }
}
