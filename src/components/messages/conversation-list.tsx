'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlayerAvatar } from '@/components/ui/avatar';
import { formatRelativeDate } from '@/lib/utils/dates';
import Pusher from 'pusher-js';

interface Conversation {
  id: string;
  otherParticipant: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
}

interface ConversationListProps {
  currentPlayerId: string;
}

export function ConversationList({ currentPlayerId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/messages/conversations');
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations);
          setFilteredConversations(data.conversations);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Filter conversations by search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredConversations(
        conversations.filter((conv) =>
          conv.otherParticipant.fullName.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, conversations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
    });

    const channel = pusher.subscribe(`user-${currentPlayerId}`);

    channel.bind('dm-notification', (data: {
      conversationId: string;
      senderId: string;
      senderName: string;
      preview: string;
    }) => {
      // Update conversation in list
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              lastMessageAt: new Date().toISOString(),
              lastMessagePreview: data.preview,
              unreadCount: conv.unreadCount + 1,
            };
          }
          return conv;
        });
        // Sort by last message
        return updated.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB - dateA;
        });
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${currentPlayerId}`);
    };
  }, [currentPlayerId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Conversations
        </CardTitle>
        <CardDescription>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Conversations */}
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery 
              ? 'Aucune conversation trouvée' 
              : 'Aucune conversation. Envoyez un message à un joueur depuis son profil !'
            }
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="block"
              >
                <div className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-colors
                  hover:bg-muted/50
                  ${conv.unreadCount > 0 ? 'bg-primary/5 border-primary/20' : ''}
                `}>
                  <PlayerAvatar
                    src={conv.otherParticipant.avatarUrl}
                    name={conv.otherParticipant.fullName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium truncate ${conv.unreadCount > 0 ? 'font-semibold' : ''}`}>
                        {conv.otherParticipant.fullName}
                      </span>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeDate(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {conv.lastMessagePreview || 'Nouvelle conversation'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 px-1.5 rounded-full">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
