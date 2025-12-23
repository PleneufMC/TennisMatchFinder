import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getPlayersByClub } from '@/lib/db/queries';
import { MatchForm } from '@/components/matches/match-form';

export const metadata: Metadata = {
  title: 'Enregistrer un match',
  description: 'Déclarez le résultat de votre match',
};

export default async function NouveauMatchPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer la liste des adversaires potentiels (autres joueurs du club)
  const allPlayers = await getPlayersByClub(player.clubId, { onlyActive: true });
  const opponents = allPlayers.filter((p) => p.id !== player.id);

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
          <h1 className="text-3xl font-bold">Enregistrer un match</h1>
          <p className="text-muted-foreground">
            Déclarez le résultat de votre rencontre
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Détails du match</CardTitle>
              <CardDescription>
                Remplissez les informations sur votre match pour mettre à jour le classement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MatchForm
                currentPlayer={{
                  id: player.id,
                  fullName: player.fullName,
                  currentElo: player.currentElo,
                }}
                opponents={
                  opponents.map((o) => ({
                    id: o.id,
                    fullName: o.fullName,
                    avatarUrl: o.avatarUrl,
                    currentElo: o.currentElo,
                  }))
                }
                clubId={player.clubId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Aide */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Format du score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Entrez le score de chaque set séparé par un espace.
              </p>
              <div className="space-y-2">
                <p><strong>Exemples :</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>6-4 6-2 (match en 2 sets)</li>
                  <li>6-4 3-6 7-5 (match en 3 sets)</li>
                  <li>7-6(5) 6-4 (avec tie-break)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Système ELO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Le calcul des points ELO prend en compte plusieurs facteurs :
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>+15%</strong> si nouvel adversaire</li>
                <li><strong>+20%</strong> pour une victoire exploit</li>
                <li><strong>-5%</strong> par match récent vs même adversaire</li>
                <li><strong>+10%</strong> si 3+ adversaires cette semaine</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <p className="text-sm">
                <strong>💡 Astuce :</strong> Jouez contre différents adversaires pour
                maximiser vos gains de points !
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
