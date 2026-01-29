/**
 * Page d'invitation par parrainage
 * /invite/[playerId]
 * 
 * Landing page personnalisée quand un utilisateur clique sur un lien de parrainage.
 * Affiche les infos du parrain et redirige vers l'inscription avec le referrerId.
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { players, clubs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, Users, TrendingUp, ArrowRight, Gift, 
  CheckCircle, Sparkles, Target
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface InvitePageProps {
  params: Promise<{ playerId: string }>;
}

// Générer les métadonnées dynamiques
export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { playerId } = await params;
  
  // Récupérer les infos du parrain
  const [referrer] = await db
    .select({
      fullName: players.fullName,
      currentElo: players.currentElo,
    })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!referrer) {
    return {
      title: 'Invitation | TennisMatchFinder',
    };
  }

  return {
    title: `${referrer.fullName} vous invite | TennisMatchFinder`,
    description: `Rejoignez TennisMatchFinder grâce à l'invitation de ${referrer.fullName} et trouvez des partenaires de tennis près de chez vous.`,
    openGraph: {
      title: `${referrer.fullName} vous invite sur TennisMatchFinder`,
      description: 'Trouvez des partenaires de tennis et progressez avec le système ELO innovant.',
    },
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { playerId } = await params;

  // Récupérer les infos du parrain avec son club
  const [referrer] = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      avatarUrl: players.avatarUrl,
      currentElo: players.currentElo,
      matchesPlayed: players.matchesPlayed,
      wins: players.wins,
      clubId: players.clubId,
      clubName: clubs.name,
      clubSlug: clubs.slug,
    })
    .from(players)
    .leftJoin(clubs, eq(players.clubId, clubs.id))
    .where(eq(players.id, playerId))
    .limit(1);

  // Si le parrain n'existe pas, rediriger vers l'inscription normale
  if (!referrer) {
    redirect('/register');
  }

  const winRate = referrer.matchesPlayed > 0 
    ? Math.round((referrer.wins / referrer.matchesPlayed) * 100) 
    : 0;

  const initials = referrer.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container max-w-2xl mx-auto px-4 py-12">
        {/* Header avec badge invitation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full px-4 py-2 mb-6">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-medium">Invitation spéciale</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-primary">{referrer.fullName}</span> vous invite
          </h1>
          <p className="text-muted-foreground text-lg">
            Rejoignez la communauté TennisMatchFinder et trouvez des partenaires de jeu
          </p>
        </div>

        {/* Card du parrain */}
        <Card className="mb-8 border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-primary/20">
              <AvatarImage src={referrer.avatarUrl || undefined} alt={referrer.fullName} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{referrer.fullName}</CardTitle>
            {referrer.clubName && (
              <CardDescription className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                {referrer.clubName}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{referrer.currentElo}</div>
                <div className="text-xs text-muted-foreground">ELO</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{referrer.matchesPlayed}</div>
                <div className="text-xs text-muted-foreground">Matchs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{winRate}%</div>
                <div className="text-xs text-muted-foreground">Victoires</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avantages */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-center">
            Pourquoi rejoindre TennisMatchFinder ?
          </h2>
          
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Système ELO innovant</h3>
                <p className="text-sm text-muted-foreground">
                  Un classement qui récompense la diversité des rencontres
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">Trouvez des partenaires</h3>
                <p className="text-sm text-muted-foreground">
                  Matchmaking intelligent basé sur votre niveau et disponibilités
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">Suivez votre progression</h3>
                <p className="text-sm text-muted-foreground">
                  Statistiques détaillées, badges et historique des matchs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Offre Early Bird */}
        <Card className="mb-8 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-200">
                  Offre Early Bird
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Gratuit jusqu&apos;au 30 juin 2026
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              {[
                'Toutes les fonctionnalités Premium incluses',
                'Badge Founding Member exclusif',
                'Prix préférentiel à vie',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button size="lg" className="w-full sm:w-auto px-8" asChild>
            <Link href={`/register?ref=${playerId}`}>
              Rejoindre gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          <p className="text-xs text-muted-foreground">
            En vous inscrivant, vous acceptez nos{' '}
            <Link href="/terms" className="text-primary hover:underline">
              conditions d&apos;utilisation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
