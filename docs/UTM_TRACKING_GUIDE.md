# Guide UTM & Attribution - TennisMatchFinder

> **Version** : 1.0 | **Date** : 28 janvier 2026
> **Objectif** : Résoudre le problème des 93% de trafic "Direct" et attribuer correctement les sources

---

## Problème Actuel

| Canal GA4 | % Trafic | Réalité probable |
|-----------|----------|------------------|
| Direct | 93% | WhatsApp, Email, Slack, QR codes |
| Organic | 2% | Google search réel |
| Autres | 5% | Referrals divers |

**Impact** : Impossible de savoir quels canaux convertissent → mauvaises décisions marketing.

---

## Solution : Liens UTM Systématiques

### Qu'est-ce qu'un UTM ?

Les paramètres UTM (Urchin Tracking Module) sont ajoutés à l'URL pour identifier la source du trafic :

```
https://tennismatchfinder.net/register
  ?utm_source=whatsapp
  &utm_medium=social
  &utm_campaign=launch_jan2026
  &utm_content=cta_button
```

---

## Liens Pré-Configurés (Copier-Coller)

### WhatsApp - Message Personnel

```
Découvre TennisMatchFinder, l'app qui trouve des adversaires à ton niveau ! 🎾

👉 https://tennismatchfinder.net/register?utm_source=whatsapp&utm_medium=social&utm_campaign=referral&utm_content=personal_message
```

**Lien court** : `https://tennismatchfinder.net/r/wa`

---

### WhatsApp - Groupe Club

```
[INFO CLUB] 📢

Nouveau : utilisez TennisMatchFinder pour organiser vos matchs et suivre votre classement ELO !

✅ Gratuit jusqu'au 30 juin 2026
✅ Suggestions d'adversaires à votre niveau
✅ Badges et gamification

Inscrivez-vous ici 👇
https://tennismatchfinder.net/register?utm_source=whatsapp&utm_medium=social&utm_campaign=club_announce&utm_content=group_message
```

---

### LinkedIn - Post Personnel

```
🎾 Tennis players: j'utilise @TennisMatchFinder pour trouver des adversaires à mon niveau.

Le système ELO récompense la diversité des rencontres - fini de jouer toujours contre les mêmes !

Early Bird gratuit jusqu'en juin 👉 https://tennismatchfinder.net/register?utm_source=linkedin&utm_medium=social&utm_campaign=personal_post&utm_content=organic

#tennis #startup #sport
```

---

### LinkedIn - Message Direct

```
Salut [Prénom],

Je me permets de te contacter car j'ai vu que tu jouais au tennis. Je voulais te partager TennisMatchFinder, une app que j'utilise pour trouver des partenaires de jeu.

C'est gratuit et le système de classement ELO est vraiment bien fait !

https://tennismatchfinder.net/register?utm_source=linkedin&utm_medium=social&utm_campaign=dm&utm_content=direct_message

À bientôt sur le court ! 🎾
```

---

### Email - Newsletter/Invitation

**Sujet** : Trouve ton prochain adversaire de tennis 🎾

```html
Bonjour [Prénom],

J'ai découvert TennisMatchFinder, une plateforme qui connecte les joueurs de tennis avec un système de classement ELO innovant.

Ce que j'apprécie :
• Suggestions d'adversaires adaptés à mon niveau
• Bonus ELO pour jouer contre de nouveaux partenaires
• Badges et gamification qui motivent

C'est gratuit jusqu'au 30 juin 2026 (offre Early Bird).

<a href="https://tennismatchfinder.net/register?utm_source=email&utm_medium=newsletter&utm_campaign=invite&utm_content=cta_button">
  Créer mon compte gratuitement
</a>

À bientôt sur le court,
[Ton nom]
```

---

### Email - Relance Abandons (38 users)

**Sujet** : Ton compte TennisMatchFinder t'attend 🎾

```
Bonjour,

Tu as commencé ton inscription sur TennisMatchFinder mais tu n'as pas terminé.

Pas de souci, ton compte est sauvegardé ! Reprends où tu en étais :

👉 https://tennismatchfinder.net/register?utm_source=email&utm_medium=reactivation&utm_campaign=abandon_jan2026&utm_content=reminder

Besoin d'aide ? Réponds à cet email.

L'équipe TennisMatchFinder
```

---

### QR Code - Affiche Club

Utiliser ce lien pour générer le QR code :

```
https://tennismatchfinder.net/register?utm_source=qrcode&utm_medium=offline&utm_campaign=club_poster&utm_content=mccc
```

Générateur : [QR Code Generator](https://www.qr-code-generator.com/)

---

### Facebook / Instagram - Post

```
https://tennismatchfinder.net/register?utm_source=facebook&utm_medium=social&utm_campaign=organic_post&utm_content=link_bio
```

---

### Forum Tennis (Tennis-Classim, etc.)

```
https://tennismatchfinder.net/register?utm_source=forum&utm_medium=referral&utm_campaign=tennis_community&utm_content=signature
```

---

## Convention de Nommage UTM

| Paramètre | Description | Exemples |
|-----------|-------------|----------|
| `utm_source` | Plateforme d'origine | `whatsapp`, `linkedin`, `email`, `qrcode`, `forum` |
| `utm_medium` | Type de canal | `social`, `newsletter`, `referral`, `offline`, `cpc` |
| `utm_campaign` | Nom de campagne | `launch_jan2026`, `referral`, `club_announce`, `abandon_relance` |
| `utm_content` | Variante du CTA | `cta_button`, `text_link`, `header`, `footer` |

---

## Tableau de Bord GA4 - Configuration

### Créer un rapport "Sources avec UTM"

1. GA4 → **Explorer** → **Créer une exploration**
2. **Dimensions** : 
   - Source / Support
   - Campagne
   - Contenu de l'annonce
3. **Métriques** :
   - Utilisateurs
   - Sessions
   - Conversions (signup_completed)
   - Taux de conversion
4. **Filtre** : Source ≠ (direct)

### Alertes à Configurer

1. **Alerte abandon** : Si taux signup_step_1 → signup_completed < 25%
2. **Alerte source** : Si nouveau trafic > 10 users depuis source inconnue

---

## Raccourcisseur de Liens (Optionnel)

Pour des liens plus propres, utiliser un raccourcisseur avec tracking :

| Outil | Avantage | Lien |
|-------|----------|------|
| Bitly | Gratuit, analytics | bitly.com |
| Rebrandly | Custom domain | rebrandly.com |
| Short.io | RGPD compliant | short.io |

Exemple :
- Long : `https://tennismatchfinder.net/register?utm_source=whatsapp&utm_medium=social&utm_campaign=referral`
- Court : `https://tmf.link/wa-ref`

---

## Checklist Avant Envoi

- [ ] UTM source correct (whatsapp, email, linkedin...)
- [ ] UTM medium cohérent (social, newsletter, referral...)
- [ ] UTM campaign identifiable (date ou thème)
- [ ] Lien testé et fonctionnel
- [ ] Tracking GA4 vérifié en temps réel après envoi test

---

## Mesure du ROI par Canal

Après 2 semaines de données :

| Canal | Users | Signups | Taux | CAC* |
|-------|-------|---------|------|------|
| WhatsApp perso | ? | ? | ? | €0 |
| WhatsApp groupe | ? | ? | ? | €0 |
| LinkedIn | ? | ? | ? | €0 |
| Email relance | ? | ? | ? | €0 |
| QR Code | ? | ? | ? | €5 (impression) |

*CAC = Coût d'Acquisition Client

---

**Document maintenu par** : Équipe TennisMatchFinder
**Dernière mise à jour** : 28 janvier 2026
