'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, User, ArrowRight, Loader2, CheckCircle, MapPin, Building2, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Schéma de validation
const registerCitySchema = z.object({
  email: z.string().email('Email invalide'),
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  city: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
  selfAssessedLevel: z.enum(['débutant', 'intermédiaire', 'avancé', 'expert']),
  clubSlug: z.string().optional(), // Optionnel - pour demander à rejoindre un club
});

type RegisterCityInput = z.infer<typeof registerCitySchema>;

interface Club {
  id: string;
  name: string;
  slug: string;
}

interface RegisterFormCityProps {
  clubs: Club[];
}

export function RegisterFormCity({ clubs }: RegisterFormCityProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [selectedClub, setSelectedClub] = useState<string>('none');

  const form = useForm<RegisterCityInput>({
    resolver: zodResolver(registerCitySchema),
    defaultValues: {
      email: '',
      fullName: '',
      city: '',
      selfAssessedLevel: 'intermédiaire',
      clubSlug: undefined,
    },
  });

  const handleSubmit = async (data: RegisterCityInput) => {
    setIsLoading(true);
    try {
      // Ajouter le club slug si sélectionné
      const submitData = {
        ...data,
        clubSlug: selectedClub !== 'none' ? selectedClub : undefined,
      };

      const response = await fetch('/api/auth/register-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'inscription');
      }

      setRegisteredEmail(data.email);
      setRegistrationComplete(true);
      
      if (selectedClub !== 'none') {
        toast.success('Inscription et demande envoyées !', {
          description: 'Un administrateur va valider votre demande d\'adhésion.',
        });
      } else {
        toast.success('Inscription réussie !', {
          description: 'Vous pouvez maintenant vous connecter.',
        });
      }
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
    const hasClubRequest = selectedClub !== 'none';
    const clubName = clubs.find(c => c.slug === selectedClub)?.name;

    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            {hasClubRequest ? (
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            )}
          </div>
          <CardTitle>
            {hasClubRequest ? 'Demande envoyée !' : 'Inscription réussie !'}
          </CardTitle>
          <CardDescription>
            {hasClubRequest 
              ? `Votre demande d'adhésion au club ${clubName} a été envoyée.`
              : 'Votre compte a été créé avec succès.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          {hasClubRequest ? (
            <>
              <p>
                Un administrateur de <strong>{clubName}</strong> va examiner votre demande.
                Vous recevrez un email à <strong>{registeredEmail}</strong> une fois validée.
              </p>
              <div className="rounded-lg bg-muted/50 p-4 text-left">
                <h4 className="font-medium mb-2">En attendant :</h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Vous pouvez vous connecter avec votre email</li>
                  <li>Accès limité sans club affilié</li>
                  <li>Vous pourrez rejoindre d'autres clubs</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <p>
                Vous êtes inscrit comme joueur de tennis indépendant.
                Un email de connexion a été envoyé à <strong>{registeredEmail}</strong>.
              </p>
              <div className="rounded-lg bg-muted/50 p-4 text-left">
                <h4 className="font-medium mb-2">Prochaines étapes :</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Cliquez sur le lien dans votre email</li>
                  <li>Accédez à votre espace joueur</li>
                  <li>Demandez à rejoindre un club pour plus de fonctionnalités</li>
                </ol>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Se connecter
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/')}
          >
            Retour à l'accueil
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
          Créez votre compte TennisMatchFinder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                className="pl-10"
                {...form.register('email')}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

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
          </div>

          {/* Sélection du club (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="club" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Rejoindre un club (optionnel)
            </Label>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun club - joueur indépendant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun club - joueur indépendant</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.slug}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedClub !== 'none' 
                ? 'Votre demande sera soumise à validation par un administrateur du club.'
                : 'Vous pourrez demander à rejoindre un club plus tard.'}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              <>
                S'inscrire
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
                Recevez un lien magique par email pour vous connecter.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          En vous inscrivant, vous acceptez nos{' '}
          <Link href="/terms" className="text-primary hover:underline">
            conditions d'utilisation
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
