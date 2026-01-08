import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trash2, Trophy, MessageSquare, Users, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatTimeAgo } from '@/lib/utils/dates';
import { MarkAllReadButton, NotificationItem } from './notification-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Vos notifications',
};

// Icônes par type de notification
const notificationIcons: Record<string, React.ReactNode> = {
  badge: <Trophy className="h-5 w-5 text-yellow-500" />,
  match: <Calendar className="h-5 w-5 text-blue-500" />,
  message: <MessageSquare className="h-5 w-5 text-green-500" />,
  club: <Users className="h-5 w-5 text-purple-500" />,
  system: <Bell className="h-5 w-5 text-gray-500" />,
  achievement: <Star className="h-5 w-5 text-amber-500" />,
};

export default async function NotificationsPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Récupérer les notifications
  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, player.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes vos notifications sont lues'
            }
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {/* Liste des notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Récentes</CardTitle>
          <CardDescription>
            Vos {userNotifications.length} dernières notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userNotifications.length > 0 ? (
            <div className="space-y-1">
              {userNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={{
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    link: notification.link,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt.toISOString(),
                  }}
                  icon={notificationIcons[notification.type] || notificationIcons.system}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
              <p className="text-muted-foreground">
                Vous n'avez pas encore de notifications
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
