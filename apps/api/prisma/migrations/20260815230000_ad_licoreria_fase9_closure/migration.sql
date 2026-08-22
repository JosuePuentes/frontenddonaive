-- A&D Fase 9 — conciliación financiera básica (aditivo, NO destructivo)

CREATE TABLE "ad_licoreria"."AdFinancialReconciliation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "periodFrom" TIMESTAMP(3),
    "periodTo" TIMESTAMP(3),
    "openingBalance" DECIMAL(18,4) NOT NULL,
    "income" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "expense" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "transfersIn" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "transfersOut" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "calculatedBalance" DECIMAL(18,4) NOT NULL,
    "systemBalance" DECIMAL(18,4) NOT NULL,
    "declaredBalance" DECIMAL(18,4) NOT NULL,
    "difference" DECIMAL(18,4) NOT NULL,
    "notes" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdFinancialReconciliation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdFinancialReconciliation_tenantId_asOfDate_idx" ON "ad_licoreria"."AdFinancialReconciliation"("tenantId", "asOfDate");
CREATE INDEX "AdFinancialReconciliation_accountId_createdAt_idx" ON "ad_licoreria"."AdFinancialReconciliation"("accountId", "createdAt");

ALTER TABLE "ad_licoreria"."AdFinancialReconciliation" ADD CONSTRAINT "AdFinancialReconciliation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ad_licoreria"."AdFinancialReconciliation" ADD CONSTRAINT "AdFinancialReconciliation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ad_licoreria"."AdFinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
