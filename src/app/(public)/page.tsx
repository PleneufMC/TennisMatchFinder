import Link from 'next/link';
import { ArrowRight, Trophy, Users, TrendingUp, MessageSquare, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Décoration background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-tennis-green/10 blur-3xl" />

        <div className="container px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            🎾 Nouveau : Système ELO innovant
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Trouvez votre prochain
            <span className="text-gradient"> adversaire de tennis</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            TennisMatchFinder connecte les joueurs de tennis de votre club avec un système
            de classement ELO qui récompense la diversité des rencontres.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/join/mccc">Rejoindre le club MCCC</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Gratuit pour toujours • Aucune carte bancaire requise
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
              Créer mon compte gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
