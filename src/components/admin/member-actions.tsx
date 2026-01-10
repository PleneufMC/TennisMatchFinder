'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  MoreVertical,
  Shield,
  ShieldOff,
  UserX,
  ArrowRightLeft,
  User,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Club {
  id: string;
  name: string;
  slug: string;
}

interface MemberActionsProps {
  memberId: string;
  memberName: string;
  isAdmin: boolean;
  isCurrentUser: boolean;
  clubs: Club[];
  currentClubId: string;
}

export function MemberActions({
  memberId,
  memberName,
  isAdmin,
  isCurrentUser,
  clubs,
  currentClubId,
}: MemberActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showKickDialog, setShowKickDialog] = useState(false);
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  const otherClubs = clubs.filter(c => c.id !== currentClubId);

  const handleToggleAdmin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/members/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur');
      }

      toast.success(isAdmin ? 'Droits admin retirés' : 'Droits admin accordés');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/members/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur');
      }

      toast.success(`${memberName} a été retiré du club`);
      setShowKickDialog(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!selectedClubId) {
      toast.error('Sélectionnez un club de destination');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/members/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, targetClubId: selectedClubId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur');
      }

      const targetClub = clubs.find(c => c.id === selectedClubId);
      toast.success(`${memberName} a été migré vers ${targetClub?.name}`);
      setShowMigrateDialog(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // Ne pas afficher le menu pour l'utilisateur actuel
  if (isCurrentUser) {
    return (
      <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
        Vous
      </span>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => router.push(`/profil/${memberId}`)}>
            <User className="h-4 w-4 mr-2" />
            Voir le profil
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleToggleAdmin}>
            {isAdmin ? (
              <>
                <ShieldOff className="h-4 w-4 mr-2" />
                Retirer admin
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Promouvoir admin
              </>
            )}
          </DropdownMenuItem>

          {otherClubs.length > 0 && (
            <DropdownMenuItem onClick={() => setShowMigrateDialog(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Migrer vers un autre club
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowKickDialog(true)}
          >
            <UserX className="h-4 w-4 mr-2" />
            Retirer du club
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de confirmation pour kick */}
      <Dialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer {memberName} du club ?</DialogTitle>
            <DialogDescription>
              Cette action va retirer le joueur du club. Il deviendra un joueur indépendant
              et pourra demander à rejoindre un autre club.
              <br /><br />
              Ses statistiques et son historique de matchs seront conservés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowKickDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleKick}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserX className="h-4 w-4 mr-2" />
              )}
              Retirer du club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour migration */}
      <Dialog open={showMigrateDialog} onOpenChange={setShowMigrateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Migrer {memberName} vers un autre club</DialogTitle>
            <DialogDescription>
              Sélectionnez le club de destination. Le joueur sera automatiquement
              transféré avec ses statistiques.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetClub">Club de destination</Label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un club" />
                </SelectTrigger>
                <SelectContent>
                  {otherClubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMigrateDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleMigrate}
              disabled={isLoading || !selectedClubId}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Migrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
