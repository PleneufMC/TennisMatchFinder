/**
 * API Route: Auto-Validate Matches CRON
 * POST - Auto-valide les matchs non confirmés après 24h
 * 
 * Exécution : Toutes les heures via Netlify Scheduled Function
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches, players, eloHistory, notifications } from '@/lib/db/schema';
import { eq, and, lte, isNull } from 'drizzle-orm';
import { VALIDATION_MESSAGES } from '@/lib/constants/validation';
import { triggerBadgeCheckAfterMatch } from '@/lib/gamification/badge-checker';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification CRON
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Auto-Validate] CRON_SECRET not configured');
      return NextResponse.json({ error: 'CRON not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Auto-Validate] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Auto-Validate] Starting auto-validation check...');

    const now = new Date();

    // Trouver tous les matchs à auto-valider
    const matchesToValidate = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.validated, false),
          eq(matches.contested, false),
          lte(matches.autoValidateAt, now)
        )
      );

    console.log(`[Auto-Validate] Found ${matchesToValidate.length} matches to auto-validate`);

    let validated = 0;
    const errors: string[] = [];

    for (const match of matchesToValidate) {
      try {
        // Auto-valider le match
        await db
          .update(matches)
          .set({
            validated: true,
            autoValidated: true,
            validatedAt: now,
            updatedAt: now,
          })
          .where(eq(matches.id, match.id));

        // Mettre à jour les ELO des joueurs
        const player1NewElo = match.player1EloAfter;
        const player2NewElo = match.player2EloAfter;

        await db
          .update(players)
          .set({ currentElo: player1NewElo, updatedAt: now })
          .where(eq(players.id, match.player1Id));

        await db
          .update(players)
          .set({ currentElo: player2NewElo, updatedAt: now })
          .where(eq(players.id, match.player2Id));

        // Mettre à jour les stats
        const player1Stats = match.winnerId === match.player1Id
          ? { wins: 1, losses: 0 }
          : { wins: 0, losses: 1 };
        
        const player2Stats = match.winnerId === match.player2Id
          ? { wins: 1, losses: 0 }
          : { wins: 0, losses: 1 };

        await db.execute(
          `UPDATE players SET 
            matches_played = matches_played + 1, 
            wins = wins + ${player1Stats.wins},
            losses = losses + ${player1Stats.losses},
            last_match_at = NOW()
          WHERE id = '${match.player1Id}'`
        );

        await db.execute(
          `UPDATE players SET 
            matches_played = matches_played + 1, 
            wins = wins + ${player2Stats.wins},
            losses = losses + ${player2Stats.losses},
            last_match_at = NOW()
          WHERE id = '${match.player2Id}'`
        );

        // Enregistrer l'historique ELO
        const player1EloDelta = match.player1EloAfter - match.player1EloBefore;
        const player2EloDelta = match.player2EloAfter - match.player2EloBefore;

        await db.insert(eloHistory).values([
          {
            playerId: match.player1Id,
            matchId: match.id,
            elo: player1NewElo,
            delta: player1EloDelta,
            reason: match.winnerId === match.player1Id ? 'match_win' : 'match_loss',
            metadata: { ...(match.modifiersApplied as object), autoValidated: true },
          },
          {
            playerId: match.player2Id,
            matchId: match.id,
            elo: player2NewElo,
            delta: player2EloDelta,
            reason: match.winnerId === match.player2Id ? 'match_win' : 'match_loss',
            metadata: { ...(match.modifiersApplied as object), autoValidated: true },
          },
        ]);

        // Récupérer les noms des joueurs pour les notifications
        const [player1] = await db
          .select({ fullName: players.fullName })
          .from(players)
          .where(eq(players.id, match.player1Id))
          .limit(1);

        const [player2] = await db
          .select({ fullName: players.fullName })
          .from(players)
          .where(eq(players.id, match.player2Id))
          .limit(1);

        // Notifier les deux joueurs
        const player1Msg = VALIDATION_MESSAGES.autoValidated(
          player2?.fullName || 'adversaire',
          match.score
        );
        const player2Msg = VALIDATION_MESSAGES.autoValidated(
          player1?.fullName || 'adversaire',
          match.score
        );

        await db.insert(notifications).values([
          {
            userId: match.player1Id,
            type: 'match_auto_validated',
            title: player1Msg.title,
            message: player1Msg.body,
            link: '/matchs',
            data: {
              matchId: match.id,
              autoValidated: true,
              eloChange: player1EloDelta,
            },
          },
          {
            userId: match.player2Id,
            type: 'match_auto_validated',
            title: player2Msg.title,
            message: player2Msg.body,
            link: '/matchs',
            data: {
              matchId: match.id,
              autoValidated: true,
              eloChange: player2EloDelta,
            },
          },
        ]);

        // Vérifier et attribuer les badges
        await triggerBadgeCheckAfterMatch(
          match.player1Id,
          match.player2Id,
          match.winnerId,
          {
            player1Elo: match.player1EloBefore,
            player2Elo: match.player2EloBefore,
            matchId: match.id,
            clubId: match.clubId,
          }
        );

        validated++;
        console.log(`[Auto-Validate] Match ${match.id} auto-validated successfully`);
      } catch (error) {
        const errorMsg = `Failed to auto-validate match ${match.id}: ${error}`;
        console.error(`[Auto-Validate] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        matchesFound: matchesToValidate.length,
        matchesValidated: validated,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('[Auto-Validate] Completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Auto-Validate] Critical error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Endpoint de test/preview
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Compter les matchs à auto-valider
    const matchesToValidate = await db
      .select({
        id: matches.id,
        score: matches.score,
        createdAt: matches.createdAt,
        autoValidateAt: matches.autoValidateAt,
      })
      .from(matches)
      .where(
        and(
          eq(matches.validated, false),
          eq(matches.contested, false),
          lte(matches.autoValidateAt, now)
        )
      );

    return NextResponse.json({
      status: 'ready',
      timestamp: now.toISOString(),
      preview: {
        matchesCount: matchesToValidate.length,
        matches: matchesToValidate.slice(0, 10).map(m => ({
          id: m.id,
          score: m.score,
          createdAt: m.createdAt,
          autoValidateAt: m.autoValidateAt,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
