# 🐛 Debug : Authentification des joueurs indépendants (sans club)

## Problème

Les utilisateurs qui s'inscrivent **sans rejoindre le club MCCC** (seul club dans la base Neon) ne peuvent pas accéder au dashboard. Ils sont redirigés vers `/login` après connexion via magic link, même si leur session est valide.

**Utilisateur de test** : Henri Balavoine (`pleneuftrading@gmail.com`)
- User ID : `56f2f3b8-9cc3-4be0-b81d-b2c19df86264`
- Player ID : `56f2f3b8-9cc3-4be0-b81d-b2c19df86264`
- Club ID : `null` (joueur indépendant)
- City : Lille

---

## Diagnostic confirmé

### ✅ Ce qui fonctionne
1. **Inscription** : L'utilisateur est créé dans la table `users` ET `players`
2. **Magic link** : L'email est envoyé et le lien fonctionne
3. **Token de vérification** : Le magic link valide l'email (`emailVerified` est mis à jour)
4. **Session côté serveur** : L'API `/api/auth/session` retourne les bonnes données
5. **Session côté client** : La page `/debug-session` montre que `useSession()` fonctionne
6. **Player data** : Le player est bien attaché à la session avec `clubId: null`

### ❌ Ce qui ne fonctionne pas
- **Accès au dashboard** : L'utilisateur est redirigé vers `/login` malgré une session valide
- **Race condition suspectée** : Le redirect se produit avant que la session soit complètement chargée

---

## Solutions explorées

### 1. ❌ Vérification de la page /onboarding manquante
**Hypothèse** : La page `/onboarding` n'existait pas, causant une 404.

**Action** : Création de `/src/app/(auth)/onboarding/page.tsx`

**Résultat** : Page créée mais n'a pas résolu le problème principal.

**Commit** : `75fe9de` - "feat(auth): Add onboarding page for users without player profile"

---

### 2. ❌ Correction du callback JWT (token.id manquant)
**Hypothèse** : Le `token.id` n'était pas toujours défini dans le callback JWT.

**Action** : Ajout de fallback `token.sub` si `token.id` est undefined.

```typescript
// src/lib/auth.ts - callback jwt
if (!token.id && token.sub) {
  token.id = token.sub;
}
```

**Résultat** : Le token contient maintenant toujours un ID, mais le problème persiste.

**Commit** : `e2f4f1e` - "fix(auth): Fix session handling for independent players"

---

### 3. ❌ Correction des types TypeScript (clubId: string | null)
**Hypothèse** : Les types TypeScript n'acceptaient pas `clubId: null`.

**Actions** :
- Mise à jour de `PlayerData` dans `/src/types/player.ts` : `clubId: string | null`
- Mise à jour de `next-auth.d.ts`
- Mise à jour du hook `usePlayer`

**Résultat** : Build réussi, types corrects, mais problème persiste.

**Commit** : `e2f4f1e` - inclus dans le même commit

---

### 4. ❌ Utilisation de useEffect pour les redirections
**Hypothèse** : Les redirections synchrones causaient des problèmes d'hydratation.

**Action** : Remplacement de la redirection directe par `useEffect` + `useRouter`.

```typescript
// src/app/(dashboard)/layout.tsx
useEffect(() => {
  if (!isLoading) {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!player) {
      router.push('/onboarding');
    }
  }
}, [isLoading, isAuthenticated, player, router]);
```

**Résultat** : Amélioration de la stabilité mais problème persiste.

**Commit** : `e2f4f1e` - inclus dans le même commit

---

### 5. ❌ Configuration explicite des cookies
**Hypothèse** : Les cookies de session n'étaient pas correctement configurés pour HTTPS.

**Action** : Ajout de configuration explicite dans `auth.ts` :

```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
},
```

**Résultat** : A créé une incohérence - les cookies existants avaient le nom `__Host-next-auth.session-token` (généré automatiquement par NextAuth) alors que la config attendait `__Secure-next-auth.session-token`.

**Commit** : `2804e8e` - "fix(auth): Add explicit cookie configuration for production"

---

### 6. ❌ Suppression de la config cookies personnalisée
**Hypothèse** : La config personnalisée des cookies créait un conflit avec les cookies existants.

**Action** : Retrait de la section `cookies` pour laisser NextAuth gérer automatiquement.

**Résultat** : En attente de test après suppression des cookies par l'utilisateur.

**Commit** : `34df02e` - "fix(auth): Remove custom cookie config, let NextAuth handle automatically"

---

### 7. ❌ Ajout d'un délai avant redirect
**Hypothèse** : Race condition - la redirection se produit avant que `useSession()` ait fini de charger.

**Action** : Ajout d'un délai de 500ms et de refs pour éviter les redirections multiples.

```typescript
// src/app/(dashboard)/layout.tsx
const hasRedirected = useRef(false);
const initialLoadComplete = useRef(false);

useEffect(() => {
  if (isLoading) return;
  
  if (!initialLoadComplete.current) {
    initialLoadComplete.current = true;
  }
  
  if (hasRedirected.current) return;

  const timer = setTimeout(() => {
    if (hasRedirected.current) return;
    
    if (!isAuthenticated) {
      hasRedirected.current = true;
      router.push('/login');
    } else if (!player) {
      hasRedirected.current = true;
      router.push('/onboarding');
    }
  }, 500);

  return () => clearTimeout(timer);
}, [isLoading, isAuthenticated, player, router]);
```

**Résultat** : En attente de test.

**Commit** : `0c85b90` - "fix(auth): Add delay before redirect to prevent race condition"

---

### 8. 🔧 Page de debug créée
**Action** : Création de `/debug-session` pour visualiser l'état de la session.

**Résultat** : Confirme que la session fonctionne côté client :
- `status: authenticated`
- `player` présent avec toutes les données
- Cookies visibles

**Commit** : `ff2b113` - "debug: Add debug-session page and enhanced session logging"

---

## Pistes non encore explorées

### A. 🔍 Vérifier le middleware NextAuth
Le middleware `withAuth` pourrait rediriger AVANT que la page ne se charge.

**Fichier** : `/middleware.ts`

**Test à faire** : Ajouter `/dashboard` aux `publicPaths` temporairement pour voir si c'est le middleware qui cause la redirection.

```typescript
const publicPaths = [
  // ... existing paths
  '/dashboard', // TEMPORAIRE - pour test
];
```

---

### B. 🔍 Vérifier NEXTAUTH_URL dans Netlify
Si `NEXTAUTH_URL` ne correspond pas exactement au domaine, les cookies peuvent ne pas être reconnus.

**Variable attendue** : `NEXTAUTH_URL=https://tennismatchfinder.net`

**Vérification** : Aller dans Netlify → Site settings → Environment variables

---

### C. 🔍 Vérifier NEXTAUTH_SECRET
Le secret doit être identique entre le moment où le token est créé et vérifié.

**Vérification** : S'assurer que `NEXTAUTH_SECRET` est bien défini dans Netlify.

---

### D. 🔍 Utiliser getServerSession au lieu de useSession
Remplacer le client-side auth par server-side auth pour le layout dashboard.

**Approche** :
```typescript
// Convertir layout.tsx en Server Component
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  if (!session.user?.player) {
    redirect('/onboarding');
  }
  
  return <DashboardClientLayout player={session.user.player}>{children}</DashboardClientLayout>;
}
```

---

### E. 🔍 Ajouter du logging dans le middleware
Pour comprendre ce qui se passe avant que la page ne charge.

```typescript
export default withAuth(
  function middleware(request) {
    console.log('[Middleware] Path:', request.nextUrl.pathname);
    console.log('[Middleware] Has token:', !!request.nextauth.token);
    return NextResponse.next();
  },
  // ...
);
```

---

### F. 🔍 Vérifier les logs Netlify Functions
Les logs côté serveur pourraient montrer des erreurs non visibles côté client.

**Comment** : Netlify Dashboard → Functions → Logs

---

### G. 🔍 Tester avec un utilisateur avec club
Pour confirmer que le problème est spécifique aux joueurs sans club.

**Test** : Se connecter avec `pfermanian@gmail.com` (Pierre Fermanian, admin du MCCC)

---

### H. 🔍 Désactiver le middleware temporairement
Renommer `middleware.ts` en `middleware.ts.bak` pour voir si le problème vient du middleware.

---

### I. 🔍 Vérifier SessionProvider
S'assurer que `SessionProvider` englobe bien toute l'app.

**Fichier à vérifier** : `/src/app/layout.tsx` ou `/src/app/providers.tsx`

---

### J. 🔍 Augmenter le délai de redirect
500ms peut ne pas suffire sur des connexions lentes.

```typescript
const timer = setTimeout(() => {
  // ...
}, 2000); // 2 secondes au lieu de 500ms
```

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `/src/lib/auth.ts` | Configuration NextAuth (callbacks, providers, session) |
| `/middleware.ts` | Protection des routes (vérifie le token) |
| `/src/app/(dashboard)/layout.tsx` | Layout dashboard (vérifie session côté client) |
| `/src/hooks/use-player.ts` | Hook pour accéder aux données player |
| `/src/app/(auth)/debug-session/page.tsx` | Page de debug (TEMPORAIRE) |
| `/src/types/player.ts` | Types TypeScript pour Player |
| `/src/types/next-auth.d.ts` | Extension des types NextAuth |

---

## Variables d'environnement requises (Netlify)

```
NEXTAUTH_URL=https://tennismatchfinder.net
NEXTAUTH_SECRET=<clé secrète 32+ caractères>
DATABASE_URL=<URL Neon PostgreSQL>
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=<clé API Resend>
EMAIL_FROM=TennisMatchFinder <noreply@tennismatchfinder.net>
```

---

## Prochaines étapes recommandées

1. **Supprimer les cookies** et retester
2. Si échec → **Tester piste A** (middleware bypass)
3. Si échec → **Tester piste D** (Server Component)
4. Si échec → **Vérifier logs Netlify** (piste F)
5. Si échec → **Tester piste G** (utilisateur avec club)

---

## Historique des commits liés

| Commit | Message | Date |
|--------|---------|------|
| `75fe9de` | feat(auth): Add onboarding page | 2026-01-12 |
| `c7a1a72` | feat: Add debug endpoint for user/player diagnosis | 2026-01-12 |
| `e2f4f1e` | fix(auth): Fix session handling for independent players | 2026-01-12 |
| `149905d` | debug: Add logging to auth callbacks | 2026-01-12 |
| `2804e8e` | fix(auth): Add explicit cookie configuration | 2026-01-12 |
| `ff2b113` | debug: Add debug-session page | 2026-01-13 |
| `0c85b90` | fix(auth): Add delay before redirect | 2026-01-13 |
| `34df02e` | fix(auth): Remove custom cookie config | 2026-01-13 |

---

*Document créé le 2026-01-13*
*Dernière mise à jour : 2026-01-13*
