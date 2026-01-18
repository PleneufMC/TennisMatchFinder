# Roadmap Recommandée — TennisMatchFinder

**Date** : 18 janvier 2026  
**Horizon** : Q1-Q3 2026  
**Deadline critique** : 30 juin 2026 (fin Early Bird)  
**Auteur** : Analyse stratégique automatisée

---

## Executive Summary

### Recommandation Principale

> **Priorité absolue : Stabiliser le core et assurer la conformité légale avant toute acquisition.**

TMF possède un USP technique fort (ELO transparent) mais manque de fondations solides (tests, RGPD). La stratégie recommandée est :

1. **Semaines 1-2** : Conformité légale + protection USP (tests ELO)
2. **Semaines 3-6** : Mobile-first (PWA + Push) pour rétention
3. **Mois 2-3** : Engagement avancé (challenges, chat)
4. **Q2** : Activation paywall avec base solide

### Top 5 Priorités Immédiates (Mise à jour 18/01/2026)

| Rang | Feature | ICE Score | Statut |
|------|---------|-----------|--------|
| ~~1~~ | ~~Tests unitaires ELO~~ | ~~85~~ | ✅ **FAIT** - 59 tests (commit 4fe9dcc) |
| ~~2~~ | ~~Notification badge unlock~~ | ~~80~~ | ✅ **FAIT** - BadgeCelebrationProvider (commit 42f20f1) |
| 3 | PWA + Push notifications | 75 | ⏳ Priorité suivante |
| ~~4~~ | ~~npm audit fix~~ | ~~75~~ | ✅ **Analysé** - devDependencies only, acceptable |
| ~~5~~ | ~~Corriger 6 casts `as any`~~ | ~~60~~ | ✅ **FAIT** - Tous supprimés (commit 0b24af7) |

> ✅ **Déjà implémenté** :
> - Banner cookies RGPD (`src/components/cookie-banner.tsx`)
> - Multilingue FR/EN (`messages/fr.json`, `messages/en.json` — 286 lignes chacun)

---

## Méthodologie de Priorisation

### Framework ICE Score

```
ICE = (Impact × Confidence × Ease) / 10
```

| Dimension | Échelle | Description |
|-----------|---------|-------------|
| **Impact** | 1-10 | Effet sur acquisition/rétention/revenue |
| **Confidence** | 1-10 | Certitude de réussite |
| **Ease** | 1-10 | Facilité d'implémentation (10=trivial) |

### Catégories de Priorité

| Niveau | Définition | Délai |
|--------|------------|-------|
| **P0 - Critical** | Bloque acquisition ou rétention | Cette semaine |
| **P1 - High** | Différenciation concurrentielle forte | Ce mois |
| **P2 - Medium** | Nice-to-have avec impact modéré | Ce trimestre |
| **P3 - Low** | Future consideration | Q2-Q3+ |

---

## 1. Phase Immédiate (Semaines 1-2)

### Objectif Phase
> **Conformité légale et protection du différenciateur technique**

**Budget temps** : 10 jours développeur  
**Date fin** : 31 janvier 2026

---

### 1.1 ~~Banner Cookies RGPD~~ ✅ DÉJÀ IMPLÉMENTÉ

> **Statut** : Complet et fonctionnel
> - `src/components/cookie-banner.tsx` (245 lignes)
> - `src/hooks/use-cookie-consent.ts` (134 lignes)
> - Modal de personnalisation avec 3 catégories
> - Persistance cookie 365 jours

**Aucune action requise.**

---

### 1.2 ~~Tests Unitaires Système ELO~~ ✅ TERMINÉ

**Commit** : `4fe9dcc` (18 janvier 2026)

**Résultats** :
- 59 tests passés en 0.9 seconde
- Couverture complète de `src/lib/elo/`
- Fichier créé : `src/lib/elo/__tests__/calculator.test.ts` (635 lignes)

**Tests créés** :
- ✅ calculateExpectedScore (6 tests)
- ✅ getKFactor (4 tests)
- ✅ calculateEloChange avec tous modificateurs (20 tests)
- ✅ calculateNewElo limites 100-3000 (3 tests)
- ✅ calculateEloTrend (4 tests)
- ✅ Helpers UI (10 tests)
- ✅ Scénarios réels (4 tests)

**Commande** : `npm test`

**Fichiers impactés** :
  - `src/lib/elo/__tests__/calculator.test.ts` (nouveau)
  - `src/lib/elo/__tests__/modifiers.test.ts` (nouveau)
- **Tests requis** : Auto-référent

**Structure tests :**
```typescript
// src/lib/elo/__tests__/calculator.test.ts
import { 
  calculateExpectedScore, 
  getKFactor, 
  calculateEloChange,
  ELO_CONSTANTS 
} from '../calculator';

describe('ELO Calculator', () => {
  describe('calculateExpectedScore', () => {
    test('returns 0.5 for equal ratings', () => {
      expect(calculateExpectedScore(1200, 1200)).toBeCloseTo(0.5, 2);
    });
    
    test('returns ~0.76 for +200 rating advantage', () => {
      expect(calculateExpectedScore(1400, 1200)).toBeCloseTo(0.76, 1);
    });
    
    test('returns value between 0 and 1', () => {
      const score = calculateExpectedScore(1000, 2000);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('getKFactor', () => {
    test('returns 40 for new player (<10 matches)', () => {
      expect(getKFactor(5)).toBe(40);
    });
    
    test('returns 32 for intermediate (10-30 matches)', () => {
      expect(getKFactor(20)).toBe(32);
    });
    
    test('returns 24 for established (>30 matches)', () => {
      expect(getKFactor(50)).toBe(24);
    });
  });

  describe('calculateEloChange', () => {
    test('winner gains, loser loses ELO', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 20,
        loserMatchCount: 20,
      });
      expect(result.winnerDelta).toBeGreaterThan(0);
      expect(result.loserDelta).toBeLessThan(0);
    });
    
    test('ELO never drops below MIN_ELO', () => {
      const result = calculateEloChange({
        winnerElo: 1500,
        loserElo: 100, // Already at minimum
        winnerMatchCount: 20,
        loserMatchCount: 20,
      });
      expect(100 + result.loserDelta).toBeGreaterThanOrEqual(ELO_CONSTANTS.MIN_ELO);
    });
  });
});
```

---

### 1.3 Notification Badge Unlock ⭐ QUICK WIN

**ICE Score** : 80 (Impact: 7, Confidence: 10, Ease: 10)

- **Justification** : 2h de travail pour améliorer l'engagement gamification
- **User Story** : En tant que joueur, je veux être notifié quand je débloque un badge
- **Critères d'acceptation** :
  - [ ] Notification créée lors du déblocage
  - [ ] Lien vers /achievements
  - [ ] Icône badge dans la notification
- **Estimation** : 2 heures
- **Dépendances** : Système notifications existant
- **Fichiers impactés** :
  - `src/lib/gamification/badge-checker.ts` (ligne ~180)
- **Tests requis** :
  - [ ] Test notification créée après badge unlock

**Code correctif :**
```typescript
// src/lib/gamification/badge-checker.ts
// Après la ligne qui attribue le badge (await db.insert(playerBadges)...)

// Créer notification pour le joueur
await db.insert(notifications).values({
  id: crypto.randomUUID(),
  playerId: playerId,
  type: 'badge_unlocked',
  title: `🏆 Nouveau badge : ${badge.name}`,
  message: badge.description,
  link: '/achievements',
  data: JSON.stringify({ 
    badgeId: badge.id, 
    icon: badge.icon,
    tier: badge.tier 
  }),
  createdAt: new Date(),
});
```

---

### 1.4 npm audit fix Vulnérabilités

**ICE Score** : 75 (Impact: 8, Confidence: 10, Ease: 9)

- **Justification** : 7 vulnérabilités (4 moderate, 3 high) = risque sécurité
- **Estimation** : 1 jour
- **Dépendances** : Aucune
- **Commandes** :
```bash
npm audit fix
# Si breaking changes nécessaires :
npm audit fix --force
npm test  # Vérifier que rien n'est cassé
```

---

### 1.5 Corriger les 7 casts `as any`

**ICE Score** : 60 (Impact: 6, Confidence: 9, Ease: 8)

- **Justification** : Type safety améliorée, prévention bugs
- **Estimation** : 2 jours
- **Fichiers impactés** :
  - `src/app/api/admin/create-open-club/route.ts`
  - `src/app/api/webhooks/n8n-bot/route.ts`
  - `src/lib/auth.ts` (3 occurrences)
  - `src/lib/db/queries.ts`

**Solution type-safe pour auth.ts :**
```typescript
// Étendre le type Session dans src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      player?: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
        currentElo: number;
        clubId: string;
        city: string | null;
        isAdmin: boolean;
        isVerified: boolean;
        clubName?: string;
        clubSlug?: string;
      } | null;
    } & DefaultSession['user'];
  }
}

// Puis utiliser session.user.player au lieu de (session.user as any).player
```

---

## 2. Phase Court Terme (Semaines 3-6)

### Objectif Phase
> **Mobile-first : PWA et notifications pour rivaliser avec Playtomic**

**Budget temps** : 15 jours développeur  
**Date fin** : 28 février 2026

---

### 2.1 PWA + Manifest

**ICE Score** : 72 (Impact: 9, Confidence: 8, Ease: 10)

- **Justification** : Gap critique vs concurrents qui ont des apps natives
- **User Story** : En tant que joueur mobile, je veux installer l'app sur mon écran d'accueil
- **Critères d'acceptation** :
  - [ ] `manifest.json` avec icônes 192x192 et 512x512
  - [ ] `theme_color` et `background_color` cohérents
  - [ ] Installable depuis Chrome/Safari
  - [ ] Splash screen au lancement
- **Estimation** : 3 jours
- **Dépendances** : Aucune
- **Fichiers impactés** :
  - `public/manifest.json` (nouveau)
  - `public/icons/` (nouveaux)
  - `src/app/layout.tsx` (meta tags)

---

### 2.2 Push Notifications

**ICE Score** : 70 (Impact: 9, Confidence: 8, Ease: 9)

- **Justification** : +25% engagement selon benchmarks Playtomic
- **User Story** : En tant que joueur, je veux recevoir des push pour les propositions de match
- **Critères d'acceptation** :
  - [ ] Service Worker enregistré
  - [ ] Permission demandée après première action
  - [ ] Push pour : nouvelle proposition, match confirmé, badge débloqué
  - [ ] Préférences push dans /settings
- **Estimation** : 4 jours
- **Dépendances** : PWA, Pusher Beams ou Firebase
- **Fichiers impactés** :
  - `public/sw.js` (nouveau)
  - `src/lib/push/` (nouveau module)
  - `src/app/(dashboard)/settings/page.tsx`

---

### 2.3 Challenges Hebdomadaires

**ICE Score** : 64 (Impact: 8, Confidence: 8, Ease: 10)

- **Justification** : Différenciateur gamification Strava-level
- **User Story** : En tant que joueur, je veux des défis hebdomadaires pour rester motivé
- **Critères d'acceptation** :
  - [ ] 3-5 challenges actifs par semaine
  - [ ] Types : matchs joués, adversaires différents, victoires
  - [ ] Récompenses : badges spéciaux, XP (futur)
  - [ ] Progression visible dans le dashboard
- **Estimation** : 10 jours
- **Dépendances** : Infrastructure badges existante
- **Fichiers impactés** :
  - `src/lib/db/schema.ts` (nouvelle table `challenges`)
  - `src/lib/gamification/challenges.ts` (nouveau)
  - `src/components/gamification/challenge-card.tsx` (nouveau)

---

### 2.4 Chat 1-to-1 Complet

**ICE Score** : 63 (Impact: 7, Confidence: 9, Ease: 10)

- **Justification** : Coordination matchs facilitée, social stickiness
- **User Story** : En tant que joueur, je veux discuter en privé avec un adversaire potentiel
- **Critères d'acceptation** :
  - [ ] Liste conversations DM dans /chat
  - [ ] Création conversation depuis profil joueur
  - [ ] Indicateur messages non lus
  - [ ] UI mobile-friendly
- **Estimation** : 5 jours
- **Dépendances** : Schema chat existant (chatRooms type='private')
- **Fichiers impactés** :
  - `src/app/(dashboard)/chat/page.tsx`
  - `src/components/chat/conversation-list.tsx` (nouveau)
  - `src/components/profile/send-message-button.tsx` (nouveau)

---

### 2.5 Suppression Compte RGPD

**ICE Score** : 61 (Impact: 8, Confidence: 9, Ease: 8)

- **Justification** : Conformité RGPD Article 17 (droit à l'effacement)
- **User Story** : En tant que joueur, je veux supprimer mon compte et mes données
- **Critères d'acceptation** :
  - [ ] Bouton dans /settings "Supprimer mon compte"
  - [ ] Modal confirmation avec saisie email
  - [ ] Anonymisation données (pas suppression pour historique matchs)
  - [ ] Annulation abonnement Stripe
  - [ ] Email confirmation suppression
- **Estimation** : 3 jours
- **Dépendances** : API Stripe pour cancel subscription
- **Fichiers impactés** :
  - `src/app/api/account/delete/route.ts` (nouveau)
  - `src/app/(dashboard)/settings/page.tsx`
  - `src/components/settings/delete-account-dialog.tsx` (nouveau)

---

## 3. Phase Moyen Terme (Mois 2-3)

### Objectif Phase
> **Engagement avancé et analytics pour optimiser conversion**

**Budget temps** : 20 jours développeur  
**Date fin** : 30 avril 2026

---

### 3.1 Analytics Avancées (Plausible)

**ICE Score** : 52 (Impact: 7, Confidence: 8, Ease: 9)

- **Justification** : Data-driven decisions, optimisation conversion
- **Estimation** : 2 jours
- **Recommandation** : Plausible (RGPD-friendly, pas de banner nécessaire)
- **Événements à tracker** :
  - `signup_complete`, `match_created`, `subscription_started`
  - `suggestion_clicked`, `badge_earned`, `forum_post_created`
  - `daily_active`, `weekly_active`

---

### ~~3.2 Multilingue Complet (EN)~~ ✅ DÉJÀ IMPLÉMENTÉ

> **Statut** : Complet et fonctionnel
> - `messages/fr.json` (286 lignes)
> - `messages/en.json` (286 lignes)
> - `src/lib/i18n/` (framework custom React Context)
> - Sélecteur de langue avec drapeaux 🇫🇷 🇬🇧
> - Persistance cookie 1 an

**Aucune action requise.**

---

### 3.3 Blocage/Signalement Utilisateurs

**ICE Score** : 48 (Impact: 6, Confidence: 9, Ease: 9)

- **Justification** : Modération communauté, prévention toxicité
- **Estimation** : 5 jours
- **Tables à ajouter** :
```sql
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY,
  blocker_id UUID REFERENCES players(id),
  blocked_id UUID REFERENCES players(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE user_reports (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES players(id),
  reported_id UUID REFERENCES players(id),
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3.4 SEO Complet

**ICE Score** : 46 (Impact: 6, Confidence: 9, Ease: 9)

- **Justification** : Acquisition organique
- **Estimation** : 3 jours
- **À implémenter** :
  - Sitemap dynamique (`src/app/sitemap.ts`)
  - robots.txt optimisé
  - Schema.org pour pages publiques
  - Open Graph images

---

### 3.5 OAuth Google/Apple

**ICE Score** : 42 (Impact: 5, Confidence: 9, Ease: 9)

- **Justification** : Réduction friction inscription
- **Estimation** : 3 jours
- **Config NextAuth** :
```typescript
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  AppleProvider({
    clientId: process.env.APPLE_CLIENT_ID!,
    clientSecret: process.env.APPLE_CLIENT_SECRET!,
  }),
]
```

---

## 4. Phase Long Terme (Q2-Q3 2026)

### Objectif Phase
> **Scaling et différenciation avancée post-paywall**

---

### 4.1 Système XP/Niveaux Joueur

- **Justification** : Gamification Strava-level
- **Estimation** : 2 semaines
- **Impact** : Rétention long terme

### 4.2 Tournois Inter-Clubs

- **Justification** : Expansion réseau, viralité
- **Estimation** : 3 semaines
- **Impact** : Growth B2B

### 4.3 App Mobile Native (React Native)

- **Justification** : UX optimale mobile
- **Estimation** : 2-3 mois
- **Condition** : Traction prouvée avec PWA

### 4.4 Mode Hors-Ligne PWA

- **Justification** : UX mobile avancée
- **Estimation** : 2 semaines
- **Périmètre** : Consultation profil, historique matchs

### 4.5 Multi-Appartenance Clubs

- **Justification** : Joueurs multi-clubs
- **Estimation** : 3 semaines
- **Complexité** : Refactoring schéma players

### 4.6 Assistant IA Forum

- **Justification** : Différenciation innovation
- **Estimation** : 2 semaines
- **Fonctionnalités** : Suggestions partenaires, modération assistée

---

## 5. Features Explicitement Déprioritisées

| Feature | Raison | Reconsidérer si... |
|---------|--------|-------------------|
| **App native immédiate** | Trop coûteux sans traction | PWA atteint limites engagement |
| **Classements départementaux** | Hors scope club-first | Demande B2B récurrente |
| **Intégration Google Calendar** | Nice-to-have | Users demandent massivement |
| **Mode match amical (sans ELO)** | Dilue le USP rating | Feedback négatif des users |
| **Multi-appartenance clubs** | Complexité architecture | Plus de 10 clubs actifs |

---

## 6. Métriques de Succès par Phase

| Phase | Métrique | Target | Méthode mesure |
|-------|----------|--------|----------------|
| **Immédiate** | Tests ELO coverage | >80% | Jest --coverage |
| **Immédiate** | Conformité RGPD | 100% | Checklist légale |
| **Court terme** | PWA installs | 20% users | Analytics |
| **Court terme** | Push opt-in rate | 50% | Pusher Beams |
| **Moyen terme** | DAU/MAU ratio | 30% | Analytics |
| **Moyen terme** | NPS | >40 | Survey |
| **30 juin** | Users actifs | 500 | DB count |
| **30 juin** | Conversion Premium | 5% | Stripe |

---

## 7. Ressources Requises

### Développement

| Ressource | Allocation | Notes |
|-----------|------------|-------|
| Pierre (full-stack) | 100% | Lead dev |
| Freelance UI | 5j ponctuels | PWA assets, icônes |
| Freelance tests | 3j ponctuels | Setup initial Jest |

### Budget Mensuel Estimé

| Poste | Coût |
|-------|------|
| Neon DB | €19/mois |
| Pusher | €25/mois |
| Stripe | 2.9% + €0.25/tx |
| Plausible (optionnel) | €9/mois |
| Resend SMTP | €20/mois |
| **Total estimé** | **~€75/mois** |

### Outils Recommandés

| Catégorie | Outil | Justification |
|-----------|-------|---------------|
| Analytics | Plausible | RGPD-friendly |
| Error tracking | Sentry | Monitoring erreurs |
| Push notifications | Pusher Beams | Déjà Pusher pour chat |
| Feature flags | Vercel Edge Config | Rollouts progressifs |

---

## 8. Plan de Contingence

### Si pas de traction Q1

**Indicateur** : <50 users actifs fin février  
**Action** : Pivoter vers B2B club-first exclusif
- Focus démo pour directions de club
- Offre white-label pour clubs premium
- Réduire scope B2C

### Si vulnérabilité critique découverte

**Indicateur** : CVE score ≥8 sur dépendance  
**Action** : Hotfix immédiat
- Revue sécurité complète
- Communication transparente users
- Audit externe si nécessaire

### Si concurrence agressive

**Indicateur** : Playtomic annonce rating transparent  
**Action** : Accélérer différenciateurs
- Double-down sur gamification
- Focus communauté club-first
- Marketing transparence ELO

### Si Early Bird prolongé nécessaire

**Indicateur** : <300 users fin mai  
**Action** : Maintenir deadline 30 juin mais soft paywall
- Tier gratuit très généreux
- Premium uniquement pour features avancées
- Focus sur conversion vs acquisition

---

## Annexes

### A. Matrice Effort/Impact

```
                    IMPACT
                High │ Medium │ Low
          ┌──────────┼────────┼──────────┐
     High │ Banner   │ Chat   │ OAuth    │
          │ Tests ELO│ 1-to-1 │          │
EFFORT    ├──────────┼────────┼──────────┤
   Medium │ PWA+Push │ i18n   │ XP System│
          │ Challenge│ SEO    │          │
          ├──────────┼────────┼──────────┤
     Low  │ Badge    │ Audit  │ Calendar │
          │ notif    │ fix    │ integ    │
          └──────────┴────────┴──────────┘
```

**Légende** : Faire d'abord le quadrant haut-gauche (High Impact, Low Effort)

### B. Dépendances entre Features

```
Banner Cookies ─────────────────────────────────────┐
                                                    │
Tests ELO ──────────────────────────────────────────┤
                                                    │
Badge Notif ────────────────────────────────────────┤
                                                    ├──► PHASE 1 COMPLETE
npm audit ──────────────────────────────────────────┤
                                                    │
as any fix ─────────────────────────────────────────┘
                                                    
PWA Manifest ──────────► Push Notifications ────────┐
                                                    │
Challenges ─────────────────────────────────────────┤
                                                    ├──► PHASE 2 COMPLETE
Chat 1-to-1 ────────────────────────────────────────┤
                                                    │
Delete Account ─────────────────────────────────────┘

Analytics ──────────────────────────────────────────┐
                                                    │
i18n EN ────────────────────────────────────────────┤
                                                    ├──► PHASE 3 COMPLETE
Modération ─────────────────────────────────────────┤
                                                    │
SEO + OAuth ────────────────────────────────────────┘
                                                    
                              ▼
                    30 JUIN: ACTIVATION PAYWALL
```

### C. Calendrier Prévisionnel

| Semaine | Features | Milestone |
|---------|----------|-----------|
| S3 (20-26 jan) | Banner cookies, Tests ELO (début) | — |
| S4 (27 jan-2 fév) | Tests ELO (fin), Badge notif, npm fix | ✅ Phase 1 |
| S5 (3-9 fév) | PWA Manifest | — |
| S6 (10-16 fév) | Push notifications | — |
| S7 (17-23 fév) | Challenges (début), Delete account | — |
| S8 (24 fév-2 mars) | Challenges (fin), Chat 1-to-1 | ✅ Phase 2 |
| S9-12 (mars) | Analytics, i18n, Modération, SEO | ✅ Phase 3 |
| S13-18 (avril-mai) | OAuth, Buffer, Polish | — |
| S19-22 (juin) | Tests finaux, Buffer | 🚀 Paywall |

---

*Document de roadmap — Révision recommandée : Bi-hebdomadaire*  
*Dernière mise à jour : 18 janvier 2026*  
*Prochaine révision : 1er février 2026*
