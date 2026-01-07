import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { matches, players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { MatchConfirmForm } from '@/components/matches/match-confirm-form';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirmer un match',
  description: 'Confirmez ou refusez le résultat du match',
};

export default async function ConfirmerMatchPage({
  params,
}: {
  params: { matchId: string };
}) {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer le match
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, params.matchId))
    .limit(1);

  if (!match) {
    notFound();
  }

  // Vérifier que le joueur est impliqué
  const isPlayer1 = match.player1Id === player.id;
  const isPlayer2 = match.player2Id === player.id;

  if (!isPlayer1 && !isPlayer2) {
    redirect('/matchs');
  }

  // Si le match est déjà validé
  if (match.validated) {
    redirect('/matchs');
  }

  // Si le joueur est le rapporteur, il ne peut pas confirmer
  if (match.reportedBy === player.id) {
    redirect('/matchs');
  }

  // Récupérer les infos des joueurs
  const [player1Data] = await db
    .select()
    .from(players)
    .where(eq(players.id, match.player1Id))
    .limit(1);

  const [player2Data] = await db
    .select()
    .from(players)
    .where(eq(players.id, match.player2Id))
    .limit(1);

  const isCurrentPlayerWinner = match.winnerId === player.id;
  const reporterName = match.reportedBy === match.player1Id 
    ? player1Data?.fullName 
    : player2Data?.fullName;
  const opponentName = match.player1Id === player.id 
    ? player2Data?.fullName 
    : player1Data?.fullName;

  // Calculer le changement ELO prévu
  const myEloBefore = isPlayer1 ? match.player1EloBefore : match.player2EloBefore;
  const myEloAfter = isPlayer1 ? match.player1EloAfter : match.player2EloAfter;
  const eloDelta = myEloAfter - myEloBefore;

  return (
    <div className="space-y-6">
      {/* En-tête avec retour */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/matchs">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Confirmer un match</h1>
          <p className="text-muted-foreground">
            Vérifiez et confirmez le résultat déclaré
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Détails du match */}
        <Card>
          <CardHeader>
            <CardTitle>Détails du match</CardTitle>
            <CardDescription>
              Déclaré par {reporterName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Résultat */}
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Résultat déclaré</p>
              <p className="text-4xl font-bold mb-2">{match.score}</p>
              <p className={`text-lg font-medium ${isCurrentPlayerWinner ? 'text-green-600' : 'text-red-600'}`}>
                {isCurrentPlayerWinner ? '🏆 Victoire' : '😔 Défaite'}
              </p>
            </div>

            {/* Infos match */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(match.playedAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{match.gameType}</p>
              </div>
              {match.surface && (
                <div>
                  <p className="text-muted-foreground">Surface</p>
                  <p className="font-medium capitalize">{match.surface}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Adversaire</p>
                <p className="font-medium">{opponentName}</p>
              </div>
            </div>

            {/* Changement ELO prévu */}
            <div className={`p-4 rounded-lg ${eloDelta >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
              <p className="text-sm text-muted-foreground mb-1">Impact sur votre ELO</p>
              <div className="flex items-center gap-3">
                <span className="text-lg">{myEloBefore}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-lg font-bold">{myEloAfter}</span>
                <span className={`text-lg font-bold ${eloDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({eloDelta >= 0 ? '+' : ''}{eloDelta})
                </span>
              </div>
            </div>

            {/* Notes */}
            {match.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm bg-muted/50 p-3 rounded">{match.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulaire de confirmation */}
        <Card>
          <CardHeader>
            <CardTitle>Votre décision</CardTitle>
            <CardDescription>
              Confirmez-vous ce résultat ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatchConfirmForm matchId={match.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
