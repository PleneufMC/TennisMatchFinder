import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, Users, Building2, MapPin, Shield, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getAllClubs } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { players, clubs } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { formatRelativeDate } from '@/lib/utils/dates';
import { SuperAdminPlayerActions } from '@/components/admin/super-admin-player-actions';

// Liste des emails des super admins
const SUPER_ADMIN_EMAILS = [
  'music.music@free.fr',
  // Ajouter d'autres emails si nécessaire
];

export const metadata: Metadata = {
  title: 'Gestion de tous les joueurs',
  description: 'Gérer tous les joueurs de la plateforme',
};

async function getAllPlayers() {
  return db
    .select({
      id: players.id,
      fullName: players.fullName,
      avatarUrl: players.avatarUrl,
      currentElo: players.currentElo,
      matchesPlayed: players.matchesPlayed,
      isAdmin: players.isAdmin,
      isActive: players.isActive,
      isVerified: players.isVerified,
      city: players.city,
      clubId: players.clubId,
      createdAt: players.createdAt,
      clubName: clubs.name,
      clubSlug: clubs.slug,
    })
    .from(players)
    .leftJoin(clubs, eq(players.clubId, clubs.id))
    .orderBy(desc(players.createdAt));
}

async function isSuperAdmin(playerId: string): Promise<boolean> {
  // Vérifier par email
  const [user] = await db
    .select({ email: sql<string>`(SELECT email FROM users WHERE id = ${playerId})` })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);
  
  return !!(user && SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase() || ''));
}

export default async function TousLesJoueursPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Vérifier si c'est un super admin
  const superAdmin = await isSuperAdmin(player.id);
  if (!superAdmin) {
    redirect('/dashboard');
  }

  const [allPlayers, allClubs] = await Promise.all([
    getAllPlayers(),
    getAllClubs(),
  ]);

  const activeClubs = allClubs.filter(c => c.isActive);
  const playersWithClub = allPlayers.filter(p => p.clubId);
  const playersWithoutClub = allPlayers.filter(p => !p.clubId);

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
            Tous les joueurs
          </h1>
          <p className="text-muted-foreground">
            Gestion globale de tous les joueurs de la plateforme
          </p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total joueurs</CardDescription>
            <CardTitle className="text-3xl">{allPlayers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avec club</CardDescription>
            <CardTitle className="text-3xl text-green-600">{playersWithClub.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sans club</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{playersWithoutClub.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clubs actifs</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{activeClubs.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Joueurs sans club */}
      {playersWithoutClub.length > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <MapPin className="h-5 w-5" />
              Joueurs sans club ({playersWithoutClub.length})
            </CardTitle>
            <CardDescription>
              Ces joueurs ne sont affiliés à aucun club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {playersWithoutClub.map((member) => (
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
                        href={`/profil/${member.id}`}
                        className="font-medium hover:underline truncate"
                      >
                        {member.fullName}
                      </Link>
                      {member.city && (
                        <Badge variant="outline" className="gap-1">
                          <MapPin className="h-3 w-3" />
                          {member.city}
                        </Badge>
                      )}
                      {!member.isActive && (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{member.currentElo} ELO</span>
                      <span>•</span>
                      <span>Inscrit {formatRelativeDate(member.createdAt)}</span>
                    </div>
                  </div>
                  <SuperAdminPlayerActions
                    playerId={member.id}
                    playerName={member.fullName}
                    currentClubId={member.clubId}
                    clubs={activeClubs}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tous les joueurs avec club */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Joueurs avec club ({playersWithClub.length})
          </CardTitle>
          <CardDescription>
            Joueurs affiliés à un club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {playersWithClub.map((member) => (
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
                      href={`/profil/${member.id}`}
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
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{member.clubName}</span>
                    <span>•</span>
                    <span>{member.currentElo} ELO</span>
                    <span>•</span>
                    <span>{member.matchesPlayed} matchs</span>
                  </div>
                </div>
                <SuperAdminPlayerActions
                  playerId={member.id}
                  playerName={member.fullName}
                  currentClubId={member.clubId}
                  currentClubName={member.clubName}
                  clubs={activeClubs}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
