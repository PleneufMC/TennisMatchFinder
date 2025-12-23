import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { players, eloHistory } from '@/lib/db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { ELO_CONFIG } from '@/lib/elo/types';

/**
 * Cron job pour appliquer la décroissance ELO due à l'inactivité
 * À exécuter quotidiennement via Netlify Scheduled Functions ou un service externe
 * 
 * GET /api/cron/inactivity-decay
 */
export async function GET(request: NextRequest) {
  // Vérifier l'authentification du cron job
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Calculer la date limite d'inactivité (14 jours par défaut)
    const inactivityThreshold = new Date();
    inactivityThreshold.setDate(
      inactivityThreshold.getDate() - ELO_CONFIG.INACTIVITY_DAYS_THRESHOLD
    );

    // Trouver tous les joueurs inactifs
    const inactivePlayers = await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.isActive, true),
          lt(players.lastMatchAt, inactivityThreshold)
        )
      );

    const results = [];

    for (const player of inactivePlayers) {
      // Calculer les jours d'inactivité
      const lastMatch = player.lastMatchAt || player.createdAt;
      const daysInactive = Math.floor(
        (Date.now() - lastMatch.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculer la décroissance (max 5 points par jour au-delà du seuil)
      const decayDays = daysInactive - ELO_CONFIG.INACTIVITY_DAYS_THRESHOLD;
      const decayAmount = Math.min(
        decayDays * ELO_CONFIG.INACTIVITY_DECAY_PER_DAY,
        ELO_CONFIG.MAX_INACTIVITY_DECAY
      );

      if (decayAmount <= 0) continue;

      // Ne pas descendre en dessous du minimum
      const newElo = Math.max(
        player.currentElo - decayAmount,
        ELO_CONFIG.MIN_ELO
      );
      const actualDecay = player.currentElo - newElo;

      if (actualDecay <= 0) continue;

      // Mettre à jour l'ELO du joueur
      await db
        .update(players)
        .set({
          currentElo: newElo,
          lowestElo: Math.min(player.lowestElo, newElo),
          updatedAt: new Date(),
        })
        .where(eq(players.id, player.id));

      // Enregistrer dans l'historique
      await db.insert(eloHistory).values({
        playerId: player.id,
        elo: newElo,
        delta: -actualDecay,
        reason: 'inactivity_decay',
        metadata: {
          daysInactive,
          previousElo: player.currentElo,
        },
      });

      results.push({
        playerId: player.id,
        playerName: player.fullName,
        previousElo: player.currentElo,
        newElo,
        decay: actualDecay,
        daysInactive,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in inactivity decay cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
