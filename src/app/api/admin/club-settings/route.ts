import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, clubs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player || !player.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les infos du club
    const [club] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, player.clubId))
      .limit(1);

    if (!club) {
      return NextResponse.json({ error: 'Club non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      id: club.id,
      name: club.name,
      slug: club.slug,
      description: club.description,
      contactEmail: club.contactEmail,
      websiteUrl: club.websiteUrl,
      address: club.address,
      bannerUrl: club.bannerUrl,
      logoUrl: club.logoUrl,
    });
  } catch (error) {
    console.error('Error fetching club settings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player || !player.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, contactEmail, websiteUrl, address, bannerUrl, logoUrl } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Le nom du club est requis' }, { status: 400 });
    }

    // Mettre à jour le club
    const [updatedClub] = await db
      .update(clubs)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        websiteUrl: websiteUrl?.trim() || null,
        address: address?.trim() || null,
        bannerUrl: bannerUrl?.trim() || null,
        logoUrl: logoUrl?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(clubs.id, player.clubId))
      .returning();

    if (!updatedClub) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({
      id: updatedClub.id,
      name: updatedClub.name,
      slug: updatedClub.slug,
      description: updatedClub.description,
      contactEmail: updatedClub.contactEmail,
      websiteUrl: updatedClub.websiteUrl,
      address: updatedClub.address,
      bannerUrl: updatedClub.bannerUrl,
      logoUrl: updatedClub.logoUrl,
    });
  } catch (error) {
    console.error('Error updating club settings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    );
  }
}
