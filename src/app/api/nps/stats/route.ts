/**
 * API Route NPS Stats (Admin only)
 * GET /api/nps/stats - Récupérer les statistiques NPS
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getNpsStats, getRecentNpsResponses } from '@/lib/nps/service';

/**
 * GET /api/nps/stats
 * Récupère les statistiques NPS (réservé aux admins)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const [player] = await db
      .select({ isAdmin: players.isAdmin })
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player?.isAdmin) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de période
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'week', 'month', 'quarter', 'all'

    let fromDate: Date | undefined;
    const now = new Date();

    switch (period) {
      case 'week':
        fromDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        fromDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        fromDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
    }

    // Récupérer les stats et les dernières réponses
    const [stats, recentResponses] = await Promise.all([
      getNpsStats({ fromDate }),
      getRecentNpsResponses(50),
    ]);

    return NextResponse.json({
      stats,
      recentResponses,
      period,
    });
  } catch (error) {
    console.error('NPS stats error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
