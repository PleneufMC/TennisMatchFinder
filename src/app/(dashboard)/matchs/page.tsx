import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Swords, Plus, Trophy, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getMatchesByPlayer } from '@/lib/db/queries';
import { formatRelativeDate } from '@/lib/utils/dates';
import { formatEloDelta } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Mes matchs',
  description: 'Historique de vos matchs et résultats',
};

export default async function MatchsPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer tous les matchs du joueur
  const matches = await getMatchesByPlayer(player.id);

  // Grouper les matchs par mois
  const matchesByMonth: Record<string, typeof matches> = {};
  matches.forEach((match) => {
    const date = new Date(match.playedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!matchesByMonth[monthKey]) {
      matchesByMonth[monthKey] = [];
    }
    matchesByMonth[monthKey]?.push(match);
  });

  // Calculer les statistiques
  const totalWins = matches.filter((m) => m.winnerId === player.id).length;
  const totalLosses = matches.length - totalWins;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Swords className="h-8 w-8" />
            Mes matchs
          </h1>
          <p className="text-muted-foreground">
            Historique de vos rencontres
          </p>
        </div>
        <Button asChild>
          <Link href="/matchs/nouveau">
            <Plus className="h-4 w-4 mr-2" />
            Enregistrer un match
          </Link>
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Swords className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{matches.length}</p>
                <p className="text-sm text-muted-foreground">Matchs joués</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{totalWins}</p>
                <p className="text-sm text-muted-foreground">Victoires</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Swords className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{totalLosses}</p>
                <p className="text-sm text-muted-foreground">Défaites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des matchs */}
      {Object.keys(matchesByMonth).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(matchesByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([monthKey, monthMatches]) => {
              const [year, month] = monthKey.split('-');
              const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric',
              });

              return (
                <Card key={monthKey}>
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {monthName}
                    </CardTitle>
                    <CardDescription>
                      {monthMatches?.length} match{monthMatches && monthMatches.length > 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {monthMatches?.map((match) => {
                        const isPlayer1 = match.player1Id === player.id;
                        const isWinner = match.winnerId === player.id;
                        const opponent = isPlayer1 ? match.player2 : match.player1;
                        const eloDelta = isPlayer1
                          ? match.player1EloAfter - match.player1EloBefore
                          : match.player2EloAfter - match.player2EloBefore;

                        return (
                          <div
                            key={match.id}
                            className={cn(
                              'flex items-center gap-4 p-4 rounded-lg border',
                              isWinner ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/50 dark:bg-red-900/10'
                            )}
                          >
                            {/* Indicateur victoire/défaite */}
                            <div
                              className={cn(
                                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold',
                                isWinner
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              )}
                            >
                              {isWinner ? 'V' : 'D'}
                            </div>

                            {/* Adversaire */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <PlayerAvatar
                                src={opponent?.avatarUrl}
                                name={opponent?.fullName || 'Adversaire'}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  vs {opponent?.fullName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatRelativeDate(match.playedAt.toISOString())}
                                </p>
                              </div>
                            </div>

                            {/* Score */}
                            <div className="text-center px-4">
                              <p className="font-mono font-bold">{match.score}</p>
                              {match.surface && (
                                <p className="text-xs text-muted-foreground capitalize">
                                  {match.surface}
                                </p>
                              )}
                            </div>

                            {/* Delta ELO */}
                            <Badge variant={isWinner ? 'success' : 'destructive'}>
                              {formatEloDelta(eloDelta)}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Swords className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Aucun match enregistré</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par enregistrer votre premier match pour suivre votre progression.
            </p>
            <Button asChild>
              <Link href="/matchs/nouveau">
                <Plus className="h-4 w-4 mr-2" />
                Enregistrer mon premier match
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
