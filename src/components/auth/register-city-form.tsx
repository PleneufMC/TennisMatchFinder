'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  Mail, User, MapPin, ArrowRight, Loader2, CheckCircle, 
  Clock, Building2, Info
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Schéma de validation avec ville
const registerCitySchema = z.object({
  email: z.string().email('Email invalide'),
  fullName: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  city: z.string().min(2, 'Ville requise').max(100, 'Nom de ville trop long'),
  selfAssessedLevel: z.enum(['débutant', 'intermédiaire', 'avancé', 'expert']),
  clubSlug: z.string().optional(),
});

type RegisterCityInput = z.infer<typeof registerCitySchema>;

interface Club {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
}

interface RegisterCityFormProps {
  clubs: Club[];
}

export function RegisterCityForm({ clubs }: RegisterCityFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [joinRequestCreated, setJoinRequestCreated] = useState(false);
  const [wantsToJoinClub, setWantsToJoinClub] = useState(false);

  const form = useForm<RegisterCityInput>({
    resolver: zodResolver(registerCitySchema),
    defaultValues: {
      email: '',
      fullName: '',
      city: '',
      selfAssessedLevel: 'intermédiaire',
      clubSlug: '',
    },
  });

  const handleSubmit = async (data: RegisterCityInput) => {
    setIsLoading(true);
    try {
      // Normaliser la ville (première lettre majuscule)
      const normalizedCity = data.city.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      const payload = {
        ...data,
        city: normalizedCity,
        clubSlug: wantsToJoinClub && data.clubSlug ? data.clubSlug : undefined,
      };

      const response = await fetch('/api/auth/register-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'inscription');
      }

      setRegisteredEmail(data.email);
      setJoinRequestCreated(result.joinRequestCreated || false);
      setRegistrationComplete(true);
      
      toast.success('Compte créé !', {
        description: result.joinRequestCreated 
          ? 'Votre demande d\'adhésion a été envoyée.'
          : 'Vous pouvez maintenant vous connecter.',
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Compte créé !</CardTitle>
          <CardDescription>
            {joinRequestCreated 
              ? 'Votre compte a été créé et votre demande d\'adhésion a été envoyée.'
              : 'Votre compte a été créé avec succès.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            Un email de connexion a été envoyé à <strong>{registeredEmail}</strong>.
          </p>
          
          {joinRequestCreated ? (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-left">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">Demande d'adhésion en attente</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Un administrateur du club va examiner votre demande.
                    Vous serez notifié par email une fois votre adhésion validée.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-left">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Joueur indépendant</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Vous êtes inscrit comme joueur indépendant. Vous pouvez rejoindre un club
                    à tout moment depuis votre tableau de bord.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-4 text-left">
            <h4 className="font-medium mb-2">Prochaines étapes :</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Vérifiez votre boîte email</li>
              <li>Cliquez sur le lien magique pour vous connecter</li>
              <li>Complétez votre profil joueur</li>
              {!joinRequestCreated && <li>Rejoignez un club ou jouez en indépendant</li>}
            </ol>
          </div>
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
          Créez votre compte joueur en quelques secondes
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

          {/* Email */}
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

          {/* Ville - CHAMP LIBRE */}
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
              Votre ville pour trouver des joueurs proches de chez vous
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
            <p className="text-xs text-muted-foreground">
              Cela nous aide à vous suggérer des adversaires adaptés
            </p>
          </div>

          {/* Option rejoindre un club */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="joinClub"
                checked={wantsToJoinClub}
                onCheckedChange={(checked) => setWantsToJoinClub(checked === true)}
              />
              <Label htmlFor="joinClub" className="text-sm font-normal cursor-pointer">
                Je souhaite rejoindre un club existant
              </Label>
            </div>

            {wantsToJoinClub && clubs.length > 0 && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="club">Choisir un club</Label>
                <Select
                  value={form.watch('clubSlug') || ''}
                  onValueChange={(value) => form.setValue('clubSlug', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.slug}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{club.name}</span>
                          {club.city && (
                            <span className="text-xs text-muted-foreground">({club.city})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Une demande d&apos;adhésion sera envoyée à l&apos;administrateur du club
                </p>
              </div>
            )}

            {!wantsToJoinClub && (
              <p className="text-xs text-muted-foreground pl-6">
                Vous serez inscrit comme joueur indépendant et pourrez rejoindre un club plus tard
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              <>
                Créer mon compte
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
