import { z } from 'zod';

/**
 * Schémas de validation pour l'authentification
 */

// Validation email
export const emailSchema = z
  .string()
  .email('Adresse email invalide')
  .min(1, 'L\'email est requis')
  .max(255, 'L\'email est trop long');

// Validation mot de passe
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(72, 'Le mot de passe est trop long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
  );

// Login avec magic link
export const loginMagicLinkSchema = z.object({
  email: emailSchema,
});

// Login avec mot de passe
export const loginPasswordSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
});

// Inscription
export const registerSchema = z.object({
  email: emailSchema,
  fullName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides'),
  password: passwordSchema.optional(),
  clubSlug: z
    .string()
    .min(1, 'Le club est requis')
    .regex(/^[a-z0-9-]+$/, 'Slug de club invalide'),
  selfAssessedLevel: z.enum(['débutant', 'intermédiaire', 'avancé', 'expert']).optional(),
});

// Confirmation mot de passe
export const confirmPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

// Reset password
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Update password
export const updatePasswordSchema = confirmPasswordSchema;

// Types inférés
export type LoginMagicLinkInput = z.infer<typeof loginMagicLinkSchema>;
export type LoginPasswordInput = z.infer<typeof loginPasswordSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
