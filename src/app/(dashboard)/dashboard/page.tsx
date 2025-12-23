import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Trophy, Swords, Users, TrendingUp, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      {/* Titre avec salutation */}
      <div>
        <h1 className="text-3xl font-bold">
          Bonjour, {player.fullName.split(' ')[0]} ! 👋
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre activité tennis
        </p>
      </div>

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
                <Badge variant={trend === 'up' ? 'success' : 'destructive'}>
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
              Série en cours
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {player.winStreak > 0 ? `${player.winStreak} 🔥` : '0'}
            </div>
            <p className="text-sm text-muted-foreground">
              {player.winStreak > 0 ? 'victoires consécutives' : 'Prêt pour la prochaine !'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section principale */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Propositions en attente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Propositions de match
            </CardTitle>
            <CardDescription>
              {pendingProposals.length} proposition(s) en attente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingProposals.length > 0 ? (
              <div className="space-y-4">
                {pendingProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {proposal.fromPlayer?.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {proposal.proposedDate
                          ? formatRelativeDate(proposal.proposedDate.toISOString())
                          : 'Date flexible'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Décliner
                      </Button>
                      <Button size="sm">Accepter</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Aucune proposition en attente
                </p>
                <Button asChild className="mt-4">
                  <Link href="/suggestions">Trouver un adversaire</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Derniers matchs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Derniers matchs
            </CardTitle>
            <CardDescription>
              Vos 5 dernières rencontres
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.map((match) => {
                  const isPlayer1 = match.player1Id === player.id;
                  const isWinner = match.winnerId === player.id;
                  const opponent = isPlayer1
                    ? match.player2?.fullName
                    : match.player1?.fullName;
                  const eloDelta = isPlayer1
                    ? match.player1EloAfter - match.player1EloBefore
                    : match.player2EloAfter - match.player2EloBefore;

                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isWinner ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <p className="font-medium">
                            {isWinner ? 'Victoire' : 'Défaite'} vs {opponent}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {match.score} • {formatRelativeDate(match.playedAt.toISOString())}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isWinner ? 'success' : 'destructive'}>
                        {formatEloDelta(eloDelta)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Aucun match enregistré
                </p>
                <Button asChild className="mt-4">
                  <Link href="/matchs/nouveau">Enregistrer un match</Link>
                </Button>
              </div>
            )}

            {recentMatches.length > 0 && (
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/matchs">Voir tous les matchs</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/matchs/nouveau">
                <Swords className="h-6 w-6" />
                <span>Enregistrer un match</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/suggestions">
                <Users className="h-6 w-6" />
                <span>Trouver un adversaire</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/classement">
                <Trophy className="h-6 w-6" />
                <span>Voir le classement</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/forum">
                <TrendingUp className="h-6 w-6" />
                <span>Aller au forum</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
