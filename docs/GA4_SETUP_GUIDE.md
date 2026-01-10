# Guide de Configuration GA4 - TennisMatchFinder

> **Document pour l'équipe marketing et technique**  
> Version 1.0 - Janvier 2026

## 1. Création du compte Google Analytics 4

### Étape 1 : Accéder à Google Analytics
1. Aller sur [analytics.google.com](https://analytics.google.com/)
2. Se connecter avec le compte Google de l'entreprise

### Étape 2 : Créer une propriété
1. Cliquer sur **Admin** (icône engrenage en bas à gauche)
2. Dans la colonne **Propriété**, cliquer sur **Créer une propriété**
3. Remplir les informations :
   - **Nom de la propriété** : `TennisMatchFinder - Production`
   - **Fuseau horaire** : `France (GMT+1)`
   - **Devise** : `Euro (€)`
4. Cliquer sur **Suivant**

### Étape 3 : Configurer le flux de données Web
1. Sélectionner **Web** comme plateforme
2. Remplir :
   - **URL du site** : `https://tennismatchfinder.net`
   - **Nom du flux** : `TennisMatchFinder Web`
3. Cliquer sur **Créer un flux**
4. **COPIER LE MEASUREMENT ID** (format : `G-XXXXXXXXXX`)

---

## 2. Configuration dans Netlify

### Étape 1 : Ajouter la variable d'environnement
1. Aller sur [app.netlify.com](https://app.netlify.com/)
2. Sélectionner le site **tennismatchfinder**
3. Aller dans **Site configuration** > **Environment variables**
4. Cliquer sur **Add a variable**
5. Ajouter :
   - **Key** : `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **Value** : `G-XXXXXXXXXX` (votre Measurement ID)
6. **Scopes** : Cocher `Production` et `Deploy previews`
7. Cliquer sur **Create variable**

### Étape 2 : Redéployer le site
1. Aller dans **Deploys**
2. Cliquer sur **Trigger deploy** > **Deploy site**
3. Attendre que le déploiement soit terminé (~2 minutes)

---

## 3. Vérification du tracking

### Test immédiat (Temps réel)
1. Ouvrir un **onglet incognito** dans Chrome
2. Aller sur `https://tennismatchfinder.net`
3. **Accepter les cookies** dans la bannière
4. Dans GA4, aller dans **Rapports** > **Temps réel**
5. Vous devez voir **1 utilisateur actif**

### Test avec Tag Assistant
1. Installer l'extension Chrome [Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Activer l'extension
3. Visiter `tennismatchfinder.net`
4. L'extension doit afficher un tag GA4 vert ✅

---

## 4. Événements de conversion configurés

Le code TennisMatchFinder envoie automatiquement ces événements :

### Événements de conversion (Acquisition)

| Événement | Déclencheur | Paramètres |
|-----------|-------------|------------|
| `signup_started` | Clic sur "Rejoindre gratuitement" | `source` (landing_hero, navbar, etc.) |
| `signup_completed` | Inscription réussie | `club_slug`, `method` |
| `first_match_created` | Premier match enregistré | `elo_gained` |

### Événements d'engagement

| Événement | Déclencheur | Paramètres |
|-----------|-------------|------------|
| `match_now_activated` | Activation disponibilité | - |
| `elo_viewed` | Consultation classement | `player_elo` |
| `badge_earned` | Badge débloqué | `badge_id`, `badge_name` |
| `match_proposal` | Proposition de match | `opponent_elo` |

### Événements de monétisation

| Événement | Déclencheur | Paramètres |
|-----------|-------------|------------|
| `subscription` | Action abonnement | `tier`, `action` |
| `pricing_viewed` | Visite page pricing | `tier_viewed` |

---

## 5. Configuration des conversions dans GA4

### Marquer les événements comme conversions
1. Dans GA4, aller dans **Admin** > **Événements**
2. Pour chaque événement suivant, activer le toggle **Marquer comme conversion** :
   - ✅ `signup_completed` (Principale)
   - ✅ `first_match_created` (Activation)
   - ✅ `subscription` (Revenue)

### Attribuer une valeur aux conversions
1. Aller dans **Admin** > **Conversions**
2. Cliquer sur `signup_completed`
3. Activer **Utiliser une valeur de conversion par défaut**
4. Définir : `10 EUR` (valeur estimée d'un lead)

---

## 6. Liaison Google Ads (Optionnel - pour campagnes)

### Étape 1 : Lier les comptes
1. Dans GA4, aller dans **Admin** > **Liens produits** > **Liens Google Ads**
2. Cliquer sur **Associer**
3. Sélectionner votre compte Google Ads
4. Activer **Activer la publicité personnalisée**
5. Cliquer sur **Suivant** puis **Envoyer**

### Étape 2 : Importer les conversions dans Google Ads
1. Dans Google Ads, aller dans **Outils** > **Conversions**
2. Cliquer sur **+ Nouvelle action de conversion**
3. Sélectionner **Importer** > **Propriétés Google Analytics 4**
4. Sélectionner les événements :
   - `signup_completed`
   - `first_match_created`
5. Cliquer sur **Importer et continuer**

---

## 7. Dashboard recommandé

### Créer un rapport personnalisé "Acquisition TMF"

**Dimensions :**
- Source / Support
- Campagne
- Ville
- Appareil

**Métriques :**
- Utilisateurs
- Sessions
- Conversions (signup_completed)
- Taux de conversion
- Valeur de conversion

### Segments suggérés
1. **Trafic payant** : Source contient "google" OU "facebook" ET Support = "cpc"
2. **Organic** : Support = "organic"
3. **Direct** : Support = "(none)"

---

## 8. Checklist pré-campagne

- [ ] Variable `NEXT_PUBLIC_GA_MEASUREMENT_ID` configurée dans Netlify
- [ ] Site redéployé après ajout de la variable
- [ ] Test temps réel : 1 utilisateur visible dans GA4
- [ ] Événement `signup_completed` marqué comme conversion
- [ ] Liaison Google Ads effectuée (si campagnes prévues)
- [ ] Bannière cookies fonctionnelle (consentement requis pour GA4)

---

## 9. Utilisation des événements dans le code

Pour les développeurs, voici comment utiliser le tracking dans les composants React :

```typescript
import { useGoogleAnalytics } from '@/components/google-analytics';

function MonComposant() {
  const { 
    trackSignupStarted,
    trackSignupCompleted,
    trackCtaClicked 
  } = useGoogleAnalytics();

  const handleCtaClick = () => {
    trackSignupStarted('landing_hero');
    // Navigation vers /register
  };

  return (
    <button onClick={handleCtaClick}>
      Rejoindre gratuitement
    </button>
  );
}
```

---

## 10. Support

**Questions techniques :** Voir le fichier `src/components/google-analytics.tsx`

**Questions marketing :** Contacter l'équipe marketing

**Documentation GA4 officielle :** [support.google.com/analytics](https://support.google.com/analytics)

---

*Document préparé par Alex, Expert Product Marketing SaaS Sport*  
*Date : Janvier 2026*
