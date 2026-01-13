# 📋 Changelog TennisMatchFinder

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [0.9.0-beta] - 2026-01-13

### 🎉 Nouveautés

#### 🏠 Open Club - Club pour tous !
- **Nouveau** : Création de l'**Open Club**, un club par défaut pour tous les joueurs sans affiliation
- Les joueurs peuvent s'inscrire sans rejoindre un club spécifique
- Accès complet au dashboard et aux fonctionnalités pour tous
- Possibilité de rejoindre un club spécifique ultérieurement

#### 🏆 Box Leagues (Poules de compétition)
- **Nouveau** : Système de compétition par poules
- Création et gestion de box leagues par les administrateurs
- Classement automatique des joueurs dans les poules
- Suivi des matchs et résultats en temps réel

#### 📊 Tracking & Analytics
- Intégration **Google Analytics 4** (GA4) complète
- Intégration **Meta Pixel** pour le tracking marketing
- Événements personnalisés : inscription, création de match, badges, etc.
- Respect du RGPD avec consentement utilisateur

#### 🎯 Page Stratégie Digitale
- Nouvelle page `/strategie-digitale` documentant la stratégie marketing
- Calendrier des campagnes (mi-mars à mi-mai 2026)
- Templates d'annonces et briefs influenceurs
- Dashboard de suivi des KPIs

### 🐛 Corrections de bugs

#### Authentification
- **Corrigé** : Problème de connexion pour les joueurs sans club
- **Corrigé** : Race condition lors du chargement de la session
- **Corrigé** : Gestion des tokens JWT améliorée
- **Corrigé** : Types TypeScript pour `clubId: null`

#### Interface utilisateur
- **Corrigé** : Redirections intempestives vers /login
- **Corrigé** : Affichage du skeleton pendant le chargement
- **Corrigé** : Erreurs 404 sur certains assets

### 🔧 Améliorations techniques

- Centralisation de la configuration des super admins
- Meilleure gestion des erreurs dans les callbacks NextAuth
- Logging amélioré pour le debugging
- Documentation technique complète

### 👑 Administration

- **Nouveau** : Rôle Super Admin pour gérer tous les clubs
- Accès à la gestion de tous les joueurs (`/admin/tous-les-joueurs`)
- Possibilité de changer le club d'un joueur

---

## [0.8.0-alpha] - 2026-01-01

### 🎉 Nouveautés initiales

- Système d'authentification par magic link
- Profils joueurs avec niveau et disponibilités
- Système ELO pour le classement
- Création et gestion des matchs
- Forum de discussion par club
- Système de badges et gamification
- Notifications en temps réel

---

## Roadmap

### Prochaines versions prévues

#### v0.9.1-beta (Janvier 2026)
- [ ] Amélioration de l'onboarding
- [ ] Statistiques personnelles détaillées
- [ ] Export des données de match

#### v0.10.0-beta (Février 2026)
- [ ] Application mobile (PWA améliorée)
- [ ] Notifications push
- [ ] Chat en temps réel entre joueurs

#### v1.0.0 (Mars 2026)
- [ ] Lancement officiel
- [ ] Campagnes marketing actives
- [ ] Support multi-clubs complet

---

## Contribuer

Vous êtes un **Pionnier** de TennisMatchFinder ? Vos retours sont précieux !

- 💬 Partagez vos suggestions sur le [Forum](https://tennismatchfinder.net/forum)
- 🐛 Signalez les bugs rencontrés
- 💡 Proposez des nouvelles fonctionnalités

Merci de faire partie de l'aventure ! 🎾
