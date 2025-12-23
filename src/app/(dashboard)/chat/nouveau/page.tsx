import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, MessageCircle, Search, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/avatar';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getPlayersByClub } from '@/lib/db/queries';
import { NewChatButton } from '@/components/chat/new-chat-button';

export const metadata: Metadata = {
  title: 'Nouvelle conversation',
  description: 'Démarrer une nouvelle conversation',
};

export default async function NewChatPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer les autres joueurs du club
  const allPlayers = await getPlayersByClub(player.clubId, { 
    activeOnly: true,
    orderBy: 'name' 
  });
  
  // Exclure le joueur courant
  const otherPlayers = allPlayers.filter(p => p.id !== player.id);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chat">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle conversation</h1>
          <p className="text-muted-foreground">
            Sélectionnez un membre pour démarrer une discussion
          </p>
        </div>
      </div>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres du club
          </CardTitle>
          <CardDescription>
            {otherPlayers.length} membre{otherPlayers.length !== 1 ? 's' : ''} disponible{otherPlayers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {otherPlayers.length > 0 ? (
            <div className="space-y-2">
              {otherPlayers.map((otherPlayer) => (
                <NewChatButton
                  key={otherPlayer.id}
                  currentPlayerId={player.id}
                  clubId={player.clubId}
                  targetPlayer={otherPlayer}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Aucun autre membre</h3>
              <p className="text-muted-foreground">
                Il n&apos;y a pas encore d&apos;autres membres dans votre club.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
