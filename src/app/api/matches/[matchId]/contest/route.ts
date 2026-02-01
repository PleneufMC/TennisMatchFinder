/**
 * API Route: Contest Match
 * POST - Permet à un joueur de contester un match (avant ou après validation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches, players, notifications } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, and, or, gte, count } from 'drizzle-orm';
import { canContestMatch, MATCH_VALIDATION_CONFIG } from '@/lib/constants/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // BUG-007 FIX: Next.js 15 requires awaiting params
    const { matchId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Veuillez fournir une raison détaillée (minimum 10 caractères)' },
        { status: 400 }
      );
    }

    // Récupérer le match
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    // Vérifier que le joueur est impliqué dans le match
    const isPlayer1 = match.player1Id === player.id;
    const isPlayer2 = match.player2Id === player.id;

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas impliqué dans ce match' },
        { status: 403 }
      );
    }

    // Vérifier si le match est déjà contesté
    if (match.contested) {
      return NextResponse.json(
        { error: 'Ce match est déjà en cours de contestation' },
        { status: 400 }
      );
    }

    // Vérifier si on peut encore contester (7 jours après validation)
    if (match.validated && !canContestMatch(match.validatedAt)) {
      return NextResponse.json(
        { error: 'La période de contestation est expirée (7 jours après validation)' },
        { status: 400 }
      );
    }

    // Vérifier le nombre de contestations ce mois-ci
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [contestCount] = await db
      .select({ count: count() })
      .from(matches)
      .where(
        and(
          eq(matches.contestedBy, player.id),
          gte(matches.contestedAt, startOfMonth)
        )
      );

    if ((contestCount?.count || 0) >= MATCH_VALIDATION_CONFIG.maxContestationsPerMonth) {
      return NextResponse.json(
        { error: `Vous avez atteint la limite de ${MATCH_VALIDATION_CONFIG.maxContestationsPerMonth} contestations ce mois-ci` },
        { status: 400 }
      );
    }

    // Marquer le match comme contesté
    await db
      .update(matches)
      .set({
        contested: true,
        contestedBy: player.id,
        contestedAt: new Date(),
        contestReason: reason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    // Notifier l'autre joueur
    const otherPlayerId = isPlayer1 ? match.player2Id : match.player1Id;
    
    await db.insert(notifications).values({
      userId: otherPlayerId,
      type: 'match_contested',
      title: '⚠️ Match contesté',
      message: `${player.fullName} a contesté le résultat de votre match. Un administrateur va examiner la situation.`,
      link: `/matchs`,
      data: {
        matchId,
        contestedBy: player.id,
        contestedByName: player.fullName,
        reason: reason.trim(),
      },
    });

    // Notifier les admins du club
    const clubAdmins = await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.clubId, match.clubId),
          eq(players.isAdmin, true)
        )
      );

    for (const admin of clubAdmins) {
      if (admin.id !== player.id) {
        await db.insert(notifications).values({
          userId: admin.id,
          type: 'match_contested_admin',
          title: '🚨 Match contesté - Action requise',
          message: `${player.fullName} a contesté un match. Raison : "${reason.trim().substring(0, 100)}..."`,
          link: `/admin/matchs/${matchId}`,
          data: {
            matchId,
            contestedBy: player.id,
            contestedByName: player.fullName,
            reason: reason.trim(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contestation enregistrée. Un administrateur va examiner votre demande.',
      contestedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error contesting match:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET - Récupérer le statut de contestation d'un match
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // BUG-007 FIX: Next.js 15 requires awaiting params
    const { matchId } = await params;

    const [match] = await db
      .select({
        contested: matches.contested,
        contestedAt: matches.contestedAt,
        contestedBy: matches.contestedBy,
        contestReason: matches.contestReason,
        contestResolvedAt: matches.contestResolvedAt,
        contestResolution: matches.contestResolution,
        validated: matches.validated,
        validatedAt: matches.validatedAt,
      })
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: 'Match non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      contested: match.contested,
      contestedAt: match.contestedAt,
      contestedBy: match.contestedBy,
      contestReason: match.contestReason,
      contestResolved: !!match.contestResolvedAt,
      contestResolution: match.contestResolution,
      canContest: !match.contested && canContestMatch(match.validatedAt),
    });
  } catch (error) {
    console.error('Error getting contest status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
