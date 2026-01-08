import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, BarChart3, Users, Swords, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getPlayersByClub, getMatchesByClub, getClubById } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { matches, boxLeagues, tournaments } from '@/lib/db/schema';
import { eq, and, gte, count } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Statistiques du club',
  description: 'Activité et performances du club',
};

export default async function StatistiquesPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  if (!player.isAdmin) {
    redirect('/dashboard');
  }

  // Récupérer les données
  const [allPlayers, recentMatches, club] = await Promise.all([
    getPlayersByClub(player.clubId),
    getMatchesByClub(player.clubId, { limit: 1000 }),
    getClubById(player.clubId),
  ]);

  // Calculs statistiques
  const activePlayers = allPlayers.filter(p => p.isActive);
  const totalMatches = recentMatches.length;
  
  // Matchs ce mois
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const matchesThisMonth = recentMatches.filter(m => new Date(m.playedAt) >= startOfMonth).length;

  // Matchs cette semaine
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const matchesThisWeek = recentMatches.filter(m => new Date(m.playedAt) >= startOfWeek).length;

  // ELO moyen
  const avgElo = activePlayers.length > 0 
    ? Math.round(activePlayers.reduce((sum, p) => sum + p.currentElo, 0) / activePlayers.length)
    : 1200;

  // Top joueur
  const topPlayer = activePlayers.sort((a, b) => b.currentElo - a.currentElo)[0];

  // Joueur le plus actif (matchs joués)
  const mostActivePlayer = activePlayers.sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0];

  // Compétitions actives
  const [activeLeagues] = await db
    .select({ count: count() })
    .from(boxLeagues)
    .where(and(eq(boxLeagues.clubId, player.clubId), eq(boxLeagues.status, 'active')));

  const [activeTournaments] = await db
    .select({ count: count() })
    .from(tournaments)
    .where(and(eq(tournaments.clubId, player.clubId), eq(tournaments.status, 'active')));

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Statistiques du club
          </h1>
          <p className="text-muted-foreground">
            Activité et performances de {club?.name || 'votre club'}
          </p>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlayers.length}</div>
            <p className="text-xs text-muted-foreground">
              sur {allPlayers.length} inscrits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matchs joués</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
            <p className="text-xs text-muted-foreground">
              {matchesThisMonth} ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ELO moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgElo}</div>
            <p className="text-xs text-muted-foreground">
              Niveau du club
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compétitions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(activeLeagues?.count || 0) + (activeTournaments?.count || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activité cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Matchs joués</span>
                <span className="font-bold text-xl">{matchesThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Matchs ce mois</span>
                <span className="font-bold text-xl">{matchesThisMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Moyenne par joueur</span>
                <span className="font-bold text-xl">
                  {activePlayers.length > 0 
                    ? (totalMatches / activePlayers.length).toFixed(1) 
                    : '0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top joueurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPlayer && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Meilleur ELO</p>
                    <p className="font-medium">{topPlayer.fullName}</p>
                  </div>
                  <span className="font-bold text-xl text-yellow-600">{topPlayer.currentElo}</span>
                </div>
              )}
              {mostActivePlayer && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Plus actif</p>
                    <p className="font-medium">{mostActivePlayer.fullName}</p>
                  </div>
                  <span className="font-bold text-xl text-blue-600">{mostActivePlayer.matchesPlayed} matchs</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution ELO */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des niveaux</CardTitle>
          <CardDescription>Répartition des joueurs par tranche ELO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Expert (1500+)', min: 1500, max: 9999, color: 'bg-yellow-500' },
              { label: 'Avancé (1300-1499)', min: 1300, max: 1499, color: 'bg-blue-500' },
              { label: 'Intermédiaire (1100-1299)', min: 1100, max: 1299, color: 'bg-green-500' },
              { label: 'Débutant (<1100)', min: 0, max: 1099, color: 'bg-gray-400' },
            ].map((tier) => {
              const count = activePlayers.filter(p => p.currentElo >= tier.min && p.currentElo <= tier.max).length;
              const percentage = activePlayers.length > 0 ? (count / activePlayers.length) * 100 : 0;
              return (
                <div key={tier.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{tier.label}</span>
                    <span className="font-medium">{count} joueur{count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${tier.color} transition-all`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
