import { NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getWeeklyStreakInfo } from '@/lib/gamification/streaks';
import { getPlayerChallengeProgress, getChallengeSummary } from '@/lib/gamification/challenges';
import { getPlayerBadgesForDisplay } from '@/lib/gamification/badge-checker';
import { BADGES, getBadgeById } from '@/lib/gamification/badges';

/**
 * GET /api/gamification
 * Récupère toutes les données de gamification du joueur connecté
 */
export async function GET() {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer toutes les données en parallèle
    const [streakInfo, challengeProgress, challengeSummary, badges] = await Promise.all([
      getWeeklyStreakInfo(player.id),
      getPlayerChallengeProgress(player.id),
      getChallengeSummary(player.id),
      getPlayerBadgesForDisplay(player.id),
    ]);

    // Formater les badges avec les infos complètes
    const formattedBadges = badges.map((b) => {
      const badgeInfo = getBadgeById(b.badgeId);
      return {
        ...b,
        category: badgeInfo?.category,
        tier: badgeInfo?.tier,
      };
    });

    return NextResponse.json({
      streak: streakInfo,
      challenges: {
        progress: challengeProgress,
        summary: challengeSummary,
      },
      badges: {
        earned: formattedBadges,
        totalAvailable: BADGES.length,
        earnedCount: badges.length,
      },
    });
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}
