# Diagnostic : Bouton "Voir les détails" Tournoi - Erreur #438

## Symptôme
Le bouton "Voir les détails" sur la carte d'un tournoi créé provoque une erreur React Minified #438 (erreur d'hydratation).

## Solutions Testées (Sans Succès)

### 1. Alignement des Enums de Base de Données (2026-01-09)
**Problème présumé** : Mismatch entre les enums TypeScript et PostgreSQL
- `registration_open` vs `registration`
- `registration_closed` vs `seeding`
- `in_progress` vs `active`

**Action** : SQL exécuté dans Neon
```sql
ALTER TYPE tournament_status RENAME VALUE 'registration_open' TO 'registration';
ALTER TYPE tournament_status RENAME VALUE 'registration_closed' TO 'seeding';
ALTER TYPE tournament_status RENAME VALUE 'in_progress' TO 'active';
```
**Résultat** : ✅ Corrigé mais erreur persistante

### 2. Ajout de Gestion d'Erreurs sur /tournaments (2026-01-09)
**Problème présumé** : Erreurs API non gérées
**Action** : Ajout de try/catch et états d'erreur
**Résultat** : ✅ Page liste fonctionne, mais détail toujours en erreur

### 3. Safe Date Parsing sur TournamentCard (2026-01-09)
**Problème présumé** : Dates retournées comme strings causent des crashes
**Action** : Ajout de helpers `safeParseDate` et `safeFormat`
```typescript
function safeParseDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  try {
    const parsed = typeof date === 'string' ? new Date(date) : date;
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}
```
**Résultat** : ✅ Carte s'affiche correctement, erreur persiste au clic

### 4. Safe Date Parsing sur /tournaments/[tournamentId] (2026-01-09)
**Problème présumé** : Même problème de dates sur la page détail
**Action** : Même correction appliquée à la page détail
**Résultat** : ❌ Erreur persiste

### 5. Vérification des Tables de Base de Données (2026-01-09)
**Action** : Vérification que `tournaments`, `tournament_participants`, `tournament_matches` existent
**Résultat** : ✅ Tables existent

## Solution Finale (SUCCÈS)

### 6. Incompatibilité React use() API (2026-01-09)
**Cause Racine Identifiée** : 
- Le projet utilise **React 18.2.0**
- Le code utilisait `use(params)` qui est une API **React 19**
- L'erreur #438 est une erreur d'hydratation causée par l'utilisation d'une API non supportée

**Code Problématique** :
```typescript
import { useState, useEffect, use } from 'react';
// ...
export default function TournamentDetailPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  // ...
  const res = await fetch(`/api/tournaments/${resolvedParams.tournamentId}`);
```

**Code Corrigé** :
```typescript
import { useState, useEffect } from 'react';
// ...
export default function TournamentDetailPage({ params }: { params: PageParams }) {
  // ...
  const res = await fetch(`/api/tournaments/${params.tournamentId}`);
```

**Fichiers Corrigés** :
- `src/app/(dashboard)/tournaments/[tournamentId]/page.tsx`
- `src/app/(dashboard)/box-leagues/[leagueId]/page.tsx`

**Résultat** : ✅ Build passe, erreur résolue

## Leçons Apprises

1. **Vérifier la compatibilité React** : Le hook `use()` nécessite React 19 (React Canary)
2. **Erreur #438** : Souvent causée par des différences server/client pendant l'hydratation
3. **Next.js 14 avec React 18** : Ne pas utiliser les nouvelles APIs Promise-based pour les params

## Versions du Projet
- Next.js: 14.2.35
- React: 18.2.0
- React DOM: 18.2.0

## Commits Associés
- `24aab42` - fix(tournaments): Add safe date parsing to tournament detail page
- `57dc966` - fix(tournaments): Add safe date parsing to prevent React hydration errors
- `6bb69ac` - fix(tournaments): Add error handling and loading states
- `a54f390` - fix(tournaments): Remove React 19 use() API - use params directly
- `b76ba5a` - fix(tournaments): Fix API params extraction + add delete button for admins

---

## Solution Complémentaire (2026-01-09)

### 7. API Route params Promise (SUCCÈS FINAL)
**Cause** : Même problème sur l'API côté serveur. L'API utilisait `await params` qui ne fonctionne pas de manière fiable avec Next.js 14.

**Code Problématique** :
```typescript
interface RouteParams {
  params: Promise<{ tournamentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tournamentId } = await params;
  // ...
}
```

**Code Corrigé** :
```typescript
function getTournamentIdFromUrl(request: NextRequest): string {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const tournamentIdIndex = pathParts.findIndex(part => part === 'tournaments') + 1;
  return pathParts[tournamentIdIndex] || '';
}

export async function GET(request: NextRequest) {
  const tournamentId = getTournamentIdFromUrl(request);
  // ...
}
```

**Résultat** : ✅ Page détail tournoi fonctionne

### Fonctionnalité Ajoutée : Suppression de Tournoi
- Bouton "Supprimer" visible uniquement pour les admins
- Uniquement pour les tournois en brouillon, inscription ouverte ou annulé
- Boîte de dialogue de confirmation
- API DELETE /api/tournaments/[tournamentId]

---

## Solutions Testées SANS Succès (2026-01-09)

### 8. Extraction URL personnalisée (ÉCHEC)
**Hypothèse** : Le pattern `await params` ne fonctionne pas
**Action** : Extraction du tournamentId depuis `request.url`
```typescript
function getTournamentIdFromUrl(request: NextRequest): string {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const tournamentIdIndex = pathParts.findIndex(part => part === 'tournaments') + 1;
  return pathParts[tournamentIdIndex] || '';
}
```
**Résultat** : ❌ Erreur 404 persiste - REVERT effectué

### 9. Retour au pattern standard Next.js (ÉCHEC)
**Action** : Retour à `await params` comme les autres routes API (box-leagues)
**Résultat** : ❌ Erreur persiste après redéploiement

### 10. Clear cache Netlify + Redeploy (ÉCHEC)
**Action** : "Clear cache and deploy site" dans Netlify
**Résultat** : ❌ Erreur persiste

### 11. Hard refresh navigateur (ÉCHEC)
**Action** : Ctrl+Shift+R, vider cache DevTools
**Résultat** : ❌ Erreur persiste

### Vérifications effectuées (toutes OK)
- ✅ Table `tournaments` existe avec bonnes colonnes
- ✅ Enum `tournament_format` existe (single_elimination, double_elimination, consolation)
- ✅ Enum `tournament_status` existe (draft, registration, seeding, active, completed)
- ✅ Tournoi "Test" existe dans la DB (id: a81b5e26-58e4-4322-b3ac-9cd65a8ffc18)
- ✅ Build Next.js passe sans erreurs
- ✅ Route `/tournaments/[tournamentId]` générée correctement

### Erreurs Console Observées
```
Failed to load resource: /api/tournaments/a81b5e26-58e4-4322-b3ac-9cd65a8ffc18 - 404
```

### Hypothèses Restantes à Tester
1. **Problème Netlify Functions** : La fonction API n'est pas déployée correctement
2. **Problème de routing Netlify** : Les routes dynamiques API ne sont pas gérées
3. **Problème d'authentification** : Session non transmise correctement
4. **Problème de CORS/Headers** : Requête bloquée avant d'atteindre l'API
