import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { createDefaultClubSections, getClubSections, createClubSection } from '@/lib/db/queries';

// GET - Récupérer les sections du club
export async function GET() {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.clubId) {
      return NextResponse.json({ sections: [] });
    }

    const sections = await getClubSections(player.clubId);

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sections' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle section ou les sections par défaut
export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin || !player.clubId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Si createDefaults est true, créer les sections par défaut
    if (body.createDefaults) {
      const sections = await createDefaultClubSections(player.clubId);
      return NextResponse.json({
        success: true,
        message: `${sections.length} section(s) créée(s)`,
        sections,
      });
    }

    // Sinon, créer une section personnalisée
    const { name, description, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom de la section est requis' },
        { status: 400 }
      );
    }

    const section = await createClubSection(
      player.clubId,
      name,
      description,
      icon
    );

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la section' },
      { status: 500 }
    );
  }
}
