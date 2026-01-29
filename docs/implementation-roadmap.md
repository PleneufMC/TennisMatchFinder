# TennisMatchFinder - Roadmap d'Implémentation

*Plan de développement aligné sur la stratégie business*

---

## 🎯 Objectif Phase 1 : MVP Premium (4-6 semaines)

Créer une expérience "single-player mode" qui apporte de la valeur **avant** d'avoir une masse critique d'utilisateurs.

---

## 📋 Sprint 1 : Customisation Club & UX Premium (Semaine 1-2) ✅

### 1.1 Personnalisation visuelle par club
- [x] Image banner club (terre battue MCCC ajoutée)
- [x] Afficher le banner sur le dashboard
- [ ] Couleurs personnalisables par club (primary color)
- [x] Logo club dans le header
- [ ] Page d'accueil club publique (`/club/mccc`)

### 1.2 Design "Luxury Discretion"
- [x] Refonte header avec banner club
- [ ] Typography premium (Inter → système + accent font)
- [ ] Palette de couleurs terre battue (ocre, blanc, vert)
- [x] Animations subtiles (Framer Motion)
- [x] Mode sombre raffiné

### 1.3 Profil joueur enrichi
- [x] Section "À propos" étendue
- [x] Niveau de jeu détaillé (auto-évaluation)
- [x] Style de jeu préféré (main dominante)
- [x] Disponibilités (jours/créneaux)
- [x] Onboarding guidé en 5 écrans (`/onboarding`)

---

## 📋 Sprint 2 : Single-Player Mode (Semaine 2-3) ✅

### 2.1 Tracking de matchs manuel
- [x] Bouton "Enregistrer un match" rapide
- [x] Saisie score simplifiée (6-4, 6-3)
- [x] Adversaire : membre du club
- [x] Date, validation par l'adversaire
- [x] Système de confirmation de match
- [x] **Sélection du format de match** (1 set, 2 sets, 3 sets, super TB) ✨ NEW

### 2.2 Statistiques personnelles
- [x] Dashboard stats individuel
- [x] Graphique ELO évolution
- [x] Win rate global et par période
- [x] Adversaires les plus fréquents (Rivalités)
- [x] Série en cours (victoires/défaites - winStreak)
- [x] API ELO Breakdown (`GET /api/matches/[matchId]/elo-breakdown`)

### 2.3 Historique complet
- [x] Liste tous les matchs joués
- [x] Filtres : période, adversaire, résultat
- [ ] Export CSV (pour les data lovers)

---

## 📋 Sprint 3 : Gamification - Trophy Case 2.0 ✅ (Semaine 3-4)

### 3.1 Système de badges - **COMPLÉTÉ** ✅
- [x] Schéma DB : `badges` (table master) + `player_badges` (FK)
- [x] 16 badges répartis en 4 catégories :
  - **Milestones (5)** : First Rally, Getting Started, Habitué, Passionné, Century
  - **Achievements (4)** : Hot Streak, On Fire, Giant Killer, Rising Star
  - **Social (4)** : Social Butterfly, Pilier du Club, Rival Master, Comité d'accueil
  - **Special (4)** : King of Club, Founding Member, Champion, Roi de la Poule
- [x] Système de tiers (Common → Rare → Epic → Legendary)
- [x] Badges dynamiques (King of Club peut être perdu)
- [x] Migration SQL exécutée sur Neon ✅

### 3.2 UI Trophy Case 2.0 - **COMPLÉTÉ** ✅
- [x] `BadgeCard.tsx` - 3 états (locked/unlocked/just_unlocked)
- [x] `BadgeGrid.tsx` - Filtrage par catégorie + progression
- [x] `BadgeUnlockModal.tsx` - Célébration avec confetti 🎉
- [x] `BadgeProgressBar.tsx` - Barre de progression
- [x] `TrophyCase.tsx` - Page complète refactorisée
- [x] Styling par tier (couleurs, gradients, animations)

### 3.3 Backend Badges - **COMPLÉTÉ** ✅
- [x] `badge-checker.ts` - Service de vérification automatique
- [x] Triggers : `match_completed`, `elo_changed`, `tournament_won`, `box_league_won`
- [x] `GET /api/badges` - Récupérer les badges
- [x] `POST /api/badges/[badgeId]/seen` - Marquer comme vu
- [x] Intégration dans `POST /api/matches/[matchId]/confirm`
- [x] Backward-compatible (gestion erreurs si migration pas faite)

### 3.4 Streaks & Défis
- [x] Weekly Streak (semaines consécutives avec matchs)
- [x] Défis mensuels (`/achievements`)
- [ ] Objectifs personnalisables

### 3.5 Classement club amélioré
- [x] Classement ELO avec variations (+/-) 
- [x] Position et écart avec joueur précédent/suivant
- [x] "King of Club" : badge pour le #1

---

## 📋 Sprint 3.5 : Coefficient ELO par Format ✅ NEW (13 janvier 2026)

### USP vs Playtomic - Système ELO équitable 🎯

- [x] **Coefficients par format de match** :
  | Format | Coefficient | Justification |
  |--------|-------------|---------------|
  | 1 set | ×0.50 | Haute variance statistique |
  | 2 sets | ×0.80 | Format amateur standard |
  | 3 sets | ×1.00 | Impact complet |
  | Super TB | ×0.30 | Très aléatoire |

- [x] **Modificateur de marge de victoire** :
  | Écart | Modificateur | Exemple |
  |-------|--------------|---------|
  | ≥5 jeux | ×1.15 | 6-0, 6-1 |
  | 3-4 jeux | ×1.05 | 6-3, 6-2 |
  | 2 jeux | ×1.00 | 6-4 |
  | ≤1 jeu | ×0.90 | 7-6, 7-5 |

- [x] **Composants UI** :
  - `MatchFormatSelector.tsx` - Sélection intuitive avec indicateurs visuels
  - `EloBreakdownModal.tsx` - Explication détaillée du calcul (transparence totale)

- [x] **Schema DB** :
  - ENUM `match_format` créé
  - Colonne `match_format` ajoutée à `matches`
  - Colonnes `format_coefficient`, `margin_modifier` ajoutées à `elo_history`

- [x] **API** :
  - `POST /api/matches` accepte `matchFormat` (inféré du score si non fourni)
  - Response inclut `breakdown` complet pour affichage transparent

---

## 📋 Sprint 4 : Réputation & Social (Semaine 4-5) - ✅ COMPLÉTÉ

### 4.1 Système de réputation ✅
- [x] Évaluation post-match (optionnel)
  - Ponctualité : ⭐⭐⭐⭐⭐
  - Fair-play : ⭐⭐⭐⭐⭐
  - Convivialité : ⭐⭐⭐⭐⭐
- [x] Badge "Partenaire Fiable" (>4.5 moyenne, >5 évaluations)
- [x] Affichage discret sur le profil (ReputationBadge)
- [x] Modal d'évaluation après confirmation de match
- [x] API POST/GET /api/matches/[matchId]/rate

### 4.2 Suggestions intelligentes ✅
- [x] "Partenaires recommandés" basé sur ELO proche
- [x] Disponibilités compatibles (Match Now)
- [ ] Style de jeu complémentaire
- [x] "Joueurs actifs cette semaine"
- [x] "Nouveaux membres à accueillir" ✅ (section dédiée + tag)

### 4.3 Notifications ✅
- [x] Nouveau match proposé
- [x] Match Now - quelqu'un veut jouer
- [x] Rappel d'inactivité : "Vous n'avez pas joué depuis 7 jours" ✅ (CRON quotidien)
- [x] Badge débloqué (notification in-app)

### 4.4 Système Anti-Churn ✅ NEW (14 janvier 2026)
- [x] Auto-validation des matchs après 24h sans réponse
- [x] Rappel automatique après 6h si pas d'action
- [x] Contestation possible 7 jours après validation
- [x] Limite de 3 contestations par mois
- [x] UI avec countdown en temps réel
- [x] CRON jobs Netlify (auto-validate, reminders)

### 4.5 Administration Super Admin ✅
- [x] Suppression définitive d'un joueur (cascade complète)
- [x] Dialog de confirmation sécurisé

---

## 📋 Sprint 5 : Monétisation (Semaine 5-6) - ✅ COMPLÉTÉ (15 janvier 2026)

### 5.1 Mode Early Bird ✅
- [x] Accès Premium gratuit pour tous jusqu'au 30 juin 2026
- [x] Badge "Founding Member" pour les early adopters
- [x] Page `/pricing` avec offre de lancement
- [x] Variable `EARLY_BIRD_MODE` pour basculer facilement

### 5.2 Infrastructure Stripe ✅
- [x] Intégration Stripe complète (backend prêt)
- [x] **Produits Stripe configurés** :
  | Plan | Product ID | Price ID | Tarif |
  |------|------------|----------|-------|
  | Premium Mensuel | `prod_TkkGjS5zwAMEG0` | `price_1SnEm8IkmQ7vFcvcvPLnGOT2` | 9.99€/mois |
  | Premium Annuel | `prod_TkkIGodB2NEhoJ` | `price_1SnEnTIkmQ7vFcvcJdy5nWog` | 99€/an |
- [x] API `/api/stripe/checkout` - Création session checkout
- [x] API `/api/stripe/subscription` - Status abonnement
- [x] API `/api/stripe/portal` - Portail facturation client
- [x] Webhook `/api/webhooks/stripe` - Gestion événements Stripe
- [x] Tables DB `subscriptions` et `payments` créées
- [x] Migration SQL `stripe-subscriptions.sql`

### 5.3 Configuration Netlify ✅
- [x] `STRIPE_SECRET_KEY` configuré
- [x] `STRIPE_WEBHOOK_SECRET` configuré
- [x] `STRIPE_PRICE_PREMIUM_MONTHLY` configuré
- [x] `STRIPE_PRICE_PREMIUM_YEARLY` configuré

### 5.4 Paywall (prêt pour activation post-Early Bird)
- [x] `src/lib/stripe/paywall.ts` - Système de limites par tier
- [x] `src/lib/stripe/config.ts` - Plans FREE et PREMIUM définis
- [x] Fonctions `getUserTier()`, `canUseFeature()`, `getPlanLimits()`
- [ ] Activation du paywall (quand Early Bird termine)

### 5.5 Admin club avancé
- [x] Dashboard admin club
- [x] Gestion membres (approbation, rôles)
- [ ] Analytics club (membres actifs/inactifs)
- [ ] Export données membres
- [x] Personnalisation club (banner, description)

---

## 📋 Sprint 6 : Compétitions ✅

### 6.1 Box Leagues
- [x] Création de poules
- [x] Gestion des participants
- [x] Matchs de poule
- [x] Classement par poule
- [x] Badge "Roi de la Poule"

### 6.2 Tournois
- [x] Création tournoi (bracket)
- [x] Inscription participants
- [x] Gestion matchs tournoi
- [x] Badge "Champion"
- [ ] Tableau dynamique en temps réel

---

## 🏗️ Architecture Technique

### Tables DB (mise à jour 15 janvier 2026)

```sql
-- Badges Master Table
CREATE TABLE badges (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  criteria TEXT NOT NULL,
  category badge_category NOT NULL,
  tier badge_tier NOT NULL,
  icon VARCHAR(50) NOT NULL,
  icon_color VARCHAR(20),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_dynamic BOOLEAN NOT NULL DEFAULT false,
  max_progress INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Player Badges
CREATE TABLE player_badges (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) REFERENCES badges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  seen BOOLEAN NOT NULL DEFAULT false,
  earned_at TIMESTAMP DEFAULT NOW(),
  seen_at TIMESTAMP
);

-- Matches (avec format)
ALTER TABLE matches ADD COLUMN match_format match_format NOT NULL DEFAULT 'two_sets';
-- ENUM: 'one_set', 'two_sets', 'three_sets', 'super_tiebreak'

-- ELO History (avec breakdown)
ALTER TABLE elo_history 
ADD COLUMN format_coefficient DECIMAL(3,2),
ADD COLUMN margin_modifier DECIMAL(3,2);

-- Subscriptions (Stripe) ✨ NEW
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments (Stripe) ✨ NEW
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_payment_intent_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'eur',
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Routes (complètes)

```
# Matchs
POST /api/matches                         -- Créer un match (avec matchFormat)
POST /api/matches/[matchId]/confirm       -- Confirmer + check badges
GET  /api/matches/[matchId]/elo-breakdown -- Détail calcul ELO complet
POST /api/matches/[matchId]/rate          -- Évaluer l'adversaire
POST /api/matches/[matchId]/contest       -- Contester un résultat

# Badges
GET  /api/badges                          -- Badges du joueur
POST /api/badges/[badgeId]/seen           -- Marquer badge vu
POST /api/admin/badges/founding-member    -- Attribuer badge Founding Member

# Stripe ✨ NEW
POST /api/stripe/checkout                 -- Créer session checkout
GET  /api/stripe/subscription             -- Status abonnement
POST /api/stripe/portal                   -- Portail facturation
POST /api/webhooks/stripe                 -- Webhook Stripe

# CRON Jobs
POST /api/cron/auto-validate-matches      -- Auto-validation 24h
POST /api/cron/match-reminders            -- Rappels 6h
POST /api/cron/inactivity-reminder        -- Rappel inactivité 7j

# Onboarding
POST /api/onboarding                      -- Créer profil joueur
```

---

## 📊 KPIs par Sprint

| Sprint | Métrique cible | Statut |
|--------|----------------|--------|
| 1 | Design score NPS >7/10 sur 5 testeurs | ✅ Complété |
| 2 | 80% des matchs trackables en <30 sec | ✅ Complété |
| 3 | 16 badges disponibles, 3+ gagnables jour 1 | ✅ Complété |
| 3.5 | Coefficient ELO par format fonctionnel | ✅ Complété |
| 4 | Système de réputation post-match | ✅ Complété |
| 5 | Infrastructure Stripe prête | ✅ Complété |
| 6 | Box Leagues et Tournois | ✅ Complété |
| 7 | Parrainage + NPS Survey (AARRR) | ✅ Complété |
| - | Taux de parrainage >10% | ⏳ À mesurer |
| - | NPS >40 | ⏳ À mesurer |
| - | Conversion freemium >3% | ⏳ Post-Early Bird |

---

## 🚀 Fonctionnalités livrées - 15 janvier 2026

### 💳 Sprint 5 : Monétisation (USP Business)
- ✅ Mode Early Bird : accès Premium gratuit jusqu'au 30/06/2026
- ✅ Page `/pricing` avec offre de lancement
- ✅ Infrastructure Stripe complète (backend prêt)
- ✅ Webhook configuré et opérationnel
- ✅ Variables d'environnement Netlify configurées
- ✅ Tables DB `subscriptions` et `payments`
- ✅ 2 plans : Gratuit et Premium (9.99€/mois ou 99€/an)

### 🎾 Coefficient ELO par Format (USP majeur)
- ✅ Système de coefficients équitable (1 set ×0.5 → 3 sets ×1.0)
- ✅ Modificateur de marge de victoire (6-0 ≠ 7-6)
- ✅ Composant `MatchFormatSelector` avec indicateurs visuels
- ✅ Modal `EloBreakdownModal` pour transparence totale
- ✅ API enrichie avec breakdown complet
- ✅ Migration SQL exécutée sur Neon

### 🏆 Trophy Case 2.0 (Gamification complète)
- ✅ Migration DB badges exécutée sur Neon
- ✅ 16 badges avec système de tiers (common → legendary)
- ✅ UI complète : BadgeCard, BadgeGrid, BadgeUnlockModal
- ✅ Célébration avec confetti pour badges epic/legendary
- ✅ Backward-compatible (graceful degradation)

### ⭐ Sprint 4 : Réputation & Anti-Churn
- ✅ Système de réputation post-match (3 critères)
- ✅ Auto-validation matchs 24h
- ✅ Contestation 7 jours
- ✅ CRON jobs automatisés

---

## 📁 Structure fichiers créés (15 janvier 2026)

```
src/
├── app/
│   ├── (auth)/
│   │   └── onboarding/
│   │       └── page.tsx                    -- Onboarding 5 étapes
│   ├── (public)/
│   │   └── pricing/
│   │       └── page.tsx                    -- Page tarifs (Early Bird)
│   ├── (dashboard)/
│   │   └── achievements/
│   │       └── page.tsx                    -- Page Trophy Case
│   └── api/
│       ├── badges/
│       │   ├── route.ts                    -- GET badges joueur
│       │   └── [badgeId]/seen/route.ts     -- POST marquer vu
│       ├── matches/
│       │   ├── route.ts                    -- POST avec matchFormat
│       │   └── [matchId]/
│       │       ├── confirm/route.ts        -- Avec check badges
│       │       ├── rate/route.ts           -- Évaluation
│       │       ├── contest/route.ts        -- Contestation
│       │       └── elo-breakdown/route.ts  -- Détail calcul ELO
│       ├── stripe/                         -- ✨ NEW Sprint 5
│       │   ├── checkout/route.ts           -- Session checkout
│       │   ├── subscription/route.ts       -- Status abonnement
│       │   └── portal/route.ts             -- Portail client
│       ├── webhooks/
│       │   └── stripe/route.ts             -- ✨ NEW Webhook Stripe
│       ├── cron/
│       │   ├── auto-validate-matches/route.ts
│       │   ├── match-reminders/route.ts
│       │   └── inactivity-reminder/route.ts
│       └── onboarding/
│           └── route.ts                    -- Création profil
│
├── components/
│   ├── elo/
│   │   └── elo-breakdown-modal.tsx         -- Modal transparence ELO
│   ├── gamification/
│   │   ├── BadgeCard.tsx
│   │   ├── BadgeGrid.tsx
│   │   ├── BadgeProgressBar.tsx
│   │   ├── BadgeUnlockModal.tsx
│   │   ├── badge-notification.tsx
│   │   └── trophy-case.tsx
│   ├── matches/
│   │   └── match-format-selector.tsx       -- Sélecteur format
│   ├── reputation/
│   │   ├── rating-modal.tsx
│   │   └── reputation-badge.tsx
│   └── onboarding/
│       └── onboarding-steps.tsx
│
├── lib/
│   ├── db/
│   │   ├── schema.ts                       -- Tables + ENUMs
│   │   └── seed-badges.ts
│   ├── elo/                                -- Module ELO refactorisé
│   │   ├── index.ts
│   │   ├── calculator.ts
│   │   ├── format-coefficients.ts
│   │   ├── modifiers.ts
│   │   └── types.ts
│   ├── stripe/                             -- ✨ NEW Sprint 5
│   │   ├── client.ts
│   │   ├── config.ts                       -- Plans FREE/PREMIUM
│   │   ├── index.ts
│   │   ├── paywall.ts                      -- Limites par tier
│   │   └── subscription.ts                 -- Gestion abonnements
│   ├── gamification/
│   │   ├── badges.ts
│   │   ├── badge-checker.ts
│   │   ├── streaks.ts
│   │   ├── challenges.ts
│   │   └── index.ts
│   └── constants/
│       └── validation.ts                   -- Config anti-churn
│
└── migrations/
    ├── trophy-case-2.0.sql                 -- Badges (exécuté ✅)
    ├── match-format-coefficients.sql       -- Format ELO (exécuté ✅)
    ├── reputation-system.sql               -- Réputation (exécuté ✅)
    ├── match-validation-contestation.sql   -- Anti-churn (exécuté ✅)
    ├── onboarding-system.sql               -- Onboarding (exécuté ✅)
    └── stripe-subscriptions.sql            -- ✨ NEW Stripe (exécuté ✅)
```

---

## 📣 Sprint 7 : AARRR - Referral & Retention ✅ COMPLÉTÉ (29 janvier 2026)

### 7.1 Système de Parrainage ✅
- [x] Page d'invitation personnalisée `/invite/[playerId]`
- [x] Affichage infos parrain (nom, ELO, club, matchs, win rate)
- [x] Capture paramètre `?ref=` à l'inscription
- [x] Tracking conversions : pending → completed → rewarded
- [x] Triggers PostgreSQL pour stats automatiques
- [x] Badge **Ambassador** (3 filleuls) - Rare
- [x] Badge **Networker** (10 filleuls) - Epic
- [x] Section profil "Mes parrainages" avec stats
- [x] Vue analytics `v_referral_analytics`
- [x] Migration SQL : `migrations/referral-system.sql`
- [x] **PR #5** mergée

### 7.2 NPS Survey ✅
- [x] Modal NPS (score 0-10 avec couleurs dynamiques)
- [x] Feedback textuel optionnel
- [x] Déclenchement auto après 5 matchs OU 30 jours
- [x] Cooldown 90 jours entre surveys
- [x] Dashboard admin `/admin/nps`
  - Score NPS global (-100 à +100)
  - Distribution Promoteurs/Passifs/Détracteurs
  - Liste des réponses avec feedback
  - Filtres par période
- [x] Calcul NPS : Détracteurs (0-6), Passifs (7-8), Promoteurs (9-10)
- [x] Vues analytics : `v_nps_analytics`, `v_nps_global`
- [x] Migration SQL : `migrations/nps-survey.sql`
- [x] **PR #6** mergée

---

## 🔜 Prochaines étapes

### Sprint 8 : Activation & Acquisition
- [ ] OAuth Google/Apple (réduire friction inscription)
- [ ] Tracking UTM amélioré (attribution marketing)
- [ ] PWA + Push notifications

### Phase 2 : Post-Early Bird (Juillet 2026)
1. **Activer le paywall** - Basculer `EARLY_BIRD_MODE = false`
2. **Promotion Early Birds** - Offre spéciale pour les premiers membres
3. **Conversion tracking** - Analytics sur les upgrades

### Fonctionnalités futures envisagées
- [ ] Weekly Streak (engagement)
- [ ] Email digest hebdomadaire (rétention)
- [ ] Page stats publique profil (viralité)
- [ ] Plan "Club" pour multi-club management
- [ ] Inter-clubs : matchs entre clubs différents

---

## 📈 Métriques de succès

| Métrique | Cible | Status |
|----------|-------|--------|
| Utilisateurs inscrits | 100+ | ⏳ En cours |
| Matchs enregistrés/semaine | 50+ | ⏳ En cours |
| Badges débloqués | 500+ | ⏳ En cours |
| Taux de rétention J7 | >40% | ⏳ En cours |
| Conversion Premium (post-EB) | >5% | ⏳ Post-Early Bird |

---

*Dernière mise à jour : 29 janvier 2026 - Sprint 7 AARRR (Parrainage + NPS) complété*
