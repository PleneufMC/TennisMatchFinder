import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { Trophy, Flame, Target, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getWeeklyStreakInfo } from '@/lib/gamification/streaks';
import { getPlayerChallengeProgress, getChallengeSummary } from '@/lib/gamification/challenges';
import { getPlayerBadgesForDisplay } from '@/lib/gamification/badge-checker';
import { BADGES } from '@/lib/gamification/badges';
import { TrophyCase, WeeklyStreak, MonthlyChallenges } from '@/components/gamification';

export const metadata: Metadata = {
  title: 'Achievements',
  description: 'Vos badges, streaks et challenges',
};

export default async function AchievementsPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer toutes les données de gamification
  const [streakInfo, challengeProgress, challengeSummary, badges] = await Promise.all([
    getWeeklyStreakInfo(player.id),
    getPlayerChallengeProgress(player.id),
    getChallengeSummary(player.id),
    getPlayerBadgesForDisplay(player.id),
  ]);

  // Statistiques globales
  const completedChallengesTotal = challengeSummary.completedChallenges;
  const badgesEarned = badges.length;
  const totalBadges = BADGES.length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-500" />
          Achievements
        </h1>
        <p className="text-muted-foreground mt-1">
          Vos badges, streaks et challenges mensuels
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{streakInfo.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Weekly Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedChallengesTotal}/{challengeSummary.totalChallenges}</p>
                <p className="text-sm text-muted-foreground">Challenges du mois</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{badgesEarned}/{totalBadges}</p>
                <p className="text-sm text-muted-foreground">Badges débloqués</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">+{challengeSummary.xpEarned}</p>
                <p className="text-sm text-muted-foreground">XP ce mois</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Streak */}
        <WeeklyStreak streakInfo={streakInfo} />

        {/* Monthly Challenges */}
        <MonthlyChallenges progress={challengeProgress} summary={challengeSummary} />
      </div>

      {/* Trophy Case */}
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
