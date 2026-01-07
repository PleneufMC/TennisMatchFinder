/**
 * API Admin - Gestion des clubs
 * PUT /api/admin/clubs/[clubId] - Mettre à jour un club
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, clubs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
