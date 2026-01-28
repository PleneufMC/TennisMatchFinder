'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlayerAvatar } from '@/components/ui/avatar';
import { formatRelativeDate, formatFullDate } from '@/lib/utils/dates';
import Pusher from 'pusher-js';

interface Message {
  id: string;
  content: string;
  senderId: string;
  readAt: string | null;
  createdAt: string;
}

interface Participant {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo?: number;
}

interface ConversationViewProps {
  conversationId: string;
  currentPlayer: Participant;
  otherParticipant: Participant;
}

export function ConversationView({
  conversationId,
  currentPlayer,
  otherParticipant,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/conversations/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
          setHasMore(data.hasMore);
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, scrollToBottom]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
    });

    const channel = pusher.subscribe(`dm-${conversationId}`);

    channel.bind('new-message', (data: {
      id: string;
      content: string;
      senderId: string;
      senderName: string;
      createdAt: string;
    }) => {
      // Only add if not from current user (we already added it optimistically)
      if (data.senderId !== currentPlayer.id) {
        setMessages((prev) => [...prev, {
          id: data.id,
          content: data.content,
          senderId: data.senderId,
          readAt: null,
          createdAt: data.createdAt,
        }]);
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`dm-${conversationId}`);
    };
  }, [conversationId, currentPlayer.id, scrollToBottom]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentPlayer.id,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 100);

    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? data.message : m))
        );
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        setNewMessage(content); // Restore message
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setNewMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (isLoading) {
    return (
      <Card className="h-[calc(100vh-12rem)]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/messages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link href={`/profil/${otherParticipant.id}`} className="flex items-center gap-3 hover:opacity-80">
            <PlayerAvatar
              src={otherParticipant.avatarUrl}
              name={otherParticipant.fullName}
              size="md"
            />
            <div>
              <p className="font-semibold">{otherParticipant.fullName}</p>
              {otherParticipant.currentElo && (
                <p className="text-sm text-muted-foreground">{otherParticipant.currentElo} ELO</p>
              )}
            </div>
          </Link>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <User className="h-12 w-12 mb-4 opacity-50" />
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Envoyez le premier message !</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {formatFullDate(new Date(date).toISOString())}
                </span>
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {dateMessages.map((message) => {
                  const isMine = message.senderId === currentPlayer.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : ''}`}>
                        {!isMine && (
                          <PlayerAvatar
                            src={otherParticipant.avatarUrl}
                            name={otherParticipant.fullName}
                            size="sm"
                          />
                        )}
                        <div
                          className={`
                            px-4 py-2 rounded-2xl
                            ${isMine 
                              ? 'bg-primary text-primary-foreground rounded-br-md' 
                              : 'bg-muted rounded-bl-md'
                            }
                          `}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="flex-shrink-0 border-t p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="h-[44px] w-[44px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
        </p>
      </div>
    </Card>
  );
}
