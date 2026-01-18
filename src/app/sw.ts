/**
 * Service Worker pour TennisMatchFinder PWA
 * 
 * Stratégies de cache :
 * - Pages : Network-first avec fallback cache
 * - API : Network-only (données temps réel)
 * - Assets statiques : Cache-first
 * - Images : Cache-first avec expiration
 */

/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// Déclaration des variables injectées par Serwist
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Initialiser Serwist avec le manifest de précache
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }: { request: Request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

// Types pour les événements
interface PushEventData {
  title?: string;
  body?: string;
  message?: string;
  tag?: string;
  url?: string;
  link?: string;
}

// Écouter les événements push pour les notifications
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json() as PushEventData;
    
    const options: NotificationOptions = {
      body: data.body || data.message || '',
      icon: '/images/icon-192.svg',
      badge: '/images/icon-192.svg',
      tag: data.tag || 'tmf-notification',
      data: {
        url: data.url || data.link || '/',
      },
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'TennisMatchFinder',
        options
      )
    );
  } catch (error) {
    console.error('[SW] Error showing notification:', error);
  }
});

// Gérer le clic sur une notification
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const notificationData = event.notification.data as { url?: string } | undefined;
  const urlToOpen = notificationData?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: readonly WindowClient[]) => {
      // Si une fenêtre TMF est déjà ouverte, la focus
      for (const client of clientList) {
        if (client.url.includes('tennismatchfinder') && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
      return;
    })
  );
});

// Ajouter le listener pour les messages depuis l'app
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && typeof event.data === 'object' && 'type' in event.data) {
    if (event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  }
});

serwist.addEventListeners();
