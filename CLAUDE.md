# CLAUDE.md - Guide de développement TennisMatchFinder

Ce fichier documente les conventions, erreurs courantes et bonnes pratiques pour ce projet.

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Base de données**: PostgreSQL (Neon) avec Drizzle ORM
- **Authentification**: NextAuth.js
- **Déploiement**: Netlify
- **Styling**: Tailwind CSS + shadcn/ui

---

## Erreurs Courantes à Éviter

### 1. Drizzle ORM - Vérification des résultats `.returning()`

**Problème**: TypeScript strict mode détecte que `.returning()` peut retourner un tableau vide, donc l'élément déstructuré peut être `undefined`.

**Erreur typique**:
```
Type error: 'newClub' is possibly 'undefined'.
```

**Code incorrect**:
```typescript
const [newClub] = await db
  .insert(clubs)
  .values({ name: 'Mon Club' })
  .returning();

// ERREUR: newClub peut être undefined
await db.insert(players).values({
  clubId: newClub.id,  // TypeScript erreur ici
});
```

**Code correct**:
```typescript
const [newClub] = await db
  .insert(clubs)
  .values({ name: 'Mon Club' })
  .returning();

// Toujours vérifier avant d'utiliser
if (!newClub) {
  return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
}

// Maintenant TypeScript sait que newClub est défini
await db.insert(players).values({
  clubId: newClub.id,
});
```

### 2. Drizzle ORM - Accès aux éléments de tableau après `.select()`

**Problème**: Même après vérification de `.length > 0`, TypeScript ne garantit pas que `array[0]` est défini.

**Code incorrect**:
```typescript
const existingUser = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

if (existingUser.length > 0) {
  // ERREUR: existingUser[0] peut être undefined selon TypeScript
  const userId = existingUser[0].id;
}
```

**Code correct**:
```typescript
const existingUser = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

const foundUser = existingUser[0];
if (foundUser) {
  // TypeScript sait que foundUser est défini
  const userId = foundUser.id;
}
```

### 3. Schéma Drizzle - Noms de champs corrects

**Problème**: Utiliser un nom de champ qui n'existe pas dans le schéma.

**Erreur typique**:
```
Type error: 'level' does not exist in type...
```

**Solution**: Toujours vérifier le schéma dans `src/lib/db/schema.ts` avant d'insérer des données.

Exemple pour la table `players`:
- ✅ `selfAssessedLevel` (correct)
- ❌ `level` (incorrect)

### 4. Regex Match - Vérification des groupes capturés

**Problème**: Les groupes de capture regex peuvent être `undefined`.

**Code incorrect**:
```typescript
const match = score.match(/^(\d)-(\d)$/);
if (!match) return false;

const [, g1, g2] = match;
// ERREUR: g1 et g2 peuvent être undefined
return parseInt(g1) > parseInt(g2);
```

**Code correct**:
```typescript
const match = score.match(/^(\d)-(\d)$/);
if (!match) return false;

const [, g1, g2] = match;
if (!g1 || !g2) return false;

return parseInt(g1) > parseInt(g2);
```

---

## Bonnes Pratiques

### API Routes

1. **Toujours vérifier l'authentification** en premier
2. **Valider les données d'entrée** avant traitement
3. **Vérifier les résultats de base de données** avant utilisation
4. **Retourner des erreurs explicites** avec les bons codes HTTP

```typescript
export async function POST(request: NextRequest) {
  // 1. Authentification
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // 2. Validation
  const body = await request.json();
  if (!body.requiredField) {
    return NextResponse.json({ error: 'Champ requis manquant' }, { status: 400 });
  }

  // 3. Opération DB avec vérification
  const [result] = await db.insert(table).values({...}).returning();
  if (!result) {
    return NextResponse.json({ error: 'Erreur création' }, { status: 500 });
  }

  // 4. Succès
  return NextResponse.json({ success: true, data: result });
}
```

### Commandes utiles

```bash
# Vérifier les types TypeScript avant commit
npx tsc --noEmit

# Lancer le build local pour tester
npm run build

# Générer les migrations Drizzle
npx drizzle-kit generate

# Appliquer les migrations
npx drizzle-kit migrate
```

---

## Structure du Projet

```
src/
├── app/
│   ├── api/           # Routes API
│   ├── (auth)/        # Pages authentification
│   └── (dashboard)/   # Pages tableau de bord
├── components/        # Composants React
├── lib/
│   ├── db/
│   │   ├── schema.ts  # Schéma Drizzle (SOURCE DE VÉRITÉ)
│   │   └── queries.ts # Requêtes réutilisables
│   ├── auth.ts        # Configuration NextAuth
│   └── email/         # Envoi d'emails
└── types/             # Types TypeScript
```

---

## Checklist avant Commit

- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] Tous les `.returning()` ont une vérification `if (!result)`
- [ ] Les accès `array[0]` sont vérifiés avec extraction dans une variable
- [ ] Les noms de champs correspondent au schéma `src/lib/db/schema.ts`
- [ ] Les regex matches vérifient les groupes capturés
