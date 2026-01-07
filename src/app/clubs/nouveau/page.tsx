import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ClubCreationForm } from '@/components/clubs/club-creation-form';
import { db } from '@/lib/db';
import { players, clubCreationRequests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Créer un club - TennisMatchFinder',
  description: 'Créez votre club de tennis sur TennisMatchFinder',
};

export default async function NouveauClubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/clubs/nouveau');
  }

  // Vérifier si l'utilisateur a déjà un profil joueur (donc déjà dans un club)
  const [existingPlayer] = await db
    .select()
    .from(players)
    .where(eq(players.id, session.user.id))
    .limit(1);

  if (existingPlayer) {
    // L'utilisateur est déjà membre d'un club
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Vous êtes déjà membre d'un club
              </CardTitle>
              <CardDescription>
                Vous ne pouvez pas créer un nouveau club car vous êtes déjà membre d'un club.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Vérifier s'il y a une demande en cours
  const [pendingRequest] = await db
    .select()
    .from(clubCreationRequests)
    .where(
      and(
        eq(clubCreationRequests.userId, session.user.id),
        eq(clubCreationRequests.status, 'pending')
      )
    )
    .limit(1);

  if (pendingRequest) {
    // Une demande est déjà en cours
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-orange-500" />
                Demande en cours
              </CardTitle>
              <CardDescription>
                Votre demande de création de club est en attente d'approbation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="font-medium">{pendingRequest.clubName}</p>
                <p className="text-sm text-muted-foreground">
                  Demande envoyée le {new Date(pendingRequest.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              
              <Alert>
                <AlertDescription>
                  Vous recevrez un email dès que votre demande sera traitée. 
                  Le délai de traitement est généralement de 24 à 48 heures.
                </AlertDescription>
              </Alert>

              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Afficher le formulaire de création
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎾 Créer votre club
          </h1>
          <p className="text-muted-foreground">
            Lancez votre communauté de tennis sur TennisMatchFinder
          </p>
        </div>

        {/* Avantages */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl mb-2">👥</div>
                <p className="font-medium">Communauté</p>
                <p className="text-sm text-muted-foreground">Réunissez vos membres</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <p className="font-medium">Classements</p>
                <p className="text-sm text-muted-foreground">Système ELO intégré</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💬</div>
                <p className="font-medium">Chat</p>
                <p className="text-sm text-muted-foreground">Communication en temps réel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du club</CardTitle>
            <CardDescription>
              Remplissez ce formulaire pour demander la création de votre club.
              Votre demande sera examinée sous 24-48h.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClubCreationForm 
              userEmail={session.user.email || ''} 
              userName={session.user.name || ''}
            />
          </CardContent>
        </Card>

        {/* Info */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          En créant un club, vous acceptez nos{' '}
          <Link href="/terms" className="underline">conditions d'utilisation</Link>.
        </p>
      </div>
    </div>
  );
}
