'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Target,
  Euro,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  Instagram,
  Megaphone,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Zap,
  MousePointer,
  Eye,
  UserPlus,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

// Types
interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category?: string;
}

interface WeekData {
  week: number;
  dates: string;
  title: string;
  focus: string;
  budget: number;
  targetSignups: string;
  cplTarget: string;
  tasks: string[];
  icon: React.ReactNode;
}

// Data
const budgetAllocation = [
  { name: 'Google Ads', amount: 400, percentage: 40, color: 'bg-blue-500' },
  { name: 'Meta Ads', amount: 300, percentage: 30, color: 'bg-purple-500' },
  { name: 'Influenceurs', amount: 200, percentage: 20, color: 'bg-pink-500' },
  { name: 'Réserve', amount: 100, percentage: 10, color: 'bg-gray-400' },
];

const projections = [
  { scenario: 'Pessimiste', signups: 85, cpl: '11,76€', color: 'text-red-500' },
  { scenario: 'Réaliste', signups: 110, cpl: '9,09€', color: 'text-yellow-500' },
  { scenario: 'Optimiste', signups: 140, cpl: '7,14€', color: 'text-green-500' },
];

const weeklyPlan: WeekData[] = [
  {
    week: 1,
    dates: '17-23 mars',
    title: 'Setup & Fondations',
    focus: 'Configuration tracking & landing page',
    budget: 0,
    targetSignups: '0',
    cplTarget: '-',
    icon: <Zap className="h-5 w-5" />,
    tasks: [
      'Créer propriété Google Analytics 4',
      'Configurer événements de conversion (signup_started, signup_completed, etc.)',
      'Installer Meta Pixel Facebook',
      'Optimiser landing page (above the fold, mobile)',
      'Préparer assets créatifs (3 visuels + 1 vidéo 15s)',
      'Créer comptes Google Ads et Meta Business',
    ],
  },
  {
    week: 2,
    dates: '24-30 mars',
    title: 'Lancement Google Ads',
    focus: 'Campagne Search haute intention',
    budget: 105,
    targetSignups: '15-20',
    cplTarget: '<7€',
    icon: <Search className="h-5 w-5" />,
    tasks: [
      'Lancer campagne Search (15€/jour)',
      'Configurer groupes d\'annonces par ville (Top 10)',
      'Activer mots-clés haute intention',
      'Ajouter mots-clés négatifs',
      'Créer 3 variantes d\'annonces',
      'Surveiller Quality Score quotidiennement',
    ],
  },
  {
    week: 3,
    dates: '31 mars - 6 avril',
    title: 'Lancement Meta Ads',
    focus: 'Lookalike & Retargeting',
    budget: 175,
    targetSignups: '35-45',
    cplTarget: '<8€',
    icon: <Instagram className="h-5 w-5" />,
    tasks: [
      'Lancer campagne Lookalike Tennis France (10€/jour)',
      'Configurer audience (intérêts tennis, 25-55 ans)',
      'Déployer créatif vidéo "Frustration WhatsApp"',
      'Lancer carrousel Before/After',
      'Préparer campagne retargeting S4',
      'Tester différents placements (Feed, Stories, Reels)',
    ],
  },
  {
    week: 4,
    dates: '7-13 avril',
    title: 'Micro-Influenceurs',
    focus: 'Credibilité sociale & awareness',
    budget: 375,
    targetSignups: '60-80',
    cplTarget: '<9€',
    icon: <Users className="h-5 w-5" />,
    tasks: [
      'Contacter 10-15 créateurs tennis (5K-50K abonnés)',
      'Négocier partenariats (50-100€/créateur)',
      'Créer UTM unique par influenceur',
      'Distribuer codes promo personnalisés',
      'Lancer campagne retargeting Meta',
      'Optimiser campagnes Google/Meta selon performance S2-S3',
    ],
  },
  {
    week: 5,
    dates: '14-20 avril',
    title: 'Optimisation #1',
    focus: 'Analyse & ajustements',
    budget: 50,
    targetSignups: '70-85',
    cplTarget: '<10€',
    icon: <BarChart3 className="h-5 w-5" />,
    tasks: [
      'Analyser performance S2-S4 par canal',
      'Identifier top 3 mots-clés Google',
      'Identifier top créatif Meta',
      'Couper campagnes CPL > 15€',
      'Réallouer budget vers winners',
      'Préparer visuels Roland-Garros',
    ],
  },
  {
    week: 6,
    dates: '21-27 avril',
    title: 'Optimisation #2',
    focus: 'Scaling progressif',
    budget: 50,
    targetSignups: '75-95',
    cplTarget: '<10€',
    icon: <TrendingUp className="h-5 w-5" />,
    tasks: [
      'Augmenter budget mots-clés performants +50%',
      'Dupliquer ad sets Meta gagnants',
      'Élargir audiences lookalike (5% → 10%)',
      'Intensifier retargeting',
      'Préparer offensive finale',
      'Valider messaging Roland-Garros',
    ],
  },
  {
    week: 7,
    dates: '28 avril - 4 mai',
    title: 'Push Roland-Garros #1',
    focus: 'Offensive saisonnière',
    budget: 100,
    targetSignups: '90-110',
    cplTarget: '<10€',
    icon: <Target className="h-5 w-5" />,
    tasks: [
      'Lancer créatifs thématiques terre battue',
      'Adapter copy: "Roland-Garros arrive"',
      'Maximiser budget sur canaux validés',
      'Booster posts organiques performants',
      'Relance email base existante',
      'Activer derniers influenceurs',
    ],
  },
  {
    week: 8,
    dates: '5-11 mai',
    title: 'Push Roland-Garros #2',
    focus: 'Sprint final',
    budget: 100,
    targetSignups: '100-120',
    cplTarget: '<10€',
    icon: <Megaphone className="h-5 w-5" />,
    tasks: [
      'Dépenser budget restant sur winners',
      'Focus retargeting audience chaude',
      'Dernière vague influenceurs',
      'Rapport final de performance',
      'Analyse ROI par canal',
      'Planifier phase 2 post-campagne',
    ],
  },
];

const googleAdsKeywords = {
  highIntent: [
    { keyword: 'partenaire tennis [ville]', match: 'Phrase', cpc: '1,80€' },
    { keyword: 'trouver partenaire tennis', match: 'Phrase', cpc: '1,60€' },
    { keyword: 'recherche joueur tennis', match: 'Phrase', cpc: '1,40€' },
    { keyword: 'adversaire tennis [ville]', match: 'Phrase', cpc: '1,50€' },
    { keyword: 'tennis entre particuliers', match: 'Phrase', cpc: '1,20€' },
  ],
  longTail: [
    { keyword: 'comment trouver partenaire tennis', match: 'Phrase', cpc: '0,50€' },
    { keyword: 'jouer tennis sans club', match: 'Phrase', cpc: '0,60€' },
    { keyword: 'tennis loisir [ville]', match: 'Phrase', cpc: '0,45€' },
    { keyword: 'niveau tennis amateur', match: 'Broad', cpc: '0,40€' },
    { keyword: 'application tennis gratuite', match: 'Phrase', cpc: '0,70€' },
  ],
  negative: [
    'cours tennis', 'leçon tennis', 'professeur tennis', 'raquette tennis',
    'chaussure tennis', 'roland garros billets', 'tennis de table', 'ping pong',
  ],
};

const adCopies = {
  google: [
    {
      title: 'Annonce 1 — Frustration',
      headline: 'Partenaire Tennis [Ville] - Trouvez en 30 Secondes',
      description: 'Fini les 15 messages WhatsApp. Matching par niveau ELO. Inscription gratuite. Trouvez un adversaire maintenant.',
      extensions: '⭐ Gratuit · 📍 [Ville] · ⚡ Matching instantané',
    },
    {
      title: 'Annonce 2 — Niveau',
      headline: 'Tennis [Ville] - Joueurs de Votre Niveau',
      description: 'Système ELO intelligent. Trouvez des adversaires adaptés. Sans engagement. Jouez quand vous voulez.',
      extensions: '⭐ 100% Gratuit · 📈 Suivi progression · 🎾 Multi-villes',
    },
    {
      title: 'Annonce 3 — Sans club',
      headline: 'Tennis Sans Club - Trouvez des Partenaires',
      description: 'Pas besoin de licence FFT. Jouez en liberté avec des joueurs de votre niveau. Application 100% gratuite.',
      extensions: '⭐ Sans engagement · 📍 Près de chez vous · ⚡ Instantané',
    },
  ],
  meta: {
    short: `🎾 15 messages WhatsApp pour organiser UN match ?

TennisMatchFinder trouve un adversaire de votre niveau en 30 secondes.

✅ Matching intelligent par ELO
✅ Sans engagement ni licence
✅ 100% gratuit

👉 Lien en bio`,
    long: `J'en avais marre.

Chaque semaine, la même galère :
→ "T'es dispo samedi ?"
→ "Non mais dimanche ?"
→ "Ah non j'ai les enfants"
→ "Et Jean-Pierre ?"
→ "Il est blessé"

15 messages. 3 jours. Pour UN match.

Maintenant j'utilise TennisMatchFinder :
1. Je choisis mon créneau
2. L'app me propose des joueurs de mon niveau
3. Je confirme

30 secondes. C'est réglé.

Le secret ? Un système ELO qui calcule vraiment ton niveau.
Pas de mismatch. Pas de frustration.

Gratuit. Sans club. Sans prise de tête.

🎾 Teste maintenant →`,
  },
};

const influencerBrief = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRIEF PARTENARIAT — TennisMatchFinder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Salut [Prénom] !

Je te contacte car je développe TennisMatchFinder, une app gratuite 
pour trouver des partenaires de tennis de son niveau.

Le concept : un système ELO (comme aux échecs) qui matche les joueurs 
intelligemment. Fini les 15 messages WhatsApp pour organiser un match.

🎯 CE QUE JE TE PROPOSE

• 1 story Instagram/TikTok montrant l'app
• Mentionner : "gratuit", "matching par niveau", "30 secondes"
• Ton lien tracké personnalisé : tennismatchfinder.net/?ref=[tonpseudo]

💰 COMPENSATION

• [50€ / 100€] via PayPal ou virement
• OU accès premium à vie (quand on lance le tier payant)
• OU les deux si tu fais une vidéo dédiée

📊 TON CODE PROMO

• Code : [PSEUDO]10 (pour tracker tes conversions)
• Tu peux offrir [avantage] à ta communauté

Ça t'intéresse ? Je peux te faire une démo en 5 min si tu veux.

Pierre
TennisMatchFinder`;

const ga4Events = [
  { event: 'signup_started', category: 'conversion', description: 'Clic sur CTA inscription (source: landing_hero, register_form)', status: 'active' },
  { event: 'signup_completed', category: 'conversion', description: 'Inscription réussie (club_slug, method: magic_link)', status: 'active' },
  { event: 'first_match_created', category: 'activation', description: 'Premier match enregistré (elo_gained)', status: 'active' },
  { event: 'match_now_activated', category: 'engagement', description: 'Activation disponibilité Match Now', status: 'active' },
  { event: 'elo_viewed', category: 'engagement', description: 'Consultation classement (player_elo)', status: 'active' },
  { event: 'badge_earned', category: 'engagement', description: 'Badge débloqué (badge_id, badge_name)', status: 'active' },
  { event: 'pricing_viewed', category: 'monetization', description: 'Visite page pricing (tier_viewed)', status: 'active' },
  { event: 'subscription', category: 'monetization', description: 'Action abonnement (tier, action)', status: 'active' },
];

const initialChecklist: ChecklistItem[] = [
  // Tracking - Déjà fait selon SESSION_GA4_SETUP_2026-01-11.md
  { id: 't1', text: 'GA4 installé et vérifié (Real-time) — G-SK1KGRV9KK', checked: true, category: 'tracking' },
  { id: 't2', text: 'Variable Netlify NEXT_PUBLIC_GA_MEASUREMENT_ID configurée', checked: true, category: 'tracking' },
  { id: 't3', text: 'Événements signup_started implémentés dans le code', checked: true, category: 'tracking' },
  { id: 't4', text: 'Événements signup_completed implémentés dans le code', checked: true, category: 'tracking' },
  { id: 't5', text: 'Test temps réel GA4 validé', checked: true, category: 'tracking' },
  { id: 't6', text: 'Composant SignupCtaButton avec tracking sur landing', checked: true, category: 'tracking' },
  { id: 't7', text: 'Hook useGoogleAnalytics disponible', checked: true, category: 'tracking' },
  { id: 't8', text: 'Événements marqués comme conversions dans GA4 (24-48h)', checked: false, category: 'tracking' },
  { id: 't9', text: 'Meta Pixel installé et vérifié', checked: false, category: 'tracking' },
  { id: 't10', text: 'Google Ads lié à GA4', checked: false, category: 'tracking' },
  // Landing Page - Produit existant et fonctionnel
  { id: 'l1', text: 'Landing page avec pricing Early Bird', checked: true, category: 'landing' },
  { id: 'l2', text: 'Mobile responsive (Tailwind)', checked: true, category: 'landing' },
  { id: 'l3', text: 'Formulaire inscription Magic Link', checked: true, category: 'landing' },
  { id: 'l4', text: 'Pages légales (CGU, Confidentialité, Cookies)', checked: true, category: 'landing' },
  { id: 'l5', text: 'Système de paiement Stripe configuré', checked: true, category: 'landing' },
  { id: 'l6', text: 'Bannière cookies avec consentement analytics', checked: true, category: 'landing' },
  { id: 'l7', text: 'Temps chargement < 3s (PageSpeed)', checked: false, category: 'landing' },
  // Comptes publicitaires
  { id: 'c1', text: 'Google Ads : compte créé, facturation OK', checked: false, category: 'comptes' },
  { id: 'c2', text: 'Meta Business : compte créé, domaine vérifié', checked: false, category: 'comptes' },
  { id: 'c3', text: 'Budgets quotidiens configurés', checked: false, category: 'comptes' },
  { id: 'c4', text: 'Alertes budget activées', checked: false, category: 'comptes' },
  // Assets créatifs
  { id: 'a1', text: '3 visuels statiques prêts (1200x628, 1080x1080, 1080x1920)', checked: false, category: 'assets' },
  { id: 'a2', text: '1 vidéo 15s "Frustration WhatsApp"', checked: false, category: 'assets' },
  { id: 'a3', text: 'Textes ads validés (voir onglet Annonces)', checked: true, category: 'assets' },
  { id: 'a4', text: 'Liste mots-clés finalisée (voir onglet Google Ads)', checked: true, category: 'assets' },
  { id: 'a5', text: 'Brief influenceur prêt (voir onglet Influenceurs)', checked: true, category: 'assets' },
];

export default function StrategieDigitalePage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const checklistProgress = Math.round(
    (checklist.filter(item => item.checked).length / checklist.length) * 100
  );

  const totalBudgetSpent = weeklyPlan.reduce((acc, week) => acc + week.budget, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="py-12 md:py-20 border-b">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Target className="h-3 w-3 mr-1" />
              Stratégie Marketing 360°
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Plan d&apos;Acquisition <span className="text-primary">TennisMatchFinder</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Objectif : <strong>100 inscrits</strong> pour <strong>1 000€</strong> en 8 semaines
              <br />
              <span className="text-sm">Mi-mars → Mi-mai 2026 (Pic Roland-Garros)</span>
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Euro className="h-4 w-4" />
                  <span className="text-sm">Budget Total</span>
                </div>
                <div className="text-3xl font-bold">1 000€</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm">Objectif Inscrits</span>
                </div>
                <div className="text-3xl font-bold">100+</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">CPL Cible</span>
                </div>
                <div className="text-3xl font-bold">≤10€</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Durée</span>
                </div>
                <div className="text-3xl font-bold">8 sem.</div>
              </CardContent>
            </Card>
          </div>

          {/* Projections */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projections Réalistes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {projections.map((proj) => (
                  <div
                    key={proj.scenario}
                    className="p-4 rounded-lg bg-muted/50 text-center"
                  >
                    <div className={`text-sm font-medium ${proj.color} mb-1`}>
                      {proj.scenario}
                    </div>
                    <div className="text-2xl font-bold">{proj.signups} inscrits</div>
                    <div className="text-sm text-muted-foreground">
                      CPL: {proj.cpl}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Budget Allocation */}
      <section className="py-12 border-b">
        <div className="container px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Euro className="h-6 w-6 text-primary" />
            Répartition du Budget
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Visual bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {budgetAllocation.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.amount}€ ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pie chart representation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {/* Google Ads - 40% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#3B82F6"
                        strokeWidth="20"
                        strokeDasharray="100.53 251.33"
                        strokeDashoffset="0"
                      />
                      {/* Meta Ads - 30% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#A855F7"
                        strokeWidth="20"
                        strokeDasharray="75.40 251.33"
                        strokeDashoffset="-100.53"
                      />
                      {/* Influenceurs - 20% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#EC4899"
                        strokeWidth="20"
                        strokeDasharray="50.27 251.33"
                        strokeDashoffset="-175.93"
                      />
                      {/* Réserve - 10% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#9CA3AF"
                        strokeWidth="20"
                        strokeDasharray="25.13 251.33"
                        strokeDashoffset="-226.2"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">1 000€</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-6">
                  {budgetAllocation.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Weekly Plan */}
      <section className="py-12 border-b">
        <div className="container px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Plan Semaine par Semaine
          </h2>

          <div className="space-y-4">
            {weeklyPlan.map((week) => (
              <Card
                key={week.week}
                className={`transition-all duration-300 ${
                  activeWeek === week.week ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setActiveWeek(activeWeek === week.week ? null : week.week)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {week.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Semaine {week.week} <span className="text-muted-foreground font-normal">({week.dates})</span>
                        </CardTitle>
                        <CardDescription>{week.title}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <div className="font-semibold">{week.budget}€</div>
                        <div className="text-sm text-muted-foreground">
                          {week.targetSignups} inscrits
                        </div>
                      </div>
                      {activeWeek === week.week ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {activeWeek === week.week && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Focus</div>
                        <div className="font-medium">{week.focus}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">CPL Cible</div>
                        <div className="font-medium">{week.cplTarget}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Budget</div>
                        <div className="font-medium">{week.budget}€</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium mb-2">Actions clés :</div>
                      {week.tasks.map((task, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Budget timeline */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Progression Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Progress value={(totalBudgetSpent / 1000) * 100} className="flex-1" />
                <span className="text-sm font-medium">{totalBudgetSpent}€ / 1 000€</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {weeklyPlan.map((week) => (
                  <div key={week.week} className="text-center">
                    <div>S{week.week}</div>
                    <div>{week.budget}€</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ads & Keywords */}
      <section className="py-12 border-b">
        <div className="container px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Annonces & Mots-clés
          </h2>

          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="google">
                <Search className="h-4 w-4 mr-2" />
                Google Ads
              </TabsTrigger>
              <TabsTrigger value="meta">
                <Instagram className="h-4 w-4 mr-2" />
                Meta Ads
              </TabsTrigger>
              <TabsTrigger value="influencer">
                <Users className="h-4 w-4 mr-2" />
                Influenceurs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="space-y-6">
              {/* Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle>Mots-clés à acheter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Badge variant="default">Haute intention</Badge>
                        <span className="text-sm text-muted-foreground">CPC 1,20-1,80€</span>
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Mot-clé</th>
                              <th className="text-left py-2">Match</th>
                              <th className="text-left py-2">CPC estimé</th>
                            </tr>
                          </thead>
                          <tbody>
                            {googleAdsKeywords.highIntent.map((kw, idx) => (
                              <tr key={idx} className="border-b">
                                <td className="py-2 font-mono text-xs">{kw.keyword}</td>
                                <td className="py-2">
                                  <Badge variant="outline">{kw.match}</Badge>
                                </td>
                                <td className="py-2">{kw.cpc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Badge variant="secondary">Longue traîne</Badge>
                        <span className="text-sm text-muted-foreground">CPC 0,40-0,70€</span>
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Mot-clé</th>
                              <th className="text-left py-2">Match</th>
                              <th className="text-left py-2">CPC estimé</th>
                            </tr>
                          </thead>
                          <tbody>
                            {googleAdsKeywords.longTail.map((kw, idx) => (
                              <tr key={idx} className="border-b">
                                <td className="py-2 font-mono text-xs">{kw.keyword}</td>
                                <td className="py-2">
                                  <Badge variant="outline">{kw.match}</Badge>
                                </td>
                                <td className="py-2">{kw.cpc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Badge variant="destructive">Mots-clés négatifs</Badge>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {googleAdsKeywords.negative.map((kw, idx) => (
                          <Badge key={idx} variant="outline" className="text-red-500 border-red-200">
                            -{kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ad copies */}
              <Card>
                <CardHeader>
                  <CardTitle>Annonces Google Ads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adCopies.google.map((ad, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{ad.title}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${ad.headline}\n${ad.description}`, `google-${idx}`)}
                        >
                          {copiedText === `google-${idx}` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="text-blue-600 font-medium">{ad.headline}</div>
                        <div className="text-green-600 text-xs">tennismatchfinder.net</div>
                        <div className="text-muted-foreground">{ad.description}</div>
                        <div className="text-xs">{ad.extensions}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meta" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Copies Meta Ads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Version courte (Feed)</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(adCopies.meta.short, 'meta-short')}
                      >
                        {copiedText === 'meta-short' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap font-sans">
                      {adCopies.meta.short}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Version longue (Storytelling)</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(adCopies.meta.long, 'meta-long')}
                      >
                        {copiedText === 'meta-long' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap font-sans">
                      {adCopies.meta.long}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Créatifs vidéo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-4">Vidéo 15s &quot;Frustration WhatsApp&quot;</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">0-3s</Badge>
                        <div>
                          <strong>Hook :</strong> Écran smartphone avec 47 messages WhatsApp<br />
                          <span className="text-muted-foreground">Texte: &quot;Organiser un match de tennis...&quot;</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">3-8s</Badge>
                        <div>
                          <strong>Problème :</strong> Montage rapide de messages<br />
                          <span className="text-muted-foreground">&quot;T&apos;es dispo quand ?&quot; &quot;Non pas ce jour&quot; &quot;Et toi ?&quot;</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">8-12s</Badge>
                        <div>
                          <strong>Solution :</strong> Écran TMF, swipe, match trouvé<br />
                          <span className="text-muted-foreground">&quot;30 secondes. Même niveau. C&apos;est réglé.&quot;</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="outline" className="shrink-0">12-15s</Badge>
                        <div>
                          <strong>CTA :</strong> Logo TMF + &quot;Essayez gratuitement&quot;
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="influencer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brief Influenceur</CardTitle>
                  <CardDescription>Template prêt à envoyer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(influencerBrief, 'influencer-brief')}
                    >
                      {copiedText === 'influencer-brief' ? (
                        <>
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copier le brief
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap font-mono overflow-x-auto">
                    {influencerBrief}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cibles recommandées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Type de compte</th>
                          <th className="text-left py-2">Abonnés</th>
                          <th className="text-left py-2">Plateforme</th>
                          <th className="text-left py-2">Angle</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Joueurs amateurs qui documentent leur progression</td>
                          <td className="py-2">5K-20K</td>
                          <td className="py-2">Instagram</td>
                          <td className="py-2">Authenticité</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Coachs tennis indépendants</td>
                          <td className="py-2">5K-15K</td>
                          <td className="py-2">Instagram/YouTube</td>
                          <td className="py-2">Crédibilité</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Comptes lifestyle sport/wellness</td>
                          <td className="py-2">10K-50K</td>
                          <td className="py-2">TikTok</td>
                          <td className="py-2">Reach</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Comptes humour tennis</td>
                          <td className="py-2">10K-30K</td>
                          <td className="py-2">TikTok</td>
                          <td className="py-2">Viralité</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Analytics Setup */}
      <section className="py-12 border-b">
        <div className="container px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Configuration Analytics
            <Badge className="bg-green-500 ml-2">Actif</Badge>
          </h2>

          {/* GA4 Status Card */}
          <Card className="mb-6 border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Google Analytics 4 configuré</div>
                    <div className="text-sm text-muted-foreground">
                      Measurement ID : <code className="bg-muted px-2 py-0.5 rounded">G-SK1KGRV9KK</code>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="https://analytics.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir GA4
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Événements GA4 implémentés
                  <Badge variant="secondary">{ga4Events.length} actifs</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ga4Events.map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <div>
                          <code className="text-sm font-mono text-primary">{event.event}</code>
                          <div className="text-sm text-muted-foreground">{event.description}</div>
                        </div>
                      </div>
                      <Badge variant="outline">{event.category}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Structure UTM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-medium mb-2">Format</div>
                  <code className="text-xs bg-muted p-2 rounded block">
                    utm_source/utm_medium/utm_campaign/utm_content
                  </code>
                </div>
                <div>
                  <div className="font-medium mb-2">Exemples</div>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 rounded bg-muted/50">
                      <code>google_cpc_search_partenaire-tennis</code>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <code>meta_cpc_lookalike_tennis-france</code>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <code>influencer_organic_[nom]_[format]</code>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">Ressources</div>
                  <div className="space-y-2">
                    <a
                      href="https://analytics.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Google Analytics 4 (G-SK1KGRV9KK)
                    </a>
                    <a
                      href="https://ga-dev-tools.google/campaign-url-builder"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      UTM Builder Google
                    </a>
                    <a
                      href="https://pagespeed.web.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      PageSpeed Insights
                    </a>
                    <a
                      href="https://app.netlify.com/sites/tennismatchfinder"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Netlify Dashboard
                    </a>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="text-xs text-muted-foreground">
                  <strong>Documentation technique :</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• <code>docs/GA4_SETUP_GUIDE.md</code></li>
                    <li>• <code>docs/SESSION_GA4_SETUP_2026-01-11.md</code></li>
                    <li>• <code>src/components/google-analytics.tsx</code></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pre-launch Checklist */}
      <section className="py-12 border-b">
        <div className="container px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            Checklist Pré-lancement (J-7)
          </h2>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Progression</CardTitle>
                <Badge variant={checklistProgress === 100 ? 'default' : 'secondary'}>
                  {checklistProgress}%
                </Badge>
              </div>
              <Progress value={checklistProgress} className="mt-2" />
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {['tracking', 'landing', 'comptes', 'assets'].map((category) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        {category === 'tracking' && <BarChart3 className="h-4 w-4" />}
                        {category === 'landing' && <MousePointer className="h-4 w-4" />}
                        {category === 'comptes' && <Users className="h-4 w-4" />}
                        {category === 'assets' && <Eye className="h-4 w-4" />}
                        <span className="capitalize">{category === 'landing' ? 'Landing Page' : category}</span>
                        <Badge variant="outline" className="ml-2">
                          {checklist.filter(i => i.category === category && i.checked).length}/
                          {checklist.filter(i => i.category === category).length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {checklist
                          .filter(item => item.category === category)
                          .map(item => (
                            <label
                              key={item.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                            >
                              <button
                                onClick={() => toggleChecklistItem(item.id)}
                                className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  item.checked
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-muted-foreground/30'
                                }`}
                              >
                                {item.checked && <Check className="h-3 w-3" />}
                              </button>
                              <span className={item.checked ? 'line-through text-muted-foreground' : ''}>
                                {item.text}
                              </span>
                            </label>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Plan B */}
      <section className="py-12 border-b">
        <div className="container px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Plan B — Si ça ne marche pas
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-amber-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Signaux d&apos;alerte (S3-S4)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">🔴</span>
                    <span>CPL &gt; 15€ de manière constante</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">🔴</span>
                    <span>Taux de rebond LP &gt; 80%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">🔴</span>
                    <span>CTR ads &lt; 0.5%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">🔴</span>
                    <span>0 inscription malgré clics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Alternatives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary" />
                    <span>SEO local (articles &quot;tennis + ville&quot;)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary" />
                    <span>Partenariats clubs (B2B2C gratuit)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary" />
                    <span>Product-Led Growth (invitations, viralité)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary" />
                    <span>Communauté Discord tennis</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Réallocation d&apos;urgence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="font-medium mb-2">SI Google sous-performe (CPL &gt; 12€) :</div>
                <div className="text-muted-foreground">→ Réallouer vers Meta Retargeting</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="font-medium mb-2">SI Meta sous-performe (CPL &gt; 12€) :</div>
                <div className="text-muted-foreground">→ Réallouer vers Google exact match uniquement</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="font-medium mb-2">SI les deux sous-performent :</div>
                <div className="text-muted-foreground">
                  → Pause paid<br />
                  → Investir dans contenu organique + SEO<br />
                  → Réessayer en mai (pic RG)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dashboard Template */}
      <section className="py-12 border-b">
        <div className="container px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Dashboard de Suivi Quotidien
          </h2>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Canal</th>
                      <th className="text-right py-3 px-4 font-medium">Dépensé</th>
                      <th className="text-right py-3 px-4 font-medium">Clics</th>
                      <th className="text-right py-3 px-4 font-medium">CTR</th>
                      <th className="text-right py-3 px-4 font-medium">Inscrits</th>
                      <th className="text-right py-3 px-4 font-medium">CPL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        Google Ads
                      </td>
                      <td className="text-right py-3 px-4">___€</td>
                      <td className="text-right py-3 px-4">___</td>
                      <td className="text-right py-3 px-4">___%</td>
                      <td className="text-right py-3 px-4">___</td>
                      <td className="text-right py-3 px-4">___€</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        Meta Ads
                      </td>
                      <td className="text-right py-3 px-4">___€</td>
                      <td className="text-right py-3 px-4">___</td>
                      <td className="text-right py-3 px-4">___%</td>
                      <td className="text-right py-3 px-4">___</td>
                      <td className="text-right py-3 px-4">___€</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        Influenceurs
                      </td>
                      <td className="text-right py-3 px-4">___€</td>
                      <td className="text-right py-3 px-4">-</td>
                      <td className="text-right py-3 px-4">-</td>
                      <td className="text-right py-3 px-4">___</td>
                      <td className="text-right py-3 px-4">___€</td>
                    </tr>
                    <tr className="border-b bg-muted/50 font-medium">
                      <td className="py-3 px-4">TOTAL</td>
                      <td className="text-right py-3 px-4">___€</td>
                      <td className="text-right py-3 px-4">___</td>
                      <td className="text-right py-3 px-4">-</td>
                      <td className="text-right py-3 px-4">___</td>
                      <td className="text-right py-3 px-4">___€</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-2">Progression Objectif Inscrits</div>
                  <div className="flex items-center gap-4">
                    <Progress value={52} className="flex-1" />
                    <span className="font-medium">52/100</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-2">Progression Budget</div>
                  <div className="flex items-center gap-4">
                    <Progress value={62} className="flex-1" />
                    <span className="font-medium">620€/1000€</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16">
        <div className="container px-4 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Prêt à lancer la campagne ?</h2>
          <p className="text-muted-foreground mb-8">
            Cette stratégie a été conçue pour maximiser le ROI avec un budget limité.
            <br />
            Le timing Roland-Garros est crucial — les recherches tennis sont x3 en mai.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                <Zap className="mr-2 h-5 w-5" />
                Créer mon compte
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/">
                <ArrowRight className="mr-2 h-5 w-5" />
                Voir la landing page
              </Link>
            </Button>
          </div>

          <div className="mt-12 p-6 rounded-lg bg-muted/50 text-left">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Document préparé par Lyra</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Stratégie Digitale TennisMatchFinder • Version 1.0 — Janvier 2026
              <br />
              Budget : 1 000€ | Objectif : 100 inscrits | Période : 8 semaines
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
