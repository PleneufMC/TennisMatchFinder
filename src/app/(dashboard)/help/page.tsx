import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerPlayer } from '@/lib/auth-helpers';
import { 
  HelpCircle, 
  MessageCircle, 
  BookOpen, 
  Mail, 
  ExternalLink,
  Trophy,
  Users,
  Swords,
  TrendingUp,
  Shield,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Aide',
  description: 'Centre d\'aide et FAQ',
};

export default async function HelpPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          Centre d'aide
        </h1>
        <p className="text-muted-foreground">
          Trouvez des réponses à vos questions
        </p>
      </div>

      {/* Guides rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
              <Swords className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-lg">Enregistrer un match</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Déclarez vos résultats pour mettre à jour votre classement ELO.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/matchs/nouveau">
                Enregistrer →
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Trouver un partenaire</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Consultez les membres disponibles et proposez un match.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/membres">
                Voir les membres →
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Discuter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Rejoignez les salons de discussion de votre club.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/chat">
                Ouvrir le chat →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Questions fréquentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="elo">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Comment fonctionne le système ELO ?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <p>
                  Le système ELO est un classement dynamique basé sur vos performances.
                  Chaque joueur commence à <strong>1000 points</strong>.
                </p>
                <p>Facteurs qui influencent vos gains/pertes :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>+15%</strong> si vous jouez contre un nouvel adversaire</li>
                  <li><strong>+20%</strong> pour une victoire "exploit" (adversaire &gt; 100 pts au-dessus)</li>
                  <li><strong>-5%</strong> par match récent contre le même adversaire</li>
                  <li><strong>+10%</strong> si vous avez joué 3+ adversaires différents cette semaine</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="match">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Swords className="h-4 w-4" />
                  Comment enregistrer un match ?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Allez dans <strong>Matchs → Enregistrer un match</strong></li>
                  <li>Sélectionnez votre adversaire dans la liste des membres</li>
                  <li>Indiquez le vainqueur et le score (ex: 6-4 6-2)</li>
                  <li>Votre adversaire recevra une notification pour confirmer</li>
                  <li>Une fois confirmé, les ELO sont mis à jour automatiquement</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="confirm">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Pourquoi mon adversaire doit confirmer ?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p>
                  La confirmation par l'adversaire garantit l'intégrité du classement.
                  Cela évite les erreurs de saisie et assure que les deux joueurs 
                  sont d'accord sur le résultat. Si votre adversaire refuse, 
                  le match est annulé et vous pouvez le déclarer à nouveau avec le bon score.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ranking">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Comment monter dans le classement ?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <p>Pour maximiser vos gains ELO :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Jouez régulièrement (au moins 1 match/semaine)</li>
                  <li>Variez vos adversaires (bonus diversité)</li>
                  <li>Osez défier des joueurs mieux classés (bonus exploit)</li>
                  <li>Évitez de jouer toujours contre la même personne</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="badges">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Que sont les badges ?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p>
                  Les badges sont des récompenses que vous gagnez en accomplissant 
                  certains objectifs : premier match, série de victoires, 
                  nombre de matchs joués, etc. Ils apparaissent sur votre profil.
                  <br /><br />
                  <em>🚧 Cette fonctionnalité est en cours de développement.</em>
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="chat-forum">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Quelle différence entre Chat et Forum ?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <p><strong>💬 Chat</strong> - Pour les échanges rapides et spontanés :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Messages en temps réel</li>
                  <li>Messages supprimés après <strong>24 heures</strong></li>
                  <li>Idéal pour : "Qui joue ce soir ?", "Court libre ?"</li>
                </ul>
                <p className="mt-3"><strong>📋 Forum</strong> - Pour les discussions durables :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Messages conservés indéfiniment</li>
                  <li>Organisé par catégories et sujets</li>
                  <li>Idéal pour : annonces, conseils, débats, résultats de tournois</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Besoin d'aide supplémentaire ?
          </CardTitle>
          <CardDescription>
            Notre équipe est là pour vous aider
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" asChild>
            <a href="mailto:support@tennismatchfinder.net">
              <Mail className="h-4 w-4 mr-2" />
              Envoyer un email
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/forum">
              <MessageCircle className="h-4 w-4 mr-2" />
              Poser une question sur le forum
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Version */}
      <p className="text-center text-sm text-muted-foreground">
        TennisMatchFinder v1.0.0 • Fait avec 🎾 pour les passionnés de tennis
      </p>
    </div>
  );
}
