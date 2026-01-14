/**
 * Configuration du système de validation des matchs
 * 
 * Ce système réduit le churn en auto-validant les matchs non confirmés
 * tout en permettant les contestations tardives.
 */

export const MATCH_VALIDATION_CONFIG = {
  // Délai avant auto-validation (en heures)
  autoValidateAfterHours: 24,
  
  // Délai avant envoi du rappel (en heures)
  reminderAfterHours: 6,
  
  // Période de contestation après validation (en jours)
  contestationWindowDays: 7,
  
  // Nombre max de contestations par joueur par mois
  maxContestationsPerMonth: 3,
} as const;

/**
 * Calcule la date d'auto-validation pour un match
 */
export function getAutoValidateDate(matchCreatedAt: Date): Date {
  const autoValidateAt = new Date(matchCreatedAt);
  autoValidateAt.setHours(autoValidateAt.getHours() + MATCH_VALIDATION_CONFIG.autoValidateAfterHours);
  return autoValidateAt;
}

/**
 * Calcule la date d'envoi du rappel
 */
export function getReminderDate(matchCreatedAt: Date): Date {
  const reminderAt = new Date(matchCreatedAt);
  reminderAt.setHours(reminderAt.getHours() + MATCH_VALIDATION_CONFIG.reminderAfterHours);
  return reminderAt;
}

/**
 * Vérifie si un match peut encore être contesté
 */
export function canContestMatch(validatedAt: Date | null): boolean {
  if (!validatedAt) return true; // Match non validé, contestation toujours possible
  
  const contestDeadline = new Date(validatedAt);
  contestDeadline.setDate(contestDeadline.getDate() + MATCH_VALIDATION_CONFIG.contestationWindowDays);
  
  return new Date() < contestDeadline;
}

/**
 * Calcule le temps restant avant auto-validation
 */
export function getTimeUntilAutoValidation(autoValidateAt: Date): {
  hours: number;
  minutes: number;
  expired: boolean;
  formatted: string;
} {
  const now = new Date();
  const diff = autoValidateAt.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { hours: 0, minutes: 0, expired: true, formatted: 'Expiré' };
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  } else {
    formatted = `${minutes}min`;
  }
  
  return { hours, minutes, expired: false, formatted };
}

/**
 * Messages de notification pour le système de validation
 */
export const VALIDATION_MESSAGES = {
  matchReported: (reporterName: string, score: string) => ({
    title: `🎾 ${reporterName} a enregistré votre match`,
    body: `Score déclaré : ${score}. Confirmez ou contestez ce résultat.`,
  }),
  
  reminder: (reporterName: string, hoursLeft: number) => ({
    title: '⏰ Rappel : Match en attente de confirmation',
    body: `${reporterName} attend votre confirmation. Auto-validation dans ${hoursLeft}h.`,
  }),
  
  autoValidated: (opponentName: string, score: string) => ({
    title: '✅ Match auto-validé',
    body: `Votre match contre ${opponentName} (${score}) a été automatiquement validé. Vous pouvez contester pendant 7 jours.`,
  }),
  
  contested: (contestorName: string) => ({
    title: '⚠️ Match contesté',
    body: `${contestorName} a contesté le résultat de votre match. Un admin va examiner le cas.`,
  }),
} as const;
