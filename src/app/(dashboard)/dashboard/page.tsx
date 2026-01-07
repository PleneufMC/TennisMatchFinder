import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Trophy, Swords, Users, TrendingUp, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClubBanner } from '@/components/club/club-banner';
import { getServerPlayer } from '@/lib/auth-helpers';
import { 
  getMatchesByPlayer, 
  getEloHistoryByPlayer, 
  getPendingProposalsForPlayer 
} from '@/lib/db/queries';
import { formatRelativeDate } from '@/lib/utils/dates';
import { formatEloDelta } from '@/lib/utils/format';
import { getEloRankTitle, calculateEloTrend } from '@/lib/elo';

export const metadata: Metadata = {
  title: 'Tableau de bord',
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
  const trend = calculateEloTrend(eloHistory.map(h => ({ delta: h.delta, recorded_at: h.recordedAt.toISOString() })));
  const recentDelta = eloHistory.slice(0, 5).reduce((sum, h) => sum + h.delta, 0);
  const rankInfo = getEloRankTitle(player.currentElo);

  // Calculer le taux de victoire
  const winRate = player.matchesPlayed > 0
    ? Math.round((player.wins / player.matchesPlayed) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Banner du club */}
      <ClubBanner 
        bannerUrl={player.club.bannerUrl} 
        clubName={player.club.name}
        height="md"
      >
        <div className="text-white">
          <p className="text-sm text-white/80 font-medium">{player.club.name}</p>
          <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
            Bonjour, {player.fullName.split(' ')[0]} ! 👋
          </h1>
          <p className="text-sm text-white/90 mt-1">
            Voici un aperçu de votre activité tennis
          </p>
        </div>
      </ClubBanner>

      {/* Cartes de stats principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ELO actuel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ELO actuel
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{player.currentElo}</span>
              {trend !== 'stable' && (
                <Badge variant={trend === 'up' ? 'default' : 'destructive'}>
                  {trend === 'up' ? '↑' : '↓'} {formatEloDelta(recentDelta)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <span>{rankInfo.icon}</span>
              <span className={rankInfo.color}>{rankInfo.title}</span>
            </p>
          </CardContent>
        </Card>

        {/* Matchs joués */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matchs joués
            </CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{player.matchesPlayed}</div>
            <p className="text-sm text-muted-foreground">
              {player.wins}V - {player.losses}D ({winRate}%)
            </p>
          </CardContent>
        </Card>

        {/* Adversaires uniques */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Adversaires
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{player.uniqueOpponents}</div>
            <p className="text-sm text-muted-foreground">
              joueurs différents affrontés
            </p>
          </CardContent>
        </Card>

        {/* Série actuelle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Série actuelle
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {player.winStreak > 0 ? `🔥 ${player.winStreak}` : '-'}
            </div>
            <p className="text-sm text-muted-foreground">
              Record: {player.bestWinStreak} victoires
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Jouer un match
            </CardTitle>
            <CardDescription>
              Enregistrez un nouveau résultat ou proposez un match
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild>
              <Link href="/matchs/nouveau">Enregistrer un résultat</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/suggestions">Trouver un adversaire</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Propositions ({pendingProposals.length})
            </CardTitle>
            <CardDescription>
              Demandes de match en attente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingProposals.length > 0 ? (
              <div className="space-y-2">
                {pendingProposals.slice(0, 3).map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{proposal.fromPlayer.fullName}</span>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/matchs/propositions/${proposal.id}`}>Voir</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune proposition en attente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Derniers matchs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Derniers matchs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMatches.length > 0 ? (
            <div className="space-y-3">
              {recentMatches.map((match) => {
                const isWinner = match.winnerId === player.id;
                const opponent = match.player1Id === player.id ? match.player2 : match.player1;
                const eloDelta = match.player1Id === player.id
                  ? match.player1EloAfter - match.player1EloBefore
                  : match.player2EloAfter - match.player2EloBefore;

                return (
                  <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isWinner ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium">vs {opponent.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {match.score} • {formatRelativeDate(match.playedAt.toISOString())}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isWinner ? 'default' : 'secondary'}>
                      {formatEloDelta(eloDelta)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun match enregistré. <Link href="/matchs/nouveau" className="text-primary hover:underline">Enregistrez votre premier match !</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
