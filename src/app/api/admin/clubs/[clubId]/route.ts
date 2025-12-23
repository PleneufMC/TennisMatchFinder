import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getClubById, updateClub } from '@/lib/db/queries';

// GET - Récupérer un club spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { clubId } = await params;
    const club = await getClubById(clubId);

    if (!club) {
      return NextResponse.json({ error: 'Club non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ club });
  } catch (error) {
    console.error('Error fetching club:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du club' },
      { status: 500 }
    );
  }
}

// PATCH - Modifier un club
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { clubId } = await params;
    const body = await request.json();
    const { name, description, contactEmail, websiteUrl, address, isActive } = body;

    const club = await updateClub(clubId, {
      name,
      description,
      contactEmail,
      websiteUrl,
      address,
      isActive,
    });

    return NextResponse.json({
      success: true,
      club,
    });
  } catch (error) {
    console.error('Error updating club:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du club' },
      { status: 500 }
    );
  }
}
