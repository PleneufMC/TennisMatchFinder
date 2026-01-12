# Guide d'Installation Meta Pixel - TennisMatchFinder

> **Document pour l'équipe marketing et technique**  
> Version 1.0 - Janvier 2026

## 1. Créer votre Meta Pixel

### Étape 1 : Accéder à Events Manager
1. Aller sur [business.facebook.com](https://business.facebook.com)
2. Cliquer sur **"Toutes les ressources"** (menu hamburger)
3. Sélectionner **Events Manager**

### Étape 2 : Créer le Pixel
1. Cliquer sur **"Connecter les données"** (bouton vert)
2. Sélectionner **Web**
3. Choisir **Meta Pixel**
4. Nommer le pixel : `TennisMatchFinder`
5. Entrer l'URL : `https://tennismatchfinder.net`
6. Cliquer sur **Créer**

### Étape 3 : Copier le Pixel ID
- Le Pixel ID est un nombre à 16 chiffres (ex: `1234567890123456`)
- **IMPORTANT** : Copiez ce numéro, vous en aurez besoin

---

## 2. Configuration dans Netlify

### Ajouter la variable d'environnement
1. Aller sur [app.netlify.com](https://app.netlify.com/)
2. Sélectionner le site **tennismatchfinder**
3. **Site configuration** > **Environment variables**
4. Cliquer sur **Add a variable**
5. Ajouter :
   - **Key** : `NEXT_PUBLIC_META_PIXEL_ID`
   - **Value** : `VOTRE_PIXEL_ID` (16 chiffres)
6. **Scopes** : Cocher `Production` et `Deploy previews`
7. Cliquer sur **Create variable**

### Redéployer le site
1. Aller dans **Deploys**
2. Cliquer sur **Trigger deploy** > **Deploy site**
3. Attendre ~2 minutes

---

## 3. Événements trackés automatiquement

Le code TennisMatchFinder envoie ces événements Meta Pixel :

### Événements Standards

| Événement | Déclencheur | Équivalent GA4 |
|-----------|-------------|----------------|
| `PageView` | Chaque page visitée | `page_view` |
| `Lead` | Clic sur CTA inscription | `signup_started` |
| `CompleteRegistration` | Inscription réussie | `signup_completed` |
| `InitiateCheckout` | Visite page pricing | `pricing_viewed` |
| `Purchase` | Abonnement payé | `subscription` |
| `Search` | Recherche adversaire | `elo_viewed` |

### Événements Personnalisés

| Événement | Déclencheur |
|-----------|-------------|
| `FirstMatchCreated` | Premier match enregistré |
| `BadgeEarned` | Badge débloqué |
| `TournamentRegistration` | Inscription tournoi |
| `MatchNowActivated` | Mode disponibilité activé |

---

## 4. Vérification du tracking

### Test avec Facebook Pixel Helper
1. Installer l'extension Chrome [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Visiter `tennismatchfinder.net`
3. Cliquer sur l'icône de l'extension
4. Vérifier que le pixel est détecté ✅

### Test dans Events Manager
1. Aller dans Events Manager
2. Sélectionner votre pixel
3. Cliquer sur **Test Events**
4. Ouvrir un onglet avec `tennismatchfinder.net`
5. Naviguer sur le site et cliquer sur les CTAs
6. Les événements apparaissent en temps réel

---

## 5. Configuration des conversions

### Marquer les événements comme conversions
1. Dans Events Manager, aller dans **Conversions personnalisées**
2. Créer une conversion pour :
   - **Lead** → Valeur : 1€
   - **CompleteRegistration** → Valeur : 10€
   - **Purchase** → Utiliser la valeur dynamique

### Créer des audiences personnalisées
1. Aller dans **Audiences**
2. Créer des audiences basées sur :
   - Visiteurs du site (7, 14, 30 jours)
   - Utilisateurs ayant déclenché `Lead`
   - Utilisateurs ayant déclenché `CompleteRegistration`

---

## 6. Utilisation dans le code

Pour les développeurs, voici comment tracker des événements :

```typescript
import { useMetaPixel } from '@/components/meta-pixel';

function MonComposant() {
  const { trackLead, trackCompleteRegistration, trackCustomEvent } = useMetaPixel();

  const handleCtaClick = () => {
    trackLead('landing_hero');
  };

  const handleSignupSuccess = () => {
    trackCompleteRegistration('club-slug', 'magic_link');
  };

  const handleCustomAction = () => {
    trackCustomEvent('MonEvenement', { param1: 'valeur' });
  };

  return (
    <button onClick={handleCtaClick}>
      S'inscrire
    </button>
  );
}
```

---

## 7. Consentement cookies

Le Meta Pixel respecte le consentement utilisateur :
- Ne s'active qu'après acceptation des cookies "analytics"
- Utilise le même cookie que GA4 : `tmf_cookie_consent`
- Format : `{"status":"accepted","preferences":{"analytics":true}}`

---

## 8. Checklist pré-campagne Meta Ads

- [ ] Variable `NEXT_PUBLIC_META_PIXEL_ID` configurée dans Netlify
- [ ] Site redéployé après ajout de la variable
- [ ] Test avec Facebook Pixel Helper : pixel détecté
- [ ] Test Events Manager : événements visibles
- [ ] Conversions configurées (Lead, CompleteRegistration)
- [ ] Audiences personnalisées créées
- [ ] Compte publicitaire Meta lié au pixel

---

## 9. Architecture du tracking

```
┌─────────────────────────────────────────────────────────────┐
│                     LANDING PAGE                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SignupCtaButton (onClick)                          │   │
│  │  → GA4: trackSignupStarted('landing_hero')          │   │
│  │  → Meta: trackLead('landing_hero')                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    REGISTER FORM                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  onSubmit                                            │   │
│  │  → GA4: trackSignupStarted('register_form')          │   │
│  │  → Meta: trackLead('register_form')                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  onSuccess                                           │   │
│  │  → GA4: trackSignupCompleted(clubSlug)               │   │
│  │  → Meta: trackCompleteRegistration(clubSlug)         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    GOOGLE ANALYTICS 4   │     │      META PIXEL         │
│  Measurement ID:        │     │  Pixel ID:              │
│  G-SK1KGRV9KK           │     │  XXXXXXXXXXXXXXXX       │
│                         │     │                         │
│  Events:                │     │  Events:                │
│  • signup_started       │     │  • Lead                 │
│  • signup_completed     │     │  • CompleteRegistration │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 10. Support

**Fichiers techniques :**
- `src/components/meta-pixel.tsx` - Composant et hook
- `src/app/layout.tsx` - Intégration globale
- `.env.local.example` - Variables d'environnement

**Documentation officielle :**
- [Meta Business Help Center](https://www.facebook.com/business/help/952192354843755)
- [Meta Pixel Developer Docs](https://developers.facebook.com/docs/meta-pixel/)

---

*Document préparé pour TennisMatchFinder*  
*Date : Janvier 2026*
