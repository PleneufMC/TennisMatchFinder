/**
 * Pusher Client Configuration
 * 
 * Client-side Pusher setup for real-time features
 */

import PusherClient from 'pusher-js';

// Singleton instance
let pusherClientInstance: PusherClient | null = null;

/**
 * Get or create Pusher client instance
 */
export function getPusherClient(): PusherClient | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn('Pusher client not configured');
    return null;
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(key, {
      cluster,
      // Enable presence channels authentication
      authEndpoint: '/api/pusher/auth',
      // Auth will include user info for presence channels
      auth: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      pusherClientInstance.connection.bind('connected', () => {
        console.log('✅ Pusher connected');
      });

      pusherClientInstance.connection.bind('error', (error: Error) => {
        console.error('❌ Pusher error:', error);
      });

      pusherClientInstance.connection.bind('disconnected', () => {
        console.log('⚠️ Pusher disconnected');
      });
    }
  }

  return pusherClientInstance;
}

/**
 * Generate channel name for a chat room (must match server)
 */
export function getChatChannelName(clubId: string, roomId: string): string {
  return `presence-club-${clubId}-room-${roomId}`;
}

/**
 * Generate channel name for club-wide notifications
 */
export function getClubChannelName(clubId: string): string {
  return `presence-club-${clubId}`;
}

/**
 * Event types (must match server)
 */
export const PUSHER_EVENTS = {
  NEW_MESSAGE: 'new-message',
  MESSAGE_EDITED: 'message-edited',
  MESSAGE_DELETED: 'message-deleted',
  USER_TYPING: 'user-typing',
  USER_STOPPED_TYPING: 'user-stopped-typing',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  NEW_MEMBER: 'new-member',
  NEW_MATCH_PROPOSAL: 'new-match-proposal',
} as const;

/**
 * Disconnect and cleanup Pusher client
 */
export function disconnectPusher(): void {
  if (pusherClientInstance) {
    pusherClientInstance.disconnect();
    pusherClientInstance = null;
  }
}
