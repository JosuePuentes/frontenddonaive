-- A&D Fase 7 — Finanzas / Bancos / Casa de Cambio (aditivo)

CREATE TYPE "ad_licoreria"."AdFinancialAccountType" AS ENUM ('BANK', 'CASH', 'TILL', 'DIGITAL', 'OTHER');
CREATE TYPE "ad_licoreria"."AdFinancialMovementType" AS ENUM (
  'INGRESO_VENTA',
  'EGRESO_COMPRA',
  'EGRESO_GASTO',
  'RETIRO',
  'TRANSFERENCIA',
  'CAMBIO_MONEDA',
  'AJUSTE',
  'OTROS'
);
CREATE TYPE "ad_licoreria"."AdFinancialDocStatus" AS ENUM ('DRAFT', 'PRELIMINARY', 'CONFIRMED', 'VOIDED');

-- CPP vs reposición en producto
ALTER TABLE "ad_licoreria"."AdProduct"
  ADD COLUMN IF NOT EXISTS "replacementCostUsd" DECIMAL(18,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "replacementCostBs" DECIMAL(18,6) NOT NULL DEFAULT 0;

-- Vínculos opcionales en pagos de venta
ALTER TABLE "ad_licoreria"."AdSalePayment"
  ADD COLUMN IF NOT EXISTS "paymentMethodId" TEXT,
  ADD COLUMN IF NOT EXISTS "financialAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "financialMovementId" TEXT;

ALTER TABLE "ad_licoreria"."AdPayablePayment"
  ADD COLUMN IF NOT EXISTS "financialAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "financialMovementId" TEXT;

CREATE TABLE "ad_licoreria"."AdFinanceSettings" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "parallelRateHotkey" TEXT NOT NULL DEFAULT 'Control+x',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdFinanceSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdFinanceSettings_tenantId_key" ON "ad_licoreria"."AdFinanceSettings"("tenantId");

ALTER TABLE "ad_licoreria"."AdFinanceSettings"
  ADD CONSTRAINT "AdFinanceSettings_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ad_licoreria"."AdFinancialAccount" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "warehouseId" TEXT,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "type" "ad_licoreria"."AdFinancialAccountType" NOT NULL DEFAULT 'BANK',
  "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL,
  "openingBalance" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdFinancialAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdFinancialAccount_tenantId_name_key"
  ON "ad_licoreria"."AdFinancialAccount"("tenantId", "name");
CREATE INDEX "AdFinancialAccount_tenantId_currency_active_idx"
  ON "ad_licoreria"."AdFinancialAccount"("tenantId", "currency", "active");
CREATE INDEX "AdFinancialAccount_warehouseId_idx"
  ON "ad_licoreria"."AdFinancialAccount"("warehouseId");

ALTER TABLE "ad_licoreria"."AdFinancialAccount"
  ADD CONSTRAINT "AdFinancialAccount_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_licoreria"."AdFinancialAccount"
  ADD CONSTRAINT "AdFinancialAccount_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Método de pago → cuenta financiera (1:1 opcional)
ALTER TABLE "ad_licoreria"."AdPaymentMethod"
  ADD COLUMN IF NOT EXISTS "financialAccountId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AdPaymentMethod_financialAccountId_key"
  ON "ad_licoreria"."AdPaymentMethod"("financialAccountId");

ALTER TABLE "ad_licoreria"."AdPaymentMethod"
  ADD CONSTRAINT "AdPaymentMethod_financialAccountId_fkey"
  FOREIGN KEY ("financialAccountId") REFERENCES "ad_licoreria"."AdFinancialAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ad_licoreria"."AdFinancialMovement" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" "ad_licoreria"."AdFinancialMovementType" NOT NULL,
  "status" "ad_licoreria"."AdFinancialDocStatus" NOT NULL DEFAULT 'DRAFT',
  "accountId" TEXT NOT NULL,
  "counterAccountId" TEXT,
  "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL,
  "counterAmount" DECIMAL(18,4),
  "counterCurrency" "ad_licoreria"."AdMoneyCurrency",
  "rateUsed" DECIMAL(18,6),
  "concept" TEXT,
  "reference" TEXT,
  "relatedEntity" TEXT,
  "relatedId" TEXT,
  "saleId" TEXT,
  "purchaseId" TEXT,
  "payableId" TEXT,
  "operatorId" TEXT,
  "warehouseId" TEXT,
  "balanceBefore" DECIMAL(18,4),
  "balanceAfter" DECIMAL(18,4),
  "counterBalanceBefore" DECIMAL(18,4),
  "counterBalanceAfter" DECIMAL(18,4),
  "originalSaleAmount" DECIMAL(18,4),
  "originalSaleCurrency" "ad_licoreria"."AdMoneyCurrency",
  "fxDifference" DECIMAL(18,4),
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdFinancialMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdFinancialMovement_tenantId_createdAt_idx"
  ON "ad_licoreria"."AdFinancialMovement"("tenantId", "createdAt");
CREATE INDEX "AdFinancialMovement_tenantId_type_status_idx"
  ON "ad_licoreria"."AdFinancialMovement"("tenantId", "type", "status");
CREATE INDEX "AdFinancialMovement_accountId_createdAt_idx"
  ON "ad_licoreria"."AdFinancialMovement"("accountId", "createdAt");
CREATE INDEX "AdFinancialMovement_counterAccountId_idx"
  ON "ad_licoreria"."AdFinancialMovement"("counterAccountId");
CREATE INDEX "AdFinancialMovement_relatedEntity_relatedId_idx"
  ON "ad_licoreria"."AdFinancialMovement"("relatedEntity", "relatedId");

ALTER TABLE "ad_licoreria"."AdFinancialMovement"
  ADD CONSTRAINT "AdFinancialMovement_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ad_licoreria"."AdFinancialMovement"
  ADD CONSTRAINT "AdFinancialMovement_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "ad_licoreria"."AdFinancialAccount"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ad_licoreria"."AdFinancialMovement"
  ADD CONSTRAINT "AdFinancialMovement_counterAccountId_fkey"
  FOREIGN KEY ("counterAccountId") REFERENCES "ad_licoreria"."AdFinancialAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
