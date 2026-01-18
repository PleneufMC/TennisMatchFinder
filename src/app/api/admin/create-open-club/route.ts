/**
 * API Route: Create Open Club and migrate independent players
 * POST /api/admin/create-open-club
 * 
 * This creates a default "Open Club" for players who register without joining a specific club.
 * All existing players with clubId = null will be migrated to this club.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { clubs, players } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

// Open Club configuration
const OPEN_CLUB_CONFIG = {
  name: 'Open Club',
  slug: 'open-club',
  description: 'Club ouvert à tous les joueurs de tennis, sans affiliation requise. Trouvez des partenaires de jeu partout en France !',
  contactEmail: 'contact@tennismatchfinder.net',
  isActive: true,
};

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization (via header for scripts or session for UI)
    const adminKey = request.headers.get('x-admin-key');
    const session = await getServerSession(authOptions);
    
    const isAuthorized = adminKey === process.env.ADMIN_SECRET_KEY || 
                         session?.user?.player?.isAdmin === true;
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Check if Open Club already exists
    const existingClub = await db
      .select()
      .from(clubs)
      .where(eq(clubs.slug, OPEN_CLUB_CONFIG.slug))
      .limit(1);

    let openClubId: string;

    if (existingClub[0]) {
      // Club already exists
      openClubId = existingClub[0].id;
      console.log('[Open Club] Club already exists with ID:', openClubId);
    } else {
      // Create the Open Club
      const [newClub] = await db
        .insert(clubs)
        .values(OPEN_CLUB_CONFIG)
        .returning();

      if (!newClub) {
        throw new Error('Failed to create Open Club');
      }

      openClubId = newClub.id;
      console.log('[Open Club] Created new club with ID:', openClubId);
    }

    // Find all players without a club
    const playersWithoutClub = await db
      .select({ id: players.id, fullName: players.fullName })
      .from(players)
      .where(isNull(players.clubId));

    console.log('[Open Club] Found', playersWithoutClub.length, 'players without club');

    // Migrate players to Open Club
    if (playersWithoutClub.length > 0) {
      const updateResult = await db
        .update(players)
        .set({ 
          clubId: openClubId,
          updatedAt: new Date(),
        })
        .where(isNull(players.clubId));

      console.log('[Open Club] Migrated players to Open Club');
    }

    return NextResponse.json({
      success: true,
      message: `Open Club créé/vérifié et ${playersWithoutClub.length} joueur(s) migré(s)`,
      openClubId,
      migratedPlayers: playersWithoutClub.map(p => ({
        id: p.id,
        fullName: p.fullName,
      })),
    });

  } catch (error) {
    console.error('[Open Club] Error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du club',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check Open Club status
export async function GET(request: NextRequest) {
  try {
    // Check if Open Club exists
    const existingClub = await db
      .select()
      .from(clubs)
      .where(eq(clubs.slug, OPEN_CLUB_CONFIG.slug))
      .limit(1);

    // Count players without club
    const playersWithoutClub = await db
      .select({ id: players.id })
      .from(players)
      .where(isNull(players.clubId));

    return NextResponse.json({
      openClubExists: !!existingClub[0],
      openClub: existingClub[0] || null,
      playersWithoutClubCount: playersWithoutClub.length,
    });

  } catch (error) {
    console.error('[Open Club] GET Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
