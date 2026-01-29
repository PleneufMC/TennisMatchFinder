'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { useGoogleAnalytics } from '@/components/google-analytics';
import { useMetaPixel } from '@/components/meta-pixel';
import { useSignupAttempt } from '@/hooks/use-signup-attempt';

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
  referrerId?: string; // ID du parrain (si inscription via lien de parrainage)
}

export function RegisterCityForm({ clubs, referrerId }: RegisterCityFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [joinRequestCreated, setJoinRequestCreated] = useState(false);
  const [wantsToJoinClub, setWantsToJoinClub] = useState(false);

  // ===== TRACKING ANALYTICS =====
  const { 
    trackSignupStep, 
    trackSignupFieldComplete, 
    trackSignupError,
    trackSignupCompleted,
    trackSignupAbandonment 
  } = useGoogleAnalytics();
  const { trackCompleteRegistration } = useMetaPixel();
  
  // ===== SIGNUP ATTEMPTS (Capture abandons) =====
  const {
    trackFullName: saveFullName,
    trackEmail: saveEmail,
    trackCity: saveCity,
    trackLevel: saveLevel,
    trackClubOption: saveClubOption,
    trackSubmitAttempt: saveSubmitAttempt,
    markAsConverted,
  } = useSignupAttempt({
    source: 'register_form',
    // TODO: Récupérer UTM params depuis l'URL
  });
  
  // Track des étapes complétées pour éviter les doublons
  const completedSteps = useRef<Set<string>>(new Set());
  const formStartTime = useRef<number>(Date.now());

  // Track page view au montage
  useEffect(() => {
    trackSignupStep('fullname', 1, { form_loaded: true });
    formStartTime.current = Date.now();
    
    // Track abandonment quand l'utilisateur quitte la page
    const handleBeforeUnload = () => {
      if (!registrationComplete && completedSteps.current.size > 0) {
        const lastStep = Array.from(completedSteps.current).pop() || 'fullname';
        const timeSpent = Math.round((Date.now() - formStartTime.current) / 1000);
        trackSignupAbandonment(lastStep as 'fullname' | 'email' | 'city' | 'level' | 'club_option' | 'submit_attempt', timeSpent);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackSignupStep, trackSignupAbandonment, registrationComplete]);

  // Helper pour tracker une étape une seule fois
  const trackStepOnce = useCallback((stepName: 'fullname' | 'email' | 'city' | 'level' | 'club_option', stepNumber: number) => {
    if (!completedSteps.current.has(stepName)) {
      completedSteps.current.add(stepName);
      trackSignupStep(stepName, stepNumber);
      trackSignupFieldComplete(stepName, true);
    }
  }, [trackSignupStep, trackSignupFieldComplete]);

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

  // Watch les valeurs pour tracker les steps
  const watchedValues = form.watch();
  
  // Track automatique quand les champs sont remplis + SAUVEGARDE SERVEUR
  useEffect(() => {
    if (watchedValues.fullName && watchedValues.fullName.length >= 2) {
      trackStepOnce('fullname', 1);
      // Sauvegarder côté serveur pour capture abandon
      saveFullName(watchedValues.fullName);
    }
  }, [watchedValues.fullName, trackStepOnce, saveFullName]);

  useEffect(() => {
    // EMAIL: Étape critique - sauvegarder dès que l'email semble valide
    if (watchedValues.email && watchedValues.email.includes('@') && watchedValues.email.includes('.')) {
      trackStepOnce('email', 2);
      // Sauvegarder l'email côté serveur (permet la relance)
      saveEmail(watchedValues.email, watchedValues.fullName);
    }
  }, [watchedValues.email, watchedValues.fullName, trackStepOnce, saveEmail]);

  useEffect(() => {
    if (watchedValues.city && watchedValues.city.length >= 2) {
      trackStepOnce('city', 3);
      saveCity(watchedValues.city, watchedValues.email, watchedValues.fullName);
    }
  }, [watchedValues.city, watchedValues.email, watchedValues.fullName, trackStepOnce, saveCity]);

  useEffect(() => {
    if (watchedValues.selfAssessedLevel) {
      trackStepOnce('level', 4);
      saveLevel(watchedValues.selfAssessedLevel, {
        fullName: watchedValues.fullName,
        email: watchedValues.email,
        city: watchedValues.city,
      });
    }
  }, [watchedValues.selfAssessedLevel, watchedValues.fullName, watchedValues.email, watchedValues.city, trackStepOnce, saveLevel]);

  const handleSubmit = async (data: RegisterCityInput) => {
    setIsLoading(true);
    
    // Track tentative de soumission
    trackSignupStep('submit_attempt', 6, { 
      wants_club: wantsToJoinClub,
      level: data.selfAssessedLevel 
    });
    
    // Sauvegarder la tentative de soumission côté serveur
    saveSubmitAttempt({
      fullName: data.fullName,
      email: data.email,
      city: data.city,
      selfAssessedLevel: data.selfAssessedLevel,
      wantsToJoinClub,
      clubSlug: data.clubSlug,
    });
    
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
        referrerId, // Ajouter le parrain si présent
      };

      const response = await fetch('/api/auth/register-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Track erreur serveur
        trackSignupError('submit', result.error || 'server_error');
        throw new Error(result.error || 'Erreur lors de l\'inscription');
      }

      // ===== TRACK SIGNUP COMPLETED - CONVERSION PRINCIPALE =====
      const timeToComplete = Math.round((Date.now() - formStartTime.current) / 1000);
      trackSignupCompleted(
        wantsToJoinClub && data.clubSlug ? data.clubSlug : 'independent',
        'magic_link'
      );
      
      // Meta Pixel - Complete Registration
      trackCompleteRegistration(data.city, wantsToJoinClub ? 'club_member' : 'independent');
      
      // ===== MARQUER LA TENTATIVE COMME CONVERTIE =====
      if (result.playerId) {
        markAsConverted(result.playerId);
      }
      
      console.log(`[Analytics] signup_completed - Time: ${timeToComplete}s, Club: ${wantsToJoinClub ? data.clubSlug : 'independent'}`);

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
      trackSignupError('submit', error instanceof Error ? error.message : 'unknown_error');
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
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">Demande d&apos;adhésion en attente</h4>
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
                onCheckedChange={(checked) => {
                  const isChecked = checked === true;
                  setWantsToJoinClub(isChecked);
                  // Track l'interaction avec l'option club
                  trackStepOnce('club_option', 5);
                  // Sauvegarder côté serveur
                  saveClubOption(isChecked, undefined, {
                    fullName: watchedValues.fullName,
                    email: watchedValues.email,
                    city: watchedValues.city,
                    selfAssessedLevel: watchedValues.selfAssessedLevel,
                  });
                }}
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

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            onClick={() => {
              // Track les erreurs de validation avant submit
              const errors = form.formState.errors;
              if (errors.fullName) trackSignupError('fullname', errors.fullName.message || 'invalid');
              if (errors.email) trackSignupError('email', errors.email.message || 'invalid');
              if (errors.city) trackSignupError('city', errors.city.message || 'invalid');
            }}
          >
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
