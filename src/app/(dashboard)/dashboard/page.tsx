import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import { getServerPlayer } from '@/lib/auth-helpers';
import { 
  getMatchesByPlayer, 
  getEloHistoryByPlayer, 
  getPendingProposalsForPlayer 
} from '@/lib/db/queries';
import { calculateEloTrend } from '@/lib/elo';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer les statistiques avec Drizzle
  const [recentMatches, eloHistory, pendingProposals] = await Promise.all([
    getMatchesByPlayer(player.id, { limit: 5 }),
    getEloHistoryByPlayer(player.id, { limit: 10 }),
    getPendingProposalsForPlayer(player.id, { limit: 5 }),
  ]);

  // Calculer la tendance
  const trend = calculateEloTrend(eloHistory.map(h => ({ delta: h.delta })));
  const recentDelta = eloHistory.slice(0, 5).reduce((sum, h) => sum + h.delta, 0);

  // Calculer le taux de victoire
  const winRate = player.matchesPlayed > 0
    ? Math.round((player.wins / player.matchesPlayed) * 100)
    : 0;

  return (
    <DashboardContent
      player={{
        id: player.id,
        fullName: player.fullName,
        currentElo: player.currentElo,
        matchesPlayed: player.matchesPlayed,
        wins: player.wins,
        losses: player.losses,
        uniqueOpponents: player.uniqueOpponents,
        winStreak: player.winStreak,
        bestWinStreak: player.bestWinStreak,
        club: player.club ? {
          name: player.club.name,
          bannerUrl: player.club.bannerUrl,
        } : null,
      }}
      recentMatches={recentMatches.map(m => ({
        id: m.id,
        winnerId: m.winnerId,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        player1: { fullName: m.player1.fullName },
        player2: { fullName: m.player2.fullName },
        player1EloAfter: m.player1EloAfter,
        player1EloBefore: m.player1EloBefore,
        player2EloAfter: m.player2EloAfter,
        player2EloBefore: m.player2EloBefore,
        score: m.score,
        playedAt: m.playedAt,
      }))}
      pendingProposals={pendingProposals.map(p => ({
        id: p.id,
        fromPlayer: { fullName: p.fromPlayer.fullName },
      }))}
      trend={trend}
      recentDelta={recentDelta}
      winRate={winRate}
    />
  );
}
