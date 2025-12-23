import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getAllClubs, createClub, getClubStats } from '@/lib/db/queries';

// GET - Récupérer tous les clubs (admin seulement)
export async function GET() {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const clubs = await getAllClubs();
    
    // Ajouter les stats pour chaque club
    const clubsWithStats = await Promise.all(
      clubs.map(async (club) => {
        const stats = await getClubStats(club.id);
        return { ...club, ...stats };
      })
    );

    return NextResponse.json({ clubs: clubsWithStats });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clubs' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau club
export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, contactEmail, websiteUrl, address } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Le nom et le slug sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que le slug est valide (lettres, chiffres, tirets)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      return NextResponse.json(
        { error: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets' },
        { status: 400 }
      );
    }

    const club = await createClub({
      name,
      slug,
      description,
      contactEmail,
      websiteUrl,
      address,
    });

    return NextResponse.json({
      success: true,
      club,
    });
  } catch (error) {
    console.error('Error creating club:', error);
    
    // Gérer l'erreur de slug unique
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Ce slug est déjà utilisé par un autre club' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du club' },
      { status: 500 }
    );
  }
}
