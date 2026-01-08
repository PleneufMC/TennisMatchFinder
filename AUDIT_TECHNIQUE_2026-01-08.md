# Audit Technique TennisMatchFinder

**Date** : 8 janvier 2026  
**Repository** : https://github.com/PleneufMC/TennisMatchFinder  
**URL production** : https://tennismatchfinder.net/  
**Auditrice** : Elena Vasquez, Senior Technical Product Analyst

---

## 1. Vue d'ensemble technique

### 1.1 Stack technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js (App Router) | 14.2.35 |
| Langage | TypeScript (strict mode) | 5.3.3 |
| Base de données | PostgreSQL (Neon Serverless) | - |
| ORM | Drizzle ORM | 0.38.3 |
| Authentification | NextAuth.js | 4.24.7 |
| Styling | Tailwind CSS + shadcn/ui | 3.4.1 |
| Temps réel | Pusher | 5.2.0 |
| Email | Nodemailer | 7.0.7 |
| Paiement | Stripe | 20.1.2 |
| Charts | Recharts | 2.12.0 |
| Animations | Framer Motion | 11.0.3 |
| Validation | Zod + React Hook Form | - |
| Déploiement | Netlify | - |

### 1.2 Architecture

- **Type** : Monolithique Next.js avec App Router
- **Pattern** : Server Components + API Routes + Client Components
- **Rendering** : SSR avec `force-dynamic` pour les pages authentifiées
- **Multi-tenant** : Isolation complète par club (clubId sur toutes les tables)

### 1.3 Structure du projet

```
tennismatchfinder/
├── src/
│   ├── app/                       # Routes Next.js 14 (App Router)
│   │   ├── (auth)/               # Pages authentification (4 pages)
│   │   ├── (dashboard)/          # Pages protégées (19 pages)
│   │   ├── (public)/             # Pages publiques (7 pages)
│   │   ├── api/                  # API Routes (25+ endpoints)
│   │   └── clubs/                # Pages création de club
│   ├── components/               # Composants React (~80 fichiers)
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── auth/                 # Formulaires auth
│   │   ├── box-leagues/          # Composants Box Leagues
│   │   ├── chat/                 # Composants chat
│   │   ├── club/                 # Composants club
│   │   ├── elo/                  # Composants ELO (breakdown, modal)
│   │   ├── forum/                # Composants forum
│   │   ├── gamification/         # Badges, achievements
│   │   ├── layout/               # Sidebar, Header, Mobile Nav
│   │   ├── match-now/            # Composants Match Now
│   │   ├── matches/              # Composants matchs
│   │   ├── profile/              # Composants profil
│   │   ├── rivalries/            # Composants rivalités
│   │   └── tournaments/          # Composants tournois
│   ├── lib/                      # Logique métier (15 modules)
│   │   ├── db/                   # Schéma Drizzle + queries
│   │   ├── box-leagues/          # Service Box Leagues
│   │   ├── elo/                  # Algorithme ELO complet
│   │   ├── email/                # Templates + envoi
│   │   ├── gamification/         # Badges + streaks
│   │   ├── match-now/            # Service Match Now
│   │   ├── matching/             # Moteur de suggestions
│   │   ├── pusher/               # Config temps réel
│   │   ├── rivalries/            # Service rivalités
│   │   ├── stripe/               # Paiement + subscriptions
│   │   ├── tournaments/          # Service tournois
│   │   ├── utils/                # Utilitaires (cn, dates, format)
│   │   └── validations/          # Schémas Zod
│   ├── constants/                # Constantes (ELO, suggestions)
│   ├── hooks/                    # React hooks personnalisés
│   └── types/                    # Types TypeScript
├── drizzle/                      # Migrations Drizzle
├── public/                       # Assets statiques
└── supabase/                     # Migrations legacy
```

### 1.4 État de la documentation

| Document | Statut | Contenu |
|----------|--------|---------|
| README.md | ✅ Présent | Stack, structure, démarrage |
| CLAUDE.md | ✅ Présent | Guide dev complet, erreurs courantes, features |
| AUDIT_TECHNIQUE.md | ✅ Présent | Audit précédent (partiellement obsolète) |
| ANALYSE_GAP_CONCURRENCE.md | ✅ Présent | Benchmark concurrentiel |
| CONTRIBUTING.md | ❌ Absent | - |
| API Documentation | ❌ Absent | - |

---

## 2. Modèle de données

### 2.1 Tables principales (27 tables)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTIFICATION (4 tables)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  users              │ Comptes utilisateurs (NextAuth)                    │
│  accounts           │ Providers OAuth                                    │
│  sessions           │ Sessions actives                                   │
│  verification_tokens│ Tokens de vérification email                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              CLUBS (3 tables)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  clubs              │ Clubs de tennis avec settings                      │
│  club_join_requests │ Demandes d'adhésion                                │
│  club_creation_requests │ Demandes de création de club                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                             JOUEURS (2 tables)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  players            │ Profils joueurs (ELO, stats, préférences)          │
│  player_badges      │ Badges/achievements gagnés                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              MATCHS (3 tables)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  matches            │ Matchs joués avec scores ELO                       │
│  match_proposals    │ Propositions de match                              │
│  elo_history        │ Historique des changements ELO                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                             FORUM (3 tables)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  forum_threads      │ Fils de discussion                                 │
│  forum_replies      │ Réponses aux threads                               │
│  forum_reactions    │ Réactions emoji                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              CHAT (3 tables)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  chat_rooms         │ Salons de discussion (sections + DM)               │
│  chat_room_members  │ Membres des salons                                 │
│  chat_messages      │ Messages (éphémères 24h)                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          ABONNEMENTS (2 tables)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  subscriptions      │ Abonnements Stripe (free/premium/pro)              │
│  payments           │ Historique paiements                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           MATCH NOW (2 tables)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  match_now_availability │ Disponibilités instantanées                    │
│  match_now_responses    │ Réponses aux disponibilités                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          BOX LEAGUES (3 tables)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  box_leagues            │ Compétitions mensuelles                        │
│  box_league_participants│ Inscriptions + stats                           │
│  box_league_matches     │ Matchs round-robin                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           TOURNOIS (3 tables)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  tournaments            │ Tournois à élimination directe                 │
│  tournament_participants│ Inscriptions avec seed et paiement             │
│  tournament_matches     │ Matchs du bracket avec liens                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATIONS (1 table)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  notifications          │ Notifications utilisateur                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Enums définis (11 enums)

| Enum | Valeurs |
|------|---------|
| `player_level` | débutant, intermédiaire, avancé, expert |
| `game_type` | simple, double |
| `court_surface` | terre battue, dur, gazon, indoor |
| `weekday` | lundi → dimanche |
| `time_slot` | matin, midi, après-midi, soir |
| `forum_category` | général, recherche-partenaire, résultats, équipement, annonces |
| `proposal_status` | pending, accepted, declined, expired |
| `elo_change_reason` | match_win, match_loss, inactivity_decay, manual_adjustment |
| `join_request_status` | pending, approved, rejected |
| `club_creation_status` | pending, approved, rejected |
| `subscription_status` | active, canceled, incomplete, incomplete_expired, past_due, trialing, unpaid |
| `subscription_tier` | free, premium, pro |
| `box_league_status` | draft, registration, active, completed, cancelled |
| `tournament_status` | draft, registration, seeding, active, completed, cancelled |
| `tournament_format` | single_elimination, double_elimination, consolation |

---

## 3. Inventaire des features

### 3.1 Authentification & Utilisateurs

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Inscription email | ✅ Complet | Formulaire + validation | `/app/(auth)/register` |
| Connexion Magic Link | ✅ Complet | Email avec lien temporaire | `/lib/auth.ts` |
| OAuth Google | ❌ Absent | Non configuré | - |
| OAuth Apple | ❌ Absent | Non configuré | - |
| Mot de passe oublié | N/A | Magic Link = pas de mdp | - |
| Vérification email | ✅ Complet | Via NextAuth email provider | `/lib/auth.ts` |
| Déconnexion | ✅ Complet | Via NextAuth signOut | Layout dashboard |
| Suppression de compte | ❌ Absent | Non implémenté | - |
| Sessions multiples | ✅ Complet | Géré par NextAuth | DB `sessions` |

### 3.2 Profil Joueur

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Photo de profil | ✅ Complet | Upload + stockage | `/api/upload/avatar` |
| Informations personnelles | ✅ Complet | Nom, téléphone, bio | `/app/(dashboard)/profil` |
| Niveau auto-évalué | ✅ Complet | 4 niveaux (enum) | Schema `players` |
| ELO calculé dynamique | ✅ Complet | 1200 par défaut | `/lib/elo/calculator.ts` |
| Disponibilités | ✅ Complet | Jours + créneaux (JSON) | Schema `availability` |
| Préférences de jeu | ✅ Complet | Types + surfaces (JSON) | Schema `preferences` |
| Bio / Description | ✅ Complet | Champ texte | Schema `bio` |
| Historique matchs sur profil | ✅ Complet | Liste avec stats | `/app/(dashboard)/profil` |
| Badges affichés | ✅ Complet | 15 badges définies | `/lib/gamification/badges.ts` |
| Badge "Verified" | ✅ Complet | Champ `isVerified` | Schema `players` |

### 3.3 Système ELO

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| ELO de départ | ✅ Complet | 1200 (configurable) | `/lib/elo/types.ts:23` |
| Calcul après match | ✅ Complet | Formule standard | `/lib/elo/calculator.ts:59-73` |
| Facteur K dynamique | ✅ Complet | K=40→32→24→16 selon matchs/ELO | `/lib/elo/calculator.ts:20-41` |
| Bonus nouvel adversaire | ✅ Complet | +15% | `/lib/elo/modifiers.ts:18` |
| Malus répétition | ✅ Complet | -5%/match (min 70%), 30j window | `/lib/elo/modifiers.ts:21-23` |
| Bonus upset | ✅ Complet | +20% si victoire vs +100 ELO | `/lib/elo/modifiers.ts:26-27` |
| Bonus diversité hebdo | ✅ Complet | +10% si 3+ adversaires/semaine | `/lib/elo/modifiers.ts:30-32` |
| ELO min/max | ✅ Complet | 100 - 3000 | `/lib/elo/types.ts:24-25` |
| Historique progression | ✅ Complet | Table `elo_history` | Schema + queries |
| Graphique évolution | ✅ Complet | Recharts | Dashboard |
| Decay inactivité | ✅ Complet | -5pts/jour après 14j (max -100) | `/api/cron/inactivity-decay` |
| Explication post-match | ✅ Complet | Modal EloBreakdown | `/components/elo/elo-breakdown.tsx` |
| Rang textuel | ✅ Complet | Débutant → Grand Maître | `calculator.ts:237-261` |

### 3.4 Matchmaking & Suggestions

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Liste joueurs du club | ✅ Complet | Avec filtres | `/app/(dashboard)/classement` |
| Suggestions automatiques | ✅ Complet | Score de compatibilité | `/lib/matching/suggestion-engine.ts` |
| Score ELO proximity | ✅ Complet | Idéal 50-150 points (35%) | `suggestion-engine.ts:33-53` |
| Score nouveauté | ✅ Complet | Jamais affronté = 100% (30%) | `suggestion-engine.ts:59-87` |
| Score disponibilités | ✅ Complet | Jours + créneaux communs (20%) | `suggestion-engine.ts:92-115` |
| Score préférences | ✅ Complet | Types de jeu communs (15%) | `suggestion-engine.ts:120-139` |
| Tags suggestions | ✅ Complet | "Nouveau défi", "Même niveau", "Revanche" | `suggestion-engine.ts:144-175` |
| Head-to-head stats | ✅ Complet | V/D par adversaire | `suggestion-engine.ts:180-195` |
| Mode "Match Now" | ✅ Complet | Disponibilité instantanée | `/lib/match-now/service.ts` |
| Rivalités (H2H page) | ✅ Complet | Page dédiée | `/app/(dashboard)/rivalite/[playerId]/[opponentId]` |

### 3.5 Propositions de match

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Bouton proposer match | ✅ Complet | Sur profil adversaire | Composants match |
| Sélection date/heure | ✅ Complet | Date picker | Formulaire proposition |
| Message personnalisé | ✅ Complet | Champ texte | Schema `message` |
| Liste propositions envoyées | ✅ Complet | Dans dashboard | Queries |
| Liste propositions reçues | ✅ Complet | Dans dashboard | Queries |
| Accepter/Refuser | ✅ Complet | API endpoints | `/api/matches/` |
| Notification in-app | ✅ Complet | Table notifications | `/api/notifications` |
| Notification email | 🔧 Partiel | Infra prête, activation pending | `/lib/email/` |
| Annulation proposition | ✅ Complet | Status "expired" | Schema |
| Proposer autre créneau | ❌ Absent | Non implémenté | - |

### 3.6 Gestion des matchs

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Liste matchs passés | ✅ Complet | Avec stats ELO | `/app/(dashboard)/matchs` |
| Enregistrement score | ✅ Complet | Format sets (6-4, 7-5, etc.) | `/components/matches/match-form.tsx` |
| Validation format score | ✅ Complet | Regex + logique tennis | `match-form.tsx` |
| Validation double (2 joueurs) | ✅ Complet | Système de confirmation | `/api/matches/[matchId]/confirm` |
| Page confirmation | ✅ Complet | Page dédiée | `/matchs/confirmer/[matchId]` |
| Type de match (simple/double) | ✅ Complet | Enum | Schema |
| Surface | ✅ Complet | 4 types | Schema enum |
| Match amical (sans ELO) | ❌ Absent | Tous comptent pour ELO | - |
| Forfait / Abandon | ❌ Absent | Non implémenté | - |
| Modification match | ❌ Absent | Immutable après création | - |

### 3.7 Communication - Chat

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Salons de club (sections) | ✅ Complet | Général, Recherche, Annonces | Schema `chat_rooms` |
| Messages temps réel | ✅ Complet | Pusher integration | `/lib/pusher/` |
| Messages éphémères | ✅ Complet | Suppression après 24h | `/api/cron/cleanup-chat` |
| Indicateur typing | ✅ Complet | Via Pusher | `/api/chat/typing` |
| Unread count | ✅ Complet | Par salon | Queries |
| Chat 1-to-1 | 🔧 Partiel | Schema prêt (`isDirect`), UI basique | `/api/chat/create` |
| Blocage utilisateur | ❌ Absent | Non implémenté | - |
| Signalement message | ❌ Absent | Non implémenté | - |
| Assistant IA | 📝 Prévu | Webhook n8n configuré | `/api/webhooks/n8n-bot` |

### 3.8 Forum / Communauté

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Liste catégories | ✅ Complet | 5 catégories (enum) | `/app/(dashboard)/forum` |
| Création de post | ✅ Complet | Titre + contenu | Formulaire |
| Réponses | ✅ Complet | Nested replies possible | Schema `parentReplyId` |
| Édition post | 🔧 Partiel | Non exposé en UI | Schema `updatedAt` |
| Suppression post | 🔧 Partiel | Admin seulement | - |
| Épingler post | ✅ Complet | Flag `isPinned` | Schema + UI |
| Verrouiller post | ✅ Complet | Flag `isLocked` | Schema |
| View count | ✅ Complet | Compteur automatique | Schema |
| Reply count | ✅ Complet | Compteur automatique | Schema |
| Réactions emoji | ✅ Complet | Table dédiée | Schema `forum_reactions` |
| Recherche forum | ❌ Absent | Non implémenté | - |
| Posts bot | ✅ Complet | Flag `isBot` | Schema |

### 3.9 Classement & Statistiques

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Classement global club | ✅ Complet | Trié par ELO | `/app/(dashboard)/classement` |
| Position personnelle | ✅ Complet | Mise en évidence | UI classement |
| Tendance (↑↓→) | ✅ Complet | Calculée sur 5 matchs | `/lib/elo/calculator.ts:214-232` |
| Stats V/D | ✅ Complet | Sur profil et dashboard | Queries |
| Adversaires uniques | ✅ Complet | Compteur | Schema `uniqueOpponents` |
| Série victoires | ✅ Complet | Actuelle + record | Schema `winStreak`, `bestWinStreak` |
| Best/Lowest ELO | ✅ Complet | Historique personnel | Schema |
| Filtres temporels | 📝 Prévu | Premium feature définie | Paywall |
| Export données | 📝 Prévu | Premium feature définie | Paywall |

### 3.10 Gamification

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Badges / Achievements | ✅ Complet | 15 badges définis | `/lib/gamification/badges.ts` |
| Attribution automatique | ✅ Complet | Après chaque match | `/lib/gamification/badge-service.ts` |
| Affichage sur profil | ✅ Complet | Page Achievements | `/app/(dashboard)/achievements` |
| Notifications déblocage | 📝 TODO | Code commenté | `badge-service.ts:97-98` |
| Streaks tracking | ✅ Complet | Win streak trackée | Schema + service |
| Raretés (common→legendary) | ✅ Complet | 4 niveaux | `badges.ts` |
| Early Bird badge | ✅ Complet | Avant 30 juin 2026 | `badge-service.ts:212` |

**15 Badges disponibles :**

| Badge | Catégorie | Rareté | Condition |
|-------|-----------|--------|-----------|
| Premier Set | milestone | common | 1er match joué |
| Joueur Régulier | milestone | common | 10 matchs |
| Compétiteur | milestone | rare | 50 matchs |
| Centenaire | milestone | epic | 100 matchs |
| Rising Star | milestone | rare | ELO 1400+ |
| Giant Slayer | achievement | epic | Victoire vs +200 ELO |
| En Feu | achievement | rare | 5 victoires consécutives |
| Inarrêtable | achievement | legendary | 10 victoires consécutives |
| Mois Parfait | achievement | legendary | 100% victoires / mois (min 4) |
| Comeback King | achievement | epic | +100 ELO en 30 jours |
| Papillon Social | social | common | 10 adversaires différents |
| Networking Pro | social | rare | 25 adversaires différents |
| Légende du Club | social | epic | 50 adversaires différents |
| Early Bird | special | legendary | Inscription avant 30/06/2026 |
| King of Club | special | legendary | #1 du classement |
| Club Regular | special | epic | Plus actif sur 90 jours |

### 3.11 Notifications

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Centre notifications in-app | ✅ Complet | Table + UI | Schema `notifications` |
| Marquer comme lu | ✅ Complet | Flag `isRead` | Queries |
| Notifications email | 🔧 Partiel | Infra prête, partiellement activé | `/lib/email/` |
| Push notifications | ❌ Absent | Pas de PWA/service worker | - |
| Préférences par type | ❌ Absent | Pas de settings granulaires | - |

### 3.12 Multi-clubs

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Création club | ✅ Complet | Workflow approbation email | `/api/clubs/request`, `/approve` |
| Rejoindre club | ✅ Complet | Via slug ou code | `/app/(auth)/join/[clubSlug]` |
| ELO séparé par club | ✅ Complet | Clé étrangère `clubId` | Schema |
| Forum séparé | ✅ Complet | Clé étrangère `clubId` | Schema |
| Classement séparé | ✅ Complet | Filtré par club | Queries |
| Salons chat séparés | ✅ Complet | Clé étrangère `clubId` | Schema |
| Club banner/logo | ✅ Complet | Champs optionnels | Schema + UI |
| Changement de club | ❌ Absent | Pas d'UI | - |
| Multi-appartenance | ❌ Absent | 1 joueur = 1 club | Schema constraint |

### 3.13 Administration club

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Dashboard admin | ✅ Complet | Stats + liens rapides | `/app/(dashboard)/admin` |
| Gestion demandes adhésion | ✅ Complet | Approve/Reject | `/admin/demandes` |
| Liste membres | ✅ Complet | Avec stats | `/admin/membres` |
| Gestion salons chat | ✅ Complet | CRUD sections | `/admin/sections` |
| Gestion clubs (super-admin) | ✅ Complet | Liste + édition | `/admin/clubs` |
| Modération forum | 🔧 Partiel | Épingler/verrouiller | Flags schema |
| Statistiques club | 📝 Placeholder | Page existe, stats basiques | `/admin/statistiques` |
| Notifications membres | 📝 Placeholder | Page existe | `/admin/notifications` |
| Paramètres club | 📝 Placeholder | Page existe | `/admin/parametres` |

### 3.14 Compétitions - Box Leagues

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Création Box League | ✅ Complet | Admin only | `/api/box-leagues` |
| Configuration | ✅ Complet | Dates, ELO range, division | Schema |
| Inscriptions | ✅ Complet | API + UI | `/api/box-leagues/[id]/register` |
| Génération round-robin | ✅ Complet | Matchs automatiques | `service.ts:generateLeagueMatches` |
| Enregistrement résultats | ✅ Complet | Avec intégration ELO | `service.ts:recordMatchResult` |
| Classement temps réel | ✅ Complet | Points, sets, games | `service.ts:getLeagueStandings` |
| Promotion/Relégation | ✅ Complet | Automatique fin de saison | `service.ts:finalizeLeagueStandings` |
| UI Cards | ✅ Complet | Liste + détail | `/components/box-leagues/` |
| UI Tableau classement | ✅ Complet | StandingsTable | `/components/box-leagues/standings-table.tsx` |

### 3.15 Compétitions - Tournois

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Création tournoi | ✅ Complet | Admin only | `/api/tournaments` |
| Formats | ✅ Complet | single/double elimination, consolation | Schema enum |
| Configuration | ✅ Complet | Dates, ELO range, sets, 3ème place | Schema |
| Inscriptions | ✅ Complet | Avec gestion paiement | `/api/tournaments/[id]/register` |
| Seeding automatique | ✅ Complet | Par ELO ou aléatoire | `service.ts:generateBracket` |
| Gestion BYE | ✅ Complet | Automatique | `service.ts:processByes` |
| Bracket génération | ✅ Complet | Positions équilibrées | `service.ts:generateSeedPositions` |
| Enregistrement résultats | ✅ Complet | Avancement automatique | `service.ts:advanceWinner` |
| Petite finale | ✅ Complet | Optionnel | `service.ts:addToThirdPlaceMatch` |
| Bracket UI | ✅ Complet | Visualisation interactive | `/components/tournaments/` |
| Paiement inscription | 🔧 Partiel | Schema prêt, Stripe à connecter | Schema `entryFee`, `stripePriceId` |

### 3.16 Abonnements & Paiement

| Feature | Statut | Détails | Localisation code |
|---------|--------|---------|-------------------|
| Plans définis | ✅ Complet | Free, Premium (99€/an), Pro (149€/an) | `/lib/stripe/config.ts` |
| Stripe Checkout | ✅ Complet | Création session | `/api/stripe/checkout` |
| Stripe Webhooks | ✅ Complet | Sync abonnements | `/api/stripe/webhook` |
| Billing Portal | ✅ Complet | Gestion abonnement | `/api/stripe/portal` |
| Feature paywall | ✅ Complet | Vérification par tier | `/lib/stripe/paywall.ts` |
| Early Bird Mode | ✅ Actif | Tout gratuit jusqu'au 30/06/2026 | Variable env `EARLY_BIRD_MODE` |
| Page Pricing | ✅ Complet | Mode Early Bird + mode standard | `/app/(public)/pricing` |

**Features par tier :**

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Suggestions/semaine | 3 | ∞ | ∞ |
| Forum écriture | ❌ | ✅ | ✅ |
| Chat illimité | ❌ | ✅ | ✅ |
| Stats avancées | ❌ | ✅ | ✅ |
| Explication ELO | ❌ | ✅ | ✅ |
| Export données | ❌ | ✅ | ✅ |
| Tournois | ❌ | ❌ | ✅ |
| Box Leagues | ❌ | ❌ | ✅ |
| Analytics premium | ❌ | ❌ | ✅ |

### 3.17 Technique & UX

| Feature | Statut | Détails |
|---------|--------|---------|
| Responsive mobile | ✅ Complet | Tailwind responsive classes |
| PWA / Installable | ❌ Absent | Pas de manifest/SW |
| Mode sombre | ✅ Complet | next-themes + Tailwind dark: |
| Multilingue | ❌ Absent | Français uniquement |
| Accessibilité | 🔧 Partiel | shadcn/ui (ARIA basique) |
| SEO | 🔧 Partiel | Metadata présent, pas de sitemap |
| Analytics | ❌ Absent | Non intégré |
| États vides | ✅ Complet | Messages + CTAs |
| Loaders/Skeletons | ✅ Complet | Suspense + Skeleton UI |
| Gestion erreurs | ✅ Complet | Error boundaries + toasts (Sonner) |

### 3.18 Légal & Compliance

| Feature | Statut | Détails |
|---------|--------|---------|
| CGU | ✅ Complet | `/terms` - Complet et détaillé |
| Politique confidentialité | ✅ Complet | `/privacy` - RGPD compliant |
| Politique cookies | ✅ Complet | `/cookies` - Détail par cookie |
| Mentions légales | ✅ Complet | `/mentions-legales` |
| Banner cookies | ❌ Absent | Non implémenté |
| RGPD export données | 📝 Prévu | Premium feature |
| RGPD suppression | ❌ Absent | Non implémenté |

---

## 4. Algorithmes et logique métier

### 4.1 Système ELO détaillé

**Formule de base** :
```
NouvelELO = AncienELO + K × Modificateurs × (Résultat - Attendu)
```

**Calcul du score attendu** :
```typescript
expectedScore = 1 / (1 + 10^((opponentElo - playerElo) / 400))
```

**Facteur K dynamique** :

| Condition | K |
|-----------|---|
| < 10 matchs joués | 40 |
| 10-30 matchs joués | 32 |
| > 30 matchs joués | 24 |
| ELO ≥ 1800 | 16 |

**Modificateurs (multiplicatifs)** :

| Type | Valeur | Condition |
|------|--------|-----------|
| Nouvel adversaire | ×1.15 (+15%) | Jamais affronté |
| Répétition | ×0.95 par match | Match vs même adversaire < 30j (min ×0.70) |
| Upset | ×1.20 (+20%) | Victoire contre +100 ELO |
| Diversité hebdo | ×1.10 (+10%) | 3+ adversaires différents / 7j |

**Bornes** :
- ELO minimum : 100
- ELO maximum : 3000
- ELO départ : 1200

**Decay inactivité** :
- Seuil : 14 jours sans match
- Perte : -5 pts/jour
- Maximum : -100 pts

### 4.2 Moteur de suggestions

**Score de compatibilité (pondéré)** :
```typescript
compatibilityScore = 
  eloProximity × 0.35 +      // Écart ELO
  noveltyScore × 0.30 +       // Nouveauté adversaire
  scheduleMatch × 0.20 +      // Disponibilités communes
  preferenceMatch × 0.15      // Préférences jeu
```

**Critères** :
- Écart ELO idéal : 50-150 points (score 100%)
- Maximum : 300 points (au-delà, exclus)
- Inactivité : 30 jours = exclusion

### 4.3 Jobs automatiques (Cron)

| Job | Endpoint | Fonction |
|-----|----------|----------|
| Inactivity decay | `/api/cron/inactivity-decay` | -5 ELO/jour après 14j inactif |
| Chat cleanup | `/api/cron/cleanup-chat` | Suppression messages > 24h |

---

## 5. Intégrations externes

| Service | Usage | Statut | Variables env |
|---------|-------|--------|---------------|
| Neon (PostgreSQL) | Base de données serverless | ✅ Actif | `DATABASE_URL` |
| Pusher | Chat temps réel | ✅ Actif | `PUSHER_*`, `NEXT_PUBLIC_PUSHER_*` |
| Nodemailer/SMTP | Emails transactionnels | ✅ Actif | `EMAIL_SERVER_*`, `EMAIL_FROM` |
| Stripe | Paiements & abonnements | ✅ Actif | `STRIPE_*` |
| NextAuth | Authentification | ✅ Actif | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| n8n | Webhook bot IA | 🔧 Configuré | `N8N_WEBHOOK_SECRET` |
| Netlify | Hébergement & CDN | ✅ Actif | Auto-déploiement |

---

## 6. Routes API (25+ endpoints)

### Authentification
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `POST /api/auth/register` - Inscription

### Administration
- `GET/POST /api/admin/clubs` - Gestion clubs
- `GET/PATCH /api/admin/clubs/[clubId]` - Club spécifique
- `POST /api/admin/join-requests/[id]/approve` - Approuver demande
- `POST /api/admin/join-requests/[id]/reject` - Rejeter demande
- `GET/POST /api/admin/sections` - Gestion sections chat
- `GET/PATCH /api/admin/club-settings` - Paramètres club
- `POST /api/admin/notifications` - Notifications admin

### Matchs
- `GET/POST /api/matches` - Liste / Création
- `POST /api/matches/[matchId]/confirm` - Confirmation
- `POST /api/matches/invite` - Invitation

### Chat
- `GET/POST /api/chat/[roomId]/messages` - Messages
- `POST /api/chat/create` - Créer conversation
- `POST /api/chat/typing` - Indicateur frappe

### Box Leagues
- `GET/POST /api/box-leagues` - Liste / Création
- `GET/PATCH /api/box-leagues/[leagueId]` - Détail / Update
- `POST /api/box-leagues/[leagueId]/register` - Inscription

### Tournois
- `GET/POST /api/tournaments` - Liste / Création
- `GET/PATCH /api/tournaments/[tournamentId]` - Détail / Update
- `POST /api/tournaments/[tournamentId]/register` - Inscription
- `POST /api/tournaments/[tournamentId]/checkout` - Paiement
- `PATCH /api/tournaments/[tournamentId]/matches/[matchId]` - Résultat

### Match Now
- `GET/POST/DELETE /api/match-now` - Disponibilité
- `POST /api/match-now/respond` - Réponse

### Stripe
- `POST /api/stripe/checkout` - Créer session
- `POST /api/stripe/portal` - Portal client
- `POST /api/stripe/webhook` - Événements

### Autres
- `GET/PATCH /api/profile` - Profil utilisateur
- `POST /api/upload/avatar` - Upload avatar
- `GET /api/badges` - Badges joueur
- `GET/POST /api/gamification` - Vérification badges
- `GET /api/subscription` - État abonnement
- `POST /api/pusher/auth` - Auth Pusher
- `GET /api/webhooks/events` - Événements pour n8n
- `POST /api/webhooks/n8n-bot` - Actions bot IA
- `POST /api/clubs/request` - Demande création club
- `GET /api/clubs/approve` - Approuver création

---

## 7. Dette technique identifiée

### 7.1 TODOs dans le code (4 trouvés)

```
src/lib/box-leagues/service.ts:
  → TODO: Implémenter le calcul de tendance

src/lib/gamification/badge-service.ts:
  → TODO: Créer une notification pour le joueur (ligne 97-98)

src/lib/gamification/streaks.ts:
  → TODO: Récupérer le best streak depuis un champ de la DB ou calculer

src/lib/stripe/subscription.ts:
  → TODO: Désactiver cette ligne quand on active le paywall
```

### 7.2 Points d'amélioration

1. **Tests automatisés** : Aucun test détecté
2. **Documentation API** : Absente
3. **Banner cookies** : Non implémenté (RGPD)
4. **PWA** : Non implémenté (pas de push notifications)
5. **Internationalisation** : Français uniquement
6. **Analytics** : Non intégré

### 7.3 Dépendances

- Next.js 14.2.35 : ✅ Version récente
- Toutes les dépendances à jour selon package.json

---

## 8. Comparaison avec l'audit précédent

| Élément | Audit précédent | Situation actuelle |
|---------|-----------------|-------------------|
| Pages légales | ❌ Absentes | ✅ Toutes présentes |
| Système paiement | ❌ Absent | ✅ Stripe intégré |
| Gamification | 🔧 Partiel | ✅ 15 badges + auto-attribution |
| Box Leagues | ❌ Absent | ✅ Complet |
| Tournois | ❌ Absent | ✅ Complet |
| Match Now | ❌ Absent | ✅ Complet |
| Rivalités | ❌ Absent | ✅ Complet |
| Explication ELO | ❌ Absent | ✅ Complet |
| Chat temps réel | 🔧 Partiel | ✅ Complet |
| Score maturité | 55% | **85%** |

---

## 9. Métriques de maturité

| Critère | Score | Commentaire |
|---------|-------|-------------|
| Fonctionnalités core | 95% | ELO, matchmaking, forum, chat, compétitions OK |
| UX/UI | 85% | Design moderne, responsive, états vides OK |
| Infrastructure | 95% | Stack moderne, déploiement OK, Stripe OK |
| Sécurité | 80% | Auth OK, pages légales complètes |
| Documentation | 60% | README + CLAUDE.md présents, API doc manquante |
| Tests | 0% | Aucun test détecté |
| Monétisation | 100% | Stripe intégré, Early Bird actif |
| Compliance | 80% | CGU/Privacy OK, banner cookies manquant |

**Score global de maturité produit : 85%**

**Verdict** : Produit fonctionnel et complet, prêt pour lancement public. Mode Early Bird actif jusqu'au 30 juin 2026. Les compétitions (Box Leagues + Tournois) sont une différenciation majeure.

---

## 10. Recommandations priorisées

### Priorité Haute (avant fin Early Bird)

1. **Implémenter banner cookies**
   - RGPD compliance
   - Utiliser une lib comme `react-cookie-consent`

2. **Notifications email complètes**
   - Activer les emails pour propositions de match
   - Emails bienvenue nouveau membre

3. **Tests automatisés critiques**
   - Tests unitaires ELO
   - Tests E2E parcours inscription

### Priorité Moyenne

4. **Analytics**
   - Intégration Plausible ou Posthog
   - Tracking événements clés

5. **PWA + Push notifications**
   - Manifest
   - Service worker
   - Push pour propositions de match

6. **Documentation API**
   - OpenAPI/Swagger pour les endpoints publics

### Priorité Basse

7. **Internationalisation**
   - Support anglais minimum

8. **RGPD export/suppression données**
   - Implémentation complète

9. **Chat 1-to-1 complet**
   - UI dédiée conversations privées

---

## 11. Annexes

### A. Variables d'environnement requises

```env
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Email
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

# Pusher
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PREMIUM_MONTHLY=
STRIPE_PRICE_PREMIUM_YEARLY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=

# App
NEXT_PUBLIC_APP_URL=
N8N_WEBHOOK_SECRET=
EARLY_BIRD_MODE=true
```

### B. Commandes utiles

```bash
# Développement
npm run dev

# Vérification types
npm run type-check

# Build production
npm run build

# Migrations DB
npm run db:generate
npm run db:migrate
npm run db:push

# Studio DB
npm run db:studio
```

---

*Rapport généré le 8 janvier 2026 par Elena Vasquez*  
*Prochaine révision recommandée : Avant activation du paywall (30 juin 2026)*
