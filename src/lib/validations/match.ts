import { z } from 'zod';

/**
 * Schémas de validation pour les matchs
 */

// Validation du format de score
// Formats acceptés: "6-4 6-2", "6-4 3-6 7-5", "6-4 6-7(5) 6-3"
const scoreSetRegex = /^(\d{1,2})-(\d{1,2})(\(\d{1,2}\))?$/;

export const scoreSchema = z
  .string()
  .min(1, 'Le score est requis')
  .refine(
    (score) => {
      const sets = score.split(' ');
      if (sets.length < 2 || sets.length > 3) {
        return false;
      }
      return sets.every((set) => scoreSetRegex.test(set));
    },
    {
      message: 'Format de score invalide. Exemples: "6-4 6-2", "6-4 3-6 7-5"',
    }
  )
  .refine(
    (score) => {
      const sets = score.split(' ');
      let player1Sets = 0;
      let player2Sets = 0;

      for (const set of sets) {
        const match = set.match(/^(\d{1,2})-(\d{1,2})/);
        if (!match) return false;

        const [, p1, p2] = match;
        const p1Games = parseInt(p1 ?? '0', 10);
        const p2Games = parseInt(p2 ?? '0', 10);

        // Un set doit être gagné avec au moins 2 jeux d'écart (sauf tie-break)
        if (p1Games > p2Games) {
          player1Sets++;
        } else if (p2Games > p1Games) {
          player2Sets++;
        }
      }

      // Un joueur doit avoir gagné 2 sets
      return player1Sets === 2 || player2Sets === 2;
    },
    {
      message: 'Le score doit refléter une victoire valide (2 sets gagnants)',
    }
  );

// Validation date du match (pas dans le futur, pas trop ancien)
export const matchDateSchema = z
  .date()
  .refine(
    (date) => date <= new Date(),
    'La date du match ne peut pas être dans le futur'
  )
  .refine(
    (date) => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return date >= sixMonthsAgo;
    },
    'Le match ne peut pas être daté de plus de 6 mois'
  );

// Création d'un match
export const createMatchSchema = z.object({
  opponentId: z.string().uuid('ID adversaire invalide'),
  score: scoreSchema,
  winnerId: z.string().uuid('ID gagnant invalide'),
  playedAt: matchDateSchema,
  gameType: z.enum(['simple', 'double']).default('simple'),
  surface: z.enum(['terre battue', 'dur', 'gazon', 'indoor']).optional(),
  location: z.string().max(200, 'Le lieu est trop long').optional(),
  notes: z.string().max(500, 'Les notes sont trop longues').optional(),
});

// Validation que le gagnant est bien un des joueurs
export const validateMatchWinner = (
  currentUserId: string,
  opponentId: string,
  winnerId: string
): boolean => {
  return winnerId === currentUserId || winnerId === opponentId;
};

// Proposition de match
export const createProposalSchema = z.object({
  toPlayerId: z.string().uuid('ID joueur invalide'),
  proposedDate: z.date().optional(),
  proposedTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format horaire invalide (HH:MM)')
    .optional(),
  proposedLocation: z.string().max(200, 'Le lieu est trop long').optional(),
  message: z.string().max(500, 'Le message est trop long').optional(),
  gameType: z.enum(['simple', 'double']).default('simple'),
});

// Réponse à une proposition
export const respondProposalSchema = z.object({
  proposalId: z.string().uuid('ID proposition invalide'),
  status: z.enum(['accepted', 'declined']),
  responseMessage: z.string().max(500, 'Le message est trop long').optional(),
});

// Types inférés
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type RespondProposalInput = z.infer<typeof respondProposalSchema>;

// Helper pour parser le score
export function parseScore(scoreString: string): {
  sets: { player1: number; player2: number; tiebreak?: number }[];
  winner: 'player1' | 'player2';
} {
  const sets = scoreString.split(' ').map((set) => {
    const match = set.match(/^(\d{1,2})-(\d{1,2})(?:\((\d{1,2})\))?$/);
    if (!match) throw new Error('Invalid score format');

    return {
      player1: parseInt(match[1] ?? '0', 10),
      player2: parseInt(match[2] ?? '0', 10),
      tiebreak: match[3] ? parseInt(match[3], 10) : undefined,
    };
  });

  let player1Sets = 0;
  let player2Sets = 0;

  for (const set of sets) {
    if (set.player1 > set.player2) {
      player1Sets++;
    } else {
      player2Sets++;
    }
  }

  return {
    sets,
    winner: player1Sets > player2Sets ? 'player1' : 'player2',
  };
}
