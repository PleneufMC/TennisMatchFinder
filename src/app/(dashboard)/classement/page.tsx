import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getClubRanking } from '@/lib/db/queries';
import { cn } from '@/lib/utils';
import { getEloRankTitle } from '@/lib/elo';
import { formatWinRate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Classement',
  description: 'Classement ELO des joueurs du club',
};

export default async function ClassementPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer le classement du club
  const players = await getClubRanking(player.clubId);

  // Trouver le rang du joueur actuel
  const currentPlayerRank = players.findIndex((p) => p.id === player.id);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Classement
          </h1>
          <p className="text-muted-foreground">
            Classement ELO des joueurs de votre club
          </p>
        </div>
      </div>

      {/* Position actuelle */}
      {currentPlayerRank >= 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">
                  #{currentPlayerRank + 1}
                </div>
                <div>
                  <p className="font-medium">Votre position</p>
                  <p className="text-sm text-muted-foreground">
                    {player.currentElo} ELO
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {player.matchesPlayed} matchs • {formatWinRate(player.wins, player.matchesPlayed)} de victoires
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau de classement */}
      <Card>
        <CardHeader>
          <CardTitle>Classement complet</CardTitle>
          <CardDescription>
            {players.length} joueurs actifs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {players.map((rankedPlayer, index) => {
              const rank = index + 1;
              const isCurrentUser = rankedPlayer.id === player.id;
              const rankInfo = getEloRankTitle(rankedPlayer.currentElo);

              return (
                <Link
                  key={rankedPlayer.id}
                  href={`/profil/${rankedPlayer.id}`}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50',
                    isCurrentUser && 'bg-primary/5 border-primary/30'
                  )}
                >
                  {/* Rang */}
                  <div className="flex-shrink-0 w-10 text-center">
                    {rank === 1 && <span className="text-2xl">🥇</span>}
                    {rank === 2 && <span className="text-2xl">🥈</span>}
                    {rank === 3 && <span className="text-2xl">🥉</span>}
                    {rank > 3 && <span className="text-lg font-bold text-muted-foreground">{rank}</span>}
                  </div>

                  {/* Avatar et nom */}
                  <PlayerAvatar
                    src={null}
                    name={rankedPlayer.fullName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {rankedPlayer.fullName}
                      </p>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          Vous
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={rankInfo.color}>
                        {rankInfo.icon} {rankInfo.title}
                      </span>
                      <span>•</span>
                      <span>{rankedPlayer.matchesPlayed} matchs</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {rankedPlayer.currentElo}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rankedPlayer.wins}V - {rankedPlayer.losses}D
                    </div>
                  </div>

                  {/* Série */}
                  {rankedPlayer.winStreak >= 3 && (
                    <Badge className="hidden sm:flex">
                      🔥 {rankedPlayer.winStreak}
                    </Badge>
                  )}
                </Link>
              );
            })}

            {players.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun joueur actif dans le club</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Légende des rangs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span>👑</span>
              <span className="text-purple-600">Grand Maître (2000+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🏆</span>
              <span className="text-red-600">Expert (1800+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⭐</span>
              <span className="text-orange-500">Avancé (1600+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <span className="text-yellow-600">Intermédiaire+ (1400+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🎾</span>
              <span className="text-green-600">Intermédiaire (1200+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📈</span>
              <span className="text-blue-600">Débutant+ (1000+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🌱</span>
              <span className="text-gray-600">Débutant (&lt;1000)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
