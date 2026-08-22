-- A&D Fase 4 — aditivo: espacios, auditoría warehouse, sesiones JWT
-- Sin DROP / sin RESET

ALTER TABLE "ad_licoreria"."AdTableSpace" ADD COLUMN IF NOT EXISTS "number" TEXT;
ALTER TABLE "ad_licoreria"."AdTableSpace" ADD COLUMN IF NOT EXISTS "spaceType" TEXT NOT NULL DEFAULT 'mesa';
ALTER TABLE "ad_licoreria"."AdTableSpace" ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "ad_licoreria"."AdTableSpace" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'disponible';

CREATE INDEX IF NOT EXISTS "AdTableSpace_warehouseId_idx" ON "ad_licoreria"."AdTableSpace"("warehouseId");

ALTER TABLE "ad_licoreria"."AdAuditEvent" ADD COLUMN IF NOT EXISTS "warehouseId" TEXT;
CREATE INDEX IF NOT EXISTS "AdAuditEvent_warehouseId_createdAt_idx" ON "ad_licoreria"."AdAuditEvent"("warehouseId", "createdAt");

CREATE TABLE IF NOT EXISTS "ad_licoreria"."AdAuthSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdAuthSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdAuthSession_jti_key" ON "ad_licoreria"."AdAuthSession"("jti");
CREATE INDEX IF NOT EXISTS "AdAuthSession_tenantId_operatorId_idx" ON "ad_licoreria"."AdAuthSession"("tenantId", "operatorId");
CREATE INDEX IF NOT EXISTS "AdAuthSession_expiresAt_idx" ON "ad_licoreria"."AdAuthSession"("expiresAt");
