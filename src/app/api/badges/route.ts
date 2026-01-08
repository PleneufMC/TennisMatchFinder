import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getPlayerBadges, checkAndAwardBadges } from '@/lib/gamification';
import { BADGES, getBadgeById } from '@/lib/gamification/badges';

/**
 * GET /api/badges
 * Récupère les badges du joueur connecté
 */
export async function GET() {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const badges = await getPlayerBadges(player.id);

    // Formater avec les infos complètes des badges
    const formattedBadges = badges.map((b) => {
      const badgeInfo = getBadgeById(b.badgeType);
      return {
        ...b,
        category: badgeInfo?.category,
        rarity: badgeInfo?.rarity,
      };
    });

    return NextResponse.json({
      badges: formattedBadges,
      totalBadges: BADGES.length,
      earnedCount: badges.length,
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des badges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/badges/check
 * Vérifie et attribue les badges éligibles
 */
export async function POST() {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const newBadges = await checkAndAwardBadges(player.id);

    return NextResponse.json({
      newBadges,
      newBadgesCount: newBadges.length,
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification des badges' },
      { status: 500 }
    );
  }
}
