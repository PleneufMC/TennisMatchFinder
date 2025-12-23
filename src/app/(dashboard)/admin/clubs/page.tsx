import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, Building2, Plus, Users, Trophy, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getAllClubs, getClubStats } from '@/lib/db/queries';
import { CreateClubDialog } from '@/components/admin/create-club-dialog';

export const metadata: Metadata = {
  title: 'Gestion des clubs',
  description: 'Gérer les clubs de tennis',
};

export default async function AdminClubsPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est admin
  if (!player.isAdmin) {
    redirect('/dashboard');
  }

  const clubs = await getAllClubs();
  
  // Ajouter les stats pour chaque club
  const clubsWithStats = await Promise.all(
    clubs.map(async (club) => {
      const stats = await getClubStats(club.id);
      return { ...club, ...stats };
    })
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Gestion des clubs
          </h1>
          <p className="text-muted-foreground">
            Créez et gérez les clubs de tennis
          </p>
        </div>
        <CreateClubDialog />
      </div>

      {/* Liste des clubs */}
      <Card>
        <CardHeader>
          <CardTitle>Clubs enregistrés</CardTitle>
          <CardDescription>
            {clubs.length} club{clubs.length !== 1 ? 's' : ''} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clubsWithStats.length > 0 ? (
            <div className="space-y-4">
              {clubsWithStats.map((club) => (
                <div
                  key={club.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border"
                >
                  {/* Infos principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg">
                        {club.name}
                      </span>
                      <Badge variant={club.isActive ? 'default' : 'secondary'}>
                        {club.isActive ? (
                          <><Check className="h-3 w-3 mr-1" /> Actif</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Inactif</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Slug : <code className="bg-muted px-1 rounded">{club.slug}</code>
                      {' • '}
                      URL d&apos;inscription : <code className="bg-muted px-1 rounded">/join/{club.slug}</code>
                    </p>
                    {club.description && (
                      <p className="text-sm text-muted-foreground">
                        {club.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {club.playersCount} membre{club.playersCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        {club.matchesCount} match{club.matchesCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/join/${club.slug}`} target="_blank">
                        Voir page inscription
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Aucun club</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre premier club pour commencer.
              </p>
              <CreateClubDialog />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">À propos des clubs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Chaque club possède un <strong>slug unique</strong> qui définit son URL d&apos;inscription.
          </p>
          <p>
            Par exemple, un club avec le slug <code className="bg-muted px-1 rounded">mccc</code> aura 
            l&apos;URL d&apos;inscription <code className="bg-muted px-1 rounded">/join/mccc</code>.
          </p>
          <p>
            Les joueurs qui s&apos;inscrivent via cette URL seront automatiquement associés à ce club
            après validation par un administrateur.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
