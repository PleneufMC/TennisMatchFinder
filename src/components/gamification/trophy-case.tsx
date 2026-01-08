'use client';

import { useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BadgeCard } from './badge-card';
import {
  BADGES,
  CATEGORY_LABELS,
  type Badge as BadgeType,
  type BadgeCategory,
} from '@/lib/gamification/badges';

interface EarnedBadge {
  badgeType: string;
  earnedAt: Date;
}

interface TrophyCaseProps {
  earnedBadges: EarnedBadge[];
  showProgress?: boolean;
  showLocked?: boolean;
}

export function TrophyCase({
  earnedBadges,
  showProgress = true,
  showLocked = true,
}: TrophyCaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');

  // Map earned badges by type for quick lookup
  const earnedMap = new Map(
    earnedBadges.map((b) => [b.badgeType, b.earnedAt])
  );

  // Filter badges by category
  const filteredBadges =
    selectedCategory === 'all'
      ? BADGES
      : BADGES.filter((b) => b.category === selectedCategory);

  // Calculate progress
  const totalBadges = BADGES.length;
  const earnedCount = earnedBadges.length;
  const progressPercent = Math.round((earnedCount / totalBadges) * 100);

  // Group badges for display
  const displayBadges = showLocked
    ? filteredBadges
    : filteredBadges.filter((b) => earnedMap.has(b.id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle>Trophy Case</CardTitle>
          </div>
          <Badge variant="secondary" className="text-sm">
            {earnedCount}/{totalBadges} badges
          </Badge>
        </div>
        <CardDescription>
          Vos badges et achievements obtenus
        </CardDescription>
        
        {showProgress && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs
          value={selectedCategory}
          onValueChange={(v) => setSelectedCategory(v as BadgeCategory | 'all')}
        >
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="milestone">{CATEGORY_LABELS.milestone}</TabsTrigger>
            <TabsTrigger value="achievement">{CATEGORY_LABELS.achievement}</TabsTrigger>
            <TabsTrigger value="social">{CATEGORY_LABELS.social}</TabsTrigger>
            <TabsTrigger value="special">{CATEGORY_LABELS.special}</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            {displayBadges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun badge dans cette catégorie</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {displayBadges.map((badge) => {
                  const earnedAt = earnedMap.get(badge.id);
                  return (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      earned={!!earnedAt}
                      earnedAt={earnedAt ? new Date(earnedAt) : undefined}
                      size="md"
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
