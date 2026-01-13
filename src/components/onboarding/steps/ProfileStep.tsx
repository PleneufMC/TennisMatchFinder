'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Hand, ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { OnboardingData } from '../OnboardingFlow';

interface ProfileStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProfileStep({ data, updateData, onNext, onBack }: ProfileStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.fullName || data.fullName.trim().length < 2) {
      newErrors.fullName = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (!data.city || data.city.trim().length < 2) {
      newErrors.city = 'Veuillez indiquer votre ville';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const initials = data.fullName
    ? data.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'JD';

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Ton profil joueur
        </CardTitle>
        <CardDescription>
          Ces infos aident les autres joueurs à te trouver
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar preview */}
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex justify-center"
        >
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={data.avatarUrl} alt={data.fullName} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 p-1 bg-background rounded-full shadow-sm">
              <Camera className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </motion.div>

        {/* Full name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Prénom et nom *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="Jean Dupont"
              className="pl-10"
              value={data.fullName}
              onChange={(e) => updateData({ fullName: e.target.value })}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Tel qu&apos;il apparaîtra aux autres joueurs
          </p>
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">Ville *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="city"
              type="text"
              placeholder="Paris, Lyon, Marseille..."
              className="pl-10"
              value={data.city}
              onChange={(e) => updateData({ city: e.target.value })}
            />
          </div>
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Pour trouver des joueurs près de chez toi
          </p>
        </div>

        {/* Dominant hand */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Hand className="h-4 w-4" />
            Main dominante
          </Label>
          <RadioGroup
            value={data.dominantHand || 'right'}
            onValueChange={(value) => updateData({ dominantHand: value as OnboardingData['dominantHand'] })}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { value: 'right', label: 'Droitier', emoji: '🫱' },
              { value: 'left', label: 'Gaucher', emoji: '🫲' },
              { value: 'ambidextrous', label: 'Ambidextre', emoji: '🙌' },
            ].map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary/50 ${
                  data.dominantHand === option.value || (!data.dominantHand && option.value === 'right')
                    ? 'border-primary bg-primary/5'
                    : 'border-muted'
                }`}
              >
                <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                <span className="text-2xl mb-1">{option.emoji}</span>
                <span className="text-sm">{option.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Continuer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
