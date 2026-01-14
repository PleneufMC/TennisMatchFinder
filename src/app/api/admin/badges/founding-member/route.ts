/**
 * API Route: Award Founding Member Badge
 * POST - Attribue le badge Founding Member à tous les joueurs éligibles
 * 
 * Réservé aux super admins
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { isSuperAdminEmail } from '@/lib/constants/admins';
import { awardFoundingMemberToAllEligible } from '@/lib/gamification/badge-checker';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier super admin
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, player.id))
      .limit(1);

    if (!user?.email || !isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Attribuer le badge à tous les éligibles
    const result = await awardFoundingMemberToAllEligible();

    return NextResponse.json({
      success: true,
      message: `Badge Founding Member attribué à ${result.awarded} joueurs`,
      stats: result,
    });
  } catch (error) {
    console.error('Error awarding founding member badges:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET - Prévisualisation : combien de joueurs seraient éligibles
 */
export async function GET(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier super admin
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, player.id))
      .limit(1);

    if (!user?.email || !isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Compter les joueurs éligibles
    const { players, playerBadges } = await import('@/lib/db/schema');
    const { and, eq: eqOp, lte, isNull, sql } = await import('drizzle-orm');
    
    const EARLY_BIRD_DEADLINE = new Date('2026-06-30T23:59:59');

    // Total joueurs inscrits avant la deadline
    const [eligibleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(lte(players.createdAt, EARLY_BIRD_DEADLINE));

    // Joueurs qui ont déjà le badge
    const [alreadyHaveCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(playerBadges)
      .where(eqOp(playerBadges.badgeId, 'founding-member'));

    const eligible = Number(eligibleCount?.count || 0);
    const alreadyHave = Number(alreadyHaveCount?.count || 0);
    const toAward = eligible - alreadyHave;

    return NextResponse.json({
      earlyBirdDeadline: EARLY_BIRD_DEADLINE.toISOString(),
      stats: {
        eligiblePlayers: eligible,
        alreadyHaveBadge: alreadyHave,
        toBeAwarded: Math.max(0, toAward),
      },
    });
  } catch (error) {
    console.error('Error getting founding member stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
