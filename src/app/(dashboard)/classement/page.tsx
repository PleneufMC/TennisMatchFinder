import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import { getServerPlayer } from '@/lib/auth-helpers';
import { getClubRanking } from '@/lib/db/queries';
import { RankingContent } from '@/components/ranking/ranking-content';

export const metadata: Metadata = {
  title: 'Ranking',
  description: 'Club ELO ranking',
};

export default async function ClassementPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer le classement du club (si le joueur a un club)
  const players = player.clubId ? await getClubRanking(player.clubId) : [];

  return (
    <RankingContent
      player={{
        id: player.id,
        fullName: player.fullName,
        currentElo: player.currentElo,
        matchesPlayed: player.matchesPlayed,
        wins: player.wins,
        losses: player.losses,
        winStreak: player.winStreak,
        clubId: player.clubId,
      }}
      players={players.map(p => ({
        id: p.id,
        fullName: p.fullName,
        currentElo: p.currentElo,
        matchesPlayed: p.matchesPlayed,
        wins: p.wins,
        losses: p.losses,
        winStreak: p.winStreak,
      }))}
    />
  );
}
