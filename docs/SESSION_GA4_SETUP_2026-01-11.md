# Session de Configuration GA4 - TennisMatchFinder

> **Date** : 11 janvier 2026  
> **Participants** : Pierre (Product Owner) + Alex (Expert Product Marketing)  
> **Objectif** : Configurer le tracking GA4 pour les campagnes d'acquisition

---

## 1. Contexte

Préparation du tracking analytics pour la campagne d'acquisition Q1 2026 :
- **Budget** : 1 000€
- **Objectif** : 100 inscrits minimum
- **Période** : 8 semaines (Mi-mars → Mi-mai 2026)
- **CPL cible** : ≤ 10€

---

## 2. Problèmes identifiés et résolus

### 2.1 Bug : Import useState mal placé
**Fichier** : `src/components/google-analytics.tsx`

**Problème** : L'import `useState` était placé à la fin du fichier (ligne 200) au lieu d'être avec les autres imports, causant une erreur runtime potentielle.

**Solution** :
```typescript
// AVANT (ligne 200)
// Import manquant
import { useState } from 'react';

// APRÈS (ligne 4)
import { useEffect, useState } from 'react';
```

### 2.2 Variable d'environnement non standardisée
**Fichier** : `.env.local.example`

**Problème** : Le fichier exemple utilisait `NEXT_PUBLIC_GA_ID` mais le code attendait `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

**Solution** : Standardisation sur `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### 2.3 Événements de conversion non implémentés
**Problème** : Le code GA4 existait mais les événements de conversion marketing n'étaient pas appelés dans les composants.

**Solution** : Branchement du tracking dans :
- `src/components/auth/register-form.tsx`
- `src/app/(public)/page.tsx` (via `SignupCtaButton`)

---

## 3. Modifications apportées au code

### 3.1 Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/components/google-analytics.tsx` | Fix import + 8 nouveaux événements marketing |
| `src/components/auth/register-form.tsx` | Ajout tracking signup_started et signup_completed |
| `src/app/(public)/page.tsx` | Remplacement CTA par SignupCtaButton |
| `.env.local.example` | Variable GA4 standardisée + Meta Pixel |

### 3.2 Nouveaux fichiers créés

| Fichier | Description |
|---------|-------------|
| `src/components/tracking/cta-button.tsx` | Composant CTA avec tracking intégré |
| `docs/GA4_SETUP_GUIDE.md` | Guide de configuration GA4 |
| `docs/SESSION_GA4_SETUP_2026-01-11.md` | Ce document |

### 3.3 Nouveaux événements de tracking

```typescript
// Événements de conversion marketing ajoutés
trackSignupStarted(source)      // Clic sur CTA inscription
trackSignupCompleted(clubSlug)  // Inscription réussie
trackFirstMatchCreated(elo)     // Premier match (activation)
trackMatchNowActivated()        // Mode disponibilité
trackEloViewed(elo)             // Consultation classement
trackLandingPageView(variant)   // Vue landing page
trackCtaClicked(name, location) // Clic CTA générique
trackPricingViewed(tier)        // Vue page pricing
```

---

## 4. Configuration GA4

### 4.1 Propriété GA4
- **Nom** : TennisMatchFinder
- **Measurement ID** : `G-SK1KGRV9KK`
- **Flux de données** : Web - tennismatchfinder.net

### 4.2 Variable Netlify
```
NEXT_PUBLIC_GA_MEASUREMENT_ID = G-SK1KGRV9KK
```
Configurée dans : Netlify → Site configuration → Environment variables

### 4.3 Événements personnalisés créés dans GA4
Via Administration → Événements → Configurations personnalisées :

| Événement | Condition |
|-----------|-----------|
| `signup_started` | `event_name` est égal à `signup_started` |
| `signup_completed` | `event_name` est égal à `signup_completed` |

### 4.4 Consentement cookies
Le tracking GA4 ne s'active qu'après acceptation des cookies analytics.
- Cookie de consentement : `tmf_cookie_consent`
- Format : `{"status":"accepted","preferences":{"analytics":true}}`

---

## 5. Tests effectués

### 5.1 Test temps réel GA4
- ✅ `page_view` : visible
- ✅ `signup_started` : visible après clic sur "Rejoindre gratuitement"
- ✅ `form_start` : visible
- ✅ `session_start` : visible

### 5.2 Test console DevTools
```
[GA4] trackSignupStarted: landing_hero
```
Message visible dans la console après clic sur le CTA.

### 5.3 Cookies GA4 vérifiés
- ✅ `_ga` : présent
- ✅ `_ga_SK1KGRV9KK` : présent (cookie spécifique à la propriété)

---

## 6. Commits Git

### PR #2 (mergée)
```
feat(analytics): fix GA4 integration and add marketing conversion events

- Fix useState import order in google-analytics.tsx
- Add 8 new marketing conversion events
- Standardize env var name to NEXT_PUBLIC_GA_MEASUREMENT_ID
- Update .env.local.example with GA4, Sentry, and Meta Pixel sections
- Add comprehensive GA4 setup guide (docs/GA4_SETUP_GUIDE.md)
```

### Commits directs sur main
```
feat(analytics): Wire up GA4 tracking in signup flow and landing page

- Add useGoogleAnalytics hook to RegisterForm component
- Track signup_started when form is submitted
- Track signup_completed when registration succeeds
- Create TrackedCtaButton component for landing page CTAs
- Replace hero CTA with SignupCtaButton (tracks landing_hero source)
```

```
fix(analytics): Add debug logs and fix onClick propagation in SignupCtaButton
```

---

## 7. Actions en attente

### À faire dans 24-48h
Les événements `signup_started` et `signup_completed` doivent être marqués comme **Événements clés** (conversions) dans GA4 :

1. Aller dans **Administration → Événements**
2. Les événements `signup_started` et `signup_completed` apparaîtront dans la liste
3. Cliquer sur l'**étoile ☆** pour les marquer comme Événements clés

### Pour les campagnes Google Ads
1. Lier le compte Google Ads à GA4 :
   - Administration → Associations de produits → Associations à Google Ads
2. Importer les conversions dans Google Ads :
   - Google Ads → Outils → Conversions → Importer depuis GA4

---

## 8. Architecture du tracking

```
┌─────────────────────────────────────────────────────────────┐
│                     LANDING PAGE                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SignupCtaButton (onClick)                          │   │
│  │  → trackSignupStarted('landing_hero')               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    REGISTER FORM                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  onSubmit                                            │   │
│  │  → trackSignupStarted('register_form')               │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  onSuccess                                           │   │
│  │  → trackSignupCompleted(clubSlug, 'magic_link')      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GOOGLE ANALYTICS 4                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Événements reçus :                                  │   │
│  │  • signup_started (source: landing_hero/register)    │   │
│  │  • signup_completed (club: mccc, method: magic_link) │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Conversions (à configurer) :                        │   │
│  │  • signup_started → valeur: 1€                       │   │
│  │  • signup_completed → valeur: 10€                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Checklist pour lancement campagne

### Technique ✅
- [x] GA4 configuré et actif
- [x] Variable Netlify configurée
- [x] Tracking signup_started implémenté
- [x] Tracking signup_completed implémenté
- [x] Test temps réel validé
- [ ] Événements marqués comme conversions (attendre 24-48h)

### Marketing (à faire)
- [ ] Créer audiences Facebook/Instagram
- [ ] Préparer 5 créatifs vidéo
- [ ] Configurer campagne Google Ads longue traîne
- [ ] Créer landing pages persona-spécifiques
- [ ] Lier Google Ads à GA4

---

## 10. Ressources

- **GA4 Property** : https://analytics.google.com/ (TennisMatchFinder - G-SK1KGRV9KK)
- **Netlify** : https://app.netlify.com/sites/tennismatchfinder
- **GitHub** : https://github.com/PleneufMC/TennisMatchFinder
- **Production** : https://tennismatchfinder.net
- **Guide GA4** : `docs/GA4_SETUP_GUIDE.md`

---

*Document généré le 11 janvier 2026*  
*Session animée par Alex, Expert Product Marketing SaaS Sport*
