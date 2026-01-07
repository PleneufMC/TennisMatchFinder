# TennisMatchFinder - Roadmap d'Implémentation

*Plan de développement aligné sur la stratégie business*

---

## 🎯 Objectif Phase 1 : MVP Premium (4-6 semaines)

Créer une expérience "single-player mode" qui apporte de la valeur **avant** d'avoir une masse critique d'utilisateurs.

---

## 📋 Sprint 1 : Customisation Club & UX Premium (Semaine 1-2)

### 1.1 Personnalisation visuelle par club
- [x] Image banner club (terre battue MCCC ajoutée)
- [ ] Afficher le banner sur le dashboard
- [ ] Couleurs personnalisables par club (primary color)
- [ ] Logo club dans le header
- [ ] Page d'accueil club publique (`/club/mccc`)

### 1.2 Design "Luxury Discretion"
- [ ] Refonte header avec banner club
- [ ] Typography premium (Inter → système + accent font)
- [ ] Palette de couleurs terre battue (ocre, blanc, vert)
- [ ] Animations subtiles (Framer Motion)
- [ ] Mode sombre raffiné

### 1.3 Profil joueur enrichi
- [ ] Section "À propos" étendue
- [ ] Niveau de jeu détaillé (coup droit, revers, service, volée)
- [ ] Style de jeu préféré (attaquant, défenseur, tout-terrain)
- [ ] Équipement (raquette, cordage - optionnel)

---

## 📋 Sprint 2 : Single-Player Mode (Semaine 2-3)

### 2.1 Tracking de matchs manuel
- [ ] Bouton "Enregistrer un match" rapide
- [ ] Saisie score simplifiée (6-4, 6-3)
- [ ] Adversaire : membre du club OU nom libre
- [ ] Date, lieu (court), durée
- [ ] Notes personnelles (optionnel)

### 2.2 Statistiques personnelles
- [ ] Dashboard stats individuel
- [ ] Graphique ELO évolution (déjà existant, améliorer)
- [ ] Win rate global et par période
- [ ] Adversaires les plus fréquents
- [ ] Performance par surface (si tracking)
- [ ] Série en cours (victoires/défaites)

### 2.3 Historique complet
- [ ] Liste tous les matchs joués
- [ ] Filtres : période, adversaire, résultat
- [ ] Export CSV (pour les data lovers)

---

## 📋 Sprint 3 : Gamification (Semaine 3-4)

### 3.1 Système de badges
- [ ] Schéma DB : `player_badges`, `badge_definitions`
- [ ] Badges de progression :
  - 🎾 "Premier Match" - Premier match enregistré
  - 🔥 "En Feu" - 3 victoires consécutives
  - ⭐ "Série de 5" - 5 victoires consécutives
  - 🏆 "10 Victoires" - 10 matchs gagnés
  - 🎯 "Régulier" - 10 matchs en 1 mois
  - 🤝 "Social" - 5 adversaires différents
  - 📈 "Progression" - +100 ELO en 1 mois

### 3.2 Streaks & Défis
- [ ] Streak de jours consécutifs avec activité
- [ ] Défi hebdomadaire : "Jouez 3 matchs cette semaine"
- [ ] Objectifs personnalisables

### 3.3 Classement club amélioré
- [ ] Classement ELO avec variations (+/-) 
- [ ] Filtres : Tous, ce mois, cette semaine
- [ ] Position et écart avec joueur précédent/suivant
- [ ] "Votre rival" : joueur ELO le plus proche

---

## 📋 Sprint 4 : Réputation & Social (Semaine 4-5)

### 4.1 Système de réputation
- [ ] Évaluation post-match (optionnel)
  - Ponctualité : ⭐⭐⭐⭐⭐
  - Fair-play : ⭐⭐⭐⭐⭐
  - Convivialité : ⭐⭐⭐⭐⭐
- [ ] Badge "Partenaire Fiable" (>4.5 moyenne, >5 évaluations)
- [ ] Affichage discret sur le profil

### 4.2 Suggestions intelligentes
- [ ] "Partenaires recommandés" basé sur :
  - ELO proche (±100)
  - Disponibilités compatibles
  - Style de jeu complémentaire
- [ ] "Joueurs actifs cette semaine"
- [ ] "Nouveaux membres à accueillir"

### 4.3 Notifications
- [ ] Nouveau match proposé près de votre niveau
- [ ] Quelqu'un veut jouer maintenant
- [ ] Rappel : "Vous n'avez pas joué depuis 7 jours"
- [ ] Badge débloqué

---

## 📋 Sprint 5 : Monétisation & Admin (Semaine 5-6)

### 5.1 Tiers et restrictions
- [ ] Définir limites tier Gratuit :
  - 3 recherches partenaire/semaine
  - 5 conversations chat actives
  - Historique 10 derniers matchs
- [ ] Implémentation soft paywall
- [ ] Page pricing (`/pricing`)

### 5.2 Système d'abonnement
- [ ] Intégration Stripe
- [ ] Plans : Premium (€99/an), Pro (€149/an)
- [ ] Gestion abonnement (upgrade, cancel)
- [ ] Période d'essai 30 jours

### 5.3 Admin club avancé
- [ ] Dashboard analytics club
  - Membres actifs / inactifs
  - Matchs organisés / semaine
  - Engagement chat
- [ ] Export données membres
- [ ] Personnalisation club (banner, couleurs, description)

---

## 🏗️ Architecture Technique

### Nouvelles tables DB
```sql
-- Badges
CREATE TABLE badge_definitions (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10), -- emoji
  category VARCHAR(50), -- 'progression', 'social', 'achievement'
  criteria JSONB NOT NULL, -- conditions d'obtention
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE player_badges (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  badge_id UUID REFERENCES badge_definitions(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, badge_id)
);

-- Évaluations
CREATE TABLE match_ratings (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  rater_id UUID REFERENCES players(id),
  rated_id UUID REFERENCES players(id),
  punctuality INTEGER CHECK (punctuality BETWEEN 1 AND 5),
  fair_play INTEGER CHECK (fair_play BETWEEN 1 AND 5),
  friendliness INTEGER CHECK (friendliness BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, rater_id)
);

-- Abonnements
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL, -- 'free', 'premium', 'pro'
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Routes à créer
```
POST /api/matches/record     -- Enregistrer match manuel
GET  /api/stats/personal     -- Stats personnelles
GET  /api/badges/available   -- Badges disponibles
POST /api/ratings            -- Évaluer un partenaire
GET  /api/suggestions        -- Partenaires suggérés
POST /api/subscriptions      -- Créer abonnement Stripe
```

---

## 📊 KPIs par Sprint

| Sprint | Métrique cible |
|--------|----------------|
| 1 | Design score NPS >7/10 sur 5 testeurs |
| 2 | 80% des matchs trackables en <30 sec |
| 3 | 3+ badges gagnables dès le premier jour |
| 4 | Taux de suggestion acceptée >20% |
| 5 | Conversion freemium >3% |

---

## 🚀 Quick Wins Immédiats

### Cette semaine
1. ✅ Image banner MCCC ajoutée
2. [ ] Afficher banner sur dashboard
3. [ ] Améliorer page profil (plus de détails)
4. [ ] Bouton "Enregistrer un match" visible

### Semaine prochaine
1. [ ] Stats personnelles basiques
2. [ ] 3 premiers badges
3. [ ] Classement avec variations ELO

---

## 📁 Structure fichiers à créer

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── stats/
│   │   │   └── page.tsx          -- Stats personnelles
│   │   ├── matchs/
│   │   │   └── enregistrer/
│   │   │       └── page.tsx      -- Enregistrer match
│   │   └── badges/
│   │       └── page.tsx          -- Mes badges
│   ├── pricing/
│   │   └── page.tsx              -- Page tarifs
│   └── api/
│       ├── matches/
│       │   └── record/route.ts   -- API enregistrement
│       ├── stats/
│       │   └── route.ts          -- API stats
│       ├── badges/
│       │   └── route.ts          -- API badges
│       └── subscriptions/
│           └── route.ts          -- API Stripe
├── components/
│   ├── stats/
│   │   ├── elo-chart.tsx
│   │   ├── win-rate-card.tsx
│   │   └── match-history.tsx
│   ├── badges/
│   │   ├── badge-card.tsx
│   │   └── badge-grid.tsx
│   └── club/
│       ├── club-banner.tsx
│       └── club-header.tsx
└── lib/
    ├── badges/
    │   ├── definitions.ts        -- Définitions badges
    │   └── check-earned.ts       -- Vérification critères
    └── stripe/
        └── client.ts             -- Config Stripe
```

---

*Dernière mise à jour : 7 janvier 2026*
