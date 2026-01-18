# TennisMatchFinder — Statut Projet Centralisé

**Dernière mise à jour** : 18 janvier 2026  
**Version** : 1.3.1  
**Commit** : `6fd0895`  
**URL Production** : https://tennismatchfinder.net  
**Repository** : https://github.com/PleneufMC/TennisMatchFinder

---

## 1. Vue d'Ensemble

### 1.1 Positionnement Produit

> **"Le Strava du Tennis en Club Privé"**

TennisMatchFinder est une plateforme SaaS B2B2C de matchmaking tennis amateur avec un système ELO transparent — différenciateur unique vs Playtomic dont le rating opaque est la frustration #1 des utilisateurs.

### 1.2 Métriques Actuelles

| Métrique | Valeur Actuelle | Objectif Q2 2026 | Écart |
|----------|-----------------|------------------|-------|
| Users inscrits | ~25 | 500 | -95% |
| Clubs actifs | 2 (MCCC + Open Club) | 10 | -80% |
| Matchs/semaine | ~5 | 50 | -90% |
| DAU/MAU ratio | ~15% | 30% | -50% |
| Conversion Premium | 0% (Early Bird) | 5% | N/A |
| NPS | Non mesuré | 40+ | N/A |

### 1.3 Santé Technique

| Indicateur | Statut | Notes |
|------------|--------|-------|
| **Build** | ✅ Passing | Dernière CI: 18 jan 2026 |
| **TypeScript** | ✅ Strict | Compile sans erreurs |
| **Tests** | ⚠️ 0% coverage | Critique pour ELO |
| **Sécurité** | ⚠️ 7 vulnérabilités npm | 4 moderate, 3 high |
| **Performance** | ✅ | TTFB < 200ms |
| **Uptime** | ✅ 99.9% | Netlify CDN |

### 1.4 Stack Technique

```
Frontend:  Next.js 14.2.35 | TypeScript 5.x | Tailwind CSS 3.4.1 | Radix UI
Backend:   Next.js API Routes | Drizzle ORM 0.38.3 | NextAuth.js 4.24.7
Database:  Neon PostgreSQL (serverless) | 27 tables
Real-time: Pusher Channels | WebSockets
Payments:  Stripe (checkout, portal, webhooks)
Hosting:   Netlify (Edge Functions) | Custom domain
Analytics: GA4 (G-SK1KGRV9KK) | Meta Pixel
```

---

## 2. Changelog Versions

### v1.3.1 "Security Fixes" (18 janvier 2026) — EN PRODUCTION

**Corrections critiques P0 de l'audit technique :**
- ✅ Suppression webhook Stripe dupliqué (`/api/webhooks/stripe`)
- ✅ Logs sensibles auth.ts conditionnés au dev (`debugLog`)
- ✅ Injection SQL corrigée dans auto-validate-matches (Drizzle ORM)
- ✅ Header HSTS ajouté dans netlify.toml

### v1.3.0 "Réputation & Anti-Churn" (14 janvier 2026)

**Nouveautés majeures :**
- ✅ Système de réputation post-match (3 critères)
- ✅ Badge "Partenaire Fiable" (≥4.5 moyenne, ≥5 avis)
- ✅ Auto-validation matchs après 24h
- ✅ Système de contestation (7 jours)
- ✅ Rappels d'inactivité CRON (7 jours)
- ✅ "Nouveaux membres à accueillir"
- ✅ Suppression joueur (super-admin)

### v1.2.0 "Trophy Case & Fair ELO" (13 janvier 2026)

**Nouveautés majeures :**
- ✅ Trophy Case 2.0 (16 badges, 4 tiers)
- ✅ Coefficients ELO par format (1set=0.5, 3sets=1.0)
- ✅ Modal EloBreakdownModal (transparence totale)
- ✅ Onboarding guidé en 5 étapes

### v1.1.0 "Open Club" (13 janvier 2026)

**Nouveautés majeures :**
- ✅ Open Club (club par défaut)
- ✅ Box Leagues (poules de compétition)
- ✅ Intégration GA4 + Meta Pixel
- ✅ WebAuthn/Passkeys (biométrique)
- ✅ i18n FR/EN (partiel)

### v1.0.0 "Lancement" (Décembre 2025)

- ✅ Core features : auth, profils, matchs, ELO
- ✅ Chat temps réel (Pusher)
- ✅ Forum de discussion
- ✅ Système de badges
- ✅ Multi-tenant clubs

---

## 3. Sprint Actuel

### Objectif Sprint (Semaines 3-4 janvier 2026)

> **Stabilisation et conformité légale avant acquisition**

### User Stories Actives

| ID | Story | Status | Priorité | Effort |
|----|-------|--------|----------|--------|
| US-51 | Banner cookies RGPD | ⏳ Pending | P0 | 2j |
| US-52 | Tests unitaires ELO | ⏳ Pending | P0 | 5j |
| US-53 | Notification badge unlock | ⏳ Pending | P0 | 2h |
| US-54 | npm audit fix vulnérabilités | ⏳ Pending | P1 | 1j |
| US-55 | Corriger 7 casts `as any` | ⏳ Pending | P1 | 2j |
| US-56 | Validation Zod /api/matches | ⏳ Pending | P1 | 1j |

### Blockers Actuels

| Blocker | Impact | Mitigation |
|---------|--------|------------|
| 0% test coverage sur ELO | Risque régression USP | Priorité P0 |
| 7 vulnérabilités npm | Risque sécurité | npm audit fix |

---

## 4. Backlog Priorisé

### P0 — Cette Semaine (Critiques)

| Feature | Effort | Impact | ICE Score |
|---------|--------|--------|-----------|
| Banner cookies RGPD | 2j | 10 (légal) | 90 |
| Tests unitaires ELO | 5j | 10 (USP) | 85 |
| Notification badge unlock | 2h | 7 | 80 |
| npm audit fix | 1j | 8 | 75 |

### P1 — Ce Mois (Importantes)

| Feature | Effort | Impact | ICE Score |
|---------|--------|--------|-----------|
| PWA + Manifest | 3j | 9 | 72 |
| Push notifications | 4j | 9 | 70 |
| Challenges hebdomadaires | 10j | 8 | 64 |
| Chat 1-to-1 complet | 5j | 7 | 63 |
| Suppression compte RGPD | 3j | 8 | 61 |
| Multilingue complet (EN) | 10j | 7 | 56 |

### P2 — Ce Trimestre (Améliorations)

| Feature | Effort | Impact | ICE Score |
|---------|--------|--------|-----------|
| Analytics avancées (Plausible) | 2j | 7 | 52 |
| Blocage/signalement utilisateurs | 5j | 6 | 48 |
| SEO complet (sitemap, schema.org) | 3j | 6 | 46 |
| OAuth Google/Apple | 3j | 5 | 42 |
| Emails transactionnels complets | 4j | 6 | 40 |
| Documentation API OpenAPI | 5j | 5 | 35 |

### P3 — Futur (Nice-to-have)

| Feature | Effort | Impact |
|---------|--------|--------|
| Système XP/Niveaux | 2 sem | 6 |
| Tournois inter-clubs | 3 sem | 7 |
| App mobile native | 2-3 mois | 9 |
| Mode hors-ligne PWA | 2 sem | 5 |
| Multi-appartenance clubs | 3 sem | 4 |
| Assistant IA forum | 2 sem | 5 |

---

## 5. Dette Technique

### Critique (à traiter immédiatement)

| Item | Fichiers | Impact | Estimation |
|------|----------|--------|------------|
| 0% test coverage ELO | `src/lib/elo/` | Régression USP | 5j |
| 7 vulnérabilités npm | `package.json` | Sécurité | 1j |
| 7 casts `as any` | Divers | Type safety | 2j |
| 35/67 routes sans Zod | `src/app/api/` | Validation | 3j |

### À Surveiller

| Item | Fichiers | Impact | Estimation |
|------|----------|--------|------------|
| Fichiers >500 lignes (12) | Schema, queries, services | Maintenabilité | 1 sem |
| 5 TODOs dans le code | Divers | Features incomplètes | 2j |
| 14 dépendances outdated | `package.json` | Compatibilité | 1j |
| Console.log en prod (37) | API routes | Logs pollution | 2j |

### Fichiers les Plus Volumineux

| Fichier | Lignes | Action Recommandée |
|---------|--------|-------------------|
| `src/lib/db/schema.ts` | 1456 | Splitter par domaine |
| `src/app/(public)/strategie-digitale/page.tsx` | 1454 | OK (contenu) |
| `src/lib/db/queries.ts` | 1146 | Splitter par module |
| `src/lib/gamification/badge-checker.ts` | 862 | Refactoring |
| `src/lib/tournaments/service.ts` | 757 | OK |

### TODOs Identifiés dans le Code

```typescript
// src/app/api/matches/[matchId]/elo-breakdown/route.ts
// TODO: Vérifier si l'utilisateur est membre du même club

// src/lib/box-leagues/service.ts
trend: 'stable' as const, // TODO: Implémenter le calcul de tendance

// src/lib/gamification/streaks.ts
// TODO: Récupérer le best streak depuis un champ de la DB ou calculer

// src/lib/match-now/service.ts
// TODO: En mode proximité, notifier par géolocalisation

// src/lib/stripe/subscription.ts
// TODO: Désactiver cette ligne quand on active le paywall
```

---

## 6. Dépendances & Intégrations

| Service | Statut | Dernière vérif | Notes |
|---------|--------|----------------|-------|
| **Neon DB** | ✅ Actif | 18 jan 2026 | Pool connections OK |
| **Stripe** | ✅ Actif | 18 jan 2026 | Webhook URL corrigée |
| **Pusher** | ✅ Actif | 18 jan 2026 | Cluster EU |
| **Resend SMTP** | ✅ Actif | 18 jan 2026 | Magic links OK |
| **GA4** | ✅ Actif | 18 jan 2026 | G-SK1KGRV9KK |
| **Meta Pixel** | ✅ Actif | 18 jan 2026 | 672907449567233 |
| **Netlify** | ✅ Actif | 18 jan 2026 | Auto-deploy main |

### Variables d'Environnement Requises

```env
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://tennismatchfinder.net
NEXTAUTH_SECRET=...

# Email
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PASSWORD=re_...
EMAIL_FROM=TennisMatchFinder <noreply@tennismatchfinder.net>

# Pusher
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-SK1KGRV9KK
NEXT_PUBLIC_META_PIXEL_ID=672907449567233

# Feature Flags
EARLY_BIRD_MODE=true

# CRON
CRON_SECRET=...
```

---

## 7. Risques Projet

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Régression ELO sans tests | Haute | Critique | P0: Tests unitaires |
| Non-conformité RGPD | Haute | Critique | P0: Banner cookies |
| Churn early adopters | Moyenne | Élevé | Gamification, push notifs |
| Playtomic améliore rating | Moyenne | Moyen | Différenciation club-first |
| Ressources limitées (1 dev) | Haute | Élevé | Priorisation ICE stricte |
| Retard paywall (30 juin) | Moyenne | Élevé | Buffer sprint final |

### Plan de Contingence

| Scénario | Action |
|----------|--------|
| Pas de traction Q1 | Pivoter vers B2B club-first exclusif |
| Vulnérabilité critique | Hotfix immédiat, revue sécurité |
| Concurrence agressive | Accélérer différenciateurs (ELO, gamification) |

---

## 8. Décisions Architecture

### ADR-001: JWT vs Sessions DB
**Contexte** : Choix stratégie session NextAuth  
**Décision** : JWT avec enrichissement via callback session  
**Conséquences** :
- ✅ Performance (pas de query DB par requête)
- ✅ Scaling serverless (pas d'état serveur)
- ⚠️ Invalidation nécessite attendre expiration (30j)

### ADR-002: Custom Drizzle Adapter
**Contexte** : `@auth/drizzle-adapter` incompatible next-auth@4.x  
**Décision** : Adapter custom 516 lignes dans `src/lib/auth.ts`  
**Conséquences** :
- ✅ Contrôle total sur le mapping
- ⚠️ Maintenance manuelle

### ADR-003: Multi-tenant par clubId
**Contexte** : Isolation données entre clubs  
**Décision** : FK clubId sur toutes les tables métier  
**Conséquences** :
- ✅ Isolation forte
- ⚠️ Pas de multi-appartenance possible actuellement

### ADR-004: ELO transparent avec modificateurs
**Contexte** : Différenciation vs Playtomic (rating opaque)  
**Décision** : Formule ELO standard + 4 modificateurs documentés  
**Conséquences** :
- ✅ USP marketing fort
- ✅ Confiance utilisateurs
- ⚠️ Exploitation potentielle (gaming)

### ADR-005: Pusher vs Socket.io
**Contexte** : Chat temps réel  
**Décision** : Pusher Channels (managed)  
**Conséquences** :
- ✅ Pas d'infrastructure à gérer
- ✅ Scaling automatique
- ⚠️ Coût mensuel (~€25/mois)

---

## 9. Métriques de Succès

### Q1 2026 (Acquisition)

| Métrique | Target | Méthode Mesure |
|----------|--------|----------------|
| Users inscrits | 100 | DB count |
| Clubs actifs | 5 | DB count |
| Matchs/semaine | 20 | Analytics |
| NPS early users | >40 | Survey |
| Rétention J7 | >25% | Cohort analysis |

### Q2 2026 (Monétisation)

| Métrique | Target | Méthode Mesure |
|----------|--------|----------------|
| Users inscrits | 500 | DB count |
| Conversion Premium | 5% | Stripe |
| MRR | €500 | Stripe |
| DAU/MAU | >30% | Analytics |
| Churn mensuel | <5% | Cohort analysis |

---

## 10. Ressources & Contacts

### Liens Utiles

| Ressource | URL |
|-----------|-----|
| Production | https://tennismatchfinder.net |
| GitHub | https://github.com/PleneufMC/TennisMatchFinder |
| Netlify Dashboard | https://app.netlify.com/sites/tennismatchfinder |
| Neon Console | https://console.neon.tech |
| Stripe Dashboard | https://dashboard.stripe.com |
| Pusher Dashboard | https://dashboard.pusher.com |
| GA4 | https://analytics.google.com |

### Documentation Projet

| Document | Chemin | Description |
|----------|--------|-------------|
| README | `/README.md` | Guide démarrage |
| CLAUDE.md | `/CLAUDE.md` | Instructions AI |
| Technical Briefing | `/docs/TECHNICAL_BRIEFING.md` | Architecture |
| Audit Concurrentiel | `/docs/AUDIT_COMPETITIVE_GAP.md` | Gap analysis |
| Roadmap | `/docs/ROADMAP_RECOMMENDATION.md` | Priorisation |
| Schema DB | `/docs/SCHEMA_MODELE_DONNEES.md` | Modèle données |
| Changelog | `/docs/CHANGELOG.md` | Historique |

---

## 11. Calendrier Clé

```
┌─────────────────────────────────────────────────────────────┐
│                     JANVIER 2026                             │
├─────────────────────────────────────────────────────────────┤
│ Sem 3 (13-19) │ ✅ v1.3.0 Réputation & Anti-Churn           │
│               │ ✅ v1.3.1 Security Fixes P0                  │
│ Sem 4 (20-26) │ ⏳ Banner cookies + Tests ELO               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     FÉVRIER 2026                             │
├─────────────────────────────────────────────────────────────┤
│ Sem 1-2       │ PWA + Push notifications                    │
│ Sem 3-4       │ Suppression compte RGPD                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     MARS 2026                                │
├─────────────────────────────────────────────────────────────┤
│ Sem 1         │ Analytics Plausible                         │
│ Sem 2-3       │ Emails transactionnels                      │
│ Sem 4         │ Challenges hebdomadaires                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     AVRIL-MAI 2026                           │
├─────────────────────────────────────────────────────────────┤
│               │ Multilingue EN complet                      │
│               │ Chat 1-to-1 complet                         │
│               │ OAuth Google/Apple                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     JUIN 2026                                │
├─────────────────────────────────────────────────────────────┤
│               │ Buffer + Tests finaux                       │
│ 30 JUIN       │ 🚀 FIN EARLY BIRD - Activation paywall     │
└─────────────────────────────────────────────────────────────┘
```

---

*Document centralisé — Source unique de vérité projet*  
*Dernière mise à jour : 18 janvier 2026*  
*Prochaine révision : 25 janvier 2026*
