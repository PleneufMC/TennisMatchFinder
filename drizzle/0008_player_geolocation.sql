-- Migration: Géolocalisation des joueurs
-- Date: 2026-01-10
-- Description: Ajoute les coordonnées GPS pour la recherche par proximité

-- Ajouter les colonnes latitude et longitude
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "latitude" decimal(10, 8);
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "longitude" decimal(11, 8);

-- Index pour les recherches géographiques
CREATE INDEX IF NOT EXISTS "players_location_idx" ON "players" ("latitude", "longitude");

-- Note: Pour calculer la distance, on utilisera la formule de Haversine côté application
-- car PostgreSQL standard ne supporte pas les fonctions géospatiales (nécessite PostGIS)
