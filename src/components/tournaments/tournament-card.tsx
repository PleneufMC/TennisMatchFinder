'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Clock,
  ChevronRight,
  Target,
  Swords,
  Crown,
  Euro,
} from 'lucide-react';
import Link from 'next/link';
import type { Tournament } from '@/lib/tournaments/types';
import { formatDistanceToNow, format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TournamentCardProps {
  tournament: Tournament;
  isRegistered?: boolean;
  mySeed?: number | null;
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', variant: 'secondary' as const, color: 'bg-gray-500' },
  registration: { label: 'Inscriptions ouvertes', variant: 'default' as const, color: 'bg-green-500' },
  seeding: { label: 'Tirage au sort', variant: 'default' as const, color: 'bg-amber-500' },
  active: { label: 'En cours', variant: 'default' as const, color: 'bg-blue-500' },
  completed: { label: 'Terminé', variant: 'secondary' as const, color: 'bg-gray-400' },
  cancelled: { label: 'Annulé', variant: 'destructive' as const, color: 'bg-red-500' },
} as const;

type StatusConfigKey = keyof typeof STATUS_CONFIG;

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status as StatusConfigKey] ?? STATUS_CONFIG.draft;
};

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: 'Élimination directe',
  double_elimination: 'Double élimination',
  consolation: 'Avec consolation',
};

// Helper pour parser les dates de manière sécurisée
function safeParseDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  try {
    const parsed = typeof date === 'string' ? new Date(date) : date;
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

// Helper pour formater une date de manière sécurisée
function safeFormat(date: Date | string | null | undefined, formatStr: string): string {
  const parsed = safeParseDate(date);
  if (!parsed) return '-';
  try {
    return format(parsed, formatStr, { locale: fr });
  } catch {
    return '-';
  }
}

export function TournamentCard({ tournament, isRegistered, mySeed }: TournamentCardProps) {
  // Utiliser participantCount de tournament (retourné par l'API)
  const participantCount = tournament.participantCount ?? 0;
  
  const statusConfig = getStatusConfig(tournament.status);
  const now = new Date();
  
  // Parser les dates de manière sécurisée
  const registrationStart = safeParseDate(tournament.registrationStart);
  const registrationEnd = safeParseDate(tournament.registrationEnd);
  const startDate = safeParseDate(tournament.startDate);
  
  const registrationOpen = tournament.status === 'registration' && 
    registrationStart && registrationEnd &&
    isAfter(now, registrationStart) &&
    isBefore(now, registrationEnd);
  
  const progressPercent = (participantCount / tournament.maxParticipants) * 100;
  
  let daysUntilStart: string | null = null;
  if (startDate && isAfter(startDate, now)) {
    try {
      daysUntilStart = formatDistanceToNow(startDate, { locale: fr, addSuffix: true });
    } catch {
      daysUntilStart = null;
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
              <Trophy className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{tournament.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs">
                <Swords className="h-3 w-3" />
                {FORMAT_LABELS[tournament.format] || tournament.format}
                <span className="text-muted-foreground">•</span>
                <span>{tournament.maxParticipants} joueurs max</span>
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        {tournament.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{tournament.description}</p>
        )}

        {/* Prix et ELO Range */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Prix */}
          {tournament.entryFee > 0 ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
              <Euro className="h-3 w-3" />
              {(tournament.entryFee / 100).toFixed(0)} EUR
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-muted-foreground">
              Gratuit
            </div>
          )}
          
          {/* ELO Range */}
          {(tournament.eloRangeMin || tournament.eloRangeMax) && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              ELO: {tournament.eloRangeMin || '∞'} - {tournament.eloRangeMax || '∞'}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {safeFormat(tournament.startDate, 'dd MMM yyyy')}
            </span>
          </div>
          {registrationOpen && registrationEnd && (
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs">
                Jusqu&apos;au {safeFormat(registrationEnd, 'dd MMM')}
              </span>
            </div>
          )}
        </div>

        {/* Participants Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              Participants
            </span>
            <span className="font-medium">{participantCount} / {tournament.maxParticipants}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          
          {/* Avatars des participants */}
          {tournament.participants && tournament.participants.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex -space-x-2">
                {tournament.participants.slice(0, 5).map((participant) => (
                  <div
                    key={participant.id}
                    className="relative h-7 w-7 rounded-full border-2 border-background overflow-hidden bg-muted"
                    title={`${participant.fullName} (${participant.currentElo} ELO)`}
                  >
                    {participant.avatarUrl ? (
                      <img
                        src={participant.avatarUrl}
                        alt={participant.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {participant.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {participantCount > 5 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{participantCount - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* User Status */}
        {isRegistered && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-sm">
            {mySeed ? (
              <>
                <Crown className="h-4 w-4 text-amber-500" />
                <span>
                  Tête de série <strong>#{mySeed}</strong>
                </span>
              </>
            ) : (
              <span className="text-green-600 font-medium">✓ Inscrit</span>
            )}
          </div>
        )}

        {/* Winner */}
        {tournament.status === 'completed' && tournament.winnerId && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-sm">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-amber-700 dark:text-amber-400">
              Vainqueur désigné
            </span>
          </div>
        )}

        {/* Countdown */}
        {daysUntilStart && tournament.status === 'registration' && (
          <div className="text-center text-sm text-muted-foreground">
            Début {daysUntilStart}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1">
            <Link href={`/tournaments/${tournament.id}`}>
              {tournament.status === 'active' ? 'Voir le bracket' : 'Voir les détails'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          {registrationOpen && !isRegistered && (
            <Button variant="outline" asChild>
              <Link href={`/tournaments/${tournament.id}?register=true`}>
                {tournament.entryFee > 0 
                  ? `S'inscrire (${(tournament.entryFee / 100).toFixed(0)}€)` 
                  : "S'inscrire"}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
