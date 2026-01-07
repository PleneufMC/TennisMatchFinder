/**
 * usePusherChat Hook
 * 
 * Hook React pour gérer la connexion Pusher dans les salons de chat.
 * Gère automatiquement la souscription/désouscription aux canaux.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Channel, PresenceChannel } from 'pusher-js';
import { getPusherClient, getChatChannelName, PUSHER_EVENTS } from '@/lib/pusher/client';
import type { ChatMessage, Player } from '@/lib/db/schema';

/**
 * Type for message received from Pusher
 */
export interface PusherMessage {
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
 * Type for typing indicator
 */
export interface TypingUser {
  playerId: string;
  playerName: string;
}

/**
 * Type for presence member
 */
export interface PresenceMember {
  id: string;
  info: {
    name: string;
    avatar: string | null;
  };
}

interface UsePusherChatOptions {
  clubId: string;
  roomId: string;
  currentPlayerId: string;
  onNewMessage?: (message: PusherMessage) => void;
  onUserTyping?: (user: TypingUser) => void;
  onUserStoppedTyping?: (user: TypingUser) => void;
  onMemberAdded?: (member: PresenceMember) => void;
  onMemberRemoved?: (member: PresenceMember) => void;
}

interface UsePusherChatReturn {
  isConnected: boolean;
  isSubscribed: boolean;
  onlineMembers: PresenceMember[];
  typingUsers: TypingUser[];
  sendTypingIndicator: (isTyping: boolean) => void;
  error: string | null;
}

export function usePusherChat({
  clubId,
  roomId,
  currentPlayerId,
  onNewMessage,
  onUserTyping,
  onUserStoppedTyping,
  onMemberAdded,
  onMemberRemoved,
}: UsePusherChatOptions): UsePusherChatReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState<PresenceMember[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<PresenceChannel | null>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Subscribe to channel
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) {
      setError('Pusher non configuré');
      return;
    }

    const channelName = getChatChannelName(clubId, roomId);
    
    // Subscribe to presence channel
    const channel = pusher.subscribe(channelName) as PresenceChannel;
    channelRef.current = channel;

    // Connection state
    pusher.connection.bind('connected', () => {
      setIsConnected(true);
      setError(null);
    });

    pusher.connection.bind('disconnected', () => {
      setIsConnected(false);
    });

    pusher.connection.bind('error', (err: Error) => {
      setError(err.message);
    });

    // Presence channel events
    channel.bind('pusher:subscription_succeeded', (members: { members: Record<string, PresenceMember['info']> }) => {
      setIsSubscribed(true);
      const memberList: PresenceMember[] = Object.entries(members.members).map(([id, info]) => ({
        id,
        info,
      }));
      setOnlineMembers(memberList);
    });

    channel.bind('pusher:subscription_error', (err: Error) => {
      setError(`Erreur de souscription: ${err.message}`);
      setIsSubscribed(false);
    });

    channel.bind('pusher:member_added', (member: { id: string; info: PresenceMember['info'] }) => {
      const newMember: PresenceMember = { id: member.id, info: member.info };
      setOnlineMembers((prev) => [...prev, newMember]);
      onMemberAdded?.(newMember);
    });

    channel.bind('pusher:member_removed', (member: { id: string; info: PresenceMember['info'] }) => {
      const removedMember: PresenceMember = { id: member.id, info: member.info };
      setOnlineMembers((prev) => prev.filter((m) => m.id !== member.id));
      onMemberRemoved?.(removedMember);
      
      // Remove from typing users if they were typing
      setTypingUsers((prev) => prev.filter((u) => u.playerId !== member.id));
    });

    // Chat events
    channel.bind(PUSHER_EVENTS.NEW_MESSAGE, (message: PusherMessage) => {
      // Don't process our own messages (we add them optimistically)
      if (message.senderId === currentPlayerId) return;
      onNewMessage?.(message);
    });

    channel.bind(PUSHER_EVENTS.USER_TYPING, (data: TypingUser) => {
      if (data.playerId === currentPlayerId) return;
      
      // Clear existing timeout for this user
      if (typingTimeoutRef.current[data.playerId]) {
        clearTimeout(typingTimeoutRef.current[data.playerId]);
      }

      // Add to typing users
      setTypingUsers((prev) => {
        if (prev.some((u) => u.playerId === data.playerId)) return prev;
        return [...prev, data];
      });

      // Auto-remove after 3 seconds of no typing
      typingTimeoutRef.current[data.playerId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.playerId !== data.playerId));
        delete typingTimeoutRef.current[data.playerId];
      }, 3000);

      onUserTyping?.(data);
    });

    channel.bind(PUSHER_EVENTS.USER_STOPPED_TYPING, (data: TypingUser) => {
      if (data.playerId === currentPlayerId) return;
      
      // Clear timeout
      if (typingTimeoutRef.current[data.playerId]) {
        clearTimeout(typingTimeoutRef.current[data.playerId]);
        delete typingTimeoutRef.current[data.playerId];
      }

      setTypingUsers((prev) => prev.filter((u) => u.playerId !== data.playerId));
      onUserStoppedTyping?.(data);
    });

    // Cleanup
    return () => {
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};

      // Unsubscribe
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      channelRef.current = null;
      setIsSubscribed(false);
      setOnlineMembers([]);
      setTypingUsers([]);
    };
  }, [clubId, roomId, currentPlayerId, onNewMessage, onUserTyping, onUserStoppedTyping, onMemberAdded, onMemberRemoved]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    async (isTyping: boolean) => {
      try {
        await fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clubId,
            roomId,
            isTyping,
          }),
        });
      } catch (err) {
        // Silently fail - typing indicators are best effort
      }
    },
    [clubId, roomId]
  );

  return {
    isConnected,
    isSubscribed,
    onlineMembers,
    typingUsers,
    sendTypingIndicator,
    error,
  };
}
