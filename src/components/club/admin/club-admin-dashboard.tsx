'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { ClubStatsCard } from './club-stats-card';
import { ClubActivityChart } from './club-activity-chart';
import { ClubAlertsSection } from './club-alerts-section';
import { ClubMembersTable } from './club-members-table';
import { ClubExportButton } from './club-export-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { ClubStatsResponse } from '@/lib/club/stats-service';

interface ClubAdminDashboardProps {
  clubId: string;
  clubName: string;
  clubSlug: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function ClubAdminDashboard({ clubId, clubName, clubSlug }: ClubAdminDashboardProps) {
  const { data: stats, isLoading, error } = useQuery<ClubStatsResponse>({
    queryKey: ['club-stats', clubId],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${clubId}/stats`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur chargement stats');
      }
      return res.json();
    },
    refetchInterval: 60000, // Refresh toutes les minutes
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-lg">
          Erreur lors du chargement des statistiques
        </p>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Veuillez réessayer'}
        </p>
      </div>
    );
  }

  const activePercent = stats.overview.totalMembers > 0
    ? Math.round((stats.overview.activeMembers30d / stats.overview.totalMembers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">🎾 {clubName}</h1>
          <p className="text-muted-foreground">Dashboard Admin</p>
        </div>
        <ClubExportButton clubId={clubId} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ClubStatsCard
          title="Membres"
          value={stats.overview.totalMembers}
          icon={Users}
        />
        <ClubStatsCard
          title="Actifs (30j)"
          value={stats.overview.activeMembers30d}
          subtitle={`${activePercent}%`}
          icon={UserCheck}
        />
        <ClubStatsCard
          title="Matchs ce mois"
          value={stats.overview.matchesThisMonth}
          trend={stats.overview.matchesTrend}
          icon={Calendar}
        />
        <ClubStatsCard
          title="Rétention M3"
          value={`${stats.overview.retentionM3}%`}
          icon={TrendingUp}
        />
      </div>

      {/* Activity Chart */}
      <ClubActivityChart data={stats.weeklyActivity} />

      {/* Alerts */}
      <ClubAlertsSection alerts={stats.alerts} clubId={clubSlug} />

      {/* Top Active + New Members - Side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top 5 Actifs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">🏆 Top 5 Actifs ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topActive.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucun match ce mois
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.topActive.map((player, idx) => (
                  <li key={player.id} className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground w-6 text-right">
                      {idx + 1}.
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(player.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <Link 
                      href={`/profil/${player.id}`}
                      className="flex-1 font-medium hover:underline"
                    >
                      {player.fullName}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {player.matchCount} matchs
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Nouveaux ce mois */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">🆕 Nouveaux ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.newMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucun nouveau membre ce mois
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.newMembers.map((player) => (
                  <li key={player.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(player.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <Link 
                      href={`/profil/${player.id}`}
                      className="flex-1 font-medium hover:underline"
                    >
                      {player.fullName}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(player.joinedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <ClubMembersTable clubId={clubId} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      {/* Chart */}
      <Skeleton className="h-80" />

      {/* Alerts */}
      <Skeleton className="h-40" />

      {/* Side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>

      {/* Table */}
      <Skeleton className="h-96" />
    </div>
  );
}
