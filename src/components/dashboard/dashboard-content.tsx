'use client';

import Link from 'next/link';
import { Trophy, Swords, Users, TrendingUp, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClubBanner } from '@/components/club/club-banner';
import { formatRelativeDate } from '@/lib/utils/dates';
import { formatEloDelta } from '@/lib/utils/format';
import { getEloRankTitle } from '@/lib/elo';
import { TSABanner } from '@/components/partners';
import { useTranslations } from '@/lib/i18n';

interface Player {
  id: string;
  fullName: string;
  currentElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  uniqueOpponents: number;
  winStreak: number;
  bestWinStreak: number;
  club: {
    name: string;
    bannerUrl: string | null;
  } | null;
}

interface Match {
  id: string;
  winnerId: string;
  player1Id: string;
  player2Id: string;
  player1: { fullName: string };
  player2: { fullName: string };
  player1EloAfter: number;
  player1EloBefore: number;
  player2EloAfter: number;
  player2EloBefore: number;
  score: string;
  playedAt: Date;
}

interface Proposal {
  id: string;
  fromPlayer: { fullName: string };
}

interface DashboardContentProps {
  player: Player;
  recentMatches: Match[];
  pendingProposals: Proposal[];
  trend: 'up' | 'down' | 'stable';
  recentDelta: number;
  winRate: number;
}

export function DashboardContent({
  player,
  recentMatches,
  pendingProposals,
  trend,
  recentDelta,
  winRate,
}: DashboardContentProps) {
  const { t, locale } = useTranslations('dashboard');
  const { t: tCommon } = useTranslations('common');
  
  const rankInfo = getEloRankTitle(player.currentElo);
  const firstName = player.fullName.split(' ')[0];
  
  const greeting = locale === 'fr' 
    ? `Bonjour, ${firstName} ! 👋`
    : `Hello, ${firstName}! 👋`;
    
  const activityText = locale === 'fr'
    ? 'Voici un aperçu de votre activité tennis'
    : 'Here\'s an overview of your tennis activity';

  return (
    <div className="space-y-6">
      {/* Banner du club (ou bannière par défaut si pas de club) */}
      <ClubBanner 
        bannerUrl={player.club?.bannerUrl ?? null} 
        clubName={player.club?.name ?? 'TennisMatchFinder'}
        height="md"
      >
        <div className="text-white">
          {player.club && (
            <p className="text-sm text-white/80 font-medium">{player.club.name}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
            {greeting}
          </h1>
          <p className="text-sm text-white/90 mt-1">
            {activityText}
          </p>
        </div>
      </ClubBanner>

      {/* Cartes de stats principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ELO actuel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('yourElo')}
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
              {t('matchesPlayed')}
            </CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{player.matchesPlayed}</div>
            <p className="text-sm text-muted-foreground">
              {player.wins}{locale === 'fr' ? 'V' : 'W'} - {player.losses}{locale === 'fr' ? 'D' : 'L'} ({winRate}%)
            </p>
          </CardContent>
        </Card>

        {/* Adversaires uniques */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === 'fr' ? 'Adversaires' : 'Opponents'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{player.uniqueOpponents}</div>
            <p className="text-sm text-muted-foreground">
              {locale === 'fr' ? 'joueurs différents affrontés' : 'different players faced'}
            </p>
          </CardContent>
        </Card>

        {/* Série actuelle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {locale === 'fr' ? 'Série actuelle' : 'Current streak'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {player.winStreak > 0 ? `🔥 ${player.winStreak}` : '-'}
            </div>
            <p className="text-sm text-muted-foreground">
              {locale === 'fr' ? `Record: ${player.bestWinStreak} victoires` : `Record: ${player.bestWinStreak} wins`}
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
              {locale === 'fr' ? 'Jouer un match' : 'Play a match'}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' 
                ? 'Enregistrez un nouveau résultat ou proposez un match' 
                : 'Record a new result or propose a match'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild>
              <Link href="/matchs/nouveau">{t('recordMatch')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/suggestions">{t('findOpponent')}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {locale === 'fr' ? `Propositions (${pendingProposals.length})` : `Proposals (${pendingProposals.length})`}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' ? 'Demandes de match en attente' : 'Pending match requests'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingProposals.length > 0 ? (
              <div className="space-y-2">
                {pendingProposals.slice(0, 3).map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm">{proposal.fromPlayer.fullName}</span>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/matchs/propositions/${proposal.id}`}>
                        {locale === 'fr' ? 'Voir' : 'View'}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'Aucune proposition en attente' : 'No pending proposals'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Banner partenaire TSA */}
      <TSABanner className="my-6" />

      {/* Derniers matchs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t('recentMatches')}
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
              {t('noMatches')}. <Link href="/matchs/nouveau" className="text-primary hover:underline">
                {locale === 'fr' ? 'Enregistrez votre premier match !' : 'Record your first match!'}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
