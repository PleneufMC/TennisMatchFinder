import { z } from 'zod';

/**
 * Schémas de validation pour les profils joueurs
 */

// Niveaux auto-évalués
export const playerLevels = ['débutant', 'intermédiaire', 'avancé', 'expert'] as const;

// Jours de la semaine
export const weekdays = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const;

// Créneaux horaires
export const timeSlots = ['matin', 'midi', 'après-midi', 'soir'] as const;

// Types de jeu
export const gameTypes = ['simple', 'double'] as const;

// Surfaces
export const courtSurfaces = ['terre battue', 'dur', 'gazon', 'indoor'] as const;

// Disponibilités
export const availabilitySchema = z.object({
  days: z.array(z.enum(weekdays)).default([]),
  timeSlots: z.array(z.enum(timeSlots)).default([]),
});

// Préférences
export const preferencesSchema = z.object({
  gameTypes: z.array(z.enum(gameTypes)).default(['simple']),
  surfaces: z.array(z.enum(courtSurfaces)).default([]),
  preferredLocations: z.array(z.string().max(100)).max(5).default([]),
});

// Mise à jour du profil
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides')
    .optional(),
  phone: z
    .string()
    .regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, 'La bio est trop longue').optional(),
  selfAssessedLevel: z.enum(playerLevels).optional(),
  availability: availabilitySchema.optional(),
  preferences: preferencesSchema.optional(),
});

// Configuration du profil initial (après inscription)
export const setupProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides'),
  selfAssessedLevel: z.enum(playerLevels),
  availability: availabilitySchema,
  preferences: preferencesSchema,
});

// Upload d'avatar
export const avatarUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Le fichier ne peut pas dépasser 5 Mo')
    .refine(
      (file) =>
        ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Format non supporté. Utilisez JPG, PNG, WebP ou GIF'
    ),
});

// Types inférés
export type PlayerLevel = (typeof playerLevels)[number];
export type Weekday = (typeof weekdays)[number];
export type TimeSlot = (typeof timeSlots)[number];
export type GameType = (typeof gameTypes)[number];
export type CourtSurface = (typeof courtSurfaces)[number];
export type Availability = z.infer<typeof availabilitySchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SetupProfileInput = z.infer<typeof setupProfileSchema>;

// Labels pour l'affichage
export const levelLabels: Record<PlayerLevel, string> = {
  débutant: 'Débutant',
  intermédiaire: 'Intermédiaire',
  avancé: 'Avancé',
  expert: 'Expert',
};

export const weekdayLabels: Record<Weekday, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
};

export const timeSlotLabels: Record<TimeSlot, { label: string; hours: string }> = {
  matin: { label: 'Matin', hours: '8h - 12h' },
  midi: { label: 'Midi', hours: '12h - 14h' },
  'après-midi': { label: 'Après-midi', hours: '14h - 18h' },
  soir: { label: 'Soir', hours: '18h - 22h' },
};

export const gameTypeLabels: Record<GameType, string> = {
  simple: 'Simple',
  double: 'Double',
};

export const surfaceLabels: Record<CourtSurface, string> = {
  'terre battue': 'Terre battue',
  dur: 'Dur',
  gazon: 'Gazon',
  indoor: 'Indoor',
};
