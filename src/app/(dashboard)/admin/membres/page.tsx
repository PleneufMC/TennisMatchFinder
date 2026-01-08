import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, Users, Search, MoreVertical, Shield, ShieldOff, UserX, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getPlayersByClub } from '@/lib/db/queries';
import { formatRelativeDate } from '@/lib/utils/dates';

export const metadata: Metadata = {
  title: 'Gestion des membres',
  description: 'Gérer les membres du club',
};

export default async function MembresPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  if (!player.isAdmin) {
    redirect('/dashboard');
  }

  const allPlayers = await getPlayersByClub(player.clubId, { orderBy: 'name' });
  const activePlayers = allPlayers.filter(p => p.isActive);
  const inactivePlayers = allPlayers.filter(p => !p.isActive);

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
            <Users className="h-8 w-8" />
            Gestion des membres
          </h1>
          <p className="text-muted-foreground">
            {activePlayers.length} membre{activePlayers.length > 1 ? 's' : ''} actif{activePlayers.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Membres actifs</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activePlayers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Membres inactifs</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{inactivePlayers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administrateurs</CardDescription>
            <CardTitle className="text-3xl text-primary">{allPlayers.filter(p => p.isAdmin).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les membres</CardTitle>
          <CardDescription>
            Cliquez sur un membre pour voir son profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allPlayers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun membre dans le club
              </p>
            ) : (
              <div className="divide-y">
                {allPlayers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <PlayerAvatar
                      src={member.avatarUrl}
                      name={member.fullName}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/profil?id=${member.id}`}
                          className="font-medium hover:underline truncate"
                        >
                          {member.fullName}
                        </Link>
                        {member.isAdmin && (
                          <Badge variant="default" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                        {!member.isActive && (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                        {member.isVerified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Vérifié
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{member.currentElo} ELO</span>
                        <span>•</span>
                        <span>{member.matchesPlayed} match{member.matchesPlayed > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>Inscrit {formatRelativeDate(member.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        member.currentElo >= 1500 ? 'text-yellow-600' :
                        member.currentElo >= 1300 ? 'text-blue-600' :
                        member.currentElo >= 1100 ? 'text-green-600' :
                        'text-muted-foreground'
                      }`}>
                        #{allPlayers.filter(p => p.isActive && p.currentElo > member.currentElo).length + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
