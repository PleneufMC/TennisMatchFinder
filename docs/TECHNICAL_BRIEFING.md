# TennisMatchFinder - Briefing Technique Complet

**Document pour expert technique**  
**Version**: 1.1.0 (Open Club)  
**Date**: 13 janvier 2026  
**URL Production**: https://tennismatchfinder.net

---

## 1. Vue d'ensemble du projet

### 1.1 Description
TennisMatchFinder est une plateforme SaaS B2B2C de mise en relation pour joueurs de tennis amateurs au sein de clubs. L'application propose un système de classement ELO innovant adapté au tennis loisir, un matchmaking intelligent, et des outils de communication en temps réel.

### 1.2 Métriques du code source

| Métrique | Valeur |
|----------|--------|
| **Fichiers source** | 253 fichiers (.ts, .tsx) |
| **Lignes de code** | ~44 300 lignes |
| **Routes API** | 53 endpoints |
| **Tables DB** | 27 tables |
| **Composants UI** | ~60 composants |

---

## 2. Stack Technique

### 2.1 Frontend
```
Framework:       Next.js 14.2.35 (App Router)
Langage:         TypeScript 5.x (strict mode)
UI Library:      React 18.x
Styling:         Tailwind CSS 3.4.1 + tailwindcss-animate
Components:      Radix UI (primitives headless)
Forms:           React Hook Form + Zod (validation)
State:           React Query (TanStack Query) + useSession
Real-time:       Pusher-js (WebSockets)
```

### 2.2 Backend
```
Runtime:         Node.js 20.x
API:             Next.js API Routes (serverless)
Auth:            NextAuth.js 4.24.7 (JWT + Magic Link)
ORM:             Drizzle ORM 0.38.3
Validation:      Zod
Emails:          Nodemailer + Resend SMTP
```

### 2.3 Base de données
```
Provider:        Neon (PostgreSQL serverless)
ORM:             Drizzle ORM
Migrations:      drizzle-kit 0.30.1
Connection:      @neondatabase/serverless (pooled)
```

### 2.4 Services tiers
```
Hébergement:     Netlify (Edge Functions)
Temps réel:      Pusher Channels
Paiements:       Stripe (checkout, subscriptions, webhooks)
Analytics:       Google Analytics 4 (G-SK1KGRV9KK)
Ads Tracking:    Meta Pixel (672907449567233)
```

### 2.5 DevOps & Outils
```
Repository:      GitHub (PleneufMC/TennisMatchFinder)
CI/CD:           Netlify auto-deploy
Node version:    20.x (enforced via netlify.toml)
Package manager: npm
Testing:         Jest + @testing-library/react
Linting:         ESLint + Next.js config
```

---

## 3. Architecture Applicative

### 3.1 Structure des dossiers
```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Pages auth (login, register, onboarding)
│   ├── (dashboard)/          # Pages protégées (dashboard, admin, etc.)
│   ├── (public)/             # Pages publiques (landing, pricing, etc.)
│   └── api/                  # 53 API Routes
│       ├── admin/            # Endpoints administration
│       ├── auth/             # NextAuth + register
│       ├── box-leagues/      # Box Leagues (poules)
│       ├── chat/             # Messages temps réel
│       ├── clubs/            # Gestion clubs
│       ├── forum/            # Forum de discussion
│       ├── matches/          # Matchs et ELO
│       ├── stripe/           # Paiements
│       ├── tournaments/      # Tournois élimination
│       └── webhooks/         # Stripe, N8N
├── components/               # ~60 composants React
│   ├── admin/                # Composants admin
│   ├── auth/                 # Formulaires auth
│   ├── box-leagues/          # UI Box Leagues
│   ├── chat/                 # Chat en temps réel
│   ├── elo/                  # Affichage ELO
│   ├── gamification/         # Badges, streaks
│   ├── layout/               # Header, Sidebar, Nav
│   ├── matches/              # Formulaires matchs
│   ├── premium/              # Paywall, upgrade
│   ├── providers/            # SessionProvider, Theme
│   ├── tournaments/          # Bracket, participants
│   └── ui/                   # Primitives shadcn/ui
├── hooks/                    # 3 custom hooks
│   ├── use-player.ts         # Session + player data
│   ├── use-cookie-consent.ts # RGPD cookies
│   └── use-pusher-chat.ts    # WebSocket chat
├── lib/                      # 49 modules utilitaires
│   ├── auth.ts               # NextAuth config + adapter
│   ├── auth-helpers.ts       # getServerPlayer()
│   ├── db/                   # Drizzle schema + queries
│   ├── elo/                  # Calcul ELO + modifiers
│   ├── box-leagues/          # Service Box Leagues
│   ├── gamification/         # Badges, challenges
│   ├── match-now/            # Disponibilité instantanée
│   ├── matching/             # Suggestion engine
│   ├── pusher/               # Server + client config
│   ├── rivalries/            # Rivalités entre joueurs
│   ├── stripe/               # Config + subscription
│   ├── tournaments/          # Service tournois
│   ├── utils/                # cn(), dates, format
│   └── validations/          # Schemas Zod
└── types/                    # TypeScript definitions
```

### 3.2 Patterns architecturaux

**Server Components par défaut**
- Les pages utilisent `async/await` pour fetch DB côté serveur
- Réduction du JavaScript client
- Hydration sélective avec `'use client'`

**Route Handlers API**
- `GET/POST/PUT/DELETE` dans `route.ts`
- Auth via `getServerPlayer()` ou `getServerSession()`
- Validation entrée avec Zod

**Multi-tenant (club isolation)**
- Chaque club a ses propres données isolées
- `clubId` requis sur la plupart des tables
- Canaux Pusher par club: `presence-club-{clubId}-room-{roomId}`

---

## 4. Schéma de Base de Données

### 4.1 Tables principales (27)

```
AUTHENTIFICATION (NextAuth)
├── users                 # Comptes utilisateurs
├── accounts              # OAuth providers
├── sessions              # Sessions (backup, non utilisé avec JWT)
└── verificationTokens    # Magic links

MÉTIER PRINCIPAL
├── clubs                 # Clubs de tennis
├── players               # Profils joueurs (extends users)
├── matches               # Matchs joués + scores
├── eloHistory            # Historique ELO par match
├── matchProposals        # Propositions de match
└── clubJoinRequests      # Demandes d'adhésion

BOX LEAGUES (Poules mensuelles)
├── boxLeagues            # Configuration poule
├── boxLeagueParticipants # Inscrits + stats
└── boxLeagueMatches      # Matchs de poule

TOURNOIS (Élimination directe)
├── tournaments           # Configuration tournoi
├── tournamentParticipants # Inscrits + seeding
└── tournamentMatches     # Bracket + résultats

CHAT TEMPS RÉEL
├── chatRooms             # Salons (privés, groupe, section)
├── chatRoomMembers       # Participants
└── chatMessages          # Messages

FORUM
├── forumThreads          # Sujets
├── forumReplies          # Réponses
└── forumReactions        # Réactions emoji

GAMIFICATION
├── playerBadges          # Badges gagnés
└── notifications         # Notifications in-app

ABONNEMENTS (Stripe)
├── subscriptions         # État abonnement
└── payments              # Historique paiements

MATCH NOW
├── matchNowAvailability  # Disponibilités instantanées
└── matchNowResponses     # Réponses aux dispos
```

### 4.2 Relations clés

```
users (1) ────────── (1) players
clubs (1) ────────── (n) players
clubs (1) ────────── (n) matches
players (n) ──────── (n) matches (via player1Id, player2Id)
players (1) ──────── (n) eloHistory
boxLeagues (1) ───── (n) boxLeagueParticipants
tournaments (1) ──── (n) tournamentParticipants
chatRooms (1) ────── (n) chatMessages
```

### 4.3 Indexes de performance

- `players_club_id_idx` - Recherche membres par club
- `players_current_elo_idx` - Tri classement
- `matches_played_at_idx` - Historique chronologique
- `elo_history_player_id_idx` - Graphique progression
- `chat_messages_created_at_idx` - Pagination messages

---

## 5. Système ELO Innovant

### 5.1 Formule de base
```
NouvelELO = AncienELO + K × Modificateurs × (Résultat - Attendu)
```

### 5.2 Facteur K dynamique

| Profil joueur | K Factor |
|---------------|----------|
| Nouveau (<10 matchs) | 40 |
| Intermédiaire (10-30 matchs) | 32 |
| Établi (>30 matchs) | 24 |
| ELO élevé (≥1800) | 16 |

### 5.3 Modificateurs contextuels

| Modificateur | Description | Effet |
|--------------|-------------|-------|
| **Surprise** | Victoire contre joueur +200 ELO | +20% bonus |
| **Rival** | Confrontations répétées | Réduit impact |
| **Série** | Win/lose streak | Amplifie gains/pertes |
| **Inactivité** | Decay ELO après 30j sans match | -5 ELO/semaine |

### 5.4 Rangs ELO

| ELO | Rang | Badge |
|-----|------|-------|
| ≥2000 | Grand Maître | 👑 |
| ≥1800 | Expert | 🏆 |
| ≥1600 | Avancé | ⭐ |
| ≥1400 | Intermédiaire+ | 🎯 |
| ≥1200 | Intermédiaire | 🎾 |
| ≥1000 | Débutant+ | 📈 |
| <1000 | Débutant | 🌱 |

---

## 6. Authentification & Sécurité

### 6.1 Flow d'authentification
```
1. Utilisateur entre email sur /login
2. Magic Link envoyé via Resend SMTP
3. Clic sur lien → /api/auth/callback/email
4. NextAuth vérifie token + crée session JWT
5. JWT enrichi avec player data (callback session)
6. Session accessible via useSession() client
```

### 6.2 Configuration NextAuth

```typescript
// Stratégie: JWT (30 jours, refresh 24h)
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60,
  updateAge: 24 * 60 * 60,
}

// Adapter custom Drizzle
adapter: CustomDrizzleAdapter()

// Callbacks enrichissent la session
callbacks: {
  jwt: // Ajoute user.id au token
  session: // Fetch player + club depuis DB
}
```

### 6.3 Middleware de protection

```typescript
// Routes publiques
const publicPaths = [
  '/', '/login', '/register', '/join',
  '/api/auth', '/pricing', '/privacy', '/terms',
  '/cookies', '/mentions-legales', '/strategie-digitale'
];

// Routes protégées nécessitent token JWT valide
```

### 6.4 Sécurité headers (netlify.toml)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000`
- CSP restrictive (scripts, images, connexions autorisés)

---

## 7. Fonctionnalités par Module

### 7.1 Gestion des clubs

| Feature | Status | Description |
|---------|--------|-------------|
| Multi-club | ✅ | Isolation données par club |
| Open Club | ✅ | Club virtuel pour joueurs sans affiliation |
| Demandes adhésion | ✅ | Workflow approbation admin |
| Paramètres club | ✅ | Logo, bannière, description |
| Sections chat | ✅ | Salons personnalisés par club |

### 7.2 Matchs & ELO

| Feature | Status | Description |
|---------|--------|-------------|
| Enregistrement match | ✅ | Score, surface, validation |
| Calcul ELO automatique | ✅ | Formule + modificateurs |
| Historique ELO | ✅ | Graphique progression |
| Propositions match | ✅ | Invitations entre joueurs |
| Validation croisée | ✅ | Confirmation par l'adversaire |

### 7.3 Box Leagues (Poules)

| Feature | Status | Description |
|---------|--------|-------------|
| Création poule | ✅ | Admin crée avec dates, règles |
| Inscription joueurs | ✅ | Enregistrement ELO au moment |
| Classement en direct | ✅ | Points, sets, games |
| Promotion/Relégation | ✅ | Système configurable |

### 7.4 Tournois

| Feature | Status | Description |
|---------|--------|-------------|
| Élimination directe | ✅ | Single/double/consolation |
| Bracket visuel | ✅ | Affichage arbre tournoi |
| Seeding ELO | ✅ | Têtes de série automatiques |
| Paiement inscription | ✅ | Stripe checkout intégré |

### 7.5 Chat temps réel

| Feature | Status | Description |
|---------|--------|-------------|
| Messages instantanés | ✅ | Pusher WebSockets |
| Conversations privées | ✅ | 1-to-1 entre joueurs |
| Salons de groupe | ✅ | Multi-participants |
| Sections club | ✅ | Salons permanents visibles par tous |
| Indicateur "typing" | ✅ | En temps réel |

### 7.6 Gamification

| Feature | Status | Description |
|---------|--------|-------------|
| Badges | ✅ | First match, streak, etc. |
| Trophées | ✅ | Vitrine profil |
| Défis mensuels | 🔄 | En développement |
| Rivalités | ✅ | Stats head-to-head |

### 7.7 Forum

| Feature | Status | Description |
|---------|--------|-------------|
| Threads par catégorie | ✅ | Général, recherche, résultats |
| Réponses imbriquées | ✅ | Arborescence discussions |
| Réactions emoji | ✅ | Like, thumbs up, etc. |
| Épinglage | ✅ | Admin peut épingler |

### 7.8 Abonnements Stripe

| Feature | Status | Description |
|---------|--------|-------------|
| Plans Free/Premium/Pro | ✅ | Limites par tier |
| Checkout Session | ✅ | Paiement sécurisé |
| Portal client | ✅ | Gestion abonnement |
| Webhooks | ✅ | Sync état auto |
| Early Bird Mode | ✅ | Pro gratuit pour lancement |

---

## 8. API Routes Reference

### 8.1 Authentication
```
POST /api/auth/register          # Inscription classique
POST /api/auth/register-city     # Inscription ville (Open Club)
GET  /api/auth/[...nextauth]     # NextAuth handlers
```

### 8.2 Players & Profiles
```
GET  /api/profile                # Profil joueur courant
PUT  /api/profile                # Mise à jour profil
POST /api/onboarding             # Compléter profil initial
PUT  /api/player/location        # Géolocalisation
```

### 8.3 Matches
```
GET  /api/matches                # Liste des matchs
POST /api/matches                # Créer match
POST /api/matches/invite         # Inviter joueur
POST /api/matches/[id]/confirm   # Valider match
```

### 8.4 Box Leagues
```
GET  /api/box-leagues            # Lister poules
POST /api/box-leagues            # Créer poule
GET  /api/box-leagues/[id]       # Détail poule
POST /api/box-leagues/[id]/register  # S'inscrire
```

### 8.5 Tournaments
```
GET  /api/tournaments            # Lister tournois
POST /api/tournaments            # Créer tournoi
GET  /api/tournaments/[id]       # Détail + bracket
POST /api/tournaments/[id]/register   # S'inscrire
POST /api/tournaments/[id]/checkout   # Payer inscription
PUT  /api/tournaments/[id]/matches/[matchId]  # Score match
```

### 8.6 Chat
```
GET  /api/chat/[roomId]/messages  # Messages d'un salon
POST /api/chat/[roomId]/messages  # Envoyer message
POST /api/chat/create             # Créer conversation
POST /api/chat/typing             # Indicateur frappe
POST /api/pusher/auth             # Auth Pusher channel
```

### 8.7 Admin
```
GET  /api/admin/clubs             # Liste clubs
POST /api/admin/clubs             # Créer club
GET  /api/admin/join-requests/[id]/approve  # Approuver demande
POST /api/admin/members/kick      # Retirer membre
POST /api/admin/members/toggle-admin  # Toggle admin
POST /api/admin/create-open-club  # Créer Open Club + migration
```

### 8.8 Stripe
```
POST /api/stripe/checkout         # Créer checkout session
POST /api/stripe/portal           # Créer portal session
POST /api/stripe/webhook          # Webhook Stripe
GET  /api/subscription            # État abonnement
```

---

## 9. Configuration Environnement

### 9.1 Variables requises (Production)

```env
# Database
DATABASE_URL=postgresql://...@neon.tech/...?sslmode=require

# NextAuth
NEXTAUTH_URL=https://tennismatchfinder.net
NEXTAUTH_SECRET=<32+ chars random>

# Email (Resend)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_xxx
EMAIL_FROM=TennisMatchFinder <noreply@tennismatchfinder.net>

# Pusher (chat temps réel)
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=xxx
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-SK1KGRV9KK
NEXT_PUBLIC_META_PIXEL_ID=672907449567233

# Stripe (optionnel, Early Bird active)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx

# Feature flags
EARLY_BIRD_MODE=true
```

---

## 10. Déploiement

### 10.1 Pipeline Netlify
```
1. Push sur main → Trigger build
2. npm install && npm run build
3. Next.js génère .next/
4. @netlify/plugin-nextjs adapte pour Edge
5. Déploiement CDN global + Serverless Functions
6. Custom domain: tennismatchfinder.net
```

### 10.2 netlify.toml highlights
```toml
[build]
  command = "npm install && npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@neondatabase/serverless", "drizzle-orm"]
```

### 10.3 Headers sécurité
- CSP restrictive autorisant GA4, Meta Pixel, Pusher
- HSTS avec preload
- Frame deny (anti-clickjacking)

---

## 11. Monitoring & Analytics

### 11.1 Google Analytics 4
- **Property ID**: G-SK1KGRV9KK
- **Events trackés**: PageView, signup, match_created, tournament_joined

### 11.2 Meta Pixel
- **Pixel ID**: 672907449567233
- **Events**: PageView, Lead (inscription), CompleteRegistration
- **Status**: Actif, 57+ PageView enregistrés

### 11.3 Logs serveur
- Netlify Functions logs (dashboard Netlify)
- Console.log côté API routes
- Debug mode NextAuth en développement

---

## 12. Problèmes Résolus & Décisions Techniques

### 12.1 Session joueurs sans club (Bug critique résolu)
**Problème**: Utilisateurs inscrits sans affiliation club ne pouvaient pas accéder au dashboard (redirect loop vers /login).

**Cause**: Race condition dans useEffect + middleware vérifiant strictement clubId.

**Solution**: Création de l'**Open Club** - club virtuel par défaut:
- Tous les joueurs sans club sont automatiquement affiliés à l'Open Club
- L'inscription via `/api/auth/register-city` assigne l'Open Club
- Migration automatique des 5 joueurs existants sans club

**Commits**: 4dae809, 36f7193, 7fe98ee

### 12.2 Choix JWT vs Database Sessions
**Décision**: JWT avec enrichissement via callback session

**Raisons**:
- Performance (pas de query DB pour chaque requête)
- Scaling serverless (pas d'état serveur)
- Player data cached dans le token (30 jours)

**Inconvénient**: Invalidation session nécessite attendre expiration

### 12.3 Custom Drizzle Adapter
**Décision**: Adapter NextAuth custom au lieu de `@auth/drizzle-adapter`

**Raison**: Incompatibilité version next-auth@4.x avec l'adapter officiel

**Implémentation**: 258 lignes dans `src/lib/auth.ts` implémentant toutes les méthodes Adapter

---

## 13. Roadmap Technique

### v1.2 (Février 2026)
- [ ] Intégration Google Calendar (OAuth + API)
- [ ] Notifications WhatsApp (Twilio/Meta Business API)
- [ ] i18n (next-intl ou next-i18next)
- [ ] Version anglaise complète

### v1.3 (Mars-Avril 2026)
- [ ] PWA manifest + service worker
- [ ] Push notifications (Web Push API)
- [ ] Optimisation performances (lazy loading, code splitting)
- [ ] Tests E2E Playwright

### v1.4 (Q2-Q3 2026)
- [ ] Classements départementaux
- [ ] Tournois inter-clubs
- [ ] API publique documentée (OpenAPI)
- [ ] Mobile apps (React Native ou Flutter)

---

## 14. Commandes développeur

### Setup local
```bash
git clone https://github.com/PleneufMC/TennisMatchFinder.git
cd TennisMatchFinder
cp .env.local.example .env.local
# Remplir les variables
npm install
npm run db:push   # Sync schema Neon
npm run dev       # http://localhost:3000
```

### Scripts disponibles
```bash
npm run dev          # Dev server
npm run build        # Build production
npm run lint         # ESLint check
npm run type-check   # TypeScript check
npm run test         # Jest tests
npm run db:generate  # Générer migrations
npm run db:migrate   # Appliquer migrations
npm run db:studio    # Drizzle Studio (GUI DB)
npm run test:elo     # Tests système ELO
```

---

## 15. Contacts & Ressources

| Ressource | URL |
|-----------|-----|
| Production | https://tennismatchfinder.net |
| GitHub | https://github.com/PleneufMC/TennisMatchFinder |
| Netlify Dashboard | https://app.netlify.com/sites/tennismatchfinder |
| Neon Console | https://console.neon.tech |
| Pusher Dashboard | https://dashboard.pusher.com |
| Stripe Dashboard | https://dashboard.stripe.com |
| GA4 | https://analytics.google.com |
| Meta Events Manager | https://business.facebook.com/events_manager |

---

## 16. Annexes

### A. Diagramme de flux authentification
```
┌─────────┐     ┌──────────┐     ┌────────────┐     ┌─────────┐
│  User   │────▶│  /login  │────▶│ Magic Link │────▶│ Callback│
└─────────┘     └──────────┘     │   (Email)  │     │  URL    │
                                 └────────────┘     └────┬────┘
                                                        │
┌─────────┐     ┌──────────┐     ┌────────────┐         │
│Dashboard│◀────│  JWT     │◀────│ Verify     │◀────────┘
│         │     │  Session │     │ Token      │
└─────────┘     └──────────┘     └────────────┘
```

### B. Schéma calcul ELO
```
Input: Winner(elo, matchCount), Loser(elo, matchCount), History

    ┌─────────────────┐
    │ Calculate K     │
    │ (experience)    │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Expected Score  │
    │ E = 1/(1+10^d)  │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Modifiers       │
    │ (surprise,rival)│
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ New ELO =       │
    │ Old + K×M×(S-E) │
    └─────────────────┘

Output: Winner(+Δ), Loser(-Δ)
```

---

**Document généré le 13 janvier 2026**  
**Auteur**: Lyra (AI Assistant)  
**Pour**: Expert technique / Audit  
**Version document**: 1.0
