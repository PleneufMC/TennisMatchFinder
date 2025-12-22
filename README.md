# TennisMatchFinder 🎾

Plateforme SaaS de mise en relation pour joueurs de tennis avec système de classement ELO innovant.

## 🌟 Fonctionnalités

### Système ELO innovant
- **Bonus nouvel adversaire** (+15%) : Récompense la diversité des rencontres
- **Malus répétition** (-5% par match) : Pénalise les adversaires trop fréquents
- **Bonus exploit** (+20%) : Valorise les victoires contre des joueurs mieux classés
- **Bonus diversité hebdo** (+10%) : Encourage 3+ adversaires différents par semaine
- **Facteur K dynamique** : Ajustement selon l'expérience du joueur

### Suggestions d'adversaires intelligentes
- Matching basé sur le niveau ELO (écart idéal 50-150 points)
- Compatibilité des disponibilités
- Préférences de jeu (simple, double)
- Score de nouveauté pour diversifier

### Forum communautaire
- Catégories : Général, Recherche partenaire, Résultats, Équipement, Annonces
- Réactions emoji (👍 🎾 🔥 😂 🤔)
- Mise à jour temps réel
- Intégration bot IA via N8N

### Multi-tenant
- Un club = un espace isolé
- Classements séparés
- Forums dédiés
- Configuration personnalisable

## 🛠 Stack technique

- **Framework**: Next.js 14 (App Router, Server Components, Server Actions)
- **Langage**: TypeScript (strict mode)
- **Base de données & Auth**: Supabase (PostgreSQL, Auth Magic Link, Realtime, RLS)
- **UI**: Tailwind CSS + shadcn/ui
- **Déploiement**: Netlify
- **Intégration**: Webhook pour agent IA via N8N

## 📂 Structure du projet

```
tennismatchfinder/
├── src/
│   ├── app/                    # Routes Next.js 14
│   │   ├── (public)/           # Pages publiques (landing, pricing)
│   │   ├── (auth)/             # Pages d'authentification
│   │   ├── (dashboard)/        # Pages protégées (dashboard)
│   │   └── api/                # Route handlers API
│   ├── components/             # Composants React
│   │   ├── ui/                 # Composants shadcn/ui
│   │   ├── layout/             # Layout (sidebar, header)
│   │   └── ...                 # Composants métier
│   ├── lib/                    # Utilitaires et logique métier
│   │   ├── supabase/           # Clients Supabase
│   │   ├── elo/                # Calcul ELO
│   │   ├── matching/           # Moteur de suggestions
│   │   └── validations/        # Schémas Zod
│   ├── hooks/                  # React hooks personnalisés
│   ├── types/                  # Types TypeScript
│   └── constants/              # Constantes
├── supabase/
│   ├── migrations/             # Migrations SQL
│   └── seed.sql                # Données initiales
└── public/                     # Assets statiques
```

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- Un projet Supabase
- Un compte Netlify (optionnel pour le déploiement)

### Installation

1. **Cloner le repo**
```bash
git clone https://github.com/your-org/tennismatchfinder.git
cd tennismatchfinder
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.local.example .env.local
# Éditer .env.local avec vos clés Supabase
```

4. **Configurer la base de données Supabase**
```bash
# Via le dashboard Supabase, exécuter:
# - supabase/migrations/001_initial_schema.sql
# - supabase/seed.sql
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application est accessible sur http://localhost:3000

## 🔑 Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (serveur uniquement) | ✅ |
| `N8N_WEBHOOK_SECRET` | Secret pour les webhooks N8N | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL de l'application | ✅ |

## 🌐 URLs

- **Production**: https://tennismatchfinder.net
- **Preview**: https://tennismatchfinder.netlify.app
- **GitHub**: https://github.com/your-org/tennismatchfinder

## 📊 API Webhooks N8N

### POST /api/webhooks/n8n-bot
Actions du bot IA pour poster sur le forum.

```json
{
  "action": "create_thread",
  "clubId": "uuid",
  "data": {
    "category": "résultats",
    "title": "🎾 Victoire de Pierre contre Marc",
    "content": "Pierre remporte le match 6-4 6-2..."
  }
}
```

### GET /api/webhooks/events
Récupérer les événements récents pour déclencher des actions bot.

```
GET /api/webhooks/events?clubId=uuid&since=2024-01-01T00:00:00Z
```

## 🔒 Sécurité

- Row Level Security (RLS) sur toutes les tables
- Authentification Magic Link + mot de passe optionnel
- Isolation multi-tenant complète
- Headers de sécurité via netlify.toml
- Validation Zod sur tous les inputs

## 📱 Fonctionnalités à venir

- [ ] Notifications push
- [ ] Application mobile (React Native)
- [ ] Tournois et compétitions
- [ ] Statistiques avancées avec graphiques
- [ ] Export PDF des profils

## 📄 Licence

Propriétaire - Tous droits réservés

## 👥 Équipe

Développé pour la communauté tennis 🎾
