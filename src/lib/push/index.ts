/**
 * Web Push Notifications Service for TennisMatchFinder
 * 
 * Handles:
 * - VAPID key generation and management
 * - Subscription management (save, delete, get)
 * - Sending push notifications to users
 */

import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions, players } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Types
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:pleneuftrading@gmail.com';

// Initialize web-push with VAPID details
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * Get the VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(
  userId: string,
  subscription: PushSubscriptionData,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if subscription already exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription (might be for a different user)
      await db
        .update(pushSubscriptions)
        .set({
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          lastUsedAt: new Date(),
        })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
    } else {
      // Insert new subscription
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[Push] Error saving subscription:', error);
    return { success: false, error: 'Failed to save subscription' };
  }
}

/**
 * Delete a push subscription
 */
export async function deleteSubscription(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    return { success: true };
  } catch (error) {
    console.error('[Push] Error deleting subscription:', error);
    return { success: false, error: 'Failed to delete subscription' };
  }
}

/**
 * Delete all subscriptions for a user
 */
export async function deleteUserSubscriptions(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    return { success: true };
  } catch (error) {
    console.error('[Push] Error deleting user subscriptions:', error);
    return { success: false, error: 'Failed to delete subscriptions' };
  }
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userId: string) {
  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

/**
 * Send a push notification to a specific subscription
 */
async function sendToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
): Promise<{ success: boolean; expired?: boolean }> {
  if (!isPushConfigured()) {
    console.warn('[Push] VAPID keys not configured');
    return { success: false };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/images/icon-192.png',
    badge: payload.badge || '/images/icon-192.png',
    tag: payload.tag || 'tmf-notification',
    url: payload.url || '/',
    data: payload.data,
  });

  try {
    await webpush.sendNotification(pushSubscription, notificationPayload);
    return { success: true };
  } catch (error: unknown) {
    const webPushError = error as { statusCode?: number };
    // Handle expired subscriptions (410 Gone or 404 Not Found)
    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      console.log('[Push] Subscription expired, removing:', subscription.endpoint);
      await deleteSubscription(subscription.endpoint);
      return { success: false, expired: true };
    }
    console.error('[Push] Error sending notification:', error);
    return { success: false };
  }
}

/**
 * Send a push notification to a user (all their devices)
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; expired: number }> {
  const subscriptions = await getUserSubscriptions(userId);
  
  let sent = 0;
  let failed = 0;
  let expired = 0;

  for (const subscription of subscriptions) {
    const result = await sendToSubscription(subscription, payload);
    if (result.success) {
      sent++;
      // Update last used timestamp
      await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.id, subscription.id));
    } else if (result.expired) {
      expired++;
    } else {
      failed++;
    }
  }

  return { sent, failed, expired };
}

/**
 * Send a push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ totalSent: number; totalFailed: number; totalExpired: number }> {
  let totalSent = 0;
  let totalFailed = 0;
  let totalExpired = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
    totalExpired += result.expired;
  }

  return { totalSent, totalFailed, totalExpired };
}

/**
 * Send a push notification to all users in a club
 */
export async function sendPushToClub(
  clubId: string,
  payload: PushNotificationPayload,
  excludeUserId?: string
): Promise<{ totalSent: number; totalFailed: number; totalExpired: number }> {
  // Get all players in the club
  const clubPlayers = await db
    .select({ id: players.id })
    .from(players)
    .where(
      excludeUserId
        ? and(eq(players.clubId, clubId), eq(players.isActive, true))
        : eq(players.clubId, clubId)
    );

  const userIds = clubPlayers
    .map(p => p.id)
    .filter(id => id !== excludeUserId);

  return sendPushToUsers(userIds, payload);
}

// Notification type helpers
export const PushNotifications = {
  /**
   * New match recorded - notify opponent
   */
  matchRecorded: (opponentName: string, matchId: string): PushNotificationPayload => ({
    title: '🎾 Nouveau match enregistré',
    body: `${opponentName} a enregistré un match avec vous. Confirmez le résultat.`,
    tag: `match-${matchId}`,
    url: `/matchs/confirmer/${matchId}`,
  }),

  /**
   * Match confirmed - notify reporter
   */
  matchConfirmed: (opponentName: string): PushNotificationPayload => ({
    title: '✅ Match confirmé',
    body: `${opponentName} a confirmé votre match. Votre ELO a été mis à jour !`,
    tag: 'match-confirmed',
    url: '/matchs',
  }),

  /**
   * Match rejected - notify reporter
   */
  matchRejected: (opponentName: string): PushNotificationPayload => ({
    title: '❌ Match contesté',
    body: `${opponentName} a contesté le résultat du match.`,
    tag: 'match-rejected',
    url: '/matchs',
  }),

  /**
   * New chat message
   */
  newMessage: (senderName: string, roomId: string, preview: string): PushNotificationPayload => ({
    title: `💬 Message de ${senderName}`,
    body: preview.length > 100 ? preview.substring(0, 97) + '...' : preview,
    tag: `chat-${roomId}`,
    url: `/chat/${roomId}`,
  }),

  /**
   * Match Now - someone wants to play
   */
  matchNow: (playerName: string): PushNotificationPayload => ({
    title: '🎾 Quelqu\'un veut jouer !',
    body: `${playerName} cherche un partenaire maintenant. Répondez vite !`,
    tag: 'match-now',
    url: '/match-now',
  }),

  /**
   * Tournament registration open
   */
  tournamentOpen: (tournamentName: string, tournamentId: string): PushNotificationPayload => ({
    title: '🏆 Inscriptions ouvertes',
    body: `Les inscriptions pour "${tournamentName}" sont ouvertes !`,
    tag: `tournament-${tournamentId}`,
    url: `/tournaments/${tournamentId}`,
  }),

  /**
   * Badge earned
   */
  badgeEarned: (badgeName: string): PushNotificationPayload => ({
    title: '🏅 Nouveau badge !',
    body: `Félicitations ! Vous avez débloqué le badge "${badgeName}"`,
    tag: 'badge-earned',
    url: '/achievements',
  }),

  /**
   * Forum reply to your thread
   */
  forumReply: (threadTitle: string, threadId: string): PushNotificationPayload => ({
    title: '💬 Nouvelle réponse',
    body: `Nouvelle réponse sur "${threadTitle}"`,
    tag: `forum-${threadId}`,
    url: `/forum/${threadId}`,
  }),

  /**
   * Club join request approved
   */
  joinApproved: (clubName: string): PushNotificationPayload => ({
    title: '🎉 Bienvenue !',
    body: `Votre demande d'adhésion à ${clubName} a été acceptée !`,
    tag: 'join-approved',
    url: '/dashboard',
  }),

  /**
   * Generic notification
   */
  generic: (title: string, body: string, url?: string): PushNotificationPayload => ({
    title,
    body,
    url: url || '/notifications',
  }),
};
