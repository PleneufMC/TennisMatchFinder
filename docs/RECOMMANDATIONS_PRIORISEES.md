# Recommandations Priorisées - TennisMatchFinder

**Date** : 8 janvier 2026  
**Horizon** : Early Bird se termine le 30 juin 2026  

---

## Vue d'ensemble des priorités

| Niveau | Nombre | Deadline | Focus |
|--------|--------|----------|-------|
| **CRITIQUE** | 4 | Avant 30/06/2026 | Conformité + Qualité |
| **HAUTE** | 5 | Q1 2026 | Engagement + Conformité |
| **MOYENNE** | 6 | Q2 2026 | Expansion + UX |
| **BASSE** | 5 | Futur | Nice to have |

---

## PRIORITÉ CRITIQUE

### 1. Implémenter Banner Cookies RGPD

**Risque actuel** : Non-conformité RGPD - Sanctions possibles  
**Effort** : 2 jours  
**Impact** : Conformité légale obligatoire

**Actions** :
```
1. Installer react-cookie-consent ou équivalent
2. Créer composant CookieBanner avec :
   - Accepter tous
   - Refuser non-essentiels
   - Personnaliser
3. Intégrer avec /cookies policy existante
4. Stocker consentement (localStorage + tracking)
5. Conditionner Stripe cookies au consentement
```

**Fichiers à créer/modifier** :
- `src/components/cookie-banner.tsx` (nouveau)
- `src/app/layout.tsx` (intégration)
- `src/hooks/use-cookie-consent.ts` (nouveau)

**Dépendances** :
```bash
npm install react-cookie-consent
```

---

### 2. Tests Unitaires Système ELO

**Risque actuel** : Régression sur le core métier = perte de confiance  
**Effort** : 1 semaine  
**Impact** : Sécuriser le différenciateur clé

**Couverture minimale** :
```typescript
// Tests à implémenter
describe('ELO Calculator', () => {
  // Calculs de base
  test('calculateExpectedScore retourne valeur entre 0 et 1');
  test('calculateNewElo respecte les bornes MIN_ELO/MAX_ELO');
  test('calculateKFactor retourne K correct selon matchesPlayed');
  
  // Modificateurs
  test('bonus nouvel adversaire = 1.15');
  test('malus répétition décroît avec matches récents');
  test('bonus upset activé si écart >= 100');
  test('bonus diversité activé si 3+ adversaires/semaine');
  
  // Cas limites
  test('ELO ne descend pas sous 100');
  test('ELO ne dépasse pas 3000');
  test('match nul impossible au tennis');
});
```

**Setup** :
```bash
npm install --save-dev jest @types/jest ts-jest
npx ts-jest config:init
```

**Fichiers à créer** :
- `src/lib/elo/__tests__/calculator.test.ts`
- `src/lib/elo/__tests__/modifiers.test.ts`
- `jest.config.js`

---

### 3. Tests E2E Parcours Critiques

**Risque actuel** : Bugs en production non détectés  
**Effort** : 1 semaine  
**Impact** : Qualité produit garantie

**Parcours à tester** :
```
1. Inscription → Magic Link → Dashboard
2. Création de match → Confirmation → Mise à jour ELO
3. Souscription Premium → Checkout Stripe → Accès features
4. Admin : Approuver demande adhésion → Email bienvenue
```

**Setup Playwright** :
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Structure** :
```
e2e/
├── auth.spec.ts        # Parcours auth
├── match.spec.ts       # Parcours match
├── subscription.spec.ts # Parcours paiement
└── admin.spec.ts       # Parcours admin
```

---

### 4. Activer Notification Badge (Quick Win)

**Risque actuel** : UX dégradée gamification  
**Effort** : 2 heures  
**Impact** : Engagement utilisateurs

**Code actuel** :
```typescript
// src/lib/gamification/badge-service.ts:97-98
// TODO: Créer une notification pour le joueur
```

**Action** :
```typescript
// Décommenter et implémenter
import { createNotification } from '@/lib/db/queries';

await createNotification({
  playerId: playerId,
  type: 'badge_unlocked',
  title: `Nouveau badge : ${badge.name}`,
  message: badge.description,
  link: '/achievements',
  metadata: { badgeId: badge.id, icon: badge.icon }
});
```

---

## PRIORITÉ HAUTE

### 5. Suppression Compte RGPD

**Exigence** : Droit à l'effacement (Article 17 RGPD)  
**Effort** : 3 jours  
**Impact** : Conformité légale

**Implémentation** :
```
1. API: POST /api/account/delete
   - Vérifier identité (re-authentication)
   - Anonymiser données (ne pas supprimer pour historique matchs)
   - Supprimer données personnelles
   - Annuler abonnement Stripe
   - Envoyer email confirmation
   
2. UI: /settings → Section "Zone dangereuse"
   - Modal confirmation avec saisie email
   - Délai de grâce 14 jours (optionnel)
```

**Données à traiter** :
| Table | Action |
|-------|--------|
| users | Anonymiser email, supprimer name/image |
| players | Anonymiser fullName, phone, bio, photo |
| chat_messages | Remplacer senderId par "Utilisateur supprimé" |
| forum_threads/replies | Garder contenu, anonymiser auteur |
| matches | Garder pour historique, anonymiser si les deux supprimés |
| subscriptions | Annuler + marquer deleted |
| notifications | Supprimer |
| player_badges | Supprimer |

---

### 6. PWA + Push Notifications

**Bénéfice** : Engagement mobile x3 en moyenne  
**Effort** : 1 semaine  
**Impact** : Rétention utilisateurs

**Implémentation** :
```
1. Manifest (public/manifest.json)
2. Service Worker (public/sw.js)
3. Configuration push (Pusher Beams ou Firebase)
4. Hook useServiceWorker
5. Composant demande permission
```

**Notifications push à implémenter** :
- Nouvelle proposition de match
- Match confirmé
- Nouveau badge débloqué
- Nouveau message chat (optionnel)

---

### 7. Analytics (Plausible/PostHog)

**Bénéfice** : Décisions data-driven  
**Effort** : 2 jours  
**Impact** : Optimisation conversion

**Choix recommandé** : Plausible (RGPD-friendly, pas de banner nécessaire)

**Événements à tracker** :
```typescript
// Conversion
'signup_complete'
'match_created'
'subscription_started'

// Engagement
'suggestion_clicked'
'badge_earned'
'forum_post_created'

// Rétention
'daily_active'
'weekly_active'
'match_played'
```

**Setup** :
```bash
npm install plausible-tracker
```

---

### 8. Emails Transactionnels Complets

**État actuel** : Infra prête, pas activé partout  
**Effort** : 2 jours  
**Impact** : Engagement + confiance

**Emails à activer** :
| Email | Trigger | Template existant |
|-------|---------|-------------------|
| Bienvenue membre | Adhésion approuvée | ✅ sendWelcomeMemberEmail |
| Adhésion refusée | Rejet | ✅ sendJoinRequestRejectedEmail |
| Proposition match | Nouvelle proposition | ❌ À créer |
| Match confirmé | Confirmation | ❌ À créer |
| Badge débloqué | Attribution | ❌ À créer |

---

### 9. Documentation API OpenAPI

**Bénéfice** : Maintenabilité + collaboration  
**Effort** : 1 semaine  
**Impact** : Développement accéléré

**Setup** :
```bash
npm install swagger-jsdoc swagger-ui-react
```

**Structure** :
```yaml
openapi: 3.0.0
info:
  title: TennisMatchFinder API
  version: 1.0.0
paths:
  /api/matches:
    get:
      summary: Liste des matchs du joueur
      security:
        - BearerAuth: []
      responses:
        200:
          description: Liste des matchs
```

---

## PRIORITÉ MOYENNE

### 10. Internationalisation (EN)

**Bénéfice** : Marché anglophone  
**Effort** : 2 semaines  
**Impact** : Expansion internationale

**Setup next-intl** :
```bash
npm install next-intl
```

**Structure** :
```
messages/
├── fr.json
└── en.json
```

**Priorité traductions** :
1. UI principale (dashboard, navigation)
2. Emails transactionnels
3. Pages légales
4. Forum (garder contenu en langue originale)

---

### 11. Chat 1-to-1 Complet

**État actuel** : Schema prêt, UI basique  
**Effort** : 1 semaine  
**Impact** : Communication directe

**À implémenter** :
- Liste conversations DM
- Création conversation depuis profil
- Indicateur nouveaux messages
- Interface dédiée mobile-friendly

---

### 12. Recherche Forum Full-Text

**Bénéfice** : Retrouver discussions passées  
**Effort** : 3 jours  
**Impact** : UX forum

**Implémentation PostgreSQL** :
```sql
-- Ajouter index full-text
CREATE INDEX idx_threads_search 
ON forum_threads 
USING GIN(to_tsvector('french', title || ' ' || content));
```

---

### 13. OAuth Google/Apple

**Bénéfice** : Réduction friction inscription  
**Effort** : 3 jours  
**Impact** : Conversion signup

**NextAuth config** :
```typescript
// src/lib/auth.ts
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

### 14. SEO Complet

**Manquant** : Sitemap, structured data  
**Effort** : 3 jours  
**Impact** : Acquisition organique

**À implémenter** :
- `public/sitemap.xml` dynamique
- `public/robots.txt`
- Schema.org pour pages publiques
- Open Graph images

---

### 15. Filtres Avancés Classement (Premium)

**Définition** : Feature Premium déjà prévue  
**Effort** : 1 semaine  
**Impact** : Valeur Premium + UX

**Filtres** :
- Par période (30j, 90j, année)
- Par surface
- Par type de match
- Progression ELO

---

## PRIORITÉ BASSE

### 16. Match Amical (sans ELO)

**Demande utilisateur probable**  
**Effort** : 2 jours  

**Implémentation** :
- Flag `isFriendly` sur matches
- Toggle dans formulaire création
- Exclusion du calcul ELO

---

### 17. Blocage/Signalement Utilisateurs

**Modération communautaire**  
**Effort** : 1 semaine  

**Tables à ajouter** :
```sql
blocked_users (blocker_id, blocked_id)
user_reports (reporter_id, reported_id, reason, status)
```

---

### 18. Assistant IA Forum

**Innovation différenciante**  
**Effort** : 2 semaines  

**Fonctionnalités** :
- Réponses automatiques basiques
- Suggestions de partenaires
- Résumés discussions
- Modération assistée

---

### 19. Mode Hors-Ligne PWA

**UX mobile avancée**  
**Effort** : 2 semaines  

**Périmètre** :
- Consultation profil
- Historique matchs
- Classement (cache)
- Synchronisation au retour online

---

### 20. Multi-appartenance Clubs

**Complexité élevée**  
**Effort** : 3 semaines  

**Impact architecture** :
- Refactoring schéma players
- ELO par club distinct
- UI sélection club actif

---

## Planning Recommandé

```
                    JANVIER 2026
┌─────────────────────────────────────────────────────┐
│ Sem 1-2 │ Banner Cookies + Tests ELO               │
│ Sem 3-4 │ Tests E2E + Notification badges          │
└─────────────────────────────────────────────────────┘

                    FÉVRIER 2026
┌─────────────────────────────────────────────────────┐
│ Sem 1-2 │ Suppression compte RGPD                  │
│ Sem 3-4 │ PWA + Push notifications                 │
└─────────────────────────────────────────────────────┘

                    MARS 2026
┌─────────────────────────────────────────────────────┐
│ Sem 1   │ Analytics Plausible                      │
│ Sem 2-3 │ Emails transactionnels complets          │
│ Sem 4   │ Documentation API                        │
└─────────────────────────────────────────────────────┘

                    AVRIL-MAI 2026
┌─────────────────────────────────────────────────────┐
│         │ Internationalisation EN                  │
│         │ Chat 1-to-1 complet                      │
│         │ SEO + OAuth                              │
└─────────────────────────────────────────────────────┘

                    JUIN 2026
┌─────────────────────────────────────────────────────┐
│         │ Buffer + Tests finaux avant paywall      │
│ 30 JUIN │ FIN EARLY BIRD - Activation paywall      │
└─────────────────────────────────────────────────────┘
```

---

## Métriques de succès

| Objectif | Métrique | Cible |
|----------|----------|-------|
| Conformité | Banner cookies + RGPD suppression | 100% |
| Qualité | Couverture tests ELO | >80% |
| Engagement | Taux ouverture emails | >40% |
| Mobile | Installations PWA | 20% users |
| Rétention | DAU/MAU ratio | >30% |

---

## Budget estimé

| Catégorie | Coût |
|-----------|------|
| Plausible Analytics | ~9€/mois |
| Push notifications (Pusher Beams) | ~25€/mois |
| Tests CI (GitHub Actions) | Gratuit (open source) |
| **Total mensuel** | **~34€/mois** |

---

## Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Retard tests | Bugs en prod | Prioriser tests ELO uniquement |
| Complexité PWA | Délai | Commencer par manifest seul |
| RGPD non-conforme | Sanctions | Faire banner cookies en premier |
| Early Bird prolongé | Revenus | Maintenir deadline 30/06 |

---

*Document généré le 8 janvier 2026*  
*Prochaine révision : 1er février 2026*
