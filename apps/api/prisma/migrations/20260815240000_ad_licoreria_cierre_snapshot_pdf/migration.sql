-- A&D Cierre — snapshot de costo en ventas, OC→compra, umbrales configurables

-- AdSaleLine: costo histórico inmutable
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "unitCostUsdSnapshot" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "unitCostBsSnapshot" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "lineCostUsdSnapshot" DECIMAL(18,4) NOT NULL DEFAULT 0;
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "lineCostBsSnapshot" DECIMAL(18,4) NOT NULL DEFAULT 0;
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "costCurrency" "ad_licoreria"."AdMoneyCurrency" NOT NULL DEFAULT 'USD';
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "cppUsdSnapshot" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "cppBsSnapshot" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "costSource" TEXT NOT NULL DEFAULT 'avg_cost';
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "costSnapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD COLUMN IF NOT EXISTS "bcvRateAtSale" DECIMAL(18,6);

CREATE INDEX IF NOT EXISTS "AdSaleLine_productId_idx" ON "ad_licoreria"."AdSaleLine"("productId");

-- AdPurchase ← OC (idempotente)
ALTER TABLE "ad_licoreria"."AdPurchase" ADD COLUMN IF NOT EXISTS "purchaseOrderId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "AdPurchase_purchaseOrderId_key" ON "ad_licoreria"."AdPurchase"("purchaseOrderId");
DO $$ BEGIN
  ALTER TABLE "ad_licoreria"."AdPurchase" ADD CONSTRAINT "AdPurchase_purchaseOrderId_fkey"
    FOREIGN KEY ("purchaseOrderId") REFERENCES "ad_licoreria"."AdPurchaseOrder"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Umbrales configurables
ALTER TABLE "ad_licoreria"."AdFinanceSettings" ADD COLUMN IF NOT EXISTS "pricingCriticalUtilityPercent" DECIMAL(8,4) NOT NULL DEFAULT 5;
ALTER TABLE "ad_licoreria"."AdFinanceSettings" ADD COLUMN IF NOT EXISTS "inventoryCriticalCoverageDays" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "ad_licoreria"."AdFinanceSettings" ADD COLUMN IF NOT EXISTS "inventoryWarnCoverageDays" INTEGER NOT NULL DEFAULT 7;
