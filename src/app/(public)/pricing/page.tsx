'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, X, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function PricingPage() {
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
