# Changelog - Session du 9 Janvier 2026

## TennisMatchFinder v1.1.0 - Corrections Majeures & Box Leagues

Cette session a corrigé plusieurs bugs critiques et ajouté des fonctionnalités essentielles pour la gestion des tournois et Box Leagues.

---

## Bugs Corrigés

### 1. Erreur React 18/19 - Page Détail Tournoi
**Symptôme** : Clic sur "Voir les détails" d'un tournoi causait une erreur #438 (hydration error)

**Cause racine** : Utilisation de l'API `use(params)` de React 19 dans un projet React 18.2.0

**Solution** : Accès direct aux params sans `use()`
```typescript
// AVANT (React 19 - incompatible)
const resolvedParams = use(params);
const tournamentId = resolvedParams.tournamentId;

// APRÈS (React 18 - compatible)
const tournamentId = params.tournamentId;
```

**Fichiers modifiés** :
- `src/app/(dashboard)/tournaments/[tournamentId]/page.tsx`
- `src/app/(dashboard)/box-leagues/[leagueId]/page.tsx`

**Commit** : `a54f390`

---

### 2. Erreur 500 - API Tournois
**Symptôme** : L'API `/api/tournaments/[tournamentId]` retournait une erreur 500

**Cause racine** : Les fonctions `getTournamentBracket()` et `getParticipants()` crashaient sur les tournois en statut "draft" (sans matchs ni participants)

**Solution** : Ajout de blocs try-catch pour gérer gracieusement les erreurs
```typescript
let bracket = null;
let participants = [];

try {
  bracket = await getTournamentBracket(tournamentId);
} catch (bracketError) {
  console.error('Error fetching bracket:', bracketError);
}

try {
  participants = await getParticipants(tournamentId);
} catch (participantsError) {
  console.error('Error fetching participants:', participantsError);
}
```

**Commit** : `85db466`

---

### 3. Erreur 500 - Création Box League
**Symptôme** : La création d'une Box League retournait une erreur 500

**Cause racine** : 
1. Les champs `promotionSpots` et `relegationSpots` n'étaient pas gérés par l'API
2. Les tables `box_leagues`, `box_league_participants`, `box_league_matches` n'existaient pas en base de données

**Solution** :
1. Ajout des champs manquants dans le type et le service
2. Création du fichier de migration SQL

**Fichiers modifiés** :
- `src/lib/box-leagues/types.ts`
- `src/lib/box-leagues/service.ts`
- `src/app/api/box-leagues/route.ts`
- `drizzle/0005_box_leagues.sql` (nouveau)

**Commits** : `b4f4e45`, `e627f94`

---

### 4. Menu Mobile Chrome - Fermeture Immédiate
**Symptôme** : Sur Chrome mobile, le menu hamburger s'affichait une fraction de seconde puis se fermait immédiatement

**Cause racine** : Le `useEffect` qui fermait le menu sur changement de `pathname` s'exécutait aussi au premier rendu

**Solution** : Utiliser un `useRef` pour tracker le pathname précédent
```typescript
const previousPathname = useRef(pathname);

useEffect(() => {
  // Ne fermer que si le pathname a réellement changé
  if (previousPathname.current !== pathname && previousPathname.current !== '') {
    onClose();
  }
  previousPathname.current = pathname;
}, [pathname, onClose]);
```

**Fichier modifié** : `src/components/layout/mobile-nav.tsx`

**Commit** : `a95aa46`

---

## Nouvelles Fonctionnalités

### 1. Bouton Supprimer Tournoi (Admin)
**Description** : Les administrateurs peuvent maintenant supprimer un tournoi directement depuis la page de détail

**Conditions** :
- Utilisateur doit être admin du club
- Tournoi doit être en statut : `draft`, `registration`, ou `cancelled`

**Implémentation** :
- API : `DELETE /api/tournaments/[tournamentId]`
- UI : Bouton rouge avec confirmation AlertDialog

**Commit** : `b76ba5a`

---

### 2. Bouton Supprimer Box League (Admin)
**Description** : Les administrateurs peuvent supprimer une Box League depuis la page de détail

**Conditions** :
- Utilisateur doit être admin du club
- Box League doit être en statut : `draft`, `registration`, ou `cancelled`

**Implémentation** :
- API : `DELETE /api/box-leagues/[leagueId]`
- UI : Bouton rouge avec confirmation AlertDialog

**Commit** : `884b734`

---

### 3. Migration SQL Box Leagues
**Description** : Script de migration complet pour les tables Box Leagues

**Tables créées** :
- `box_leagues` - Compétitions mensuelles par niveau
- `box_league_participants` - Participants avec stats
- `box_league_matches` - Matchs de la poule

**Fichier** : `drizzle/0005_box_leagues.sql`

**Commit** : `e627f94`

---

## Résumé des Commits (chronologique)

| Commit | Type | Description |
|--------|------|-------------|
| `a95aa46` | fix | Menu mobile - fermeture immédiate |
| `884b734` | feat | Bouton supprimer Box League + amélioration nav mobile |
| `e627f94` | fix | Migration SQL Box Leagues + error handling API |
| `b4f4e45` | fix | Champs promotionSpots/relegationSpots |
| `85db466` | fix | Error handling bracket/participants tournois |
| `b76ba5a` | fix | API params + bouton supprimer tournoi |
| `a54f390` | fix | Suppression API React 19 use() |

---

## Tests Recommandés

### Tournois
- [ ] Créer un tournoi (admin)
- [ ] Voir les détails d'un tournoi
- [ ] Supprimer un tournoi en brouillon (admin)
- [ ] Ouvrir les inscriptions
- [ ] S'inscrire à un tournoi

### Box Leagues
- [ ] Créer une Box League (admin)
- [ ] Voir les détails d'une Box League
- [ ] Supprimer une Box League (admin)
- [ ] S'inscrire à une Box League

### Mobile
- [ ] Ouvrir le menu hamburger sur Chrome mobile
- [ ] Naviguer entre les pages via le menu
- [ ] Vérifier que le menu reste ouvert jusqu'au clic

---

## Configuration Requise

### Variables d'environnement
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tennismatchfinder.net
```

### Base de données
Exécuter la migration `drizzle/0005_box_leagues.sql` dans Neon si ce n'est pas déjà fait.

---

## Équipe

- **Développeur** : Assistant Claude (Anthropic)
- **Product Owner** : Pierre Fermanian
- **Date** : 9 Janvier 2026

---

*Documentation générée automatiquement - TennisMatchFinder v1.1.0*
