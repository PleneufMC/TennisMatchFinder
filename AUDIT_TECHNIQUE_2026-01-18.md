# Audit Technique Complet — TennisMatchFinder

**Date** : 18 janvier 2026  
**Repository** : https://github.com/PleneufMC/TennisMatchFinder  
**Production** : https://tennismatchfinder.net  
**Auditeur** : Claude AI, Senior Full-Stack Developer  

---

## Executive Summary

### Score Santé Global : 75/100

Le projet TennisMatchFinder est une application SaaS bien structurée avec une architecture Next.js 14 moderne. Le code est généralement de bonne qualité avec un typage TypeScript strict. Cependant, plusieurs problèmes de sécurité, de performance et de maintenabilité nécessitent une attention immédiate.

### 🔴 Top 5 Problèmes Critiques

| # | Problème | Impact | Fichier(s) |
|---|----------|--------|------------|
| 1 | **Injection SQL potentielle** dans CRON auto-validate | Sécurité critique | `src/app/api/cron/auto-validate-matches/route.ts` |
| 2 | **Double webhook Stripe** - 2 endpoints avec logique dupliquée | Cohérence/Bugs | `src/app/api/stripe/webhook/route.ts` et `src/app/api/webhooks/stripe/route.ts` |
| 3 | **Logs de debug en production** avec données sensibles (sessions) | Sécurité/RGPD | `src/lib/auth.ts` |
| 4 | **N+1 queries** sur les pages matchs et admin | Performance | `src/app/api/matches/route.ts` |
| 5 | **Vulnérabilités npm** - 7 failles (3 high, 4 moderate) | Sécurité | `package.json` |

### ✅ Top 5 Quick Wins

| # | Amélioration | Effort | Impact |
|---|--------------|--------|--------|
| 1 | Remplacer les raw SQL par des queries Drizzle paramétrées | 30 min | Sécurité |
| 2 | Supprimer les `console.log` sensibles en production | 15 min | Sécurité |
| 3 | Consolider les 2 webhooks Stripe en 1 | 1h | Maintenabilité |
| 4 | Corriger les 7 casts `as any` identifiés | 30 min | Typage |
| 5 | Mettre à jour `drizzle-kit` pour corriger les vulnérabilités | 15 min | Sécurité |

---

## 1. Analyse Architecture

### 1.1 Structure du Projet

**Score : 85/100** ✅

La structure suit les conventions Next.js 14 App Router :

```
src/
├── app/                    # 298 fichiers TypeScript
│   ├── (auth)/            # 5 pages auth
│   ├── (dashboard)/       # 24 pages dashboard
│   ├── (public)/          # 8 pages publiques
│   └── api/               # 68 routes API
├── components/            # ~100 composants React
├── lib/                   # 15 modules métier
├── hooks/                 # 3 hooks personnalisés
└── types/                 # 7 fichiers de types
```

**Points positifs :**
- ✅ Séparation claire des responsabilités (lib/, components/, app/)
- ✅ Groupes de routes pour l'organisation ((auth), (dashboard), (public))
- ✅ Modules métier bien isolés (elo/, stripe/, tournaments/)
- ✅ Pattern Server Components utilisé correctement

**Points d'amélioration :**
- ⚠️ Certains composants de 400+ lignes à découper (ex: `tournament-bracket.tsx`)
- ⚠️ Pas de dossier `__tests__` ni de tests unitaires existants

### 1.2 Conventions de Nommage

**Score : 90/100** ✅

- ✅ Fichiers en kebab-case cohérent
- ✅ Composants React en PascalCase
- ✅ Types avec préfixe explicite (ex: `PlayerWithClub`, `MatchEloResult`)
- ⚠️ Quelques incohérences : `BadgeCard.tsx` vs `badge-card.tsx` (doublon)

### 1.3 Patterns Utilisés

| Pattern | Utilisation | Évaluation |
|---------|-------------|------------|
| Server Components | Pages dashboard | ✅ Correct |
| Route Handlers | 68 APIs | ✅ Correct |
| Server Actions | Non utilisé | Opportunité manquée |
| Lazy initialization | Stripe, Pusher | ✅ Excellente pratique |
| React Query | Non utilisé | ⚠️ Caching manuel |

---

## 2. Qualité du Code

### 2.1 Typage TypeScript

**Score : 80/100**

**Configuration TypeScript (tsconfig.json) :**
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

✅ Configuration stricte excellente !

**Problèmes identifiés :**

| Type | Count | Fichiers concernés |
|------|-------|-------------------|
| `as any` casts | 7 | auth.ts, queries.ts, webhook, etc. |
| `any[]` variables | 3 | match-now/route.ts, tournaments/route.ts |
| `any` implicites | 0 | ✅ Aucun grâce au mode strict |

**Code problématique #1 - auth.ts (lignes 475-486):**
```typescript
// ❌ Mauvais : cast as any répété
(session.user as any).player = playerData;
(session.user as any).player = null;
```

**Solution proposée :**
```typescript
// ✅ Étendre le type Session dans next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      player?: PlayerSession | null;
    };
  }
}
```

### 2.2 Gestion des Erreurs

**Score : 75/100**

**Points positifs :**
- ✅ Try/catch dans toutes les routes API
- ✅ Messages d'erreur français pour le client
- ✅ Logging des erreurs côté serveur

**Points d'amélioration :**
- ⚠️ Pas d'Error Boundaries React implémentés
- ⚠️ Certaines erreurs exposent le stack en dev (lignes 106-107 tournaments/route.ts)
- ⚠️ Pas de monitoring d'erreurs (Sentry non configuré)

### 2.3 Validation des Entrées API

**Score : 70/100**

**Zod est partiellement utilisé :**

| Module | Validation Zod | Status |
|--------|---------------|--------|
| Auth | ✅ Complet | `src/lib/validations/auth.ts` |
| Forum | ✅ Complet | `src/lib/validations/forum.ts` |
| Profile | ✅ Complet | `src/lib/validations/profile.ts` |
| Matches | ⚠️ Partiel | Validation manuelle |
| Tournaments | ❌ Absent | Validation manuelle dans route |
| Chat | ❌ Absent | Validation manuelle dans route |

**Exemple de validation manuelle à risque (matches/route.ts:122-124) :**
```typescript
// ❌ Validation manuelle incomplète
if (!opponentId || !winnerId || !score) {
  return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
}
// Pas de validation du format du score, des UUIDs, etc.
```

### 2.4 Code Dupliqué

**Problème majeur : Double webhook Stripe**

Deux fichiers quasi-identiques gèrent les webhooks Stripe :
1. `src/app/api/stripe/webhook/route.ts` (179 lignes)
2. `src/app/api/webhooks/stripe/route.ts` (177 lignes)

**Impact :** Risque de traitement double des événements, divergence de logique.

---

## 3. Sécurité

### 3.1 Score Sécurité Global : 65/100 ⚠️

### 3.2 Problèmes Critiques

#### P0-SEC-1 : Injection SQL

**Fichier :** `src/app/api/cron/auto-validate-matches/route.ts` (lignes 88-104)

```typescript
// ❌ CRITIQUE : Injection SQL via string interpolation
await db.execute(
  `UPDATE players SET 
    matches_played = matches_played + 1, 
    wins = wins + ${player1Stats.wins},
    losses = losses + ${player1Stats.losses},
    last_match_at = NOW()
  WHERE id = '${match.player1Id}'`  // UUID non échappé !
);
```

Bien que `player1Stats` soit contrôlé (0 ou 1), `match.player1Id` vient de la DB et pourrait être manipulé dans un scénario d'attaque avancé.

**Solution :**
```typescript
// ✅ Utiliser les méthodes Drizzle
await db
  .update(players)
  .set({
    matchesPlayed: sql`${players.matchesPlayed} + 1`,
    wins: sql`${players.wins} + ${player1Stats.wins}`,
    losses: sql`${players.losses} + ${player1Stats.losses}`,
    lastMatchAt: new Date(),
  })
  .where(eq(players.id, match.player1Id));
```

#### P0-SEC-2 : Logs Sensibles en Production

**Fichier :** `src/lib/auth.ts` (lignes 386-489)

```typescript
// ❌ Logs avec données sensibles en production
console.log('[Auth Session] START - token:', JSON.stringify({ 
  id: token.id, sub: token.sub, email: token.email 
}));
console.log('[Auth Session] Player found:', { 
  id: player.id, fullName: player.fullName, clubId: player.clubId 
});
```

**Impact :** Fuite potentielle de PII dans les logs Netlify.

**Solution :**
```typescript
// ✅ Logs conditionnels
if (process.env.NODE_ENV === 'development') {
  console.log('[Auth Session] Token:', { id: token.id });
}
```

### 3.3 Authentification & Autorisations

**NextAuth Configuration :**

| Aspect | Implémentation | Score |
|--------|---------------|-------|
| Strategy | JWT | ✅ Approprié pour serverless |
| Session maxAge | 30 jours | ⚠️ Long (recommandé: 7 jours) |
| CSRF Protection | Par défaut NextAuth | ✅ |
| Secure cookies | Auto (HTTPS détecté) | ✅ |

**Vérification des autorisations :**

| Route | Auth | Club Isolation | Admin Check |
|-------|------|---------------|-------------|
| `/api/matches` | ✅ | ✅ | N/A |
| `/api/admin/*` | ✅ | ✅ | ✅ |
| `/api/cron/*` | ✅ CRON_SECRET | N/A | N/A |
| `/api/webhooks/n8n-bot` | ✅ Secret | ✅ | N/A |

### 3.4 Headers de Sécurité (netlify.toml)

**Configuration actuelle :**
```toml
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
X-XSS-Protection = "1; mode=block"
Referrer-Policy = "strict-origin-when-cross-origin"
Permissions-Policy = "camera=(), microphone=(), geolocation=()"
Content-Security-Policy = "frame-ancestors 'none'; ..."
```

✅ **Excellent !** Configuration complète et sécurisée.

**Manquant :**
- ❌ Strict-Transport-Security (HSTS) - Important pour forcer HTTPS

**Ajout recommandé :**
```toml
Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
```

### 3.5 Isolation Multi-Tenant

**Score : 85/100** ✅

- ✅ `clubId` présent sur toutes les tables concernées
- ✅ Vérification systématique dans les routes API
- ✅ Filtre club dans les queries de chat, forum, matchs
- ⚠️ Pas de RLS au niveau PostgreSQL (isolation côté application uniquement)

---

## 4. Performance

### 4.1 Score Performance : 70/100

### 4.2 Queries N+1

**Problème identifié dans `/api/matches/route.ts` (lignes 64-87) :**

```typescript
// ❌ N+1 : 2 queries par match
const enrichedMatches = await Promise.all(
  playerMatches.map(async (match) => {
    const [player1, player2] = await Promise.all([
      db.select(...).from(players).where(eq(players.id, match.player1Id)),
      db.select(...).from(players).where(eq(players.id, match.player2Id)),
    ]);
    // ...
  })
);
```

**Impact :** Pour 20 matchs = 40 queries supplémentaires.

**Solution avec JOIN :**
```typescript
// ✅ Une seule query avec JOINs
const enrichedMatches = await db
  .select({
    match: matches,
    player1: {
      fullName: sql<string>`p1.full_name`,
      avatarUrl: sql<string | null>`p1.avatar_url`,
    },
    player2: {
      fullName: sql<string>`p2.full_name`,
      avatarUrl: sql<string | null>`p2.avatar_url`,
    },
  })
  .from(matches)
  .innerJoin(sql`players p1`, sql`p1.id = ${matches.player1Id}`)
  .innerJoin(sql`players p2`, sql`p2.id = ${matches.player2Id}`)
  .where(whereCondition)
  .orderBy(desc(matches.playedAt))
  .limit(limit);
```

### 4.3 Indexes Base de Données

**Indexes définis dans schema.ts :**

| Table | Indexes | Évaluation |
|-------|---------|------------|
| players | clubId, currentElo | ✅ Suffisant |
| matches | clubId, player1Id, player2Id, playedAt, autoValidateAt | ✅ Complet |
| forum_threads | clubId, category, createdAt | ✅ |
| chat_messages | roomId, senderId, createdAt | ✅ |
| subscriptions | userId, stripeCustomerId, stripeSubscriptionId, status | ✅ Complet |

**Index manquant potentiel :**
- `elo_history` : Index composite sur `(playerId, recordedAt)` pour les requêtes de tendance

### 4.4 Caching

| Type | Implémentation | Recommandation |
|------|---------------|----------------|
| HTTP Cache | ❌ Non configuré pour les données | Ajouter `Cache-Control` sur GET |
| React Query | ❌ Non utilisé | Recommandé pour le dashboard |
| ISR/SSG | ❌ Non utilisé | Possible pour landing/pricing |

### 4.5 Bundle Size

**Configuration next.config.js :**
```javascript
experimental: {
  optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
}
```

✅ Optimisation des imports activée.

---

## 5. Maintenabilité

### 5.1 Score Maintenabilité : 65/100

### 5.2 Tests

**Score Tests : 0/100** ❌

**Constat :**
- Aucun test unitaire trouvé dans `src/`
- Jest configuré mais non utilisé
- Module ELO critique sans tests malgré le script `test:elo`

**Impact :** Risque élevé de régression sur les calculs ELO et la logique métier.

**Recommandation prioritaire :** Ajouter des tests pour :
1. `src/lib/elo/calculator.ts` - Calculs ELO
2. `src/lib/elo/modifiers.ts` - Modificateurs
3. `src/lib/stripe/subscription.ts` - Gestion abonnements

### 5.3 Documentation

| Document | Status | Qualité |
|----------|--------|---------|
| README.md | ✅ | 8/10 - Complet |
| CLAUDE.md | ✅ | 9/10 - Excellent guide dev |
| API Documentation | ❌ | Non existante |
| Inline Comments | ⚠️ | Sporadique |

### 5.4 Dépendances

**npm audit résultats :**

```
7 vulnerabilities (4 moderate, 3 high)

esbuild  <=0.24.2 (moderate)
glob  10.2.0 - 10.4.5 (high)
```

**Dépendances à mettre à jour :**

| Package | Version actuelle | Vulnérabilité | Fix |
|---------|-----------------|---------------|-----|
| drizzle-kit | 0.30.1 | esbuild dependency | 0.31.8+ |
| eslint-config-next | 14.2.35 | glob dependency | 16.1.3+ |

### 5.5 ESLint Configuration

**Configuration actuelle :**
```json
{"extends": "next/core-web-vitals"}
```

⚠️ **Minimal** - Recommandé d'ajouter des règles TypeScript et React strictes.

---

## 6. Points Spécifiques Audités

### 6.1 Système ELO (`src/lib/elo/`)

**Score : 85/100** ✅

**Architecture :**
- `calculator.ts` - Calcul principal (413 lignes)
- `modifiers.ts` - Bonus/malus (247 lignes)
- `types.ts` - Types partagés (89 lignes)
- `format-coefficients.ts` - Coefficients par format

**Points positifs :**
- ✅ Formule ELO standard correctement implémentée
- ✅ K-Factor dynamique selon expérience
- ✅ Modificateurs innovants (nouvel adversaire, diversité)
- ✅ Protection contre ELO négatif (`Math.max(100, ...)`)

**Edge cases vérifiés :**

| Cas | Gestion | Code |
|-----|---------|------|
| ELO négatif | ✅ Protégé | `Math.max(100, loserElo + loserDelta)` |
| ELO overflow | ✅ Borné | `MAX_ELO: 3000` (types.ts:27) |
| Division par zéro | ✅ N/A | Formule ne divise pas par ELO |
| Même joueur vs lui-même | ⚠️ Non vérifié | À ajouter côté API |

**Amélioration suggérée :**
```typescript
// Dans matches/route.ts, ajouter :
if (opponentId === player.id) {
  return NextResponse.json({ error: 'Impossible de jouer contre soi-même' }, { status: 400 });
}
```

### 6.2 Authentification NextAuth

**Fichier :** `src/lib/auth.ts` (521 lignes)

**Points positifs :**
- ✅ Custom Drizzle Adapter bien implémenté
- ✅ Support Passkey (WebAuthn) moderne
- ✅ Fallback gracieux si email non configuré
- ✅ JWT avec enrichissement player data

**Points d'attention :**

| Aspect | Observation | Recommandation |
|--------|-------------|----------------|
| Session callback | 2 queries DB par appel | Considérer caching |
| Debug logging | 37 console.log | Supprimer en prod |
| Email fallback | Silencieux si misconfigured | Alerter l'admin |

### 6.3 Chat Temps Réel (Pusher)

**Score : 80/100** ✅

**Sécurité des channels :**
```typescript
// ✅ Vérification appartenance club (pusher/auth/route.ts:58-69)
if (channelClubId && channelClubId !== player.clubId) {
  return NextResponse.json({ error: 'Vous n\'appartenez pas à ce club' }, { status: 403 });
}
```

**Gestion reconnexion (client.ts) :**
```typescript
// ✅ Logging des erreurs de connexion
channel.bind('pusher:subscription_error', (err) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Subscription error:', err);
  }
});
```

**Manquant :**
- ⚠️ Pas de rate limiting sur les messages
- ⚠️ Pas de pagination pour les messages historiques (limite fixe 100)

### 6.4 Intégration Stripe

**Score : 75/100**

**Points positifs :**
- ✅ Lazy initialization (évite erreurs build)
- ✅ Signature webhook vérifiée
- ✅ Gestion des états subscription complète

**Problèmes :**

1. **Double webhook endpoint** (P0 déjà mentionné)

2. **Non-null assertion risquée :**
```typescript
// ❌ webhookSecret! peut crash si non défini
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
```

**Solution :**
```typescript
// ✅ Vérification explicite
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
}
```

3. **Idempotency non implémentée :**
Les webhooks peuvent être rejoués par Stripe. Risque de double traitement.

**Solution :**
```typescript
// Ajouter une table processed_stripe_events ou vérifier idempotency_key
```

---

## 7. Problèmes Identifiés

| ID | Sévérité | Domaine | Description | Fichier(s) | Effort |
|----|----------|---------|-------------|------------|--------|
| P0-SEC-1 | 🔴 Critique | Sécurité | Injection SQL dans CRON | cron/auto-validate-matches/route.ts | 1h |
| P0-SEC-2 | 🔴 Critique | Sécurité | Logs sensibles en production | lib/auth.ts | 30min |
| P0-DUP-1 | 🔴 Critique | Architecture | Double webhook Stripe | api/stripe/webhook + api/webhooks/stripe | 2h |
| P1-PERF-1 | 🟠 Important | Performance | N+1 queries sur matchs | api/matches/route.ts | 2h |
| P1-SEC-3 | 🟠 Important | Sécurité | HSTS header manquant | netlify.toml | 15min |
| P1-DEP-1 | 🟠 Important | Sécurité | 7 vulnérabilités npm | package.json | 30min |
| P1-TYPE-1 | 🟠 Important | Qualité | 7 casts `as any` | auth.ts, queries.ts, webhooks | 1h |
| P2-TEST-1 | 🟡 Amélioration | Qualité | Aucun test unitaire | src/ | 8h |
| P2-VALID-1 | 🟡 Amélioration | Sécurité | Validation Zod incomplète | matches, tournaments, chat | 4h |
| P2-PERF-2 | 🟡 Amélioration | Performance | Pas de caching React Query | components/ | 4h |
| P3-DOC-1 | 🟢 Nice-to-have | Maintenabilité | Pas de doc API | - | 8h |
| P3-LOG-1 | 🟢 Nice-to-have | Observabilité | Pas de monitoring (Sentry) | - | 2h |

---

## 8. Recommandations Priorisées

### P0 - Critique (à corriger immédiatement)

#### 8.1 Corriger l'injection SQL dans auto-validate-matches

**Fichier :** `src/app/api/cron/auto-validate-matches/route.ts`

**Code actuel (lignes 88-104) :**
```typescript
await db.execute(
  `UPDATE players SET 
    matches_played = matches_played + 1, 
    wins = wins + ${player1Stats.wins},
    losses = losses + ${player1Stats.losses},
    last_match_at = NOW()
  WHERE id = '${match.player1Id}'`
);
```

**Code corrigé :**
```typescript
import { sql } from 'drizzle-orm';

// Remplacer les deux db.execute par :
await db
  .update(players)
  .set({
    matchesPlayed: sql`${players.matchesPlayed} + 1`,
    wins: sql`${players.wins} + ${player1Stats.wins}`,
    losses: sql`${players.losses} + ${player1Stats.losses}`,
    lastMatchAt: new Date(),
  })
  .where(eq(players.id, match.player1Id));

await db
  .update(players)
  .set({
    matchesPlayed: sql`${players.matchesPlayed} + 1`,
    wins: sql`${players.wins} + ${player2Stats.wins}`,
    losses: sql`${players.losses} + ${player2Stats.losses}`,
    lastMatchAt: new Date(),
  })
  .where(eq(players.id, match.player2Id));
```

#### 8.2 Supprimer les logs sensibles en production

**Fichier :** `src/lib/auth.ts`

**Code actuel :**
```typescript
console.log('[Auth JWT] Trigger:', trigger, 'User:', user?.id, 'Token sub:', token.sub);
console.log('[Auth Session] START - token:', JSON.stringify({ id: token.id, sub: token.sub, email: token.email }));
// ... 10+ autres console.log
```

**Code corrigé :**
```typescript
// Ajouter en haut du fichier
const isDev = process.env.NODE_ENV === 'development';

// Wrapper les logs
if (isDev) {
  console.log('[Auth JWT] Trigger:', trigger, 'User:', user?.id);
}
```

Ou mieux, utiliser un logger conditionnel :
```typescript
const logger = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  error: console.error, // Toujours logger les erreurs
};
```

#### 8.3 Supprimer le webhook Stripe dupliqué

**Action :** Supprimer `src/app/api/webhooks/stripe/route.ts`

**Vérifier :** 
1. Le endpoint configuré dans Stripe Dashboard
2. Mettre à jour si nécessaire vers `/api/stripe/webhook`

### P1 - Important (sprint suivant)

#### 8.4 Corriger les N+1 queries

Voir solution détaillée section 4.2.

#### 8.5 Ajouter HSTS header

**Fichier :** `netlify.toml`

```toml
[[headers]]
  for = "/*"
  [headers.values]
    # ... headers existants ...
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
```

#### 8.6 Mettre à jour les dépendances vulnérables

```bash
# Mettre à jour drizzle-kit (fix esbuild)
npm install drizzle-kit@latest

# Ou si breaking changes :
npm audit fix --force
```

#### 8.7 Corriger les casts `as any`

**Fichier :** `src/types/next-auth.d.ts`

```typescript
import 'next-auth';
import type { SubscriptionTier } from '@/lib/db/schema';

interface PlayerSession {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
  clubId: string | null;
  city: string | null;
  clubName: string;
  clubSlug: string;
  isAdmin: boolean;
  isVerified: boolean;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      player?: PlayerSession | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    player?: PlayerSession | null;
  }
}
```

Puis dans `auth.ts`, remplacer :
```typescript
// ❌ Avant
(session.user as any).player = playerData;

// ✅ Après
session.user.player = playerData;
```

### P2 - Amélioration (backlog)

#### 8.8 Ajouter des tests unitaires pour le système ELO

**Fichier à créer :** `src/lib/elo/__tests__/calculator.test.ts`

```typescript
import { calculateEloChange, calculateExpectedScore, getKFactor } from '../calculator';

describe('ELO Calculator', () => {
  describe('calculateExpectedScore', () => {
    it('should return 0.5 for equal ELOs', () => {
      expect(calculateExpectedScore(1200, 1200)).toBe(0.5);
    });

    it('should return ~0.76 for 200 ELO advantage', () => {
      const expected = calculateExpectedScore(1400, 1200);
      expect(expected).toBeCloseTo(0.76, 1);
    });
  });

  describe('getKFactor', () => {
    it('should return 40 for new players (<10 matches)', () => {
      expect(getKFactor(5)).toBe(40);
    });

    it('should return 32 for intermediate players (10-30 matches)', () => {
      expect(getKFactor(20)).toBe(32);
    });

    it('should return 24 for established players (>30 matches)', () => {
      expect(getKFactor(50)).toBe(24);
    });
  });

  describe('calculateEloChange', () => {
    it('should calculate basic ELO change correctly', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'two_sets',
      });

      expect(result.winnerDelta).toBeGreaterThan(0);
      expect(result.loserDelta).toBeLessThan(0);
    });

    it('should apply new opponent bonus', () => {
      const withBonus = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'two_sets',
        isNewOpponent: true,
      });

      const withoutBonus = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'two_sets',
        isNewOpponent: false,
      });

      expect(withBonus.winnerDelta).toBeGreaterThan(withoutBonus.winnerDelta);
    });

    it('should never return negative ELO', () => {
      const result = calculateEloChange({
        winnerElo: 1500,
        loserElo: 100, // Very low ELO
        winnerMatchCount: 30,
        loserMatchCount: 5,
        matchFormat: 'three_sets',
      });

      // Le loser delta devrait être borné pour éviter ELO < 100
      expect(100 + result.loserDelta).toBeGreaterThanOrEqual(100);
    });
  });
});
```

#### 8.9 Ajouter validation Zod aux routes manquantes

**Fichier :** `src/lib/validations/match.ts`

Compléter avec :
```typescript
import { z } from 'zod';

export const createMatchSchema = z.object({
  opponentId: z.string().uuid('ID adversaire invalide'),
  winnerId: z.string().uuid('ID vainqueur invalide'),
  score: z.string()
    .min(3, 'Score trop court')
    .max(50, 'Score trop long')
    .regex(/^\d+-\d+(\s+\d+-\d+)*(\s+\(\d+-\d+\))?$/, 'Format de score invalide'),
  matchFormat: z.enum(['one_set', 'two_sets', 'two_sets_super_tb', 'three_sets', 'super_tiebreak']).optional(),
  gameType: z.enum(['simple', 'double']).optional(),
  surface: z.enum(['terre battue', 'dur', 'gazon', 'indoor']).optional().nullable(),
  playedAt: z.string().datetime('Date invalide'),
  notes: z.string().max(500, 'Notes trop longues').optional().nullable(),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
```

### P3 - Nice-to-have (opportuniste)

- Ajouter Sentry pour le monitoring d'erreurs
- Générer une documentation API avec Swagger/OpenAPI
- Implémenter React Query pour le caching côté client
- Ajouter des Error Boundaries React

---

## 9. Plan d'Action Technique

### Sprint 1 (Semaine 1-2) : Corrections Critiques

- [ ] **P0-SEC-1** - Corriger injection SQL dans auto-validate-matches - 1h
- [ ] **P0-SEC-2** - Supprimer logs sensibles en production - 30min
- [ ] **P0-DUP-1** - Consolider les webhooks Stripe - 2h
- [ ] **P1-SEC-3** - Ajouter HSTS header - 15min
- [ ] **P1-DEP-1** - Mettre à jour dépendances vulnérables - 30min

**Effort total : ~4h**

### Sprint 2 (Semaine 3-4) : Améliorations Importantes

- [ ] **P1-PERF-1** - Corriger N+1 queries sur matchs - 2h
- [ ] **P1-TYPE-1** - Corriger les 7 casts `as any` - 1h
- [ ] **P2-VALID-1** - Ajouter validation Zod manquante - 4h

**Effort total : ~7h**

### Sprint 3+ : Optimisations

- [ ] **P2-TEST-1** - Ajouter tests unitaires ELO - 4h
- [ ] **P2-TEST-2** - Ajouter tests Stripe - 4h
- [ ] **P2-PERF-2** - Implémenter React Query - 4h
- [ ] **P3-DOC-1** - Documenter l'API - 8h
- [ ] **P3-LOG-1** - Intégrer Sentry - 2h

**Effort total : ~22h**

### Dette Technique à Planifier

1. **Refactoring majeur :** Migrer vers Server Actions pour les mutations simples
2. **Tests E2E :** Ajouter Playwright pour les parcours critiques
3. **RLS PostgreSQL :** Implémenter l'isolation au niveau DB (vs application)
4. **Caching distribué :** Considérer Redis pour les sessions/cache si scale

---

## 10. Conclusion

TennisMatchFinder est un projet de bonne qualité globale avec une architecture moderne et des fonctionnalités innovantes (système ELO avec modificateurs). Les principales préoccupations sont :

1. **Sécurité** : L'injection SQL et les logs sensibles doivent être corrigés immédiatement
2. **Maintenabilité** : L'absence de tests est un risque majeur pour l'évolution du produit
3. **Performance** : Les N+1 queries impacteront l'expérience utilisateur à l'échelle

Pour une startup early-stage, les priorités doivent rester pragmatiques :
- ✅ Corriger les failles de sécurité (P0) - Obligatoire
- ✅ Améliorer la qualité (P1) - Recommandé
- ⚠️ Optimiser (P2/P3) - À planifier selon les ressources

**Prochaine étape recommandée :** Exécuter le Sprint 1 dans les 2 semaines.

---

*Audit réalisé le 18 janvier 2026*  
*Version du code : commit HEAD sur main*
