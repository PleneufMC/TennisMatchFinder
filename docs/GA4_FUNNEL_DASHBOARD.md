# Dashboard GA4 - Funnel Inscription TennisMatchFinder

> **Version** : 1.0 | **Date** : 28 janvier 2026
> **Objectif** : Visualiser et analyser le funnel d'inscription pour identifier les points d'abandon

---

## Événements Trackés

### Funnel Inscription (signup_step)

| Step | Événement | Trigger | Paramètres |
|------|-----------|---------|------------|
| 1 | `signup_step` | Champ fullname rempli (≥2 chars) | `step_name=fullname`, `step_number=1` |
| 2 | `signup_step` | Champ email rempli (contient @) | `step_name=email`, `step_number=2` |
| 3 | `signup_step` | Champ city rempli (≥2 chars) | `step_name=city`, `step_number=3` |
| 4 | `signup_step` | Niveau sélectionné | `step_name=level`, `step_number=4` |
| 5 | `signup_step` | Option club cochée | `step_name=club_option`, `step_number=5` |
| 6 | `signup_step` | Clic sur "Créer mon compte" | `step_name=submit_attempt`, `step_number=6` |
| ✓ | `signup_completed` | Inscription réussie | `club_slug`, `method=magic_link` |

### Funnel Onboarding (onboarding_step)

| Step | Événement | Trigger | Paramètres |
|------|-----------|---------|------------|
| 1 | `onboarding_step` | Vue step Welcome | `step_name=welcome`, `action=view` |
| 2 | `onboarding_step` | Vue step Profile | `step_name=profile`, `action=view/complete/skip` |
| 3 | `onboarding_step` | Vue step Level | `step_name=level`, `action=view/complete/skip` |
| 4 | `onboarding_step` | Vue step Availability | `step_name=availability`, `action=view/complete/skip` |
| 5 | `onboarding_step` | Vue step FirstMatch | `step_name=first_match`, `action=view` |
| ✓ | `onboarding_completed` | Profil créé | `total_time_seconds`, `skipped_steps` |

### Événements Erreur

| Événement | Trigger | Paramètres |
|-----------|---------|------------|
| `signup_error` | Erreur validation | `field_name`, `error_message` |
| `signup_abandonment` | Quitte la page | `last_step`, `time_spent_seconds` |

---

## Configuration GA4 - Exploration Funnel

### Étape 1 : Créer l'exploration

1. GA4 → **Explorer** → **+ Créer une exploration**
2. Choisir **Exploration en entonnoir**
3. Nommer : "Funnel Inscription TMF"

### Étape 2 : Configurer les étapes

**Étapes de l'entonnoir** :

```
Étape 1: Page /register vue
  → Événement: page_view
  → Condition: page_path = /register

Étape 2: Nom rempli
  → Événement: signup_step
  → Condition: step_name = fullname

Étape 3: Email rempli
  → Événement: signup_step
  → Condition: step_name = email

Étape 4: Ville remplie
  → Événement: signup_step
  → Condition: step_name = city

Étape 5: Niveau sélectionné
  → Événement: signup_step
  → Condition: step_name = level

Étape 6: Tentative soumission
  → Événement: signup_step
  → Condition: step_name = submit_attempt

Étape 7: Inscription complète
  → Événement: signup_completed
```

### Étape 3 : Dimensions de segmentation

Ajouter comme **Répartitions** :
- Appareil (device_category)
- Système d'exploitation (operating_system)
- Source / Support
- Pays

---

## Rapports Personnalisés à Créer

### Rapport 1 : Conversion par Source

| Dimension | Métrique |
|-----------|----------|
| Source / Support | Users, signup_completed, Taux conversion |
| Campagne | Users, signup_completed, Taux conversion |

**Filtre** : Exclure (direct) / (none)

### Rapport 2 : Erreurs Inscription

| Dimension | Métrique |
|-----------|----------|
| field_name (param signup_error) | Nombre d'erreurs |
| error_message (param signup_error) | Nombre d'erreurs |

**Usage** : Identifier les champs qui bloquent les users

### Rapport 3 : Temps par Étape

| Dimension | Métrique |
|-----------|----------|
| step_name | Temps moyen (via engagement_time) |

**Usage** : Identifier les étapes où les users hésitent

---

## Alertes GA4 à Configurer

### Alerte 1 : Taux de conversion bas

- **Condition** : Si `signup_completed` / `signup_started` < 25%
- **Fréquence** : Quotidien
- **Action** : Email à l'équipe

### Alerte 2 : Pic d'erreurs

- **Condition** : Si `signup_error` > 10 en 1 heure
- **Fréquence** : Temps réel
- **Action** : Notification push

### Alerte 3 : Abandon massif sur un step

- **Condition** : Drop > 50% entre deux steps consécutifs
- **Fréquence** : Quotidien
- **Action** : Email

---

## Métriques Cibles (Objectifs Q1 2026)

| Métrique | Baseline | Objectif S4 | Objectif Juin |
|----------|----------|-------------|---------------|
| Landing → /register | 17.8% (53/298) | 25% | 30% |
| /register → signup_completed | 28% (15/53) | 45% | 50%+ |
| Onboarding completion | ??? | 70% | 80% |
| Time to signup | ??? | < 3 min | < 2 min |

---

## Debug Mode - Vérification

### Test Manuel

1. Ouvrir la console du navigateur (F12)
2. Aller sur `/register`
3. Remplir les champs un par un
4. Vérifier les logs `[GA4] signup_step: ...`
5. Soumettre le formulaire
6. Vérifier `[Analytics] signup_completed`

### GA4 DebugView

1. GA4 → **Admin** → **DebugView**
2. Installer l'extension [GA Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
3. Activer le debug mode
4. Les événements apparaissent en temps réel

### Vérification Temps Réel

1. GA4 → **Rapports** → **Temps réel**
2. Section **Événements par nom**
3. Vérifier que `signup_step`, `signup_completed` apparaissent

---

## Checklist Post-Déploiement

- [ ] Événements `signup_step` visibles dans GA4 Temps réel
- [ ] Événement `signup_completed` déclenché après inscription test
- [ ] Paramètres (`step_name`, `step_number`) correctement transmis
- [ ] Événements onboarding trackés
- [ ] Rapport funnel créé dans Explorer
- [ ] Alerte taux conversion configurée
- [ ] Documentation partagée avec l'équipe

---

## Prochaines Améliorations (Roadmap)

1. **Heatmaps** : Intégrer Hotjar ou Microsoft Clarity pour voir les clics
2. **Session Recording** : Enregistrer les sessions d'abandon
3. **A/B Testing** : Tester formulaire 2 étapes vs 1 étape
4. **Cohort Analysis** : Analyser rétention par date d'inscription

---

**Document maintenu par** : Équipe TennisMatchFinder
**Dernière mise à jour** : 28 janvier 2026
