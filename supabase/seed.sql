-- ============================================
-- TennisMatchFinder - Seed Data
-- Description: Données initiales pour le club MCCC (développement/démo)
-- ============================================

-- Créer le premier club : MCCC
INSERT INTO public.clubs (id, name, slug, description, contact_email, settings)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'MCCC - Monaco Country Club de Cagnes',
  'mccc',
  'Le club de tennis de référence à Cagnes-sur-Mer. Rejoignez notre communauté de passionnés !',
  'contact@mccc-tennis.fr',
  '{
    "allowPublicRegistration": true,
    "requireApproval": false,
    "defaultElo": 1200,
    "inactivityDecay": {
      "enabled": true,
      "weeksBeforeDecay": 3,
      "decayPerWeek": 2
    },
    "eloConfig": {
      "kFactorNew": 40,
      "kFactorIntermediate": 32,
      "kFactorEstablished": 24,
      "kFactorHigh": 16
    },
    "botSettings": {
      "name": "TennisBot MCCC",
      "autoPostResults": true,
      "weeklyRecap": true
    }
  }'::jsonb
);

-- Note: Les joueurs seront créés via l'authentification Supabase
-- Ce seed créera quelques joueurs de test pour le développement

-- Pour le développement local uniquement (à supprimer en production)
-- Ces utilisateurs auront besoin d'une entrée correspondante dans auth.users

-- Exemple de structure pour les joueurs de test (à créer via l'interface Supabase)
/*
-- Joueur 1 : Pierre Martin (niveau expert)
INSERT INTO public.players (
  id, club_id, email, full_name, current_elo, best_elo, lowest_elo,
  self_assessed_level, availability, preferences,
  matches_played, wins, losses, unique_opponents
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'pierre.martin@example.com',
  'Pierre Martin',
  1650, 1680, 1200,
  'expert',
  '{"days": ["lundi", "mercredi", "samedi"], "timeSlots": ["soir", "après-midi"]}'::jsonb,
  '{"gameTypes": ["simple", "double"], "surfaces": ["terre battue", "dur"]}'::jsonb,
  45, 32, 13, 18
);

-- Joueur 2 : Sophie Dubois (niveau avancé)
INSERT INTO public.players (
  id, club_id, email, full_name, current_elo, best_elo, lowest_elo,
  self_assessed_level, availability, preferences,
  matches_played, wins, losses, unique_opponents
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'sophie.dubois@example.com',
  'Sophie Dubois',
  1480, 1520, 1200,
  'avancé',
  '{"days": ["mardi", "jeudi", "dimanche"], "timeSlots": ["matin", "midi"]}'::jsonb,
  '{"gameTypes": ["simple"], "surfaces": ["dur", "indoor"]}'::jsonb,
  38, 24, 14, 15
);

-- Joueur 3 : Marc Bernard (niveau intermédiaire)
INSERT INTO public.players (
  id, club_id, email, full_name, current_elo, best_elo, lowest_elo,
  self_assessed_level, availability, preferences,
  matches_played, wins, losses, unique_opponents
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'marc.bernard@example.com',
  'Marc Bernard',
  1320, 1350, 1180,
  'intermédiaire',
  '{"days": ["samedi", "dimanche"], "timeSlots": ["matin", "après-midi"]}'::jsonb,
  '{"gameTypes": ["simple", "double"], "surfaces": ["terre battue"]}'::jsonb,
  22, 12, 10, 12
);

-- Joueur 4 : Julie Leroy (nouvelle joueuse)
INSERT INTO public.players (
  id, club_id, email, full_name, current_elo, best_elo, lowest_elo,
  self_assessed_level, availability, preferences,
  matches_played, wins, losses, unique_opponents
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  'julie.leroy@example.com',
  'Julie Leroy',
  1200, 1200, 1200,
  'débutant',
  '{"days": ["mercredi", "vendredi"], "timeSlots": ["soir"]}'::jsonb,
  '{"gameTypes": ["simple"], "surfaces": []}'::jsonb,
  5, 2, 3, 5
);
*/

-- Thread de bienvenue dans le forum
INSERT INTO public.forum_threads (
  id, club_id, author_id, category, title, content,
  is_pinned, is_bot, is_announcement
) VALUES (
  'f1111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  NULL,  -- Bot post
  'annonces',
  '🎾 Bienvenue sur TennisMatchFinder - MCCC !',
  E'## Bienvenue dans la communauté TennisMatchFinder du MCCC !\n\nCette plateforme vous permet de :\n\n- **Trouver des partenaires** de votre niveau grâce à notre système ELO innovant\n- **Suivre votre progression** avec des statistiques détaillées\n- **Participer à la vie du club** via ce forum\n\n### Comment ça marche ?\n\n1. **Complétez votre profil** avec vos disponibilités et préférences\n2. **Consultez les suggestions** d''adversaires adaptés à votre niveau\n3. **Proposez un match** et attendez la confirmation\n4. **Enregistrez vos résultats** pour faire évoluer votre classement\n\n### Le système ELO\n\nNotre système de classement récompense la diversité des rencontres :\n- **+15% de points** pour un nouvel adversaire 🎯\n- **+20% de points** pour une victoire contre un joueur mieux classé 🏆\n- **Malus** si vous rejouez trop souvent le même adversaire\n\nBonne chance à tous ! 🎾',
  TRUE,
  TRUE,
  TRUE
);

-- Thread exemple dans la catégorie résultats
INSERT INTO public.forum_threads (
  id, club_id, author_id, category, title, content,
  is_bot
) VALUES (
  'f2222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'résultats',
  '📊 Récapitulatif de la semaine - Semaine 1',
  E'## Récapitulatif de la semaine\n\n*Du 16 au 22 décembre 2024*\n\n### Statistiques globales\n- **Matchs joués** : 0\n- **Joueurs actifs** : 0\n\n### À suivre\nLes premiers matchs seront affichés ici dès leur enregistrement !\n\n---\n*Ce message est automatiquement généré par TennisBot MCCC* 🤖',
  TRUE
);

-- Thread recherche partenaire
INSERT INTO public.forum_threads (
  id, club_id, author_id, category, title, content,
  is_bot
) VALUES (
  'f3333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'recherche-partenaire',
  '💡 Conseil : Comment utiliser la recherche de partenaires',
  E'## Trouvez le partenaire idéal !\n\nVoici quelques conseils pour optimiser votre recherche :\n\n### 1. Complétez votre profil\nPlus votre profil est complet, meilleures seront les suggestions :\n- Indiquez vos **jours et créneaux** disponibles\n- Précisez vos **surfaces** préférées\n- Mentionnez si vous préférez le **simple ou le double**\n\n### 2. Regardez les suggestions\nNotre algorithme prend en compte :\n- Votre **niveau ELO** (écart idéal : 50-150 points)\n- La **diversité** (bonus pour les nouveaux adversaires)\n- La **compatibilité** des disponibilités\n\n### 3. Osez les défis !\nN''hésitez pas à défier des joueurs légèrement au-dessus de votre niveau :\n- Vous gagnez plus de points en cas de victoire\n- C''est le meilleur moyen de progresser\n\nBon jeu ! 🎾',
  TRUE
);

-- ============================================
-- FIN DU SEED
-- ============================================
