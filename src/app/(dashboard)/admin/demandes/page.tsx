import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, UserPlus, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getAllJoinRequests, countPendingJoinRequests } from '@/lib/db/queries';
import { formatTimeAgo } from '@/lib/utils/dates';
import { JoinRequestActions } from '@/components/admin/join-request-actions';

export const metadata: Metadata = {
  title: 'Demandes d\'adhésion',
  description: 'Gérer les demandes d\'adhésion au club',
};

const LEVEL_LABELS: Record<string, string> = {
  'débutant': 'Débutant',
  'intermédiaire': 'Intermédiaire',
  'avancé': 'Avancé',
  'expert': 'Expert',
};

const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    variant: 'warning' as const,
    icon: Clock,
  },
  approved: {
    label: 'Approuvée',
    variant: 'success' as const,
    icon: CheckCircle,
  },
  rejected: {
    label: 'Refusée',
    variant: 'destructive' as const,
    icon: XCircle,
  },
};

export default async function AdminJoinRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est admin
  if (!player.isAdmin) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const statusFilter = params.status as 'pending' | 'approved' | 'rejected' | undefined;

  // Récupérer les demandes
  const requests = await getAllJoinRequests(player.clubId, {
    status: statusFilter,
    limit: 100,
  });

  // Compter les demandes en attente
  const pendingCount = await countPendingJoinRequests(player.clubId);

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
            <UserPlus className="h-6 w-6" />
            Demandes d&apos;adhésion
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} en attente</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Gérez les demandes d&apos;inscription au club
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={!statusFilter ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <Link href="/admin/demandes">Toutes</Link>
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <Link href="/admin/demandes?status=pending">
            <Clock className="h-4 w-4 mr-1" />
            En attente
          </Link>
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <Link href="/admin/demandes?status=approved">
            <CheckCircle className="h-4 w-4 mr-1" />
            Approuvées
          </Link>
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          asChild
        >
          <Link href="/admin/demandes?status=rejected">
            <XCircle className="h-4 w-4 mr-1" />
            Refusées
          </Link>
        </Button>
      </div>

      {/* Liste des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter
              ? STATUS_CONFIG[statusFilter]?.label || 'Demandes'
              : 'Toutes les demandes'}
          </CardTitle>
          <CardDescription>
            {requests.length} demande{requests.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => {
                const statusConfig = STATUS_CONFIG[request.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border"
                  >
                    {/* Infos principales */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">
                          {request.fullName}
                        </span>
                        <Badge variant={statusConfig.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{request.email}</p>
                        {request.phone && <p>📱 {request.phone}</p>}
                        <p>
                          Niveau : <strong>{LEVEL_LABELS[request.selfAssessedLevel] || request.selfAssessedLevel}</strong>
                        </p>
                        {request.message && (
                          <p className="italic">&quot;{request.message}&quot;</p>
                        )}
                        <p className="text-xs">
                          Demande envoyée {formatTimeAgo(request.createdAt.toISOString())}
                        </p>
                        {request.status === 'rejected' && request.rejectionReason && (
                          <p className="text-xs text-destructive">
                            Motif : {request.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {request.status === 'pending' && (
                      <JoinRequestActions
                        requestId={request.id}
                        playerName={request.fullName}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Aucune demande</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'pending'
                  ? 'Toutes les demandes ont été traitées !'
                  : 'Aucune demande d\'adhésion pour le moment.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
