# Diagnostic : Bouton "Voir les détails" Tournoi - Erreur 500

## Symptôme
Le bouton "Voir les détails" sur la carte d'un tournoi provoque une erreur 500 Internal Server Error.
URL testée : `/tournaments/a81b5e26-58e4-4322-b3ac-9cd65a8ffc18`

## Statut Actuel
- **Erreur** : 500 Internal Server Error sur `/api/tournaments/[tournamentId]`
- **La page se charge** : Le HTML est servi correctement
- **L'API échoue** : Erreur côté serveur lors du fetch des données

---

## Vérifications Effectuées (Toutes OK)

### Base de Données Neon
- ✅ Table `tournaments` existe avec 28 colonnes correctes
- ✅ Table `tournament_participants` existe
- ✅ Table `tournament_matches` existe
- ✅ Enum `tournament_format` existe (single_elimination, double_elimination, consolation)
- ✅ Enum `tournament_status` existe (draft, registration, seeding, active, completed)
- ✅ Tournoi "Test" existe : `a81b5e26-58e4-4322-b3ac-9cd65a8ffc18` (status: draft)
- ✅ Colonnes correspondent au schéma Drizzle (snake_case)

### Build Next.js
- ✅ Build passe sans erreurs
- ✅ Route `/tournaments/[tournamentId]` générée comme dynamique (ƒ)
- ✅ Route API `/api/tournaments/[tournamentId]` générée comme dynamique (ƒ)

### Authentification
- ✅ Cookie de session envoyé (`__Secure-next-auth.session-token`)
- ✅ L'API retourne 401 sans cookie (comportement attendu)

### Déploiement Netlify
- ✅ Plugin `@netlify/plugin-nextjs` configuré
- ✅ Build command correct
- ✅ Clear cache + redeploy effectué

---

## Solutions Testées SANS Succès

### 1. Alignement des Enums (2026-01-09)
**Hypothèse** : Mismatch entre enums TypeScript et PostgreSQL
**Action** : 
```sql
ALTER TYPE tournament_status RENAME VALUE 'registration_open' TO 'registration';
ALTER TYPE tournament_status RENAME VALUE 'registration_closed' TO 'seeding';
ALTER TYPE tournament_status RENAME VALUE 'in_progress' TO 'active';
```
**Résultat** : ❌ Erreur persiste

### 2. Safe Date Parsing - TournamentCard (2026-01-09)
**Hypothèse** : Dates retournées comme strings causent des crashes React
**Action** : Ajout de helpers `safeParseDate` et `safeFormat`
**Résultat** : ✅ Carte s'affiche, mais erreur persiste au clic

### 3. Safe Date Parsing - Page Détail (2026-01-09)
**Action** : Même correction sur `/tournaments/[tournamentId]/page.tsx`
**Résultat** : ❌ Erreur persiste

### 4. Remove React 19 use() API (2026-01-09)
**Hypothèse** : `use(params)` incompatible avec React 18.2.0
**Action** : Remplacer par accès direct `params.tournamentId`
**Résultat** : ✅ Page client component corrigée, mais API échoue toujours

### 5. Extraction URL personnalisée dans API (2026-01-09)
**Hypothèse** : `await params` ne fonctionne pas dans Next.js 14
**Action** : Extraire tournamentId depuis `request.url`
**Résultat** : ❌ Pire - 404 errors, REVERT effectué

### 6. Retour au pattern standard Next.js (2026-01-09)
**Action** : Retour à `await params` comme box-leagues API
**Résultat** : ❌ Erreur 500 persiste

### 7. Clear Cache Netlify + Hard Refresh (2026-01-09)
**Action** : "Clear cache and deploy site" + Ctrl+Shift+R
**Résultat** : ❌ Erreur persiste

### 8. Try-Catch autour de bracket/participants (2026-01-09)
**Hypothèse** : Une des fonctions `getTournamentBracket` ou `getParticipants` crashe
**Action** : Wrap dans try-catch avec logging
**Commit** : `00340fe`
**Résultat** : En cours de test...

---

## Informations Techniques

### API Route Actuelle
```typescript
// src/app/api/tournaments/[tournamentId]/route.ts
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { tournamentId } = await params;
  
  const tournament = await getTournamentById(tournamentId);
  // ... bracket, participants, etc.
}
```

### Headers de la Requête qui Échoue
- Status: 500 Internal Server Error
- Cookie session: ✅ Présent
- Netlify Request ID: `01KEGVPCSXYAG1VQ7S8Y9JGTSR`

### Commits Associés
- `00340fe` - debug(api): Add try-catch around bracket and participants fetch
- `8bb9f13` - debug(api): Add detailed error logging for tournament API
- `d4d62e6` - fix(api): Revert to standard Next.js params pattern
- `b76ba5a` - fix(tournaments): Fix API params extraction + add delete button
- `a54f390` - fix(tournaments): Remove React 19 use() API
- `57dc966` - fix(tournaments): Add safe date parsing
- `6bb69ac` - fix(tournaments): Add error handling and loading states

---

## Hypothèses Restantes à Tester

### H1: Erreur dans getServerSession sur Netlify
Le `getServerSession(authOptions)` pourrait crasher sur Netlify Functions.
**Test** : Vérifier les logs Netlify ou ajouter try-catch autour de getServerSession

### H2: Erreur dans getTournamentById 
La requête DB pourrait échouer silencieusement.
**Test** : Ajouter logging détaillé ou simplifier la query

### H3: Problème de connexion DB sur Netlify
La connexion à Neon pourrait timeout ou échouer.
**Test** : Vérifier les variables d'environnement DATABASE_URL sur Netlify

### H4: Problème de sérialisation des données
Les données retournées pourraient contenir des types non-sérialisables (Date, BigInt).
**Test** : Vérifier le format des données retournées par l'API

---

## Prochaines Actions

1. **Obtenir le Response Body** de l'erreur 500 dans DevTools
2. **Vérifier les logs Netlify** : Netlify Dashboard → Functions → Logs
3. **Tester l'API directement** avec un endpoint simplifié
4. **Vérifier DATABASE_URL** dans Netlify Environment Variables

---

## Configuration Référence

### Stack
- Next.js 14.2.35
- React 18.2.0
- Drizzle ORM 0.38.3
- Neon PostgreSQL
- Netlify avec @netlify/plugin-nextjs

### Variables d'Environnement Requises (Netlify)
- `DATABASE_URL` - Connection string Neon
- `NEXTAUTH_URL` - https://tennismatchfinder.net
- `NEXTAUTH_SECRET` - Secret pour NextAuth
- `EMAIL_SERVER_*` - Config email
