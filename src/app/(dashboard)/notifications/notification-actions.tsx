'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils/dates';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationItemProps {
  notification: NotificationData;
  icon: React.ReactNode;
}

export function NotificationItem({ notification, icon }: NotificationItemProps) {
  const router = useRouter();
  const [isMarking, setIsMarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRead, setIsRead] = useState(notification.isRead);

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRead) return;
    
    setIsMarking(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notification.id] }),
      });

      if (response.ok) {
        setIsRead(true);
        router.refresh();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsMarking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notifications?id=${notification.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Notification supprimée');
        router.refresh();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const content = (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg transition-colors',
        !isRead ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/50',
      )}
    >
      {/* Icône */}
      <div className="flex-shrink-0 mt-0.5">{icon}</div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{notification.title}</span>
          {!isRead && (
            <Badge variant="default" className="text-xs">
              Nouveau
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleMarkAsRead}
            disabled={isMarking}
            title="Marquer comme lu"
          >
            {isMarking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Supprimer"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (response.ok) {
        toast.success('Toutes les notifications marquées comme lues');
        router.refresh();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleMarkAllRead} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <CheckCheck className="h-4 w-4 mr-2" />
      )}
      Tout marquer comme lu
    </Button>
  );
}
