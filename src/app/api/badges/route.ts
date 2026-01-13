/**
 * API Route: GET /api/badges
 * 
 * Récupère tous les badges disponibles avec l'état pour le joueur connecté.
 * Retourne aussi les badges non vus pour afficher les célébrations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { badges, playerBadges, players } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { BADGE_DEFINITIONS } from '@/lib/gamification/badges';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    // Vérifier que le joueur existe
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);
    
    if (!player) {
      return NextResponse.json({ error: 'Profil joueur non trouvé' }, { status: 404 });
    }
    
    // Récupérer les badges du joueur
    const playerBadgesList = await db
      .select()
      .from(playerBadges)
      .where(eq(playerBadges.playerId, player.id));
    
    // Mapper les badges avec leur état
    const badgeMap = new Map(
      playerBadgesList.map(pb => [pb.badgeId, pb])
    );
    
    // Construire la réponse
    const allBadges = BADGE_DEFINITIONS.map(badge => {
      const playerBadge = badgeMap.get(badge.id);
      const isUnlocked = !!playerBadge;
      
      return {
        ...badge,
        isUnlocked,
        earnedAt: playerBadge?.earnedAt?.toISOString() || null,
        progress: playerBadge?.progress ?? 0,
        seen: playerBadge?.seen ?? true,
      };
    });
    
    // Badges non vus (pour célébration)
    const unseenBadges = allBadges.filter(b => b.isUnlocked && !b.seen);
    
    // Stats
    const stats = {
      total: BADGE_DEFINITIONS.length,
      earned: playerBadgesList.length,
      unseenCount: unseenBadges.length,
      byCategory: {
        milestone: { total: 0, earned: 0 },
        achievement: { total: 0, earned: 0 },
        social: { total: 0, earned: 0 },
        special: { total: 0, earned: 0 },
      },
      byTier: {
        common: { total: 0, earned: 0 },
        rare: { total: 0, earned: 0 },
        epic: { total: 0, earned: 0 },
        legendary: { total: 0, earned: 0 },
      },
    };
    
    BADGE_DEFINITIONS.forEach(badge => {
      stats.byCategory[badge.category].total++;
      stats.byTier[badge.tier].total++;
      
      if (badgeMap.has(badge.id)) {
        stats.byCategory[badge.category].earned++;
        stats.byTier[badge.tier].earned++;
      }
    });
    
    return NextResponse.json({
      badges: allBadges,
      unseenBadges,
      stats,
      player: {
        id: player.id,
        fullName: player.fullName,
        matchesPlayed: player.matchesPlayed,
        currentElo: player.currentElo,
      },
    });
    
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
