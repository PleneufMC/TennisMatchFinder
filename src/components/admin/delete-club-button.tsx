'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface DeleteClubButtonProps {
  clubId: string;
  clubName: string;
  playersCount: number;
  isOwnClub: boolean;
}

export function DeleteClubButton({ clubId, clubName, playersCount, isOwnClub }: DeleteClubButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const canDelete = !isOwnClub && playersCount === 0;

  async function handleDelete() {
    try {
      setIsDeleting(true);
      
      const res = await fetch(`/api/admin/clubs/${clubId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast.success(`Club "${clubName}" supprimé avec succès`);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  }

  // Tooltip pour expliquer pourquoi on ne peut pas supprimer
  const getDisabledReason = () => {
    if (isOwnClub) return 'Vous ne pouvez pas supprimer votre propre club';
    if (playersCount > 0) return `${playersCount} joueur(s) inscrit(s) - impossible de supprimer`;
    return '';
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={!canDelete}
          title={getDisabledReason()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le club ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Le club <strong>&quot;{clubName}&quot;</strong> sera définitivement supprimé.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
