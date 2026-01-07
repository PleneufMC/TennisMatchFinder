import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Swords, Plus, Trophy, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { matches, players } from '@/lib/db/schema';
import { eq, or, desc, and, inArray } from 'drizzle-orm';
import { formatRelativeDate } from '@/lib/utils/dates';
import { formatEloDelta } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Mes matchs',
  description: 'Historique de vos matchs et résultats',
};

async function getMatchesByPlayer(playerId: string) {
  const result = await db
    .select()
    .from(matches)
    .where(or(eq(matches.player1Id, playerId), eq(matches.player2Id, playerId)))
    .orderBy(desc(matches.playedAt))
    .limit(100);

  // Fetch player details
  const playerIds = [...new Set(result.flatMap(m => [m.player1Id, m.player2Id]))];
  if (playerIds.length === 0) return [];
  
  const playersData = await db
    .select()
    .from(players)
    .where(inArray(players.id, playerIds));
  
  const playersMap = new Map(playersData.map(p => [p.id, p]));

  return result.map(match => ({
    ...match,
    player1: playersMap.get(match.player1Id)!,
    player2: playersMap.get(match.player2Id)!,
  }));
}

export default async function MatchsPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer tous les matchs du joueur
  const allMatches = await getMatchesByPlayer(player.id);

  // Séparer les matchs validés et en attente
  const pendingMatches = allMatches.filter(m => !m.validated);
  const validatedMatches = allMatches.filter(m => m.validated);

  // Matchs en attente de MA confirmation (je suis l'adversaire)
  const needsMyConfirmation = pendingMatches.filter(m => m.reportedBy !== player.id);
  
  // Matchs que j'ai déclarés, en attente de confirmation de l'adversaire
  const awaitingOtherConfirmation = pendingMatches.filter(m => m.reportedBy === player.id);

  // Grouper les matchs validés par mois
  const matchesByMonth: Record<string, typeof validatedMatches> = {};
  validatedMatches.forEach((match) => {
    const date = new Date(match.playedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!matchesByMonth[monthKey]) {
      matchesByMonth[monthKey] = [];
    }
    matchesByMonth[monthKey]?.push(match);
  });

  // Calculer les statistiques (matchs validés uniquement)
  const totalWins = validatedMatches.filter((m) => m.winnerId === player.id).length;
  const totalLosses = validatedMatches.length - totalWins;

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

      {/* Matchs à confirmer (urgent) */}
      {needsMyConfirmation.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>{needsMyConfirmation.length} match{needsMyConfirmation.length > 1 ? 's' : ''}</strong> à confirmer
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Swords className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{validatedMatches.length}</p>
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{pendingMatches.length}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matchs à confirmer */}
      {needsMyConfirmation.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Matchs à confirmer
            </CardTitle>
            <CardDescription>
              Ces matchs ont été déclarés par vos adversaires et attendent votre confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsMyConfirmation.map((match) => {
                const isPlayer1 = match.player1Id === player.id;
                const isWinner = match.winnerId === player.id;
                const opponent = isPlayer1 ? match.player2 : match.player1;

                return (
                  <Link
                    key={match.id}
                    href={`/matchs/confirmer/${match.id}`}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-accent',
                      'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200'
                    )}
                  >
                    {/* Indicateur */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-700">
                      <Clock className="h-5 w-5" />
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
                      <p className={`text-xs ${isWinner ? 'text-green-600' : 'text-red-600'}`}>
                        {isWinner ? 'Victoire' : 'Défaite'}
                      </p>
                    </div>

                    {/* Action */}
                    <Badge variant="outline" className="border-orange-500 text-orange-600">
                      À confirmer
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matchs en attente de confirmation de l'adversaire */}
      {awaitingOtherConfirmation.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Clock className="h-5 w-5" />
              En attente de confirmation
            </CardTitle>
            <CardDescription>
              Ces matchs attendent la confirmation de vos adversaires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {awaitingOtherConfirmation.map((match) => {
                const isPlayer1 = match.player1Id === player.id;
                const isWinner = match.winnerId === player.id;
                const opponent = isPlayer1 ? match.player2 : match.player1;

                return (
                  <div
                    key={match.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border',
                      'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200'
                    )}
                  >
                    {/* Indicateur */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-700">
                      <Clock className="h-5 w-5" />
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
                      <p className={`text-xs ${isWinner ? 'text-green-600' : 'text-red-600'}`}>
                        {isWinner ? 'Victoire' : 'Défaite'}
                      </p>
                    </div>

                    {/* Status */}
                    <Badge variant="outline" className="border-blue-500 text-blue-600">
                      En attente
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des matchs validés */}
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
                      {monthMatches?.length} match{monthMatches && monthMatches.length > 1 ? 's' : ''} validé{monthMatches && monthMatches.length > 1 ? 's' : ''}
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

                            {/* Delta ELO + Validé */}
                            <div className="flex items-center gap-2">
                              <Badge variant={isWinner ? 'success' : 'destructive'}>
                                {formatEloDelta(eloDelta)}
                              </Badge>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ) : pendingMatches.length === 0 ? (
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
      ) : null}
    </div>
  );
}
