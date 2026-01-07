'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Users, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils/dates';
import { usePusherChat, type PusherMessage } from '@/hooks/use-pusher-chat';
import type { ChatRoom as ChatRoomType, ChatMessage, Player } from '@/lib/db/schema';

interface ChatRoomProps {
  room: ChatRoomType;
  messages: (ChatMessage & { sender: Player | null })[];
  currentPlayer: { id: string; fullName: string; avatarUrl?: string | null; clubId: string };
  members: Player[];
  chatTitle: string;
}

export function ChatRoom({
  room,
  messages: initialMessages,
  currentPlayer,
  members,
  chatTitle,
}: ChatRoomProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<boolean>(false);

  // Handle new message from Pusher
  const handleNewMessage = useCallback((pusherMessage: PusherMessage) => {
    const newMsg: ChatMessage & { sender: Player | null } = {
      id: pusherMessage.id,
      roomId: pusherMessage.roomId,
      senderId: pusherMessage.senderId,
      content: pusherMessage.content,
      messageType: pusherMessage.messageType,
      metadata: {},
      isEdited: false,
      editedAt: null,
      createdAt: new Date(pusherMessage.createdAt),
      sender: {
        id: pusherMessage.senderId,
        fullName: pusherMessage.senderName,
        avatarUrl: pusherMessage.senderAvatar,
      } as Player,
    };
    setMessages((prev) => [...prev, newMsg]);
  }, []);

  // Connect to Pusher
  const {
    isConnected,
    isSubscribed,
    onlineMembers,
    typingUsers,
    sendTypingIndicator,
    error: pusherError,
  } = usePusherChat({
    clubId: currentPlayer.clubId,
    roomId: room.id,
    currentPlayerId: currentPlayer.id,
    onNewMessage: handleNewMessage,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!lastTypingRef.current) {
      lastTypingRef.current = true;
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      lastTypingRef.current = false;
      sendTypingIndicator(false);
    }, 2000);
  }, [sendTypingIndicator]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Stop typing indicator
    if (lastTypingRef.current) {
      lastTypingRef.current = false;
      sendTypingIndicator(false);
    }

    // Optimistic update
    const optimisticMessage: ChatMessage & { sender: Player | null } = {
      id: `temp-${Date.now()}`,
      roomId: room.id,
      senderId: currentPlayer.id,
      content: messageContent,
      messageType: 'text',
      metadata: {},
      isEdited: false,
      editedAt: null,
      createdAt: new Date(),
      sender: {
        id: currentPlayer.id,
        fullName: currentPlayer.fullName,
        avatarUrl: currentPlayer.avatarUrl || null,
      } as Player,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch(`/api/chat/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const sentMessage = await response.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMessage.id
            ? { ...sentMessage, sender: optimisticMessage.sender }
            : m
        )
      );
    } catch (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.length > 0) {
      handleTyping();
    }
  };

  // Find other member for direct chats
  const otherMember = room.isDirect
    ? members.find((m) => m.id !== currentPlayer.id)
    : null;

  // Count online members (from Pusher presence)
  const onlineCount = onlineMembers.length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chat">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        {room.isDirect && otherMember ? (
          <PlayerAvatar
            src={otherMember.avatarUrl}
            name={otherMember.fullName}
            size="md"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{chatTitle}</h2>
            {/* Connection status indicator */}
            {isConnected ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <WifiOff className="h-3 w-3 mr-1" />
                Hors ligne
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {room.isDirect ? (
              otherMember?.isActive ? 'En ligne' : 'Hors ligne'
            ) : (
              <>
                {onlineCount > 0 ? (
                  <span className="text-green-600">{onlineCount} en ligne</span>
                ) : (
                  `${members.length} membre${members.length !== 1 ? 's' : ''}`
                )}
              </>
            )}
          </p>
        </div>

        {/* Online members avatars */}
        {onlineMembers.length > 0 && !room.isDirect && (
          <div className="flex -space-x-2">
            {onlineMembers.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="relative"
                title={member.info.name}
              >
                <PlayerAvatar
                  src={member.info.avatar}
                  name={member.info.name}
                  size="sm"
                  className="ring-2 ring-background"
                />
                <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full ring-1 ring-background" />
              </div>
            ))}
            {onlineMembers.length > 5 && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background">
                +{onlineMembers.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pusher error */}
      {pusherError && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-3 text-sm text-orange-700">
          <p>Mode hors ligne - {pusherError}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>Aucun message pour le moment.</p>
            <p className="text-sm">Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentPlayer.id;
            const showAvatar =
              index === 0 ||
              messages[index - 1]?.senderId !== message.senderId;
            const showTimestamp =
              index === messages.length - 1 ||
              messages[index + 1]?.senderId !== message.senderId;

            return (
              <div
                key={message.id}
                className={cn('flex gap-3', isOwnMessage && 'flex-row-reverse')}
              >
                {/* Avatar */}
                <div className="w-8 flex-shrink-0">
                  {showAvatar && !isOwnMessage && (
                    <PlayerAvatar
                      src={message.sender?.avatarUrl}
                      name={message.sender?.fullName || 'Inconnu'}
                      size="sm"
                    />
                  )}
                </div>

                {/* Message */}
                <div
                  className={cn(
                    'max-w-[70%] space-y-1',
                    isOwnMessage && 'text-right'
                  )}
                >
                  {showAvatar && !isOwnMessage && (
                    <p className="text-xs text-muted-foreground font-medium">
                      {message.sender?.fullName || 'Inconnu'}
                    </p>
                  )}
                  <div
                    className={cn(
                      'inline-block px-4 py-2 rounded-2xl',
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  {showTimestamp && (
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(message.createdAt.toISOString())}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex gap-3">
            <div className="w-8 flex-shrink-0" />
            <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
              <p className="text-sm text-muted-foreground italic">
                {typingUsers.length === 1
                  ? `${typingUsers[0]?.playerName ?? 'Quelqu\'un'} écrit...`
                  : `${typingUsers.map((u) => u.playerName).join(', ')} écrivent...`}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
