'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerAvatar } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { levelLabels, weekdayLabels, timeSlotLabels, surfaceLabels } from '@/lib/validations/profile';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'La bio ne doit pas dépasser 500 caractères').optional(),
  selfAssessedLevel: z.string(),
  availabilityDays: z.array(z.string()),
  availabilityTimeSlots: z.array(z.string()),
  preferredSurfaces: z.array(z.string()),
  preferredGameTypes: z.array(z.string()),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Type pour les données de disponibilité
interface AvailabilityData {
  days?: string[];
  timeSlots?: string[];
}

// Type pour les préférences
interface PreferencesData {
  gameTypes?: string[];
  surfaces?: string[];
}

// Helper pour parser les données JSONB
function parseAvailability(data: unknown): AvailabilityData {
  if (!data || typeof data !== 'object') return { days: [], timeSlots: [] };
  const obj = data as Record<string, unknown>;
  return {
    days: Array.isArray(obj.days) ? obj.days as string[] : [],
    timeSlots: Array.isArray(obj.timeSlots) ? obj.timeSlots as string[] : [],
  };
}

function parsePreferences(data: unknown): PreferencesData {
  if (!data || typeof data !== 'object') return { gameTypes: [], surfaces: [] };
  const obj = data as Record<string, unknown>;
  return {
    gameTypes: Array.isArray(obj.gameTypes) ? obj.gameTypes as string[] : [],
    surfaces: Array.isArray(obj.surfaces) ? obj.surfaces as string[] : [],
  };
}

interface PlayerData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  selfAssessedLevel: string;
  availability: unknown; // JSONB retourne unknown
  preferences: unknown;  // JSONB retourne unknown
}

interface ProfileEditFormProps {
  player: PlayerData;
}

export function ProfileEditForm({ player }: ProfileEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(player.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parser les données JSONB
  const availability = parseAvailability(player.availability);
  const preferences = parsePreferences(player.preferences);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: player.fullName,
      phone: player.phone || '',
      bio: player.bio || '',
      selfAssessedLevel: player.selfAssessedLevel,
      availabilityDays: availability.days || [],
      availabilityTimeSlots: availability.timeSlots || [],
      preferredSurfaces: preferences.surfaces || [],
      preferredGameTypes: preferences.gameTypes || [],
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image trop volumineuse', {
          description: 'La taille maximum est de 2 Mo',
        });
        return;
      }

      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        toast.error('Format invalide', {
          description: 'Seules les images sont acceptées',
        });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      // Si une nouvelle photo a été sélectionnée, l'uploader d'abord
      let avatarUrl = player.avatarUrl;
      
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        
        const uploadRes = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          avatarUrl = url;
        } else {
          throw new Error('Erreur lors de l\'upload de la photo');
        }
      }

      // Mettre à jour le profil
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          avatarUrl,
          availability: {
            days: data.availabilityDays,
            timeSlots: data.availabilityTimeSlots,
          },
          preferences: {
            gameTypes: data.preferredGameTypes,
            surfaces: data.preferredSurfaces,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      toast.success('Profil mis à jour !');
      router.push('/profil');
      router.refresh();
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const weekdays = Object.entries(weekdayLabels);
  const timeSlots = Object.entries(timeSlotLabels);
  const surfaces = Object.entries(surfaceLabels);
  const gameTypes = [
    { value: 'simple', label: 'Simple' },
    { value: 'double', label: 'Double' },
    { value: 'mixte', label: 'Mixte' },
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Photo de profil */}
      <Card>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
          <CardDescription>
            Cliquez sur l&apos;avatar pour changer votre photo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div 
            className="relative cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <PlayerAvatar
              src={avatarPreview}
              name={player.fullName}
              size="xl"
            />
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Changer la photo
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG ou GIF. 2 Mo maximum.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              {...form.register('phone')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optionnel)</Label>
            <Textarea
              id="bio"
              placeholder="Présentez-vous en quelques mots..."
              rows={3}
              {...form.register('bio')}
            />
            {form.formState.errors.bio && (
              <p className="text-sm text-destructive">
                {form.formState.errors.bio.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Niveau auto-évalué</Label>
            <Select
              value={form.watch('selfAssessedLevel')}
              onValueChange={(value) => form.setValue('selfAssessedLevel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre niveau" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(levelLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disponibilités */}
      <Card>
        <CardHeader>
          <CardTitle>Disponibilités</CardTitle>
          <CardDescription>
            Indiquez quand vous êtes disponible pour jouer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Jours disponibles</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weekdays.map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={form.watch('availabilityDays').includes(value)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('availabilityDays');
                      if (checked) {
                        form.setValue('availabilityDays', [...current, value]);
                      } else {
                        form.setValue('availabilityDays', current.filter(d => d !== value));
                      }
                    }}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Créneaux horaires</Label>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map(([value, slot]) => (
                <label
                  key={value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={form.watch('availabilityTimeSlots').includes(value)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('availabilityTimeSlots');
                      if (checked) {
                        form.setValue('availabilityTimeSlots', [...current, value]);
                      } else {
                        form.setValue('availabilityTimeSlots', current.filter(t => t !== value));
                      }
                    }}
                  />
                  <span className="text-sm">{slot.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Préférences de jeu */}
      <Card>
        <CardHeader>
          <CardTitle>Préférences de jeu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Types de jeu</Label>
            <div className="flex flex-wrap gap-2">
              {gameTypes.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={form.watch('preferredGameTypes').includes(value)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('preferredGameTypes');
                      if (checked) {
                        form.setValue('preferredGameTypes', [...current, value]);
                      } else {
                        form.setValue('preferredGameTypes', current.filter(t => t !== value));
                      }
                    }}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Surfaces préférées</Label>
            <div className="grid grid-cols-2 gap-2">
              {surfaces.map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={form.watch('preferredSurfaces').includes(value)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('preferredSurfaces');
                      if (checked) {
                        form.setValue('preferredSurfaces', [...current, value]);
                      } else {
                        form.setValue('preferredSurfaces', current.filter(s => s !== value));
                      }
                    }}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/profil">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Link>
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
