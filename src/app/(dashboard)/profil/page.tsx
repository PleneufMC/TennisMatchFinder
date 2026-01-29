import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { User, Trophy, Swords, Users, Calendar, TrendingUp, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getBadgesByPlayer, getEloHistoryByPlayer } from '@/lib/db/queries';
import { getPlayerRivalries } from '@/lib/rivalries';
import { formatFullDate, formatRelativeDate } from '@/lib/utils/dates';
import { formatWinRate, formatEloDelta } from '@/lib/utils/format';
import { getEloRankTitle } from '@/lib/elo';
import { levelLabels, weekdayLabels, timeSlotLabels, surfaceLabels } from '@/lib/validations/profile';
import { TrophyCase } from '@/components/gamification';
import { RivalryCard } from '@/components/rivalries';
import { ReputationBadge } from '@/components/reputation/reputation-badge';
import { WeeklyStreakCard } from '@/components/challenges';
import { ReferralSection } from '@/components/referrals';
import { getPlayerStreakInfo, getPlayerWeeklyActivity } from '@/lib/challenges/weekly-activity';

export const metadata: Metadata = {
  title: 'Mon profil',
  description: 'Consultez et modifiez votre profil joueur',
};

export default async function ProfilPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer les badges, l'historique ELO, les rivalités et le streak
  const [badges, eloHistory, rivalries, streakInfo, weeklyActivity] = await Promise.all([
    getBadgesByPlayer(player.id),
    getEloHistoryByPlayer(player.id, { limit: 10 }),
    getPlayerRivalries(player.id, 5),
    getPlayerStreakInfo(player.id),
    getPlayerWeeklyActivity(player.id),
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
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={rankInfo.color}>
                {rankInfo.icon} {rankInfo.title}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{player.currentElo} ELO</span>
              {/* Badge de réputation */}
              <ReputationBadge
                average={player.reputationAvg ? Number(player.reputationAvg) : null}
                count={player.reputationCount || 0}
                punctuality={player.reputationPunctuality ? Number(player.reputationPunctuality) : null}
                fairPlay={player.reputationFairPlay ? Number(player.reputationFairPlay) : null}
                friendliness={player.reputationFriendliness ? Number(player.reputationFriendliness) : null}
                size="md"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Membre depuis {formatFullDate(player.createdAt.toISOString())}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/profil/modifier">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Link>
        </Button>
      </div>

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
                    <p className="text-xs text-muted-foreground">Adversaires uniques</p>
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
                Vos 10 dernières variations d&apos;ELO
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

        </div>
      </div>

      {/* Challenge Hebdomadaire */}
      <WeeklyStreakCard
        currentStreak={streakInfo.currentStreak}
        bestStreak={streakInfo.bestStreak}
        currentWeekValidated={streakInfo.currentWeekValidated}
        nextBadge={streakInfo.nextBadge}
        matchesThisWeek={weeklyActivity?.matchesPlayed || 0}
        proposalsThisWeek={weeklyActivity?.proposalsSent || 0}
      />

      {/* Parrainages */}
      <ReferralSection />

      {/* Rivalités */}
      {rivalries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Vos rivalités
            </CardTitle>
            <CardDescription>
              Vos adversaires les plus fréquents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {rivalries.map((rivalry) => (
                <RivalryCard
                  key={rivalry.opponent.id}
                  playerId={player.id}
                  opponent={rivalry.opponent}
                  matchCount={rivalry.matchCount}
                  wins={rivalry.wins}
                  losses={rivalry.losses}
                  lastPlayed={rivalry.lastPlayed}
                  rivalryLevel={rivalry.rivalryLevel}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trophy Case - Full width */}
      <TrophyCase
        earnedBadges={badges.map((b) => ({
          badgeId: b.badgeId,
          earnedAt: b.earnedAt,
        }))}
        showProgress={true}
        showLocked={true}
      />
    </div>
  );
}
