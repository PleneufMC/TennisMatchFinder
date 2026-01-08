import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getRivalry } from '@/lib/rivalries';
import { RivalryDetail } from '@/components/rivalries';

export const metadata: Metadata = {
  title: 'Face-à-Face',
  description: 'Historique des confrontations entre deux joueurs',
};

interface PageProps {
  params: {
    playerId: string;
    opponentId: string;
  };
}

export default async function RivalryPage({ params }: PageProps) {
  const currentPlayer = await getServerPlayer();

  if (!currentPlayer) {
    redirect('/login');
  }

  const { playerId, opponentId } = params;

  // Vérifier que le joueur courant est bien l'un des deux
  if (currentPlayer.id !== playerId && currentPlayer.id !== opponentId) {
    redirect('/dashboard');
  }

  // Récupérer la rivalité
  const rivalry = await getRivalry(playerId, opponentId);

  if (!rivalry) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Button variant="ghost" asChild>
        <Link href="/profil">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au profil
        </Link>
      </Button>

      {/* Détail de la rivalité */}
      <RivalryDetail rivalry={rivalry} currentPlayerId={currentPlayer.id} />
    </div>
  );
}
