import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Users, Star, Calendar, TrendingUp, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getPlayersByClub, getMatchesByPlayer } from '@/lib/db/queries';
import { generateSuggestions } from '@/lib/matching';
import { formatTimeAgo } from '@/lib/utils/dates';
import { getEloRankTitle } from '@/lib/elo';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Trouver un adversaire',
  description: 'Suggestions d\'adversaires adaptés à votre niveau',
};

export default async function SuggestionsPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Si le joueur n'a pas de club
  if (!player.clubId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Trouver un adversaire
          </h1>
          <p className="text-muted-foreground">
            Rejoignez un club pour trouver des adversaires
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Vous n&apos;êtes pas encore affilié à un club. 
              Rejoignez un club pour recevoir des suggestions d&apos;adversaires.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Récupérer tous les joueurs actifs du club et l'historique des matchs
  const [allPlayers, matchHistory] = await Promise.all([
    getPlayersByClub(player.clubId, { activeOnly: true }),
    getMatchesByPlayer(player.id),
  ]);

  // Préparer les données pour le moteur de suggestions
  // Adapter les noms de champs pour correspondre au format attendu par generateSuggestions
  const currentPlayerWithHistory = {
    id: player.id,
    full_name: player.fullName,
    avatar_url: player.avatarUrl,
    current_elo: player.currentElo,
    availability: player.availability,
    preferences: player.preferences,
    matchHistory: matchHistory.map((m) => ({
      opponentId: m.player1Id === player.id ? m.player2Id : m.player1Id,
      playedAt: m.playedAt.toISOString(),
      winnerId: m.winnerId,
    })),
  };

  // Convertir les joueurs au format attendu
  const allPlayersFormatted = allPlayers.map(p => ({
    id: p.id,
    full_name: p.fullName,
    avatar_url: p.avatarUrl,
    current_elo: p.currentElo,
    availability: p.availability,
    preferences: p.preferences,
    last_active_at: p.lastActiveAt?.toISOString(),
  }));

  // Générer les suggestions
  const suggestions = generateSuggestions(
    currentPlayerWithHistory,
    allPlayersFormatted
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Trouver un adversaire
        </h1>
        <p className="text-muted-foreground">
          Suggestions personnalisées basées sur votre niveau et vos préférences
        </p>
      </div>

      {/* Explications */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Comment ça marche ?</p>
              <p className="text-muted-foreground mt-1">
                Notre algorithme analyse votre niveau ELO, vos disponibilités et votre historique
                pour vous suggérer les adversaires les plus adaptés. Jouez contre de nouveaux
                adversaires pour gagner plus de points !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des suggestions */}
      {suggestions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((suggestion, index) => {
            const rankInfo = getEloRankTitle(suggestion.player.current_elo);
            const availability = suggestion.player.availability as { days?: string[] } | null;

            return (
              <Card key={suggestion.player.id} className="card-hover relative overflow-hidden">
                {/* Badge de recommandation */}
                {index === 0 && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                    Recommandé
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-4">
                    <PlayerAvatar
                      src={suggestion.player.avatar_url}
                      name={suggestion.player.full_name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">
                        {suggestion.player.full_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <span className={rankInfo.color}>
                          {rankInfo.icon} {suggestion.player.current_elo}
                        </span>
                      </CardDescription>
                    </div>
                  </div>

                  {/* Tags */}
                  {suggestion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {suggestion.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Score de compatibilité */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Compatibilité</span>
                      <span className="font-semibold">{suggestion.compatibilityScore}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          suggestion.compatibilityScore >= 80
                            ? 'bg-green-500'
                            : suggestion.compatibilityScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                        )}
                        style={{ width: `${suggestion.compatibilityScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Détails des facteurs */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Niveau</span>
                      <span>{suggestion.factors.eloProximity}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Nouveauté</span>
                      <span>{suggestion.factors.noveltyScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Planning</span>
                      <span>{suggestion.factors.scheduleMatch}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Préférences</span>
                      <span>{suggestion.factors.preferenceMatch}%</span>
                    </div>
                  </div>

                  {/* Head to head */}
                  {suggestion.headToHead && (
                    <div className="flex items-center justify-center gap-4 p-2 rounded bg-muted/50 text-sm">
                      <span className="text-green-600 font-medium">
                        {suggestion.headToHead.wins}V
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-red-600 font-medium">
                        {suggestion.headToHead.losses}D
                      </span>
                    </div>
                  )}

                  {/* Dernier match */}
                  {suggestion.lastPlayed && (
                    <p className="text-xs text-muted-foreground text-center">
                      Dernier match : {formatTimeAgo(suggestion.lastPlayed)}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1">
                      <Link href={`/profil/${suggestion.player.id}`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Proposer
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/profil/${suggestion.player.id}`}>
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Aucune suggestion disponible</h3>
            <p className="text-muted-foreground mb-4">
              {allPlayers.length <= 1
                ? 'Invitez d\'autres joueurs à rejoindre le club !'
                : 'Ajustez vos disponibilités dans votre profil pour trouver des adversaires.'}
            </p>
            <Button asChild variant="outline">
              <Link href="/profil">Modifier mes disponibilités</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Légende */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comprendre les scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Niveau (30%)
              </p>
              <p className="text-muted-foreground">
                Écart ELO idéal : 50-150 points pour un match équilibré
              </p>
            </div>
            <div>
              <p className="font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Nouveauté (35%)
              </p>
              <p className="text-muted-foreground">
                Bonus si vous n&apos;avez jamais joué contre cet adversaire
              </p>
            </div>
            <div>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Planning (20%)
              </p>
              <p className="text-muted-foreground">
                Disponibilités en commun pour faciliter l&apos;organisation
              </p>
            </div>
            <div>
              <p className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Préférences (15%)
              </p>
              <p className="text-muted-foreground">
                Types de jeu et surfaces compatibles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
