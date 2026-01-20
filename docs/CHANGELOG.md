# 📋 Changelog TennisMatchFinder

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

---

## [1.4.0] - 2026-01-20 — "Push & Polish"

### 🎉 Nouveautés majeures

#### 🔔 Notifications Push PWA
- **Nouveau** : Notifications push natives via Web Push API
- **Nouveau** : Configuration VAPID pour l'authentification sécurisée
- **Nouveau** : Table `push_subscriptions` pour stocker les abonnements
- **Nouveau** : Composant `PushNotificationToggle` dans les paramètres
- **Nouveau** : Hook `usePushNotifications` pour la gestion côté client
- **Nouveau** : Service `src/lib/push/` pour l'envoi des notifications
- **Nouveau** : Notifications automatiques pour :
  - Match enregistré (notification à l'adversaire)
  - Match confirmé/contesté (notification au rapporteur)
  - Match Now - disponibilité (notification aux joueurs compatibles)
  - Réponse Match Now (notification au demandeur)

#### 🎨 Nouveau Branding
- **Nouveau** : Logo redesigné (cercle vert avec graphique de progression)
- **Nouveau** : Couleur thème passée de orange (#f59e0b) à vert (#22c55e)
- **Nouveau** : Icônes PWA optimisées (192x192, 512x512 PNG)
- **Nouveau** : Favicon, apple-touch-icon mis à jour
- **Nouveau** : Sidebar, mobile-nav, layouts avec nouveau logo Image component

#### 🐛 Corrections de bugs

##### Box Leagues - Compteur de participants
- **Corrigé** : L'onglet "Mes leagues" affichait "0/18" au lieu du vrai nombre
- **Corrigé** : `getPlayerActiveLeagues()` retourne maintenant `participantCount` ET `participants`
- **Corrigé** : Avatars des participants visibles dans les cartes Box League

##### Build Netlify
- **Corrigé** : Exclusion de `playwright.config.ts` du build TypeScript
- **Corrigé** : Déclaration de types locale pour `web-push` (production build)
- **Corrigé** : ESLint et devDependencies en production

### 🔧 Améliorations techniques

- **Amélioration** : Service Worker mis à jour pour les notifications push
- **Amélioration** : Icônes de notification en PNG (compatibilité navigateurs)
- **Amélioration** : Rate limiting sur les routes sensibles
- **Amélioration** : Monitoring Sentry intégré

### 📊 Schema DB — Nouvelles tables

```sql
-- Table push_subscriptions (nouvelle)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 📁 Fichiers créés

```
src/
├── lib/push/
│   └── index.ts                    # Service notifications push
├── app/api/push/
│   ├── subscribe/route.ts          # API abonnement
│   └── unsubscribe/route.ts        # API désabonnement
├── hooks/
│   └── use-push-notifications.ts   # Hook React
├── components/push/
│   ├── push-notification-toggle.tsx # Toggle UI
│   └── index.ts
├── types/
│   └── web-push.d.ts               # Types pour production
public/images/
├── logo.png                        # Nouveau logo
├── icon-192.png                    # Icône PWA
├── icon-512.png                    # Icône PWA
├── favicon.ico                     # Favicon
└── apple-touch-icon.png            # iOS
drizzle/
└── 0010_push_subscriptions.sql     # Migration
```

### ⚙️ Configuration Netlify requise

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BL...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:pleneuftrading@gmail.com
```

### 📈 Statistiques

| Métrique | Valeur |
|----------|--------|
| Fichiers créés | 11 |
| Fichiers modifiés | 15 |
| Lignes de code ajoutées | ~800 |
| Commits | 6 |
| Migrations SQL | 1 |

---

## [1.3.0] - 2026-01-14 — "Réputation & Anti-Churn"

### 🎉 Nouveautés majeures

#### ⭐ Système de Réputation Post-Match
- **Nouveau** : Évaluation des adversaires après confirmation de match
- **Nouveau** : 3 critères : Ponctualité, Fair-play, Convivialité (⭐ 1-5)
- **Nouveau** : Commentaire optionnel (privé, max 500 caractères)
- **Nouveau** : Moyenne de réputation calculée et affichée sur le profil
- **Nouveau** : Composant `RatingModal` avec système d'étoiles interactif
- **Nouveau** : Composant `ReputationBadge` avec tooltip détaillé
- **Nouveau** : Badge **"Partenaire Fiable"** 🏅 (≥4.5 moyenne, ≥5 avis)
- **Nouveau** : API `POST/GET /api/matches/[matchId]/rate`

#### 🛡️ Système Anti-Churn — Auto-Validation & Contestation
- **Nouveau** : Auto-validation des matchs après **24h** sans réponse
- **Nouveau** : Rappel automatique après **6h** si pas d'action
- **Nouveau** : Contestation possible pendant **7 jours** après validation
- **Nouveau** : Limite de **3 contestations par mois** par joueur
- **Nouveau** : Countdown en temps réel sur la page de confirmation
- **Nouveau** : Dialog de contestation avec raison obligatoire
- **Nouveau** : Notifications admin pour les litiges
- **Nouveau** : CRON jobs Netlify : `auto-validate-matches`, `match-reminders`
- **Nouveau** : API `POST /api/matches/[matchId]/contest`

#### 👋 "Nouveaux membres à accueillir"
- **Nouveau** : Section dédiée en haut de la page `/suggestions`
- **Nouveau** : Identification automatique (<3 matchs, <30 jours d'inscription)
- **Nouveau** : Tag `"Nouveau membre 👋"` prioritaire sur les cartes
- **Nouveau** : Query `getNewMembersToWelcome` pour les clubs
- **Nouveau** : Lien avec le badge "Comité d'accueil"

#### ⏰ Rappel d'Inactivité (CRON)
- **Nouveau** : Notification automatique après **7 jours** sans match
- **Nouveau** : Exécution quotidienne à 11h (heure française)
- **Nouveau** : Smart filtering : pas de spam (1 notif/7 jours max)
- **Nouveau** : Message personnalisé selon la durée d'inactivité
- **Nouveau** : API `POST /api/cron/inactivity-reminder`

#### 👑 Administration Super Admin
- **Nouveau** : Suppression définitive d'un joueur (cascade complète)
- **Nouveau** : Dialog de confirmation avec saisie du nom exact
- **Nouveau** : Suppression de toutes les données liées (matchs, ELO, badges, chat, etc.)

### 🔧 Améliorations techniques

- **Amélioration** : Schema DB enrichi avec colonnes auto-validation/contestation
- **Amélioration** : 3 index de performance ajoutés sur `matches`
- **Amélioration** : Configuration centralisée `MATCH_VALIDATION_CONFIG`
- **Amélioration** : Helpers de calcul temporel (`getTimeUntilAutoValidation`)

### 📊 Schema DB — Nouvelles colonnes

```sql
-- Table matches : Auto-validation
ALTER TABLE matches ADD COLUMN auto_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN auto_validate_at TIMESTAMP;
ALTER TABLE matches ADD COLUMN reminder_sent_at TIMESTAMP;

-- Table matches : Contestation
ALTER TABLE matches ADD COLUMN contested BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN contested_by UUID REFERENCES players(id);
ALTER TABLE matches ADD COLUMN contested_at TIMESTAMP;
ALTER TABLE matches ADD COLUMN contest_reason TEXT;
ALTER TABLE matches ADD COLUMN contest_resolved_at TIMESTAMP;
ALTER TABLE matches ADD COLUMN contest_resolution VARCHAR(50);

-- Table match_ratings (nouvelle)
CREATE TABLE match_ratings (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  rater_id UUID REFERENCES players(id),
  rated_player_id UUID REFERENCES players(id),
  punctuality INT, fair_play INT, friendliness INT,
  comment TEXT, average_rating DECIMAL(2,1),
  created_at TIMESTAMP
);

-- Table players : Réputation
ALTER TABLE players ADD COLUMN reputation_avg DECIMAL(2,1);
ALTER TABLE players ADD COLUMN reputation_punctuality DECIMAL(2,1);
ALTER TABLE players ADD COLUMN reputation_fair_play DECIMAL(2,1);
ALTER TABLE players ADD COLUMN reputation_friendliness DECIMAL(2,1);
ALTER TABLE players ADD COLUMN reputation_count INTEGER DEFAULT 0;
```

### 📁 Fichiers créés

```
src/
├── app/api/
│   ├── matches/[matchId]/
│   │   ├── rate/route.ts           # API réputation
│   │   └── contest/route.ts        # API contestation
│   ├── cron/
│   │   ├── auto-validate-matches/  # CRON auto-validation
│   │   ├── match-reminders/        # CRON rappels 6h
│   │   └── inactivity-reminder/    # CRON inactivité
│   └── super-admin/
│       └── delete-player/route.ts  # Suppression joueur
├── components/reputation/
│   ├── rating-modal.tsx            # Modal évaluation
│   └── reputation-badge.tsx        # Badge profil
├── lib/constants/
│   └── validation.ts               # Config validation
migrations/
├── reputation-system.sql           # Migration réputation
└── match-validation-contestation.sql  # Migration anti-churn
netlify/functions/
├── auto-validate-matches.mts       # CRON Netlify
├── match-reminders.mts             # CRON Netlify
└── inactivity-reminder.mts         # CRON Netlify
```

### 📈 Statistiques

| Métrique | Valeur |
|----------|--------|
| Fichiers créés | 12 |
| Fichiers modifiés | 14 |
| Lignes de code ajoutées | ~2700 |
| Commits | 8 |
| Migrations SQL | 2 |
| CRON Jobs | 3 |
| Nouveaux badges | 1 |

---

## [1.2.0] - 2026-01-13 — "Trophy Case & Fair ELO"

### 🎉 Nouveautés majeures

#### 🏆 Trophy Case 2.0 — Gamification complète
- **Nouveau** : 16 badges répartis en 4 catégories (Milestones, Achievements, Social, Special)
- **Nouveau** : Système de tiers (Common → Rare → Epic → Legendary)
- **Nouveau** : Badges dynamiques (King of Club peut être perdu si détrôné)
- **Nouveau** : Célébration avec confetti pour badges epic/legendary
- **Nouveau** : Composants UI : BadgeCard, BadgeGrid, BadgeUnlockModal, BadgeProgressBar
- **Nouveau** : Vérification automatique après chaque match confirmé
- **Nouveau** : API badges complète (`GET /api/badges`, `POST /api/badges/[id]/seen`)

#### 🎯 Coefficient ELO par Format — USP vs Playtomic
- **Nouveau** : Impact ELO ajusté selon le format de match :
  - 1 set : ×0.50 (haute variance statistique)
  - 2 sets : ×0.80 (format amateur standard)
  - 3 sets : ×1.00 (match complet)
  - Super tie-break : ×0.30 (très aléatoire)
- **Nouveau** : Modificateur de marge de victoire (6-0 ≠ 7-6)
- **Nouveau** : Composant `MatchFormatSelector` avec indicateurs visuels
- **Nouveau** : Modal `EloBreakdownModal` pour transparence totale du calcul
- **Nouveau** : API enrichie retourne le breakdown complet

#### 📱 Onboarding guidé
- **Nouveau** : Flow en 5 écrans pour les nouveaux joueurs (`/onboarding`)
- **Nouveau** : Étapes : Bienvenue, Profil, Niveau, Disponibilités, Premier match
- **Nouveau** : API `POST /api/onboarding` pour création de profil

### 🔧 Améliorations techniques

- **Amélioration** : Module ELO refactorisé (`src/lib/elo/`)
- **Amélioration** : Backward-compatible pour les migrations non exécutées
- **Amélioration** : Calcul ELO avec K-Factor dynamique selon expérience joueur
- **Fix** : Route dynamique `[matchId]` vs `[id]` unifiée
- **Fix** : Icône "Mois Parfait" changée de Crown à CalendarCheck

### 📊 Schema DB

```sql
-- Nouveaux ENUMs
CREATE TYPE badge_tier AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE badge_category AS ENUM ('milestone', 'achievement', 'social', 'special');
CREATE TYPE match_format AS ENUM ('one_set', 'two_sets', 'three_sets', 'super_tiebreak');

-- Nouvelles tables
CREATE TABLE badges (...);           -- 16 badges
CREATE TABLE player_badges (...);    -- Badges débloqués

-- Nouvelles colonnes
ALTER TABLE matches ADD COLUMN match_format;
ALTER TABLE elo_history ADD COLUMN format_coefficient, margin_modifier;
```

### 📁 Fichiers créés

```
src/lib/elo/                         -- Module ELO complet
src/lib/gamification/badge-checker.ts
src/components/elo/elo-breakdown-modal.tsx
src/components/matches/match-format-selector.tsx
src/components/gamification/Badge*.tsx
src/components/onboarding/*.tsx
migrations/trophy-case-2.0.sql
migrations/match-format-coefficients.sql
```

---

## [1.1.0] - 2026-01-13 — "Open Club"

### 🎉 Nouveautés

#### 🏠 Open Club - Le tennis pour tous !
- **Nouveau** : Création de l'**Open Club**, un club par défaut pour tous les joueurs
- Les joueurs peuvent s'inscrire sans rejoindre un club spécifique
- Accès complet au dashboard et aux fonctionnalités pour tous
- Possibilité de rejoindre un club spécifique ultérieurement

#### 🏆 Box Leagues (Poules de compétition)
- **Nouveau** : Système de compétition par poules
- Création et gestion de box leagues par les administrateurs
- Classement automatique des joueurs dans les poules
- Suivi des matchs et résultats en temps réel

#### 📊 Tracking & Analytics
- Intégration **Google Analytics 4** (GA4) complète
- Intégration **Meta Pixel** pour le tracking marketing
- Événements personnalisés : inscription, création de match, badges, etc.
- Respect du RGPD avec consentement utilisateur

#### 🎯 Page Stratégie Digitale
- Nouvelle page `/strategie-digitale` documentant la stratégie marketing
- Calendrier des campagnes
- Templates d'annonces et briefs influenceurs

### 🐛 Corrections de bugs

- **Corrigé** : Problème de connexion pour les joueurs sans club
- **Corrigé** : Race condition lors du chargement de la session
- **Corrigé** : Gestion des tokens JWT améliorée
- **Corrigé** : Redirections intempestives vers /login
- **Corrigé** : Erreurs 404 sur certains assets

### 👑 Administration

- **Nouveau** : Rôle Super Admin pour gérer tous les clubs
- Accès à la gestion de tous les joueurs
- Possibilité de changer le club d'un joueur

---

## [1.0.0] - Décembre 2025 — Lancement

### 🎉 Fonctionnalités de lancement

- Système d'authentification par magic link
- Profils joueurs avec niveau, disponibilités et photos
- Système ELO pour le classement
- Création et gestion des matchs
- Forum de discussion par club
- Chat en temps réel entre joueurs
- Système de badges et gamification
- Notifications en temps réel
- Gestion du club MCCC

---

## 🗺️ Roadmap

### v1.3.0 — Réputation & Social ✅ TERMINÉ (14 janvier 2026)
- [x] ⭐ Système de réputation post-match
- [x] 🏅 Badge "Partenaire Fiable"
- [x] 🔔 Rappels d'inactivité (CRON)
- [x] 👋 "Nouveaux membres à accueillir"
- [x] 🛡️ Auto-validation matchs (24h)
- [x] ⚖️ Système de contestation (7 jours)

### v1.4.0 — Push & Polish ✅ TERMINÉ (20 janvier 2026)
- [x] 🔔 Notifications Push PWA (VAPID)
- [x] 🎨 Nouveau logo et branding vert
- [x] 🐛 Fix compteur participants Box Leagues
- [x] 🛡️ Rate limiting + Sentry monitoring
- [x] 🔧 Corrections build Netlify

### v1.5.0 — Monétisation (Février 2026)
- [ ] 💳 Intégration **Stripe** complète
- [ ] 📦 Plans Premium (€99/an) et Pro (€149/an)
- [ ] 🆓 Soft paywall avec tier Gratuit
- [ ] 📊 Analytics admin avancées

### v1.6.0 — Intégrations (Mars 2026)
- [ ] 📅 Intégration **Google Calendar**
- [ ] 💬 Intégration **WhatsApp**
- [ ] 📱 Mode hors-ligne amélioré
- [ ] 🔔 Notifications par email améliorées

### v2.0.0 — Expansion (Q2-Q3 2026)
- [ ] 🗺️ **Classements départementaux**
- [ ] 🏆 Tournois inter-clubs
- [ ] 📊 Statistiques avancées
- [ ] 🎯 **Objectif : 1000 joueurs**

---

## Contribuer

Vous êtes un **Pionnier** de TennisMatchFinder ? Vos retours sont précieux !

- 💬 Partagez vos suggestions sur le [Forum](https://tennismatchfinder.net/forum)
- 🐛 Signalez les bugs rencontrés
- 💡 Proposez des nouvelles fonctionnalités

Merci de faire partie de l'aventure ! 🎾

---

*Dernière mise à jour : 20 janvier 2026*
