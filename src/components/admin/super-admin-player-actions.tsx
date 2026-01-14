'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  MoreVertical,
  Building2,
  UserX,
  User,
  Loader2,
  ArrowRightLeft,
  Trash2,
  AlertTriangle,
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

interface SuperAdminPlayerActionsProps {
  playerId: string;
  playerName: string;
  currentClubId: string | null;
  currentClubName?: string | null;
  clubs: Club[];
}

export function SuperAdminPlayerActions({
  playerId,
  playerName,
  currentClubId,
  currentClubName,
  clubs,
}: SuperAdminPlayerActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showChangeClubDialog, setShowChangeClubDialog] = useState(false);
  const [showRemoveClubDialog, setShowRemoveClubDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [selectedClubId, setSelectedClubId] = useState<string>(currentClubId || '');

  const otherClubs = clubs.filter(c => c.id !== currentClubId);

  const handleChangeClub = async () => {
    if (!selectedClubId) {
      toast.error('Sélectionnez un club');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/super-admin/change-club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, targetClubId: selectedClubId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur');
      }

      const targetClub = clubs.find(c => c.id === selectedClubId);
      toast.success(`${playerName} a été assigné à ${targetClub?.name}`);
      setShowChangeClubDialog(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveClub = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/super-admin/change-club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, targetClubId: null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur');
      }

      toast.success(`${playerName} est maintenant un joueur indépendant`);
      setShowRemoveClubDialog(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (deleteConfirmation !== playerName) {
      toast.error('Le nom ne correspond pas');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/super-admin/delete-player?playerId=${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast.success(`${playerName} a été supprimé définitivement`);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

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
          
          <DropdownMenuItem onClick={() => router.push(`/profil/${playerId}`)}>
            <User className="h-4 w-4 mr-2" />
            Voir le profil
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => {
            setSelectedClubId(currentClubId || '');
            setShowChangeClubDialog(true);
          }}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            {currentClubId ? 'Changer de club' : 'Assigner à un club'}
          </DropdownMenuItem>

          {currentClubId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowRemoveClubDialog(true)}
              >
                <UserX className="h-4 w-4 mr-2" />
                Retirer du club
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer définitivement
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog pour changer/assigner un club */}
      <Dialog open={showChangeClubDialog} onOpenChange={setShowChangeClubDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {currentClubId ? `Changer le club de ${playerName}` : `Assigner ${playerName} à un club`}
            </DialogTitle>
            <DialogDescription>
              {currentClubId ? (
                <>Club actuel : <strong>{currentClubName}</strong></>
              ) : (
                <>Ce joueur n&apos;est actuellement affilié à aucun club.</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetClub">
                {currentClubId ? 'Nouveau club' : 'Club'}
              </Label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un club" />
                </SelectTrigger>
                <SelectContent>
                  {(currentClubId ? otherClubs : clubs).map((club) => (
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
              onClick={() => setShowChangeClubDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleChangeClub}
              disabled={isLoading || !selectedClubId || selectedClubId === currentClubId}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              {currentClubId ? 'Changer' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation pour retirer du club */}
      <Dialog open={showRemoveClubDialog} onOpenChange={setShowRemoveClubDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer {playerName} du club ?</DialogTitle>
            <DialogDescription>
              Cette action va retirer le joueur de <strong>{currentClubName}</strong>.
              Il deviendra un joueur indépendant.
              <br /><br />
              Ses statistiques et son historique de matchs seront conservés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveClubDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveClub}
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

      {/* Dialog de confirmation pour supprimer définitivement */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open);
        if (!open) setDeleteConfirmation('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Supprimer définitivement {playerName} ?
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-destructive text-sm">
                <strong>⚠️ Cette action est irréversible !</strong>
                <br />
                Toutes les données du joueur seront supprimées :
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Compte utilisateur</li>
                  <li>Profil joueur</li>
                  <li>Historique des matchs</li>
                  <li>Historique ELO</li>
                  <li>Badges et achievements</li>
                  <li>Messages et notifications</li>
                  <li>Participations aux tournois et box leagues</li>
                </ul>
              </div>
              <div>
                Pour confirmer, tapez le nom du joueur : <strong>{playerName}</strong>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder={`Tapez "${playerName}" pour confirmer`}
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlayer}
              disabled={isLoading || deleteConfirmation !== playerName}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
