'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, User, ArrowRight, Loader2, CheckCircle, Phone, MessageSquare, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';

interface RegisterFormProps {
  clubSlug?: string;
  clubName?: string;
}

export function RegisterForm({ clubSlug = 'tc-pleneuf', clubName = 'TC Pleneuf Val-André' }: RegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      fullName: '',
      clubSlug,
      selfAssessedLevel: 'intermédiaire',
    },
  });

  const handleSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      // Enregistrer via l'API (crée une demande d'adhésion)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'inscription');
      }

      setRegisteredEmail(data.email);
      setRegistrationComplete(true);
      toast.success('Demande envoyée !', {
        description: 'Un administrateur va valider votre inscription.',
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erreur lors de l\'inscription', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage après inscription réussie
  if (registrationComplete) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle>Demande envoyée !</CardTitle>
          <CardDescription>
            Votre demande d&apos;adhésion a été transmise aux administrateurs du club.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            Un administrateur de <strong>{clubName}</strong> va examiner votre demande
            et vous recevrez un email à <strong>{registeredEmail}</strong> une fois votre
            inscription validée.
          </p>
          <div className="rounded-lg bg-muted/50 p-4 text-left">
            <h4 className="font-medium mb-2">Prochaines étapes :</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Un admin valide votre demande</li>
              <li>Vous recevez un email de confirmation</li>
              <li>Cliquez sur le lien pour vous connecter</li>
              <li>Accédez à votre espace joueur !</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/')}
          >
            Retour à l&apos;accueil
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Inscription</CardTitle>
        <CardDescription>
          Rejoignez le club <strong>{clubName}</strong> sur TennisMatchFinder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                className="pl-10"
                {...form.register('fullName')}
                error={form.formState.errors.fullName?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                className="pl-10"
                {...form.register('email')}
                error={form.formState.errors.email?.message}
              />
            </div>
          </div>

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
            <p className="text-xs text-muted-foreground">
              Cela nous aide à vous suggérer des adversaires adaptés
            </p>
          </div>

          {/* Club slug caché */}
          <input type="hidden" {...form.register('clubSlug')} />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              <>
                S&apos;inscrire
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Connexion sans mot de passe</p>
              <p className="text-muted-foreground mt-1">
                Recevez un lien magique par email pour vous connecter instantanément.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          En vous inscrivant, vous acceptez nos{' '}
          <Link href="/terms" className="text-primary hover:underline">
            conditions d&apos;utilisation
          </Link>{' '}
          et notre{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
