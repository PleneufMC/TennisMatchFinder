'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronRight,
  ChevronLeft,
  Rocket,
  User,
  Target,
  Calendar,
  Trophy,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';

// Types
interface OnboardingData {
  fullName: string;
  phone: string;
  bio: string;
  selfAssessedLevel: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  preferredHand: 'droitier' | 'gaucher' | 'ambidextre';
  availability: {
    days: string[];
    timeSlots: string[];
  };
  preferences: {
    gameTypes: string[];
  };
}

interface OnboardingStepsProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  existingPlayer?: {
    fullName?: string;
    phone?: string;
    bio?: string;
    selfAssessedLevel?: string;
    availability?: { days: string[]; timeSlots: string[] };
    preferences?: { gameTypes: string[] };
  } | null;
  // Backward compatibility with OnboardingFlow props
  userId?: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
  onComplete?: () => void;
}

const DAYS = [
  { id: 'lundi', label: 'Lun' },
  { id: 'mardi', label: 'Mar' },
  { id: 'mercredi', label: 'Mer' },
  { id: 'jeudi', label: 'Jeu' },
  { id: 'vendredi', label: 'Ven' },
  { id: 'samedi', label: 'Sam' },
  { id: 'dimanche', label: 'Dim' },
];

const TIME_SLOTS = [
  { id: 'matin', label: 'Matin', desc: '8h - 12h' },
  { id: 'midi', label: 'Midi', desc: '12h - 14h' },
  { id: 'après-midi', label: 'Après-midi', desc: '14h - 18h' },
  { id: 'soir', label: 'Soir', desc: '18h - 22h' },
];

const LEVELS = [
  { id: 'débutant', label: 'Débutant', desc: 'Je découvre le tennis' },
  { id: 'intermédiaire', label: 'Intermédiaire', desc: 'Je joue régulièrement' },
  { id: 'avancé', label: 'Avancé', desc: 'Bon niveau technique' },
  { id: 'expert', label: 'Expert', desc: 'Niveau compétition' },
];

export function OnboardingSteps({ 
  user, 
  existingPlayer,
  // Backward compatibility props
  userId,
  userName,
  userEmail,
  userImage,
  onComplete,
}: OnboardingStepsProps) {
  const router = useRouter();
  
  // Merge user data from both prop styles
  const userData = user || {
    name: userName,
    email: userEmail,
    image: userImage,
  };
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    fullName: existingPlayer?.fullName || userData.name || '',
    phone: existingPlayer?.phone || '',
    bio: existingPlayer?.bio || '',
    selfAssessedLevel: (existingPlayer?.selfAssessedLevel as OnboardingData['selfAssessedLevel']) || 'intermédiaire',
    preferredHand: 'droitier',
    availability: existingPlayer?.availability || { days: [], timeSlots: [] },
    preferences: existingPlayer?.preferences || { gameTypes: ['simple'] },
  });

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }

      // Callback de completion ou redirection
      if (onComplete) {
        onComplete();
      } else {
        router.push('/dashboard?welcome=true');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Bienvenue
        return true;
      case 1: // Profil
        return data.fullName.trim().length >= 2;
      case 2: // Niveau
        return !!data.selfAssessedLevel;
      case 3: // Disponibilités
        return data.availability.days.length > 0 || data.availability.timeSlots.length > 0;
      case 4: // Récap
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Étape {currentStep + 1} sur {totalSteps}
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Step 0: Bienvenue */}
          {currentStep === 0 && (
            <div className="text-center space-y-8 animate-in fade-in duration-500">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full">
                <Rocket className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-4">
                  Bienvenue sur TennisMatchFinder ! 🎾
                </h1>
                <p className="text-xl text-muted-foreground">
                  Prêt à trouver vos prochains adversaires ?
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <Card className="p-4 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm font-medium">Classement ELO</p>
                </Card>
                <Card className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">Matchs adaptés</p>
                </Card>
                <Card className="p-4 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm font-medium">Badges à gagner</p>
                </Card>
              </div>
              <p className="text-muted-foreground">
                En 2 minutes, configurez votre profil pour des suggestions personnalisées.
              </p>
            </div>
          )}

          {/* Step 1: Profil */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Votre profil</h2>
                <p className="text-muted-foreground">
                  Comment voulez-vous être présenté aux autres joueurs ?
                </p>
              </div>

              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userData.image || undefined} />
                  <AvatarFallback className="text-2xl">
                    {data.fullName.slice(0, 2).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet *</Label>
                  <Input
                    id="fullName"
                    value={data.fullName}
                    onChange={(e) => updateData({ fullName: e.target.value })}
                    placeholder="Ex: Jean Dupont"
                    className="text-lg h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => updateData({ phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Quelques mots sur vous (optionnel)</Label>
                  <Textarea
                    id="bio"
                    value={data.bio}
                    onChange={(e) => updateData({ bio: e.target.value })}
                    placeholder="Ex: Je joue depuis 5 ans, j'adore les matchs en simple..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Niveau */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Votre niveau</h2>
                <p className="text-muted-foreground">
                  Sélectionnez le niveau qui vous correspond le mieux
                </p>
              </div>

              <RadioGroup
                value={data.selfAssessedLevel}
                onValueChange={(value) => updateData({ selfAssessedLevel: value as OnboardingData['selfAssessedLevel'] })}
                className="grid gap-4"
              >
                {LEVELS.map((level) => (
                  <Label
                    key={level.id}
                    htmlFor={level.id}
                    className={`
                      flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${data.selfAssessedLevel === level.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'}
                    `}
                  >
                    <RadioGroupItem value={level.id} id={level.id} />
                    <div className="flex-1">
                      <p className="font-semibold">{level.label}</p>
                      <p className="text-sm text-muted-foreground">{level.desc}</p>
                    </div>
                    {data.selfAssessedLevel === level.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </Label>
                ))}
              </RadioGroup>

              <div className="space-y-4">
                <Label>Main dominante</Label>
                <div className="flex gap-4">
                  {['droitier', 'gaucher', 'ambidextre'].map((hand) => (
                    <Button
                      key={hand}
                      type="button"
                      variant={data.preferredHand === hand ? 'default' : 'outline'}
                      onClick={() => updateData({ preferredHand: hand as OnboardingData['preferredHand'] })}
                      className="flex-1 capitalize"
                    >
                      {hand}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Disponibilités */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Vos disponibilités</h2>
                <p className="text-muted-foreground">
                  Quand êtes-vous généralement disponible pour jouer ?
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Jours de la semaine</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => {
                      const isSelected = data.availability.days.includes(day.id);
                      return (
                        <Button
                          key={day.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          className="w-14 h-14"
                          onClick={() => {
                            const newDays = isSelected
                              ? data.availability.days.filter(d => d !== day.id)
                              : [...data.availability.days, day.id];
                            updateData({
                              availability: { ...data.availability, days: newDays },
                            });
                          }}
                        >
                          {day.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Créneaux horaires</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = data.availability.timeSlots.includes(slot.id);
                      return (
                        <Button
                          key={slot.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          className="h-auto py-3 flex-col"
                          onClick={() => {
                            const newSlots = isSelected
                              ? data.availability.timeSlots.filter(s => s !== slot.id)
                              : [...data.availability.timeSlots, slot.id];
                            updateData({
                              availability: { ...data.availability, timeSlots: newSlots },
                            });
                          }}
                        >
                          <span className="font-semibold">{slot.label}</span>
                          <span className="text-xs opacity-70">{slot.desc}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Type de jeu préféré</Label>
                  <div className="flex gap-4">
                    {['simple', 'double'].map((type) => {
                      const isSelected = data.preferences.gameTypes.includes(type);
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          className="flex-1 capitalize"
                          onClick={() => {
                            const newTypes = isSelected
                              ? data.preferences.gameTypes.filter(t => t !== type)
                              : [...data.preferences.gameTypes, type];
                            updateData({
                              preferences: { ...data.preferences, gameTypes: newTypes },
                            });
                          }}
                        >
                          {type === 'simple' ? 'Simple' : 'Double'}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Récap & Lancement */}
          {currentStep === 4 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                  <Trophy className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Prêt à jouer ! 🎾</h2>
                <p className="text-muted-foreground">
                  Voici le récapitulatif de votre profil
                </p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={userData.image || undefined} />
                      <AvatarFallback>
                        {data.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xl font-bold">{data.fullName}</p>
                      <p className="text-muted-foreground capitalize">{data.selfAssessedLevel}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Jours disponibles</p>
                      <p className="font-medium">
                        {data.availability.days.length > 0
                          ? data.availability.days.map(d => 
                              DAYS.find(day => day.id === d)?.label
                            ).join(', ')
                          : 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Créneaux</p>
                      <p className="font-medium">
                        {data.availability.timeSlots.length > 0
                          ? data.availability.timeSlots.map(s => 
                              TIME_SLOTS.find(slot => slot.id === s)?.label
                            ).join(', ')
                          : 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type de jeu</p>
                      <p className="font-medium capitalize">
                        {data.preferences.gameTypes.join(' & ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Main</p>
                      <p className="font-medium capitalize">{data.preferredHand}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-primary/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ce qui vous attend
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Suggestions de partenaires adaptés à votre niveau</li>
                  <li>• Classement ELO personnalisé</li>
                  <li>• Badges et défis à débloquer</li>
                  <li>• Chat avec vos futurs adversaires</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-4 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={currentStep === 0 ? 'invisible' : ''}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continuer
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Commencer à jouer !
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
