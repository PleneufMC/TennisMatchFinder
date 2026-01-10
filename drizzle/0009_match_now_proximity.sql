-- Migration: Match Now Proximity Search
-- Date: 2026-01-10
-- Description: Ajoute les colonnes pour la recherche par proximité dans Match Now

-- Rendre club_id nullable (pour permettre les matchs sans club)
ALTER TABLE "match_now_availability" ALTER COLUMN "club_id" DROP NOT NULL;

-- Ajouter la colonne search_mode ('club' ou 'proximity')
ALTER TABLE "match_now_availability" ADD COLUMN IF NOT EXISTS "search_mode" varchar(20) DEFAULT 'club' NOT NULL;

-- Ajouter la colonne radius_km (rayon de recherche en km)
ALTER TABLE "match_now_availability" ADD COLUMN IF NOT EXISTS "radius_km" integer;
