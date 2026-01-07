# Configuration Pusher - Chat en temps réel

## Architecture

Le chat utilise **Pusher Channels** pour le temps réel avec une architecture multi-club :

```
Canal par salon: presence-club-{clubId}-room-{roomId}
Canal par club:  presence-club-{clubId}
```

Chaque club a ses propres canaux isolés, garantissant la confidentialité des conversations.

## Étapes de configuration

### 1. Créer un compte Pusher

1. Allez sur https://pusher.com/
2. Créez un compte gratuit (suffisant pour < 200k messages/jour)
3. Créez une nouvelle application "Channels"
4. Choisissez le cluster le plus proche (ex: `eu` pour l'Europe)

### 2. Récupérer les credentials

Dans le dashboard Pusher → App Keys, notez :
- **app_id** : ID de l'application
- **key** : Clé publique
- **secret** : Clé secrète (ne jamais exposer côté client)
- **cluster** : Région (eu, us2, ap1, etc.)

### 3. Configurer les variables d'environnement

#### Netlify (Production)

Site settings → Environment variables → Ajouter :

| Variable | Valeur | Notes |
|----------|--------|-------|
| `PUSHER_APP_ID` | `123456` | Votre App ID |
| `PUSHER_KEY` | `abcd1234...` | Clé publique |
| `PUSHER_SECRET` | `xyz789...` | **SECRET - Ne jamais exposer** |
| `PUSHER_CLUSTER` | `eu` | Votre cluster |
| `NEXT_PUBLIC_PUSHER_KEY` | `abcd1234...` | Même que PUSHER_KEY (accessible côté client) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `eu` | Même que PUSHER_CLUSTER |

#### Local (.env.local)

```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### 4. Activer les canaux Presence (optionnel mais recommandé)

Dans Pusher Dashboard → App Settings :
1. Cochez "Enable client events" si vous voulez les indicateurs de frappe
2. Assurez-vous que "Presence channels" est activé

## Fonctionnalités implémentées

### ✅ Messages en temps réel
- Les messages apparaissent instantanément chez tous les participants
- Mise à jour optimiste côté UI

### ✅ Indicateurs de présence
- Liste des membres en ligne
- Badge "Live" / "Hors ligne" 
- Avatars des membres connectés

### ✅ Indicateurs de frappe
- "X écrit..." affiché quand quelqu'un tape
- Timeout automatique après 3 secondes d'inactivité

### ✅ Isolation par club
- Chaque club a ses propres canaux
- Un joueur ne peut pas accéder aux canaux d'un autre club

## Structure des fichiers

```
src/
├── lib/pusher/
│   ├── server.ts      # Configuration serveur + broadcast
│   └── client.ts      # Configuration client
├── hooks/
│   └── use-pusher-chat.ts  # Hook React pour le chat
├── app/api/
│   ├── pusher/auth/route.ts     # Auth pour canaux presence
│   └── chat/
│       ├── typing/route.ts      # Indicateurs de frappe
│       └── [roomId]/messages/route.ts  # Messages (GET/POST)
└── components/chat/
    └── chat-room.tsx   # Composant UI du chat
```

## Événements Pusher

| Événement | Description |
|-----------|-------------|
| `new-message` | Nouveau message envoyé |
| `message-edited` | Message modifié |
| `message-deleted` | Message supprimé |
| `user-typing` | Utilisateur en train d'écrire |
| `user-stopped-typing` | Utilisateur a arrêté d'écrire |
| `pusher:member_added` | Membre rejoint le salon |
| `pusher:member_removed` | Membre quitte le salon |

## Mode dégradé

Si Pusher n'est pas configuré ou indisponible :
- Le chat fonctionne toujours via polling (toutes les 5 secondes)
- Un badge "Hors ligne" s'affiche
- Les messages sont envoyés et reçus, mais avec un délai

## Limites du plan gratuit Pusher

- 200 000 messages/jour
- 100 connexions simultanées max
- Suffisant pour un club de tennis typique

## Dépannage

### "Pusher non configuré"
→ Vérifiez les variables d'environnement Netlify et redéployez

### "Erreur de souscription"
→ Vérifiez que `PUSHER_SECRET` est correct côté serveur

### Les messages n'arrivent pas en temps réel
→ Vérifiez les logs Pusher Dashboard → Debug Console

### "Non authentifié" sur les canaux presence
→ L'utilisateur doit être connecté avec une session valide
