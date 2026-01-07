# TennisMatchFinder - Brief Complet pour Analyse Business

## 📋 Résumé Exécutif

**TennisMatchFinder** est une plateforme SaaS B2B2C de mise en relation pour joueurs de tennis amateurs au sein de clubs. Elle permet aux membres d'un club de trouver des partenaires de jeu de niveau similaire, d'organiser des matchs, et de suivre leur progression via un système de classement ELO innovant.

**URL Production** : https://tennismatchfinder.net  
**Stack technique** : Next.js 14, PostgreSQL (Neon), Pusher (temps réel), Netlify  
**Statut** : MVP fonctionnel, en phase de test

---

## 🎯 Problème Résolu

### Pour les joueurs amateurs de tennis :
1. **Difficulté à trouver des partenaires** de niveau équivalent dans leur club
2. **Pas de suivi de progression** en dehors des compétitions officielles FFT
3. **Organisation manuelle** des matchs (WhatsApp, tableaux papier, bouche-à-oreille)
4. **Manque de motivation** sans système de classement accessible
5. **Intégration sociale limitée** pour les nouveaux membres

### Pour les clubs de tennis :
1. **Fidélisation des adhérents** difficile à mesurer et améliorer
2. **Animation du club** reposant sur quelques bénévoles
3. **Pas de données** sur l'activité réelle des membres
4. **Communication fragmentée** entre membres

---

## 👥 Cibles Utilisateurs

### Utilisateurs finaux (B2C via B2B)
- **Joueurs amateurs** : 18-65 ans, tous niveaux (débutant à classé FFT)
- **Profil type** : Joue 1-3 fois/semaine, cherche des partenaires réguliers
- **Motivation** : Progresser, jouer plus, rencontrer d'autres membres

### Clients payants (B2B)
- **Clubs de tennis affiliés FFT** : ~7 500 clubs en France
- **Clubs privés / municipaux** : Structures avec 50-500 membres
- **Décideurs** : Président de club, responsable sportif, trésorier

---

## ✨ Fonctionnalités Implémentées (MVP)

### 1. Gestion Multi-Club
- Chaque club a son **instance isolée** (données séparées)
- **Inscription par club** avec validation admin
- **Slug personnalisé** : `/join/tc-pleneuf`, `/join/mccc`
- Un joueur = un club (pas de multi-appartenance pour l'instant)

### 2. Authentification Sécurisée
- **Magic Link par email** (pas de mot de passe à retenir)
- Session JWT sécurisée
- Rôles : Membre, Administrateur

### 3. Profil Joueur Complet
- Photo de profil
- **Niveau auto-évalué** : Débutant → Compétiteur
- **Disponibilités** : Jours + créneaux horaires
- **Préférences de jeu** : Simple/Double, surfaces préférées
- Statistiques : Matchs joués, victoires, série en cours

### 4. Système ELO Innovant
- **Score ELO initial** : 1500 points
- Calcul automatique après chaque match
- **Classement du club** visible par tous les membres
- Historique de progression avec graphiques
- **Motivation** : Voir sa progression même sans classement FFT

### 5. Propositions de Match
- Créer une **proposition ouverte** ("Je cherche un partenaire samedi 14h")
- Filtrer par niveau ELO compatible
- Accepter/Refuser les demandes
- Historique des matchs joués

### 6. Chat en Temps Réel (Pusher)
- **Salons par section** : Général, Compétition, Loisirs, Débutants...
- Messages instantanés (WebSocket)
- **Indicateurs de présence** : Qui est en ligne
- **Indicateurs de frappe** : "X écrit..."
- Isolation par club (confidentialité)

### 7. Forum de Discussion
- Threads par catégorie
- Réponses et discussions
- Complémentaire au chat (discussions longues vs instantané)

### 8. Administration Club
- **Tableau de bord admin**
- Gestion des demandes d'adhésion (approuver/rejeter)
- Création des salons de chat
- Gestion des membres (activer/désactiver)

### 9. Système de Badges (prévu)
- Récompenses pour l'activité
- Gamification : "Premier match", "10 victoires", "Série de 5"

---

## 🚀 Fonctionnalités Prévues (Roadmap)

### Court terme (1-3 mois)
- [ ] **Agent IA dans le chat** : Suggestions de partenaires, réponses aux questions
- [ ] **Notifications push** : Nouveau match proposé, message reçu
- [ ] **Réservation de terrains** (intégration avec systèmes existants)
- [ ] **Application mobile** (PWA ou React Native)

### Moyen terme (3-6 mois)
- [ ] **Tournois internes** : Création et gestion de compétitions club
- [ ] **Statistiques avancées** : Analytics pour les admins
- [ ] **Multi-sport** : Padel, Badminton, Squash
- [ ] **API publique** : Intégration avec d'autres outils

### Long terme (6-12 mois)
- [ ] **Inter-clubs** : Matchs et classements entre clubs partenaires
- [ ] **Marketplace** : Vente de matériel entre membres
- [ ] **Coaching** : Mise en relation avec moniteurs
- [ ] **Intégration FFT** : Import des classements officiels

---

## 💰 Modèles de Monétisation Possibles

### 1. Abonnement Club (B2B SaaS) - **Recommandé**
| Formule | Prix/mois | Membres max | Fonctionnalités |
|---------|-----------|-------------|-----------------|
| **Starter** | 29€ | 50 | Base : Profils, ELO, Matchs |
| **Club** | 79€ | 200 | + Chat temps réel, Forum, Stats |
| **Premium** | 149€ | 500 | + IA, Tournois, API, Support prioritaire |
| **Enterprise** | Sur devis | Illimité | Multi-sites, SSO, Formation |

**Avantages** :
- Revenus récurrents prévisibles (MRR)
- Alignement avec la valeur délivrée
- Scalable sans friction

### 2. Freemium + Upsell
- **Gratuit** : 20 membres, fonctionnalités de base
- **Payant** : Au-delà ou fonctionnalités avancées

### 3. Commission sur services
- % sur réservation de terrains
- % sur cours/coaching réservés via la plateforme

### 4. Publicité ciblée (non recommandé)
- Annonceurs équipement tennis
- Risque de dégrader l'expérience utilisateur

---

## 📊 Métriques Clés à Suivre

### Acquisition
- **Clubs inscrits** (total et par mois)
- **Membres par club** (moyenne)
- **Taux de conversion** visiteur → inscription

### Engagement
- **MAU/DAU** : Membres actifs mensuels/journaliers
- **Matchs organisés** par membre/mois
- **Messages envoyés** dans le chat
- **Temps passé** sur la plateforme

### Rétention
- **Churn rate** clubs (annulations abonnement)
- **Churn rate** membres (inactifs > 30 jours)
- **NPS** (Net Promoter Score)

### Revenus
- **MRR** (Monthly Recurring Revenue)
- **ARPU** (Average Revenue Per User/Club)
- **LTV** (Lifetime Value)
- **CAC** (Customer Acquisition Cost)

---

## 🏆 Avantages Concurrentiels

### 1. Spécialisation Tennis Club
- Pas une app généraliste (Meetup, Facebook)
- Fonctionnalités métier spécifiques (ELO, niveaux, surfaces)

### 2. Système ELO Accessible
- Motivation pour les non-classés FFT
- Gamification intelligente

### 3. Architecture Multi-tenant
- Chaque club isolé (données, chat, membres)
- Scalabilité technique prouvée

### 4. Chat Temps Réel Intégré
- Pas besoin de WhatsApp externe
- Historique centralisé, modération possible

### 5. Coût d'Acquisition Faible
- Vente B2B aux clubs (1 décision = 100+ utilisateurs)
- Bouche-à-oreille entre clubs

---

## 🎾 Concurrence

### Directe
| Concurrent | Forces | Faiblesses |
|------------|--------|------------|
| **Ten'Up (FFT)** | Officiel FFT, classement réel | Limité aux classés, UX datée |
| **Clubeo** | Gestion club complète | Pas spécialisé tennis, pas d'ELO |
| **SportEasy** | Multi-sport, mobile | Orienté équipes, pas tennis individuel |

### Indirecte
- **WhatsApp/Telegram** : Groupes informels (pas de structure)
- **Facebook Groups** : Communautés locales (pas de fonctionnalités métier)
- **Meetup** : Événements ponctuels (pas de suivi)

### Positionnement Différenciant
> "TennisMatchFinder est le **Tinder du tennis amateur** : trouvez votre partenaire idéal, suivez votre progression, le tout au sein de votre club."

---

## 🛠️ Stack Technique

| Composant | Technologie | Coût |
|-----------|-------------|------|
| **Frontend** | Next.js 14, React, TailwindCSS | - |
| **Backend** | Next.js API Routes, TypeScript | - |
| **Base de données** | PostgreSQL (Neon serverless) | ~$0-25/mois |
| **Temps réel** | Pusher Channels | ~$0-49/mois |
| **Hébergement** | Netlify | ~$0-19/mois |
| **Emails** | Gmail SMTP / Resend | ~$0-20/mois |
| **Domaine** | tennismatchfinder.net | ~$12/an |

**Coût infrastructure MVP** : < $100/mois

---

## 📈 Projections (Hypothèses)

### Année 1
- **Objectif** : 50 clubs actifs
- **Membres** : ~5 000 (moyenne 100/club)
- **MRR cible** : 3 000€ (60€/club moyen)
- **ARR** : 36 000€

### Année 2
- **Objectif** : 200 clubs actifs
- **Membres** : ~25 000
- **MRR cible** : 15 000€
- **ARR** : 180 000€

### Année 3
- **Objectif** : 500 clubs (France + Belgique/Suisse)
- **Membres** : ~75 000
- **MRR cible** : 40 000€
- **ARR** : 480 000€

---

## ❓ Questions pour le Spécialiste Business

1. **Pricing** : Le modèle d'abonnement par club est-il optimal ? Faut-il un modèle hybride ?

2. **Go-to-Market** : Quelle stratégie d'acquisition des premiers clubs ? (Démarchage direct, partenariat FFT, influenceurs tennis...)

3. **Différenciation** : Comment se positionner face à Ten'Up (officiel FFT) sans les antagoniser ?

4. **Expansion** : Faut-il rester niche (tennis) ou élargir rapidement (padel, badminton) ?

5. **Financement** : Bootstrap vs levée de fonds ? À quel stade ?

6. **Légal** : RGPD, CGU, responsabilité sur les matchs organisés ?

7. **Partenariats** : Équipementiers (Wilson, Babolat), fédérations, collectivités ?

---

## 📞 Contact

**Projet** : TennisMatchFinder  
**URL** : https://tennismatchfinder.net  
**GitHub** : https://github.com/PleneufMC/TennisMatchFinder  
**Admin test** : pfermanian@gmail.com

---

*Document généré le 7 janvier 2026*
