import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  isThisYear,
  parseISO,
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date de manière relative et lisible
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) {
    return `Aujourd'hui à ${format(d, 'HH:mm', { locale: fr })}`;
  }

  if (isYesterday(d)) {
    return `Hier à ${format(d, 'HH:mm', { locale: fr })}`;
  }

  if (isThisWeek(d)) {
    return format(d, "EEEE 'à' HH:mm", { locale: fr });
  }

  if (isThisYear(d)) {
    return format(d, "d MMMM 'à' HH:mm", { locale: fr });
  }

  return format(d, "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

/**
 * Formate une date en "il y a X temps"
 */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

/**
 * Formate une date courte
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isThisYear(d)) {
    return format(d, 'd MMM', { locale: fr });
  }

  return format(d, 'd MMM yyyy', { locale: fr });
}

/**
 * Formate une date complète
 */
export function formatFullDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE d MMMM yyyy', { locale: fr });
}

/**
 * Formate une date pour l'affichage dans un formulaire
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Formate une heure
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale: fr });
}

/**
 * Vérifie si une date est dans les X derniers jours
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

/**
 * Obtient le début de la semaine courante
 */
export function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme début
  return new Date(now.setDate(diff));
}

/**
 * Obtient le début du mois courant
 */
export function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Formate une durée en heures et minutes
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}
