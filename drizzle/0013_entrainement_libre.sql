-- Migration: Entraînement libre (Lot 1) + flag coach (préparation Lot 2)
-- Date: 2026-06-17
-- Description:
--   1. Étend match_now_availability pour distinguer les sessions "match" (classées, enjeu ELO)
--      des sessions "training" (entraînement libre : échange de balles, AUCUN enjeu ELO).
--   2. Ajoute court_paid_by_organizer : en cross-club, l'organisateur paie le court.
--      Paiement HORS plateforme — on stocke uniquement le flag pour afficher le label
--      "Court payé par l'organisateur". Aucun paiement intégré.
--   3. Ajoute players.is_coach : un membre peut être à la fois joueur ET coach
--      (marketplace profs, Lot 2). Réutilise NextAuth, aucune table d'auth séparée.
-- Idempotente : ré-exécutable sans erreur.

-- 1. session_type : 'match' (défaut) | 'training'
ALTER TABLE "match_now_availability"
  ADD COLUMN IF NOT EXISTS "session_type" varchar(20) DEFAULT 'match' NOT NULL;

-- 2. court_paid_by_organizer : label off-platform pour cross-club
ALTER TABLE "match_now_availability"
  ADD COLUMN IF NOT EXISTS "court_paid_by_organizer" boolean DEFAULT false NOT NULL;

-- 3. is_coach sur players (préparation marketplace profs)
ALTER TABLE "players"
  ADD COLUMN IF NOT EXISTS "is_coach" boolean DEFAULT false NOT NULL;

-- Index pour filtrer rapidement les sessions actives par type (ex: lister les entraînements libres ouverts)
CREATE INDEX IF NOT EXISTS "match_now_session_type_idx"
  ON "match_now_availability" ("session_type", "is_active");

-- Documentation
COMMENT ON COLUMN "match_now_availability"."session_type" IS 'match=rencontre classée (enjeu ELO) | training=entraînement libre (aucun enjeu ELO)';
COMMENT ON COLUMN "match_now_availability"."court_paid_by_organizer" IS 'Cross-club : organisateur paie le court HORS plateforme. Flag affichage uniquement.';
COMMENT ON COLUMN "players"."is_coach" IS 'Membre déclaré coach (marketplace profs). Un joueur peut aussi être coach.';
