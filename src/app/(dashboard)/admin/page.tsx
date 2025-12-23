import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Settings, UserPlus, Users, BarChart3, Bell, Shield, Hash, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getServerPlayer } from '@/lib/auth-helpers';
import { countPendingJoinRequests, getPlayersByClub, getClubSections, getAllClubs } from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Administration',
  description: 'Panneau d\'administration du club',
};

export default async function AdminPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est admin
  if (!player.isAdmin) {
    redirect('/dashboard');
  }

  // Récupérer les statistiques
  const [pendingRequests, allPlayers, sections, allClubs] = await Promise.all([
    countPendingJoinRequests(player.clubId),
    getPlayersByClub(player.clubId),
    getClubSections(player.clubId),
    getAllClubs(),
  ]);
  const activePlayers = allPlayers.filter(p => p.isActive).length;

  const adminLinks = [
    {
      href: '/admin/demandes',
      title: 'Demandes d\'adhésion',
      description: 'Gérer les nouvelles inscriptions',
      icon: UserPlus,
      badge: pendingRequests > 0 ? pendingRequests : undefined,
      badgeVariant: 'destructive' as const,
    },
    {
      href: '/admin/membres',
      title: 'Gestion des membres',
      description: 'Voir et modifier les profils',
      icon: Users,
      badge: activePlayers,
      badgeVariant: 'secondary' as const,
    },
    {
      href: '/admin/statistiques',
      title: 'Statistiques',
      description: 'Activité et performances du club',
      icon: BarChart3,
    },
    {
      href: '/admin/notifications',
      title: 'Notifications',
      description: 'Envoyer des messages aux membres',
      icon: Bell,
    },
    {
      href: '/admin/sections',
      title: 'Salons de discussion',
      description: 'Gérer les salons du club',
      icon: Hash,
      badge: sections.length,
      badgeVariant: 'secondary' as const,
    },
    {
      href: '/admin/clubs',
      title: 'Gestion des clubs',
      description: 'Créer et gérer les clubs',
      icon: Building2,
      badge: allClubs.length,
      badgeVariant: 'secondary' as const,
    },
    {
      href: '/admin/parametres',
      title: 'Paramètres du club',
      description: 'Configuration générale',
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Administration
        </h1>
        <p className="text-muted-foreground">
          Gérez votre club et ses membres
        </p>
      </div>

      {/* Alertes */}
      {pendingRequests > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <UserPlus className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {pendingRequests} demande{pendingRequests > 1 ? 's' : ''} en attente
                </h3>
                <p className="text-sm text-muted-foreground">
                  De nouveaux joueurs souhaitent rejoindre le club
                </p>
              </div>
              <Link
                href="/admin/demandes"
                className="text-sm font-medium text-primary hover:underline"
              >
                Voir les demandes →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liens rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {link.title}
                    {link.badge !== undefined && (
                      <Badge variant={link.badgeVariant}>{link.badge}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Membres actifs</CardDescription>
            <CardTitle className="text-3xl">{activePlayers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Demandes en attente</CardDescription>
            <CardTitle className="text-3xl">{pendingRequests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total membres</CardDescription>
            <CardTitle className="text-3xl">{allPlayers.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
