import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires Supabase data
export const dynamic = 'force-dynamic';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getPlayerProfile, createClient, type PlayerProfileData } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import { getEloRankTitle } from '@/lib/elo';
import { formatWinRate } from '@/lib/utils/format';
import Link from 'next/link';

interface RankedPlayerRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  current_elo: number;
  matches_played: number;
  wins: number;
  losses: number;
  win_streak: number;
}

export const metadata: Metadata = {
  title: 'Classement',
  description: 'Classement ELO des joueurs du club',
};

export default async function ClassementPage() {
  const playerData = await getPlayerProfile();

  if (!playerData) {
    redirect('/login');
  }

  const player: PlayerProfileData = playerData;
  const supabase = await createClient();

  // Récupérer tous les joueurs du club triés par ELO
  const { data, error } = await supabase
    .from('players')
    .select('id, full_name, avatar_url, current_elo, matches_played, wins, losses, win_streak')
    .eq('club_id', player.club_id)
    .eq('is_active', true)
    .order('current_elo', { ascending: false });
  
  const players = data as RankedPlayerRow[] | null;

  if (error) {
    console.error('Error fetching players:', error);
  }

  // Trouver le rang du joueur actuel
  const currentPlayerRank = players?.findIndex((p) => p.id === player.id) ?? -1;

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
                    {player.current_elo} ELO
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {player.matches_played} matchs • {formatWinRate(player.wins, player.matches_played)} de victoires
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
            {players?.length || 0} joueurs actifs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {players?.map((rankedPlayer, index) => {
              const rank = index + 1;
              const isCurrentUser = rankedPlayer.id === player.id;
              const rankInfo = getEloRankTitle(rankedPlayer.current_elo);

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
                  <div className="flex-shrink-0 w-10">
                    {rank === 1 && (
                      <div className="rank-gold">🥇</div>
                    )}
                    {rank === 2 && (
                      <div className="rank-silver">🥈</div>
                    )}
                    {rank === 3 && (
                      <div className="rank-bronze">🥉</div>
                    )}
                    {rank > 3 && (
                      <div className="rank-default">{rank}</div>
                    )}
                  </div>

                  {/* Avatar et nom */}
                  <PlayerAvatar
                    src={rankedPlayer.avatar_url}
                    name={rankedPlayer.full_name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {rankedPlayer.full_name}
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
                      <span>{rankedPlayer.matches_played} matchs</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {rankedPlayer.current_elo}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rankedPlayer.wins}V - {rankedPlayer.losses}D
                    </div>
                  </div>

                  {/* Série */}
                  {rankedPlayer.win_streak >= 3 && (
                    <Badge variant="success" className="hidden sm:flex">
                      🔥 {rankedPlayer.win_streak}
                    </Badge>
                  )}
                </Link>
              );
            })}

            {(!players || players.length === 0) && (
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
