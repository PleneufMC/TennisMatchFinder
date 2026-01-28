import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { User, Trophy, Swords, Users, Calendar, TrendingUp, MessageCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getBadgesByPlayer, getEloHistoryByPlayer, getPlayerById } from '@/lib/db/queries';
import { getPlayerRivalries, getHeadToHead } from '@/lib/rivalries';
import { formatFullDate, formatRelativeDate } from '@/lib/utils/dates';
import { formatEloDelta } from '@/lib/utils/format';
import { getEloRankTitle } from '@/lib/elo';
import { levelLabels, weekdayLabels, timeSlotLabels, surfaceLabels } from '@/lib/validations/profile';
import { TrophyCase } from '@/components/gamification';
import { StartConversationButton } from '@/components/messages/start-conversation-button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { playerId } = await params;
  const player = await getPlayerById(playerId);
  
  if (!player) {
    return { title: 'Joueur non trouvé' };
  }
  
  return {
    title: `${player.fullName} - Profil`,
    description: `Profil de ${player.fullName} - ${player.currentElo} ELO`,
  };
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { playerId } = await params;
  
  // Vérifier que l'utilisateur est connecté
  const currentPlayer = await getServerPlayer();
  if (!currentPlayer) {
    redirect('/login');
  }
  
  // Si c'est son propre profil, rediriger vers /profil
  if (currentPlayer.id === playerId) {
    redirect('/profil');
  }
  
  // Récupérer le joueur demandé
  const player = await getPlayerById(playerId);
  
  if (!player) {
    notFound();
  }
  
  // Vérifier que le joueur est du même club (si le joueur courant a un club)
  if (currentPlayer.clubId && player.clubId !== currentPlayer.clubId) {
    notFound();
  }

  // Récupérer les données du joueur
  const [badges, eloHistory, headToHead] = await Promise.all([
    getBadgesByPlayer(player.id),
    getEloHistoryByPlayer(player.id, { limit: 10 }),
    getHeadToHead(currentPlayer.id, player.id),
  ]);

  const rankInfo = getEloRankTitle(player.currentElo);
  const winRate = player.matchesPlayed > 0
    ? Math.round((player.wins / player.matchesPlayed) * 100)
    : 0;

  const availability = player.availability as { days?: string[]; timeSlots?: string[] } | null;
  const preferences = player.preferences as { gameTypes?: string[]; surfaces?: string[] } | null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <PlayerAvatar
            src={player.avatarUrl}
            name={player.fullName}
            size="xl"
          />
          <div>
            <h1 className="text-3xl font-bold">{player.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={rankInfo.color}>
                {rankInfo.icon} {rankInfo.title}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{player.currentElo} ELO</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Membre depuis {formatFullDate(player.createdAt.toISOString())}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <StartConversationButton playerId={player.id} />
          <Button asChild>
            <Link href={`/matchs/nouveau?opponent=${player.id}`}>
              <Zap className="h-4 w-4 mr-2" />
              Proposer un match
            </Link>
          </Button>
        </div>
      </div>

      {/* Head-to-Head si déjà joué */}
      {headToHead && headToHead.matchCount > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-sm text-muted-foreground mb-1">Vous</p>
                <p className="text-4xl font-bold text-green-600">{headToHead.wins}</p>
                <p className="text-sm text-muted-foreground">victoires</p>
              </div>
              <div className="text-center px-8">
                <Swords className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-lg font-semibold">{headToHead.matchCount} matchs</p>
                <p className="text-xs text-muted-foreground">face à face</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-sm text-muted-foreground mb-1">{player.fullName.split(' ')[0]}</p>
                <p className="text-4xl font-bold text-red-600">{headToHead.losses}</p>
                <p className="text-sm text-muted-foreground">victoires</p>
              </div>
            </div>
            {headToHead.lastPlayed && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Dernier match: {formatRelativeDate(headToHead.lastPlayed.toISOString())}
              </p>
            )}
            <div className="text-center mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/rivalite/${currentPlayer.id}/${player.id}`}>
                  Voir l&apos;historique complet
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne gauche - Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistiques principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold">{player.matchesPlayed}</p>
                  <p className="text-sm text-muted-foreground">Matchs joués</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                  <p className="text-3xl font-bold text-green-600">{player.wins}</p>
                  <p className="text-sm text-muted-foreground">Victoires</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
                  <p className="text-3xl font-bold text-red-600">{player.losses}</p>
                  <p className="text-sm text-muted-foreground">Défaites</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold">{winRate}%</p>
                  <p className="text-sm text-muted-foreground">Taux de victoire</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 mt-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{player.uniqueOpponents}</p>
                    <p className="text-xs text-muted-foreground">Adversaires</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{player.bestWinStreak}</p>
                    <p className="text-xs text-muted-foreground">Meilleure série</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{player.bestElo}</p>
                    <p className="text-xs text-muted-foreground">Meilleur ELO</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historique ELO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Évolution récente
              </CardTitle>
              <CardDescription>
                Les 10 dernières variations d&apos;ELO
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eloHistory.length > 0 ? (
                <div className="space-y-2">
                  {eloHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            entry.delta > 0 ? 'bg-green-500' : entry.delta < 0 ? 'bg-red-500' : 'bg-gray-500'
                          }`}
                        />
                        <span className="text-sm">
                          {entry.reason === 'match_win' && 'Victoire'}
                          {entry.reason === 'match_loss' && 'Défaite'}
                          {entry.reason === 'inactivity_decay' && 'Inactivité'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(entry.recordedAt.toISOString())}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">{entry.elo}</span>
                        <Badge variant={entry.delta > 0 ? 'success' : entry.delta < 0 ? 'destructive' : 'secondary'}>
                          {formatEloDelta(entry.delta)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Aucune variation récente
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite - Infos */}
        <div className="space-y-6">
          {/* Niveau */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Niveau auto-évalué</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-sm">
                {levelLabels[player.selfAssessedLevel as keyof typeof levelLabels]}
              </Badge>
            </CardContent>
          </Card>

          {/* Disponibilités */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Disponibilités
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Jours</p>
                <div className="flex flex-wrap gap-1">
                  {availability?.days && availability.days.length > 0 ? (
                    availability.days.map((day) => (
                      <Badge key={day} variant="outline">
                        {weekdayLabels[day as keyof typeof weekdayLabels]}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Non renseigné</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Créneaux</p>
                <div className="flex flex-wrap gap-1">
                  {availability?.timeSlots && availability.timeSlots.length > 0 ? (
                    availability.timeSlots.map((slot) => (
                      <Badge key={slot} variant="outline">
                        {timeSlotLabels[slot as keyof typeof timeSlotLabels]?.label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Non renseigné</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Préférences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Swords className="h-5 w-5" />
                Préférences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Type de jeu</p>
                <div className="flex flex-wrap gap-1">
                  {preferences?.gameTypes && preferences.gameTypes.length > 0 ? (
                    preferences.gameTypes.map((type) => (
                      <Badge key={type} variant="outline" className="capitalize">
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Non renseigné</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Surfaces</p>
                <div className="flex flex-wrap gap-1">
                  {preferences?.surfaces && preferences.surfaces.length > 0 ? (
                    preferences.surfaces.map((surface) => (
                      <Badge key={surface} variant="outline">
                        {surfaceLabels[surface as keyof typeof surfaceLabels]}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Toutes surfaces</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {player.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  À propos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {player.bio}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Trophy Case */}
      <TrophyCase
        earnedBadges={badges.map((b) => ({
          badgeId: b.badgeId,
          earnedAt: b.earnedAt,
        }))}
        showProgress={false}
        showLocked={false}
      />
    </div>
  );
}
