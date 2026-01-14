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

## 📋 Sprint 5 : Monétisation & Admin (Semaine 5-6)

### 5.1 Tiers et restrictions
- [ ] Définir limites tier Gratuit
- [ ] Implémentation soft paywall
- [ ] Page pricing (`/pricing`)

### 5.2 Système d'abonnement
- [ ] Intégration Stripe
- [ ] Plans : Premium (€99/an), Pro (€149/an)
- [ ] Gestion abonnement (upgrade, cancel)
- [ ] Période d'essai 30 jours

### 5.3 Admin club avancé
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

### Tables DB (mise à jour 14 janvier 2026)

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
```

### API Routes (complètes)

```
# Matchs
POST /api/matches                         -- Créer un match (avec matchFormat)
POST /api/matches/[matchId]/confirm       -- Confirmer + check badges
GET  /api/matches/[matchId]/elo-breakdown -- Détail calcul ELO complet

# Badges
GET  /api/badges                          -- Badges du joueur
POST /api/badges/[badgeId]/seen           -- Marquer badge vu

# Gamification
GET  /api/gamification                    -- Stats gamification

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
| 5 | Conversion freemium >3% | ⏳ À faire |

---

## 🚀 Fonctionnalités livrées - 13 janvier 2026

### 🎾 Coefficient ELO par Format (USP majeur)
- ✅ Système de coefficients équitable (1 set ×0.5 → 3 sets ×1.0)
- ✅ Modificateur de marge de victoire (6-0 ≠ 7-6)
- ✅ Composant `MatchFormatSelector` avec indicateurs visuels
- ✅ Modal `EloBreakdownModal` pour transparence totale
- ✅ API enrichie avec breakdown complet
- ✅ Migration SQL préparée pour Neon

### 🏆 Trophy Case 2.0 (Gamification complète)
- ✅ Migration DB badges exécutée sur Neon
- ✅ 16 badges avec système de tiers (common → legendary)
- ✅ UI complète : BadgeCard, BadgeGrid, BadgeUnlockModal
- ✅ Célébration avec confetti pour badges epic/legendary
- ✅ Backward-compatible (graceful degradation)

### 📱 Onboarding & API
- ✅ Onboarding guidé en 5 écrans (`/onboarding`)
- ✅ API ELO Breakdown détaillée
- ✅ Fix route dynamique `[matchId]` vs `[id]`

---

## 📁 Structure fichiers créés (13 janvier 2026)

```
src/
├── app/
│   ├── (auth)/
│   │   └── onboarding/
│   │       └── page.tsx                    -- Onboarding 5 étapes
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
│       │       └── elo-breakdown/route.ts  -- Détail calcul ELO
│       └── onboarding/
│           └── route.ts                    -- Création profil
│
├── components/
│   ├── elo/
│   │   └── elo-breakdown-modal.tsx         -- Modal transparence ELO ✨ NEW
│   ├── gamification/
│   │   ├── BadgeCard.tsx
│   │   ├── BadgeGrid.tsx
│   │   ├── BadgeProgressBar.tsx
│   │   ├── BadgeUnlockModal.tsx
│   │   ├── badge-notification.tsx
│   │   └── trophy-case.tsx
│   ├── matches/
│   │   └── match-format-selector.tsx       -- Sélecteur format ✨ NEW
│   └── onboarding/
│       ├── OnboardingFlow.tsx
│       ├── WelcomeStep.tsx
│       ├── ProfileStep.tsx
│       ├── LevelStep.tsx
│       ├── AvailabilityStep.tsx
│       └── FirstMatchStep.tsx
│
├── lib/
│   ├── db/
│   │   ├── schema.ts                       -- Tables + ENUM match_format
│   │   └── seed-badges.ts
│   ├── elo/                                -- Module ELO refactorisé ✨ NEW
│   │   ├── index.ts
│   │   ├── calculator.ts                   -- Calcul avec coefficients
│   │   ├── format-coefficients.ts          -- Constantes & helpers
│   │   ├── modifiers.ts
│   │   └── types.ts
│   └── gamification/
│       ├── badges.ts
│       ├── badge-checker.ts
│       ├── streaks.ts
│       ├── challenges.ts
│       └── index.ts
│
└── migrations/
    ├── trophy-case-2.0.sql                 -- Badges (exécuté)
    └── match-format-coefficients.sql       -- Format ELO ✨ NEW (à exécuter)
```

---

## 🔜 Prochaines étapes prioritaires

1. **Exécuter migration SQL** `match-format-coefficients.sql` sur Neon
2. **Intégrer MatchFormatSelector** dans le formulaire de saisie de match
3. **Sprint 4** : Système de réputation post-match
4. **Sprint 5** : Intégration Stripe pour monétisation

---

*Dernière mise à jour : 14 janvier 2026 - Sprint 4 complété*
