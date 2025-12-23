import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft, Hash, Plus, MessageCircle, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getClubSections } from '@/lib/db/queries';
import { CreateSectionsButton } from '@/components/admin/create-sections-button';

export const metadata: Metadata = {
  title: 'Salons de discussion',
  description: 'Gérer les salons de discussion du club',
};

export default async function AdminSectionsPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est admin
  if (!player.isAdmin) {
    redirect('/dashboard');
  }

  const sections = await getClubSections(player.clubId);

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
            <Hash className="h-6 w-6" />
            Salons de discussion
          </h1>
          <p className="text-muted-foreground">
            Gérez les salons de discussion du club
          </p>
        </div>
        <CreateSectionsButton hasSections={sections.length > 0} />
      </div>

      {/* Liste des sections */}
      <Card>
        <CardHeader>
          <CardTitle>Salons actifs</CardTitle>
          <CardDescription>
            {sections.length} salon{sections.length !== 1 ? 's' : ''} de discussion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length > 0 ? (
            <div className="space-y-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  {/* Icône */}
                  <div className="text-3xl flex-shrink-0">
                    {section.icon || '💬'}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        # {section.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Ordre: {section.sectionOrder}
                      </Badge>
                    </div>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {section.memberCount} membre{section.memberCount !== 1 ? 's' : ''}
                      </span>
                      {section.lastMessage && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          Dernier message: {new Date(section.lastMessage.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/chat/${section.id}`}>
                      Voir
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Aucun salon</h3>
              <p className="text-muted-foreground mb-4">
                Créez les salons par défaut pour permettre aux membres de discuter.
              </p>
              <CreateSectionsButton hasSections={false} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">À propos des salons</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Les salons de discussion sont des espaces de conversation ouverts à tous les membres du club.
          </p>
          <p>
            Contrairement aux conversations privées, les salons sont visibles par tous et permettent 
            des échanges collectifs sur des sujets spécifiques (annonces, recherche de partenaires, etc.).
          </p>
          <p>
            Les membres rejoignent automatiquement un salon lorsqu&apos;ils y accèdent pour la première fois.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
