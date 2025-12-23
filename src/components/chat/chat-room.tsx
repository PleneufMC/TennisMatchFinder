'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Users, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PlayerAvatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils/dates';
import type { ChatRoom as ChatRoomType, ChatMessage, Player } from '@/lib/db/schema';

interface ChatRoomProps {
  room: ChatRoomType;
  messages: (ChatMessage & { sender: Player | null })[];
  currentPlayer: { id: string; fullName: string; avatarUrl?: string | null };
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling for new messages (simple implementation)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/${room.id}/messages`);
        if (response.ok) {
          const newMessages = await response.json();
          if (newMessages.length > messages.length) {
            setMessages(newMessages);
          }
        }
      } catch (error) {
        // Silently fail - polling is best effort
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [room.id, messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

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

  // Find other member for direct chats
  const otherMember = room.isDirect
    ? members.find((m) => m.id !== currentPlayer.id)
    : null;

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
          <h2 className="font-semibold">{chatTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {room.isDirect ? (
              otherMember?.isActive ? 'En ligne' : 'Hors ligne'
            ) : (
              `${members.length} membre${members.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>
      </div>

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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
