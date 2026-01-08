# CLAUDE.md - Guide de développement TennisMatchFinder

Ce fichier documente les conventions, erreurs courantes et bonnes pratiques pour ce projet.

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Base de données**: PostgreSQL (Neon) avec Drizzle ORM
- **Authentification**: NextAuth.js
- **Déploiement**: Netlify
- **Styling**: Tailwind CSS + shadcn/ui

---

## Erreurs Courantes à Éviter

### 1. Drizzle ORM - Vérification des résultats `.returning()`

**Problème**: TypeScript strict mode détecte que `.returning()` peut retourner un tableau vide, donc l'élément déstructuré peut être `undefined`.

**Erreur typique**:
```
Type error: 'newClub' is possibly 'undefined'.
```

**Code incorrect**:
```typescript
const [newClub] = await db
  .insert(clubs)
  .values({ name: 'Mon Club' })
  .returning();

// ERREUR: newClub peut être undefined
await db.insert(players).values({
  clubId: newClub.id,  // TypeScript erreur ici
});
```

**Code correct**:
```typescript
const [newClub] = await db
  .insert(clubs)
  .values({ name: 'Mon Club' })
  .returning();

// Toujours vérifier avant d'utiliser
if (!newClub) {
  return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
}

// Maintenant TypeScript sait que newClub est défini
await db.insert(players).values({
  clubId: newClub.id,
});
```

### 2. Drizzle ORM - Accès aux éléments de tableau après `.select()`

**Problème**: Même après vérification de `.length > 0`, TypeScript ne garantit pas que `array[0]` est défini.

**Code incorrect**:
```typescript
const existingUser = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

if (existingUser.length > 0) {
  // ERREUR: existingUser[0] peut être undefined selon TypeScript
  const userId = existingUser[0].id;
}
```

**Code correct**:
```typescript
const existingUser = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

const foundUser = existingUser[0];
if (foundUser) {
  // TypeScript sait que foundUser est défini
  const userId = foundUser.id;
}
```

### 3. Schéma Drizzle - Noms de champs corrects

**Problème**: Utiliser un nom de champ qui n'existe pas dans le schéma.

**Erreur typique**:
```
Type error: 'level' does not exist in type...
```

**Solution**: Toujours vérifier le schéma dans `src/lib/db/schema.ts` avant d'insérer des données.

Exemple pour la table `players`:
- ✅ `selfAssessedLevel` (correct)
- ❌ `level` (incorrect)

### 4. Regex Match - Vérification des groupes capturés

**Problème**: Les groupes de capture regex peuvent être `undefined`.

**Code incorrect**:
```typescript
const match = score.match(/^(\d)-(\d)$/);
if (!match) return false;

const [, g1, g2] = match;
// ERREUR: g1 et g2 peuvent être undefined
return parseInt(g1) > parseInt(g2);
```

**Code correct**:
```typescript
const match = score.match(/^(\d)-(\d)$/);
if (!match) return false;

const [, g1, g2] = match;
if (!g1 || !g2) return false;

return parseInt(g1) > parseInt(g2);
```

---

## Bonnes Pratiques

### API Routes

1. **Toujours vérifier l'authentification** en premier
2. **Valider les données d'entrée** avant traitement
3. **Vérifier les résultats de base de données** avant utilisation
4. **Retourner des erreurs explicites** avec les bons codes HTTP

```typescript
export async function POST(request: NextRequest) {
  // 1. Authentification
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // 2. Validation
  const body = await request.json();
  if (!body.requiredField) {
    return NextResponse.json({ error: 'Champ requis manquant' }, { status: 400 });
  }

  // 3. Opération DB avec vérification
  const [result] = await db.insert(table).values({...}).returning();
  if (!result) {
    return NextResponse.json({ error: 'Erreur création' }, { status: 500 });
  }

  // 4. Succès
  return NextResponse.json({ success: true, data: result });
}
```

### Commandes utiles

```bash
# Vérifier les types TypeScript avant commit
npx tsc --noEmit

# Lancer le build local pour tester
npm run build

# Générer les migrations Drizzle
npx drizzle-kit generate

# Appliquer les migrations
npx drizzle-kit migrate
```

---

## Structure du Projet

```
src/
├── app/
│   ├── api/           # Routes API
│   ├── (auth)/        # Pages authentification
│   ├── (dashboard)/   # Pages tableau de bord
│   └── (public)/      # Pages publiques (landing, CGU, etc.)
├── components/
│   ├── ui/            # Composants shadcn/ui
│   ├── layout/        # Sidebar, Header, Mobile Nav
│   ├── box-leagues/   # Composants Box Leagues
│   ├── match-now/     # Composants Match Now
│   ├── gamification/  # Badges, Achievements
│   ├── rivalries/     # Composants rivalités
│   ├── chat/          # Composants chat temps réel
│   └── ...            # Autres composants
├── lib/
│   ├── db/
│   │   ├── schema.ts  # Schéma Drizzle (SOURCE DE VÉRITÉ)
│   │   └── queries.ts # Requêtes réutilisables
│   ├── auth.ts        # Configuration NextAuth
│   ├── email/         # Envoi d'emails
│   ├── stripe/        # Configuration Stripe (lazy init)
│   ├── box-leagues/   # Service Box Leagues
│   ├── match-now/     # Service Match Now
│   ├── gamification/  # Service badges/achievements
│   └── elo/           # Calcul ELO avancé
└── hooks/             # Hooks React personnalisés
```

---

## Erreurs de Build Netlify (Next.js 14 App Router)

### 5. Route API - `export const config` dépréciée

**Problème**: Dans App Router, l'ancienne syntaxe Pages Router `export const config = { api: { bodyParser: false } }` n'est plus supportée.

**Erreur typique**:
```
Error: Page config in /src/app/api/stripe/webhook/route.ts is deprecated. 
Replace `export const config=…` with the following:
```

**Code incorrect**:
```typescript
// ❌ Syntaxe Pages Router (dépréciée)
export const config = {
  api: {
    bodyParser: false,
  },
};
```

**Code correct**:
```typescript
// ✅ App Router gère automatiquement le raw body via request.text()
export async function POST(request: NextRequest) {
  const body = await request.text(); // Raw body pour webhooks Stripe
  // ...
}
// Aucune config nécessaire - supprimer export const config
```

### 6. Initialisation au Build - Variables d'environnement manquantes

**Problème**: Les modules qui s'initialisent au top-level échouent si les variables d'environnement ne sont pas disponibles pendant le build.

**Erreur typique**:
```
Error: Neither apiKey nor config.authenticator provided
Error: DATABASE_URL environment variable is not set
```

**Code incorrect**:
```typescript
// ❌ Initialisation immédiate - échoue au build
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});
```

**Code correct**:
```typescript
// ✅ Lazy initialization - s'exécute seulement au runtime
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeInstance;
}

// Proxy pour compatibilité ascendante
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  // ...
};
```

### 7. Prérendu statique - Pages accédant à la DB

**Problème**: Next.js tente de prérender les pages au build. Si une page accède à la base de données, elle échoue.

**Erreur typique**:
```
Error occurred prerendering page "/register"
Error: DATABASE_URL environment variable is not set
```

**Code incorrect**:
```typescript
// ❌ Page Server Component sans export dynamic
export default async function RegisterPage() {
  const clubs = await db.select().from(clubs); // Échoue au build
  return <RegisterForm clubs={clubs} />;
}
```

**Code correct**:
```typescript
// ✅ Forcer le rendu dynamique
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const clubs = await db.select().from(clubs); // OK - exécuté au runtime
  return <RegisterForm clubs={clubs} />;
}
```

### 8. useSearchParams sans Suspense Boundary

**Problème**: Dans App Router, `useSearchParams()` nécessite un wrapper `<Suspense>` pour le CSR bailout.

**Erreur typique**:
```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/pricing"
```

**Code incorrect**:
```typescript
'use client';

export default function PricingPage() {
  const searchParams = useSearchParams(); // ❌ Erreur au build
  const canceled = searchParams.get('subscription') === 'canceled';
  // ...
}
```

**Code correct**:
```typescript
'use client';
import { Suspense } from 'react';

function PricingPageContent() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get('subscription') === 'canceled';
  // ... contenu de la page
}

// ✅ Wrapper avec Suspense
export default function PricingPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <PricingPageContent />
    </Suspense>
  );
}
```

---

## Checklist avant Commit

- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] `npm run build` réussit localement
- [ ] Tous les `.returning()` ont une vérification `if (!result)`
- [ ] Les accès `array[0]` sont vérifiés avec extraction dans une variable
- [ ] Les noms de champs correspondent au schéma `src/lib/db/schema.ts`
- [ ] Les regex matches vérifient les groupes capturés
- [ ] Pas de `export const config` dans les routes API App Router
- [ ] Services externes (Stripe, DB) utilisent lazy initialization
- [ ] Pages Server Component avec DB access ont `export const dynamic = 'force-dynamic'`
- [ ] Composants Client avec `useSearchParams` sont wrappés dans `<Suspense>`

## Checklist avant Déploiement Netlify

```bash
# Test de build avec variables factices pour valider
DATABASE_URL="postgresql://x:x@localhost:5432/x" \
STRIPE_SECRET_KEY="sk_test_x" \
npm run build
```

Si le build passe avec des variables factices, il passera sur Netlify avec les vraies variables.

---

## Features Implémentées

### Phase 1 : Pré-requis business ✅
- [x] Pages légales (CGU, Confidentialité, Mentions, Cookies)
- [x] Système de paiement Stripe (checkout, portail, webhooks)
- [x] Paywall features premium (3 tiers: Free, Premium, Pro)
- [x] Page pricing avec comparatif des plans

### Phase 2 : Gamification ✅
- [x] Système badges complet (16 badges)
  - First Blood, Match Veteran, Century Club, Match Machine
  - Serial Winner, Win Streak, Unstoppable, Comeback King
  - Rising Star, ELO Master, Giant Slayer, Social Butterfly
  - Variety Player, Iron Man, Early Bird, Club Regular
- [x] Attribution automatique via triggers
- [x] Page Achievements (`/achievements`)
- [x] API badges (`/api/badges`, `/api/gamification`)

### Phase 3 : Différenciation ✅
- [x] Explication ELO post-match (breakdown détaillé)
- [x] Mode "Match Now" (disponibilité instantanée)
  - Toggle disponibilité avec durée configurable
  - Liste joueurs disponibles avec filtres ELO
  - Système de réponses/notifications
- [x] Rivalités (page H2H dédiée `/rivalite/[playerId]/[opponentId]`)
  - Historique complet des confrontations
  - Stats H2H, séries, évolution ELO
- [x] Chat temps réel (Pusher)
  - Salons de club (sections)
  - Conversations privées
  - Indicateur de frappe

### Phase 4 : Compétitions 🟡 (En cours)
- [x] **Box Leagues mensuelles** (implémenté 8 jan 2026)
  - Schema DB : `box_leagues`, `box_league_participants`, `box_league_matches`
  - Service complet avec CRUD et round-robin
  - API Routes : listing, détail, inscription
  - UI : cards, tableau classement, liste matchs
  - Système promotion/relégation
  - Intégration ELO des résultats
- [ ] Tournois élimination directe
- [ ] Seeding automatique ELO
- [ ] Inscriptions tournois

---

## Modules et Services

### Box Leagues (`src/lib/box-leagues/`)

**Types** (`types.ts`):
- `BoxLeague` - Compétition mensuelle
- `BoxLeagueParticipant` - Inscription joueur avec stats
- `BoxLeagueMatch` - Match du round-robin
- `BoxLeagueStanding` - Classement avec tendance

**Service** (`service.ts`):
```typescript
// Création et gestion
createBoxLeague(params) // Créer une league
getBoxLeagueById(id)    // Récupérer une league
getBoxLeaguesByClub(clubId, filters) // Lister les leagues
updateBoxLeagueStatus(id, status)    // Changer statut

// Participants
registerParticipant(params)     // Inscrire un joueur
getLeagueParticipants(leagueId) // Liste participants
getLeagueStandings(leagueId)    // Classement calculé

// Matchs
generateLeagueMatches(leagueId) // Générer round-robin
getLeagueMatches(leagueId)      // Liste des matchs
recordMatchResult(params)       // Enregistrer résultat

// Finalisation
finalizeLeagueStandings(leagueId) // Calcul promo/relégation
```

**API Routes**:
- `GET /api/box-leagues` - Liste (filtres: status, my=true)
- `POST /api/box-leagues` - Créer (admin)
- `GET /api/box-leagues/[leagueId]` - Détail + standings + matchs
- `PATCH /api/box-leagues/[leagueId]` - Update statut (admin)
- `POST /api/box-leagues/[leagueId]/register` - Inscription joueur

### Match Now (`src/lib/match-now/`)

**Fonctionnalités**:
- Activer sa disponibilité (30min à 4h)
- Message personnalisé optionnel
- Filtres type de jeu (simple/double)
- Liste joueurs disponibles avec ELO
- Système de réponses

**API Routes**:
- `GET /api/match-now` - Ma dispo + joueurs disponibles
- `POST /api/match-now` - Activer disponibilité
- `DELETE /api/match-now` - Désactiver
- `POST /api/match-now/respond` - Répondre à une dispo

### Gamification (`src/lib/gamification/`)

**16 Badges disponibles**:
| Badge | Condition |
|-------|----------|
| First Blood | 1er match joué |
| Match Veteran | 10 matchs |
| Century Club | 100 matchs |
| Serial Winner | 3 victoires consécutives |
| Win Streak | 5 victoires consécutives |
| Unstoppable | 10 victoires consécutives |
| Rising Star | ELO 1300+ |
| ELO Master | ELO 1500+ |
| Giant Slayer | Victoire vs +200 ELO |
| Social Butterfly | 5 adversaires différents |
| Variety Player | 10 adversaires différents |
| Iron Man | 20 matchs en 1 mois |
| Early Bird | Match avant 9h |
| Club Regular | Plus actif sur 90 jours |
| Comeback King | Victoire après 0-1 en sets |
| Match Machine | 50 matchs |

---

## Base de Données - Tables Principales

### Tables Core
- `users` - Comptes NextAuth
- `players` - Profils joueurs (ELO, stats, préférences)
- `clubs` - Clubs avec settings
- `matches` - Historique des matchs
- `elo_history` - Historique ELO détaillé

### Tables Fonctionnalités
- `match_proposals` - Propositions de match
- `match_now_availability` - Disponibilités instantanées
- `match_now_responses` - Réponses aux dispos
- `player_badges` - Badges obtenus
- `notifications` - Notifications utilisateur

### Tables Box Leagues
- `box_leagues` - Compétitions mensuelles
- `box_league_participants` - Inscriptions + stats
- `box_league_matches` - Matchs round-robin

### Tables Communication
- `forum_threads` - Sujets forum
- `forum_replies` - Réponses forum
- `forum_reactions` - Réactions (likes)
- `chat_rooms` - Salons chat
- `chat_room_members` - Membres salons
- `chat_messages` - Messages chat

### Tables Subscription
- `subscriptions` - Abonnements Stripe
- `payments` - Historique paiements
