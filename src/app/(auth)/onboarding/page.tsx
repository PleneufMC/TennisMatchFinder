'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MapPin, User, Loader2, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  city: z.string().min(2, 'Ville requise').max(100, 'Nom de ville trop long'),
  selfAssessedLevel: z.enum(['débutant', 'intermédiaire', 'avancé', 'expert']),
});

type OnboardingInput = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: session?.user?.name || '',
      city: '',
      selfAssessedLevel: 'intermédiaire',
    },
  });

  // Update fullName when session loads
  useEffect(() => {
    if (session?.user?.name) {
      form.setValue('fullName', session.user.name);
    }
  }, [session, form]);

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Redirect if already has player profile
  useEffect(() => {
    if (session?.user?.player) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (data: OnboardingInput) => {
    if (!session?.user?.id) {
      toast.error('Session invalide');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création du profil');
      }

      toast.success('Profil créé !');
      
      // Update session to include new player data
      await update();
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Bienvenue sur TennisMatchFinder ! 🎾</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Complétez votre profil pour commencer à trouver des partenaires de jeu
        </p>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Créer votre profil joueur</CardTitle>
          <CardDescription>
            Ces informations nous aident à vous suggérer des adversaires adaptés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nom complet */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  className="pl-10"
                  {...form.register('fullName')}
                />
              </div>
              {form.formState.errors.fullName && (
                <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="city"
                  type="text"
                  placeholder="Lyon, Paris, Marseille..."
                  className="pl-10"
                  {...form.register('city')}
                />
              </div>
              {form.formState.errors.city && (
                <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Pour trouver des joueurs près de chez vous
              </p>
            </div>

            {/* Niveau */}
            <div className="space-y-2">
              <Label htmlFor="level">Votre niveau estimé</Label>
              <select
                id="level"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...form.register('selfAssessedLevel')}
              >
                <option value="débutant">Débutant</option>
                <option value="intermédiaire">Intermédiaire</option>
                <option value="avancé">Avancé</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Créer mon profil
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
