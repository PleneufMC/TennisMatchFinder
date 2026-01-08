import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Trophy, Users, TrendingUp, MessageSquare, Zap, Shield, Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Configuration Early Bird
const EARLY_BIRD_END_DATE = new Date('2026-06-30T23:59:59');

function EarlyBirdCountdown() {
  const now = new Date();
  const timeLeft = EARLY_BIRD_END_DATE.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-6">
      {/* Badge principale */}
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full px-5 py-2.5 shadow-lg shadow-amber-500/30">
        <Gift className="h-5 w-5" />
        <span className="font-bold">Offre Early Bird</span>
      </div>
      
      {/* Compte à rebours */}
      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2">
        <Clock className="h-4 w-4 text-amber-300" />
        <span className="text-white font-medium">
          Gratuit jusqu&apos;au <span className="text-amber-300 font-bold">30 juin 2026</span>
        </span>
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {daysLeft}j
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero Section with Clay Court Background */}
      <section className="relative overflow-hidden py-20 md:py-32 min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 -z-20">
          <Image
            src="/images/clay-court-bg.jpg"
            alt="Court de tennis terre battue"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
        </div>
        
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        
        {/* Decorative blur effects */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="container px-4 text-center relative z-10">
          {/* Early Bird Countdown - bien visible */}
          <EarlyBirdCountdown />

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white drop-shadow-lg">
            Trouvez votre prochain
            <span className="text-amber-400"> adversaire de tennis</span>
          </h1>

          <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8 drop-shadow">
            TennisMatchFinder connecte les joueurs de tennis de votre club avec un système
            de classement ELO qui récompense la diversité des rencontres.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg" asChild>
              <Link href="/register">
                Rejoindre gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20" asChild>
              <Link href="/join/mccc">Rejoindre le club MCCC</Link>
            </Button>
          </div>

          <p className="text-sm text-gray-300 mt-4">
            Aucune carte bancaire requise • Toutes les fonctionnalités incluses
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Tout ce dont vous avez besoin pour progresser
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Des outils puissants pour trouver des adversaires, suivre votre progression
              et participer à la vie de votre club.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Système ELO innovant</CardTitle>
                <CardDescription>
                  Un classement qui récompense la diversité des rencontres
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ +15% de points pour un nouvel adversaire</li>
                  <li>✓ Bonus exploit contre joueurs mieux classés</li>
                  <li>✓ Malus pour adversaires trop répétés</li>
                  <li>✓ Facteur K dynamique selon l&apos;expérience</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Suggestions intelligentes</CardTitle>
                <CardDescription>
                  Trouvez le partenaire idéal pour progresser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Matching basé sur le niveau ELO</li>
                  <li>✓ Compatibilité des disponibilités</li>
                  <li>✓ Préférences de jeu (simple, double)</li>
                  <li>✓ Score de nouveauté pour diversifier</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle>Suivi de progression</CardTitle>
                <CardDescription>
                  Visualisez votre évolution au fil du temps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Graphiques d&apos;évolution ELO</li>
                  <li>✓ Statistiques détaillées</li>
                  <li>✓ Historique des matchs</li>
                  <li>✓ Badges et achievements</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Forum communautaire</CardTitle>
                <CardDescription>
                  Échangez avec les membres de votre club
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Discussions par catégories</li>
                  <li>✓ Annonces de résultats</li>
                  <li>✓ Recherche de partenaires</li>
                  <li>✓ Mise à jour en temps réel</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle>Propositions de match</CardTitle>
                <CardDescription>
                  Organisez vos rencontres facilement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Envoi de propositions</li>
                  <li>✓ Date et lieu suggérés</li>
                  <li>✓ Notifications par email</li>
                  <li>✓ Historique des échanges</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="card-hover">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle>Multi-clubs</CardTitle>
                <CardDescription>
                  Une plateforme adaptée à chaque club
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Classements séparés par club</li>
                  <li>✓ Forums dédiés</li>
                  <li>✓ Configuration personnalisable</li>
                  <li>✓ Données isolées et sécurisées</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              En 4 étapes simples, commencez à jouer avec des adversaires de votre niveau
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Inscrivez-vous',
                description: 'Créez votre compte et rejoignez votre club en quelques clics',
              },
              {
                step: '2',
                title: 'Complétez votre profil',
                description: 'Indiquez votre niveau, vos disponibilités et vos préférences',
              },
              {
                step: '3',
                title: 'Trouvez un adversaire',
                description: 'Consultez les suggestions ou parcourez le classement',
              },
              {
                step: '4',
                title: 'Jouez et progressez',
                description: 'Enregistrez vos matchs et voyez votre ELO évoluer',
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à trouver votre prochain adversaire ?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Rejoignez TennisMatchFinder et commencez à jouer avec des adversaires
            adaptés à votre niveau dès aujourd&apos;hui.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              Créer mon compte
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
