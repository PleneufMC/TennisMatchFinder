# 🔴 Configuration Pusher - Chat en temps réel

## Vue d'ensemble

Le chat utilise **Pusher Channels** pour les fonctionnalités temps réel :
- Messages instantanés
- Indicateurs de frappe ("X est en train d'écrire...")
- Présence en ligne
- Notifications en temps réel

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLUBS                                   │
├─────────────────────────────────────────────────────────────────┤
│  Club A (MCCC)              │  Club B (TC Pleneuf)               │
│  ┌─────────────────────┐    │  ┌─────────────────────┐          │
│  │ presence-club-A-    │    │  │ presence-club-B-    │          │
│  │   room-general      │    │  │   room-general      │          │
│  │   room-matchs       │    │  │   room-matchs       │          │
│  │   room-conseils     │    │  │   room-conseils     │          │
│  └─────────────────────┘    │  └─────────────────────┘          │
│                              │                                   │
│  🔒 Isolation totale entre les clubs                            │
└─────────────────────────────────────────────────────────────────┘
```

Chaque club a ses propres canaux Pusher, garantissant une isolation complète des conversations.

## Configuration

### 1. Créer un compte Pusher

1. Aller sur [pusher.com](https://pusher.com/)
2. Créer un compte gratuit
3. Créer une nouvelle application "Channels"
4. Choisir le cluster le plus proche (ex: `eu` pour l'Europe)

### 2. Variables d'environnement

Ajouter ces variables dans Netlify (Site settings → Environment variables) :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PUSHER_APP_ID` | ID de l'application (serveur) | `1234567` |
| `PUSHER_KEY` | Clé publique | `a1b2c3d4e5f6g7h8i9j0` |
| `PUSHER_SECRET` | Clé secrète (serveur uniquement) | `k1l2m3n4o5p6q7r8s9t0` |
| `PUSHER_CLUSTER` | Région du serveur | `eu` |
| `NEXT_PUBLIC_PUSHER_KEY` | Clé publique (client) | `a1b2c3d4e5f6g7h8i9j0` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Région (client) | `eu` |

⚠️ **Important** : `PUSHER_SECRET` ne doit JAMAIS être exposé côté client !

### 3. Limites du plan gratuit

Le plan gratuit Pusher inclut :
- **200 000 messages/jour**
- **100 connexions simultanées**
- **Illimité** : nombre de canaux

Pour un club de tennis typique, c'est largement suffisant.

## Fonctionnalités implémentées

### Messages en temps réel
```
Joueur A envoie un message
    ↓
API /api/chat/[roomId]/messages (POST)
    ↓
Message sauvé en DB + Broadcast Pusher
    ↓
Tous les joueurs du salon reçoivent le message instantanément
```

### Indicateur de frappe
```
Joueur A commence à écrire
    ↓
API /api/chat/typing (POST)
    ↓
Broadcast sur le canal du salon
    ↓
Autres joueurs voient "Pierre est en train d'écrire..."
```

### Présence en ligne
```
Joueur se connecte à un salon
    ↓
Pusher presence channel (subscription)
    ↓
Autres joueurs voient le compteur "3 en ligne"
```

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `src/lib/pusher/server.ts` | Configuration serveur + fonctions broadcast |
| `src/lib/pusher/client.ts` | Configuration client + connexion |
| `src/hooks/use-pusher-chat.ts` | Hook React pour le chat temps réel |
| `src/app/api/pusher/auth/route.ts` | Authentification des canaux presence |
| `src/app/api/chat/typing/route.ts` | API indicateur de frappe |
| `src/app/api/chat/[roomId]/messages/route.ts` | API messages (avec broadcast) |
| `src/components/chat/chat-room.tsx` | Composant chat avec Pusher |

## Fallback sans Pusher

Si Pusher n'est pas configuré, le chat fonctionne en mode **polling** :
- Rafraîchissement toutes les 5 secondes
- Pas d'indicateur de frappe
- Pas de compteur en ligne

## Dépannage

### Le chat ne se met pas à jour en temps réel

1. Vérifier que les variables d'environnement sont configurées
2. Vérifier la console du navigateur pour les erreurs Pusher
3. Vérifier que le joueur appartient bien au club du salon

### Erreur "Access denied" à l'authentification

- Le joueur essaie d'accéder à un canal d'un autre club
- Vérifier `player.clubId` correspond au club du canal

### Messages dupliqués

- Le système filtre automatiquement les messages du joueur courant
- Si duplication persiste, vérifier les IDs des messages

## Test local

```bash
# Ajouter les variables dans .env.local
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Redémarrer le serveur
npm run dev
```

Ouvrir deux navigateurs différents, se connecter avec deux comptes du même club, et envoyer des messages pour tester.
