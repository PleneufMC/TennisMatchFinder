'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { ClubMember } from '@/lib/club/stats-service';

interface ClubMembersTableProps {
  clubId: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatLastMatch(dateString: string | null) {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

function StatusBadge({ status }: { status: 'active' | 'inactive' | 'new' }) {
  const config = {
    active: { label: 'Actif', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    inactive: { label: 'Inactif', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    new: { label: 'Nouveau', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  };
  
  return (
    <Badge variant="outline" className={config[status].className}>
      {status === 'active' && '✅ '}
      {status === 'inactive' && '⚠️ '}
      {status === 'new' && '🆕 '}
      {config[status].label}
    </Badge>
  );
}

export function ClubMembersTable({ clubId }: ClubMembersTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all');

  // Fetch members via the stats API (we reuse it for simplicity)
  // In a real app, you might want a dedicated endpoint
  const { data: stats, isLoading } = useQuery({
    queryKey: ['club-stats', clubId],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${clubId}/stats`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  // For the table, we need all members - we'll fake it with the available data
  // In production, you'd want a dedicated /api/clubs/[clubId]/members endpoint
  const members: ClubMember[] = [
    ...(stats?.topActive?.map((m: { id: string; fullName: string; avatarUrl: string | null; currentElo: number; matchCount: number }) => ({
      id: m.id,
      fullName: m.fullName,
      avatarUrl: m.avatarUrl,
      email: null,
      currentElo: m.currentElo,
      matchesPlayed: m.matchCount,
      lastMatchDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'active' as const,
    })) || []),
    ...(stats?.alerts?.inactiveMembers?.map((m: { id: string; fullName: string; avatarUrl: string | null; currentElo: number; lastMatchDate: string | null }) => ({
      id: m.id,
      fullName: m.fullName,
      avatarUrl: m.avatarUrl,
      email: null,
      currentElo: m.currentElo,
      matchesPlayed: 0,
      lastMatchDate: m.lastMatchDate,
      createdAt: new Date().toISOString(),
      status: 'inactive' as const,
    })) || []),
    ...(stats?.alerts?.newWithoutMatch?.map((m: { id: string; fullName: string; avatarUrl: string | null; joinedAt: string }) => ({
      id: m.id,
      fullName: m.fullName,
      avatarUrl: m.avatarUrl,
      email: null,
      currentElo: 1200,
      matchesPlayed: 0,
      lastMatchDate: null,
      createdAt: m.joinedAt,
      status: 'new' as const,
    })) || []),
  ];

  // Remove duplicates by id
  const uniqueMembers = members.filter((m, i, arr) => 
    arr.findIndex(x => x.id === m.id) === i
  );

  // Filter members
  const filteredMembers = uniqueMembers.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-semibold">
            👥 Membres ({uniqueMembers.length})
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-48"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter === 'all' ? 'Tous' : statusFilter}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Tous
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  ✅ Actifs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                  ⚠️ Inactifs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('new')}>
                  🆕 Nouveaux
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search ? 'Aucun membre trouvé' : 'Aucun membre dans ce club'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">ELO</TableHead>
                  <TableHead className="text-right">Matchs</TableHead>
                  <TableHead>Dernier match</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Link 
                        href={`/profil/${member.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.fullName}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {member.currentElo}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.matchesPlayed}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLastMatch(member.lastMatchDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={member.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
