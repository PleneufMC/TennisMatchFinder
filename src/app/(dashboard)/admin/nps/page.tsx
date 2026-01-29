/**
 * Page Admin - Dashboard NPS
 * /admin/nps
 * 
 * Affiche les statistiques NPS et les dernières réponses.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, TrendingDown, Minus, Users, 
  MessageSquare, RefreshCw, Loader2, AlertCircle,
  ThumbsUp, ThumbsDown, Meh
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlayer } from '@/hooks/use-player';
import { cn } from '@/lib/utils';

interface NpsStats {
  totalResponses: number;
  averageScore: number;
  npsScore: number;
  detractors: number;
  passives: number;
  promoters: number;
  detractorsPct: number;
  passivesPct: number;
  promotersPct: number;
}

interface NpsResponse {
  id: string;
  playerId: string;
  playerName: string;
  score: number;
  feedback: string | null;
  category: 'detractor' | 'passive' | 'promoter';
  createdAt: string;
}

export default function NpsAdminPage() {
  const router = useRouter();
  const { player, isLoading: playerLoading } = usePlayer();
  const [stats, setStats] = useState<NpsStats | null>(null);
  const [responses, setResponses] = useState<NpsResponse[]>([]);
  const [period, setPeriod] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerLoading && player && !player.isAdmin) {
      router.push('/dashboard');
    }
  }, [player, playerLoading, router]);

  useEffect(() => {
    if (player?.isAdmin) {
      fetchNpsData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.isAdmin, period]);

  const fetchNpsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/nps/stats?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();
      setStats(data.stats);
      setResponses(data.recentResponses);
    } catch (err) {
      setError('Impossible de charger les données NPS');
      console.error('NPS fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getNpsColor = (score: number) => {
    if (score < 0) return 'text-red-500';
    if (score < 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getNpsBadge = (score: number) => {
    if (score < 0) return { label: 'À améliorer', variant: 'destructive' as const };
    if (score < 30) return { label: 'Correct', variant: 'secondary' as const };
    if (score < 50) return { label: 'Bon', variant: 'default' as const };
    return { label: 'Excellent', variant: 'default' as const };
  };

  const getCategoryIcon = (category: 'detractor' | 'passive' | 'promoter') => {
    switch (category) {
      case 'detractor': return <ThumbsDown className="h-4 w-4 text-red-500" />;
      case 'passive': return <Meh className="h-4 w-4 text-yellow-500" />;
      case 'promoter': return <ThumbsUp className="h-4 w-4 text-green-500" />;
    }
  };

  const getCategoryColor = (category: 'detractor' | 'passive' | 'promoter') => {
    switch (category) {
      case 'detractor': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'passive': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'promoter': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    }
  };

  if (playerLoading || !player?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard NPS</h1>
          <p className="text-muted-foreground">
            Net Promoter Score - Satisfaction utilisateurs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
              <SelectItem value="quarter">90 derniers jours</SelectItem>
              <SelectItem value="all">Tout le temps</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchNpsData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <>
          {/* Score NPS principal */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Score NPS */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Score NPS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-5xl font-bold", getNpsColor(stats.npsScore))}>
                    {stats.npsScore > 0 ? '+' : ''}{stats.npsScore}
                  </span>
                  <Badge variant={getNpsBadge(stats.npsScore).variant}>
                    {getNpsBadge(stats.npsScore).label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.totalResponses} réponses • Moyenne: {stats.averageScore}/10
                </p>
              </CardContent>
            </Card>

            {/* Distribution */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardDescription>Distribution des réponses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Promoteurs */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      Promoteurs (9-10)
                    </span>
                    <span className="font-medium">{stats.promoters} ({stats.promotersPct}%)</span>
                  </div>
                  <Progress value={stats.promotersPct} className="h-2 bg-muted [&>div]:bg-green-500" />
                </div>

                {/* Passifs */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Meh className="h-4 w-4 text-yellow-500" />
                      Passifs (7-8)
                    </span>
                    <span className="font-medium">{stats.passives} ({stats.passivesPct}%)</span>
                  </div>
                  <Progress value={stats.passivesPct} className="h-2 bg-muted [&>div]:bg-yellow-500" />
                </div>

                {/* Détracteurs */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      Détracteurs (0-6)
                    </span>
                    <span className="font-medium">{stats.detractors} ({stats.detractorsPct}%)</span>
                  </div>
                  <Progress value={stats.detractorsPct} className="h-2 bg-muted [&>div]:bg-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dernières réponses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Dernières réponses
              </CardTitle>
              <CardDescription>
                Feedback des utilisateurs récents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune réponse pour cette période
                </p>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => (
                    <div
                      key={response.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        getCategoryColor(response.category)
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(response.category)}
                          <div>
                            <p className="font-medium">{response.playerName}</p>
                            <p className="text-xs opacity-75">
                              {new Date(response.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-lg font-bold",
                            response.score <= 6 && "border-red-500 text-red-500",
                            response.score >= 7 && response.score <= 8 && "border-yellow-500 text-yellow-500",
                            response.score >= 9 && "border-green-500 text-green-500"
                          )}
                        >
                          {response.score}
                        </Badge>
                      </div>
                      {response.feedback && (
                        <p className="mt-3 text-sm italic">
                          &ldquo;{response.feedback}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
