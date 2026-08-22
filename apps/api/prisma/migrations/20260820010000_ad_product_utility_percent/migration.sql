-- Utilidad de ficha (sobre costo) para calcular PVP al comprar.
ALTER TABLE "ad_licoreria"."AdProduct"
  ADD COLUMN IF NOT EXISTS "defaultUtilityPercent" DECIMAL(8, 4) NOT NULL DEFAULT 0;
