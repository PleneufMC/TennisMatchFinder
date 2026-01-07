/**
 * Pusher Server Configuration
 * 
 * Chaque club a son propre canal de chat pour isoler les conversations.
 * Format du canal: `club-{clubId}-room-{roomId}`
 */

import Pusher from 'pusher';

// Singleton instance
let pusherInstance: Pusher | null = null;

/**
 * Get or create Pusher server instance
 */
export function getPusherServer(): Pusher | null {
  // Check if Pusher is configured
  if (
    !process.env.PUSHER_APP_ID ||
    !process.env.PUSHER_KEY ||
    !process.env.PUSHER_SECRET ||
    !process.env.PUSHER_CLUSTER
  ) {
    console.warn('Pusher not configured - real-time features disabled');
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherInstance;
}

/**
 * Generate channel name for a chat room
 * Each club has isolated channels for their rooms
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
 * Event types for chat
 */
export const PUSHER_EVENTS = {
  // Chat events
  NEW_MESSAGE: 'new-message',
  MESSAGE_EDITED: 'message-edited',
  MESSAGE_DELETED: 'message-deleted',
  USER_TYPING: 'user-typing',
  USER_STOPPED_TYPING: 'user-stopped-typing',
  
  // Room events
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  
  // Club-wide events
  NEW_MEMBER: 'new-member',
  NEW_MATCH_PROPOSAL: 'new-match-proposal',
} as const;

/**
 * Type for new message event data
 */
export interface NewMessageEventData {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  messageType: string;
  createdAt: string;
}

/**
 * Type for typing event data
 */
export interface TypingEventData {
  playerId: string;
  playerName: string;
}

/**
 * Broadcast a new message to a chat room
 */
export async function broadcastNewMessage(
  clubId: string,
  roomId: string,
  message: NewMessageEventData
): Promise<boolean> {
  const pusher = getPusherServer();
  if (!pusher) return false;

  try {
    const channelName = getChatChannelName(clubId, roomId);
    await pusher.trigger(channelName, PUSHER_EVENTS.NEW_MESSAGE, message);
    return true;
  } catch (error) {
    console.error('Failed to broadcast message:', error);
    return false;
  }
}

/**
 * Broadcast typing indicator
 */
export async function broadcastTyping(
  clubId: string,
  roomId: string,
  data: TypingEventData,
  isTyping: boolean
): Promise<boolean> {
  const pusher = getPusherServer();
  if (!pusher) return false;

  try {
    const channelName = getChatChannelName(clubId, roomId);
    const event = isTyping ? PUSHER_EVENTS.USER_TYPING : PUSHER_EVENTS.USER_STOPPED_TYPING;
    await pusher.trigger(channelName, event, data);
    return true;
  } catch (error) {
    console.error('Failed to broadcast typing:', error);
    return false;
  }
}

/**
 * Broadcast to entire club
 */
export async function broadcastToClub(
  clubId: string,
  event: string,
  data: unknown
): Promise<boolean> {
  const pusher = getPusherServer();
  if (!pusher) return false;

  try {
    const channelName = getClubChannelName(clubId);
    await pusher.trigger(channelName, event, data);
    return true;
  } catch (error) {
    console.error('Failed to broadcast to club:', error);
    return false;
  }
}
