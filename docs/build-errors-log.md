# 📋 Journal des erreurs de build Netlify - TennisMatchFinder

Ce document recense toutes les erreurs de build rencontrées et leurs solutions. 
**Consulter avant chaque modification** pour éviter de répéter les mêmes erreurs.

---

## Erreur #1 : Module 'dotenv' non trouvé (local)

**Date** : 23 décembre 2025
**Contexte** : Exécution d'un script Node.js local
**Message d'erreur** :
```
Error: Cannot find module 'dotenv'
```

**Cause** : Le package `dotenv` n'est pas installé dans le projet
**Solution** : Utiliser directement les variables d'environnement ou charger le fichier `.env.local` manuellement

---

## Erreur #2 : Colonne 'user_id' inexistante

**Date** : 23 décembre 2025
**Contexte** : Requête SQL sur la table `players`
**Message d'erreur** :
```
NeonDbError: column "user_id" does not exist
```

**Cause** : La table `players` utilise `id` comme clé primaire liée à l'utilisateur, pas `user_id`
**Solution** : Utiliser `id` au lieu de `user_id` dans les requêtes

---

## Erreur #3 : Colonne 'id' inexistante dans sessions

**Date** : 23 décembre 2025
**Contexte** : Insertion manuelle d'une session
**Message d'erreur** :
```
NeonDbError: column "id" of relation "sessions" does not exist
```

**Cause** : La table `sessions` n'a pas de colonne `id`, seulement `session_token`, `user_id`, `expires`
**Solution** : Utiliser `session_token` comme identifiant unique

---

## Erreur #4 : Composant Select manquant

**Date** : 24 décembre 2025
**Contexte** : Build Netlify
**Message d'erreur** :
```
Module not found: Can't resolve '@/components/ui/select'
in './src/components/profile/profile-edit-form.tsx'
```

**Cause** : Le fichier `src/components/ui/select.tsx` n'existait pas
**Solution** : Créer le composant Select avec shadcn/ui et Radix UI
**Commit** : `f657242`

```tsx
// src/components/ui/select.tsx
import * as SelectPrimitive from '@radix-ui/react-select';
// ... composant complet
```

---

## Erreur #5 : Propriété 'senderName' inexistante sur ChatMessage

**Date** : 24 décembre 2025
**Contexte** : Build Netlify
**Message d'erreur** :
```
./src/app/(dashboard)/chat/page.tsx:124:76
Property 'senderName' does not exist on type '{ metadata: unknown; id: string; 
createdAt: Date; content: string; roomId: string; senderId: string | null; 
messageType: string; isEdited: boolean; editedAt: Date | null; }'
```

**Cause** : 
- `getClubSectionsWithUnread` retourne `lastMessage` de type `ChatMessage`
- `ChatMessage` ne contient pas `senderName` (c'est un champ `senderId` UUID)
- La page chat tentait d'accéder à `section.lastMessage.senderName`

**Solution** :
1. Modifier `getClubSectionsWithUnread` pour faire un LEFT JOIN avec `players`
2. Créer un type `LastMessageWithSender` qui étend `ChatMessage` avec `senderName`
3. Ajouter un fallback dans la page : `section.lastMessage.senderName ?? 'Membre'`

**Commit** : `77bc498`

**Fichiers modifiés** :
- `src/lib/db/queries.ts` - Ajout du JOIN et du type
- `src/app/(dashboard)/chat/page.tsx` - Fallback avec `??`

```typescript
// src/lib/db/queries.ts
export type LastMessageWithSender = ChatMessage & { senderName?: string };

// Dans getClubSectionsWithUnread:
const lastMsgWithSender = await db
  .select({
    id: chatMessages.id,
    roomId: chatMessages.roomId,
    senderId: chatMessages.senderId,
    content: chatMessages.content,
    messageType: chatMessages.messageType,
    metadata: chatMessages.metadata,
    isEdited: chatMessages.isEdited,
    editedAt: chatMessages.editedAt,
    createdAt: chatMessages.createdAt,
    senderName: players.fullName,
  })
  .from(chatMessages)
  .leftJoin(players, eq(chatMessages.senderId, players.id))
  .where(eq(chatMessages.roomId, section.id))
  .orderBy(desc(chatMessages.createdAt))
  .limit(1);
```

---

## Erreur #6 : Type JSONB 'unknown' incompatible

**Date** : 24 décembre 2025
**Contexte** : Build Netlify
**Message d'erreur** :
```
./src/app/(dashboard)/profil/modifier/page.tsx:30:24
Type error: Type 'PlayerWithClub' is not assignable to type 'PlayerData'.
  Types of property 'availability' are incompatible.
    Type 'unknown' is not assignable to type '{ days?: string[] | undefined; 
    timeSlots?: string[] | undefined; } | null'.
```

**Cause** : 
- Les colonnes `availability` et `preferences` sont de type `jsonb` dans PostgreSQL
- Drizzle ORM infère ces colonnes comme `unknown`
- Le composant `ProfileEditForm` s'attendait à un type structuré spécifique

**Solution** :
1. Changer le type de `availability` et `preferences` dans `PlayerData` en `unknown`
2. Créer des fonctions helper pour parser les données JSONB en toute sécurité
3. Parser les données dans le composant avant utilisation

**Commit** : `4af6957`

**Code** :
```typescript
// src/components/profile/profile-edit-form.tsx

// Helper pour parser les données JSONB
function parseAvailability(data: unknown): AvailabilityData {
  if (!data || typeof data !== 'object') return { days: [], timeSlots: [] };
  const obj = data as Record<string, unknown>;
  return {
    days: Array.isArray(obj.days) ? obj.days as string[] : [],
    timeSlots: Array.isArray(obj.timeSlots) ? obj.timeSlots as string[] : [],
  };
}

function parsePreferences(data: unknown): PreferencesData {
  if (!data || typeof data !== 'object') return { gameTypes: [], surfaces: [] };
  const obj = data as Record<string, unknown>;
  return {
    gameTypes: Array.isArray(obj.gameTypes) ? obj.gameTypes as string[] : [],
    surfaces: Array.isArray(obj.surfaces) ? obj.surfaces as string[] : [],
  };
}

interface PlayerData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  selfAssessedLevel: string;
  availability: unknown; // JSONB retourne unknown
  preferences: unknown;  // JSONB retourne unknown
}

// Dans le composant:
const availability = parseAvailability(player.availability);
const preferences = parsePreferences(player.preferences);
```

---

## 🔧 Règles générales pour éviter les erreurs

### Types JSONB avec Drizzle ORM
- Les colonnes `jsonb` sont inférées comme `unknown`
- **Toujours** créer des helpers de parsing avec validation de type
- Ne jamais supposer la structure, toujours vérifier avec `typeof` et `Array.isArray`

### Composants UI manquants
- Vérifier que tous les composants importés existent
- Après `shadcn add`, vérifier que le fichier a été créé
- Committer les nouveaux composants immédiatement

### Relations entre tables
- Quand un champ calculé est nécessaire (ex: `senderName`), faire un JOIN
- Créer un type étendu pour les données enrichies
- Toujours avoir un fallback pour les valeurs potentiellement nulles

### Schéma de base de données
- Toujours vérifier les noms de colonnes exacts avant d'écrire des requêtes
- Utiliser `\d table_name` ou inspecter le schéma Drizzle

---

## 📊 Statistique des erreurs

| Catégorie | Nombre | Solution type |
|-----------|--------|---------------|
| Module manquant | 2 | Créer/installer le module |
| Type incompatible | 2 | Parser/adapter les types |
| Colonne inexistante | 2 | Vérifier le schéma |

---

## 🔄 Dernière mise à jour

**Date** : 24 décembre 2025
**Dernier commit** : `4af6957`
**Build status** : En attente de vérification
