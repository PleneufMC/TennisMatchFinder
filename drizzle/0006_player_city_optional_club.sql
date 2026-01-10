-- Migration: Joueurs non affiliés avec ville
-- Date: 2026-01-09
-- Description: Permet aux joueurs de s'inscrire sans club, avec une ville

-- 1. Ajouter la colonne city
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "city" varchar(100);

-- 2. Rendre club_id nullable (supprimer la contrainte NOT NULL)
ALTER TABLE "players" ALTER COLUMN "club_id" DROP NOT NULL;

-- 3. Modifier la contrainte ON DELETE pour SET NULL au lieu de CASCADE
-- D'abord supprimer l'ancienne contrainte
ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "players_club_id_clubs_id_fk";

-- Recréer avec ON DELETE SET NULL
ALTER TABLE "players" 
  ADD CONSTRAINT "players_club_id_clubs_id_fk" 
  FOREIGN KEY ("club_id") 
  REFERENCES "clubs"("id") 
  ON DELETE SET NULL;

-- 4. Index sur la ville pour les recherches
CREATE INDEX IF NOT EXISTS "players_city_idx" ON "players" ("city");

-- 5. Mettre à jour les joueurs existants avec une ville par défaut (optionnel)
-- UPDATE "players" SET "city" = 'Non renseignée' WHERE "city" IS NULL AND "club_id" IS NOT NULL;
