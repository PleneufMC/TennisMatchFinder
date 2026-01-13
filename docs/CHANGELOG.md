# 📋 Changelog TennisMatchFinder

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

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

### v1.3.0 — Réputation & Social (Janvier-Février 2026)
- [ ] ⭐ Système de réputation post-match
- [ ] 🏅 Badge "Partenaire Fiable"
- [ ] 🔔 Rappels d'inactivité
- [ ] 👋 "Nouveaux membres à accueillir"

### v1.4.0 — Monétisation (Février 2026)
- [ ] 💳 Intégration **Stripe**
- [ ] 📦 Plans Premium (€99/an) et Pro (€149/an)
- [ ] 🆓 Soft paywall avec tier Gratuit
- [ ] 📊 Analytics admin avancées

### v1.5.0 — Intégrations & International (Mars 2026)
- [ ] 📅 Intégration **Google Calendar**
- [ ] 💬 Intégration **WhatsApp**
- [ ] 🌍 **Version anglaise** (i18n)
- [ ] 📱 PWA améliorée

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

*Dernière mise à jour : 13 janvier 2026*
