'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, UserX, UserPlus, Flag, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface InactiveMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  lastMatchDate: string | null;
  daysSinceLastMatch: number | null;
  currentElo: number;
}

interface NewMemberWithoutMatch {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  joinedAt: string;
}

interface ClubAlerts {
  inactiveMembers: InactiveMember[];
  newWithoutMatch: NewMemberWithoutMatch[];
  pendingReports: number;
}

interface ClubAlertsSectionProps {
  alerts: ClubAlerts;
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function ClubAlertsSection({ alerts, clubId }: ClubAlertsSectionProps) {
  const [inactiveOpen, setInactiveOpen] = useState(alerts.inactiveMembers.length <= 3);
  const [newMembersOpen, setNewMembersOpen] = useState(alerts.newWithoutMatch.length <= 3);

  const totalAlerts = 
    alerts.inactiveMembers.length + 
    alerts.newWithoutMatch.length + 
    alerts.pendingReports;

  if (totalAlerts === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-green-600 text-lg font-medium">✅ Aucune alerte</div>
          <p className="text-muted-foreground text-sm mt-1">
            Tous vos membres sont actifs et engagés !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Alertes
            <Badge variant="secondary" className="ml-2">
              {totalAlerts}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Membres inactifs */}
        {alerts.inactiveMembers.length > 0 && (
          <Collapsible open={inactiveOpen} onOpenChange={setInactiveOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-500" />
                  <span className="font-medium">
                    {alerts.inactiveMembers.length} membres inactifs depuis 30+ jours
                  </span>
                </div>
                {inactiveOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {alerts.inactiveMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link 
                        href={`/profil/${member.id}`}
                        className="font-medium hover:underline"
                      >
                        {member.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {member.daysSinceLastMatch !== null 
                          ? `Dernier match il y a ${member.daysSinceLastMatch} jours`
                          : 'Aucun match joué'}
                      </p>
                    </div>
                  </div>
                  {member.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={`mailto:${member.email}?subject=On vous attend sur les courts !`}>
                        <Mail className="h-3 w-3 mr-1" />
                        Contacter
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Nouveaux sans match */}
        {alerts.newWithoutMatch.length > 0 && (
          <Collapsible open={newMembersOpen} onOpenChange={setNewMembersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">
                    {alerts.newWithoutMatch.length} nouveaux membres sans match
                  </span>
                </div>
                {newMembersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {alerts.newWithoutMatch.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link 
                        href={`/profil/${member.id}`}
                        className="font-medium hover:underline"
                      >
                        {member.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Inscrit le {formatDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/profil/${member.id}`}>
                      Voir profil
                    </Link>
                  </Button>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Signalements en attente */}
        {alerts.pendingReports > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-orange-500" />
              <span className="font-medium">
                {alerts.pendingReports} signalements en attente
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/club/${clubId}/moderation`}>
                Gérer
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
