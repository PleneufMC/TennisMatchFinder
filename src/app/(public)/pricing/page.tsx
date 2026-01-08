'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, X, Sparkles, Crown, Zap, Gift, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Mode Early Bird actif
const EARLY_BIRD_MODE = true;
const EARLY_BIRD_END_DATE = new Date('2026-06-30T23:59:59');

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    description: 'Découvrez TennisMatchFinder',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Zap,
    features: [
      { name: '3 suggestions d\'adversaires / semaine', included: true },
      { name: 'Statistiques basiques', included: true },
      { name: 'Classement du club', included: true },
      { name: 'Enregistrement de matchs', included: true },
      { name: 'Forum (lecture seule)', included: true },
      { name: 'Chat limité', included: true },
      { name: 'Statistiques avancées', included: false },
      { name: 'Tournois & Box Leagues', included: false },
      { name: 'Export des données', included: false },
    ],
    cta: 'Commencer gratuitement',
    ctaVariant: 'outline' as const,
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Pour les joueurs réguliers',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    icon: Sparkles,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY,
    features: [
      { name: 'Suggestions illimitées', included: true },
      { name: 'Statistiques avancées', included: true },
      { name: 'Classement avec filtres', included: true },
      { name: 'Forum (lecture & écriture)', included: true },
      { name: 'Chat illimité', included: true },
      { name: 'Badge "Membre Premium"', included: true },
      { name: 'Explication ELO détaillée', included: true },
      { name: 'Export des données', included: true },
      { name: 'Tournois & Box Leagues', included: false },
    ],
    cta: 'Passer à Premium',
    ctaVariant: 'default' as const,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'L\'expérience complète',
    monthlyPrice: 14.99,
    yearlyPrice: 149,
    icon: Crown,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
    features: [
      { name: 'Tout Premium inclus', included: true },
      { name: 'Tournois & Box Leagues', included: true },
      { name: 'Analytics premium', included: true },
      { name: 'Historique complet', included: true },
      { name: 'Badge "Membre Pro"', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'Accès anticipé aux nouveautés', included: true },
      { name: 'Multi-clubs (bientôt)', included: true },
      { name: 'API personnelle (bientôt)', included: false },
    ],
    cta: 'Passer à Pro',
    ctaVariant: 'default' as const,
    popular: false,
  },
];

function PricingPageContent() {
  const searchParams = useSearchParams();
  const [isYearly, setIsYearly] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  const canceled = searchParams.get('subscription') === 'canceled';

  const handleSubscribe = async (planId: string, priceId: string | undefined) => {
    if (!priceId || planId === 'free') {
      // Redirect to register for free plan
      window.location.href = '/register';
      return;
    }

    setLoading(planId);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        // User not logged in, redirect to login
        if (response.status === 401) {
          window.location.href = '/login?callbackUrl=/pricing';
        } else {
          alert(data.error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(null);
    }
  };

  // Calcul du temps restant
  const now = new Date();
  const timeLeft = EARLY_BIRD_END_DATE.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  const endDateFormatted = EARLY_BIRD_END_DATE.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Affichage Early Bird
  if (EARLY_BIRD_MODE) {
    return (
      <div className="py-12 md:py-20">
        <div className="container px-4 max-w-4xl mx-auto">
          {/* Early Bird Banner */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full px-6 py-2 mb-6">
              <PartyPopper className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-amber-700 dark:text-amber-400">Offre de lancement</span>
              <Gift className="h-5 w-5 text-amber-500" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              Accès <span className="text-gradient">100% gratuit</span> pour les premiers membres
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Rejoignez TennisMatchFinder pendant notre phase de lancement et profitez de 
              <strong className="text-foreground"> toutes les fonctionnalités Pro sans limite</strong>, 
              sans carte bancaire requise.
            </p>

            {/* Countdown */}
            <div className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-6 py-3 mb-8">
              <div className="text-red-600 dark:text-red-400 font-bold text-lg">
                ⏰ Offre valable jusqu&apos;au {endDateFormatted}
              </div>
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {daysLeft} jours restants
              </div>
            </div>
          </div>

          {/* Single Card - Everything Free */}
          <Card className="border-2 border-amber-500/50 shadow-xl shadow-amber-500/10 max-w-xl mx-auto">
            <CardHeader className="text-center pb-2">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <Badge className="bg-amber-500 hover:bg-amber-600 mb-2 mx-auto">Early Bird</Badge>
              <CardTitle className="text-2xl">Accès Pro Complet</CardTitle>
              <CardDescription>Toutes les fonctionnalités, aucune restriction</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="text-center mb-6">
                <span className="text-5xl font-bold">Gratuit</span>
                <p className="text-muted-foreground mt-2">Pendant la phase de lancement</p>
              </div>

              <div className="grid gap-3">
                {[
                  'Suggestions d\'adversaires illimitées',
                  'Statistiques avancées et analytics',
                  'Forum complet (lecture & écriture)',
                  'Chat illimité',
                  'Classement avec filtres avancés',
                  'Explication ELO détaillée',
                  'Tournois & Box Leagues (bientôt)',
                  'Badge "Early Bird" exclusif',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="flex-col gap-4">
              <Button size="lg" className="w-full text-lg py-6" asChild>
                <Link href="/register">
                  Rejoindre gratuitement
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Aucune carte bancaire requise • Accès immédiat
              </p>
            </CardFooter>
          </Card>

          {/* Future pricing info */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Les tarifs seront annoncés ultérieurement. Les early birds bénéficieront 
              d&apos;une offre exclusive en remerciement de leur confiance.
            </p>
            <p className="text-sm text-muted-foreground">
              Une question ? <a href="mailto:contact@tennismatchfinder.net" className="text-primary hover:underline">contact@tennismatchfinder.net</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-20">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Tarifs transparents
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Choisissez votre formule
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Commencez gratuitement et évoluez selon vos besoins. 
            Tous les plans incluent l&apos;accès au classement ELO unique de TennisMatchFinder.
          </p>
        </div>

        {/* Canceled alert */}
        {canceled && (
          <Alert className="max-w-md mx-auto mb-8">
            <AlertDescription>
              Votre paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.
            </AlertDescription>
          </Alert>
        )}

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Mensuel
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Annuel
            <Badge variant="secondary" className="ml-2">
              -17%
            </Badge>
          </Label>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const priceId = isYearly ? plan.priceIdYearly : plan.priceIdMonthly;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Le plus populaire</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      plan.id === 'free' ? 'bg-muted' :
                      plan.id === 'premium' ? 'bg-primary/10' :
                      'bg-amber-500/10'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        plan.id === 'free' ? 'text-muted-foreground' :
                        plan.id === 'premium' ? 'text-primary' :
                        'text-amber-500'
                      }`} />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {price === 0 ? 'Gratuit' : `${price}€`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        /{isYearly ? 'an' : 'mois'}
                      </span>
                    )}
                    {isYearly && price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        soit {(price / 12).toFixed(2)}€/mois
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.ctaVariant}
                    size="lg"
                    onClick={() => handleSubscribe(plan.id, priceId)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? 'Chargement...' : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Additional info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Questions fréquentes</h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-1">Puis-je changer de formule ?</h3>
              <p className="text-sm text-muted-foreground">
                Oui, vous pouvez upgrader ou downgrader à tout moment. Le changement prend effet immédiatement.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-1">Comment fonctionne l&apos;annulation ?</h3>
              <p className="text-sm text-muted-foreground">
                Vous pouvez annuler à tout moment. Vous conservez l&apos;accès Premium/Pro jusqu&apos;à la fin de votre période payée.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-1">Les paiements sont-ils sécurisés ?</h3>
              <p className="text-sm text-muted-foreground">
                Oui, tous les paiements sont traités par Stripe, leader mondial du paiement en ligne. 
                Nous ne stockons jamais vos données bancaires.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Une question ? Contactez-nous à{' '}
            <a href="mailto:contact@tennismatchfinder.net" className="text-primary hover:underline">
              contact@tennismatchfinder.net
            </a>
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="py-12 md:py-20">
        <div className="container px-4 flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Chargement...</div>
        </div>
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}
