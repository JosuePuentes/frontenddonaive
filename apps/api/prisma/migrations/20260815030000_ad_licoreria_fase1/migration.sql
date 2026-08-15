-- A&D Licorería Fase 1 — schema operativo aditivo (NO destructivo)
CREATE SCHEMA IF NOT EXISTS "ad_licoreria";

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdOperatorRole" AS ENUM ('admin', 'supervisor', 'cajero', 'mesonera', 'inventario', 'tv');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdInventoryMovementType" AS ENUM ('IN', 'OUT', 'ADJUST', 'TRANSFER_OUT', 'TRANSFER_IN', 'SALE', 'SERVE', 'VOID_REVERSAL', 'PURCHASE', 'COUNT');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdTransferStatus" AS ENUM ('DRAFT', 'PRELIMINARY', 'CONFIRMED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdSaleStatus" AS ENUM ('draft', 'preliminary', 'completed', 'voided');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdAccountStatus" AS ENUM ('ABIERTA', 'PREPAGADA', 'PARCIALMENTE_PAGADA', 'CERRADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdPrepaidStatus" AS ENUM ('ACTIVE', 'PARTIAL', 'DEPLETED', 'VOIDED');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdClosureStatus" AS ENUM ('OPEN', 'CLOSED', 'VOIDED');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdMoneyCurrency" AS ENUM ('USD', 'BS');

-- CreateTable
CREATE TABLE "ad_licoreria"."AdTenant" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "exchangeRateUsdToBs" DECIMAL(18,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdWarehouse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdWarehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdOperator" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ad_licoreria"."AdOperatorRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "warehouseId" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdOperator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdOperatorPermission" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "AdOperatorPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdProduct" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "description" TEXT,
    "baseUnitLabel" TEXT NOT NULL DEFAULT 'u',
    "minStockBase" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPresentation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "unitsPerPresentation" DECIMAL(18,6) NOT NULL,
    "priceUsd" DECIMAL(18,4) NOT NULL,
    "priceBs" DECIMAL(18,4) NOT NULL,
    "minPriceUsd" DECIMAL(18,4),
    "maxPriceUsd" DECIMAL(18,4),
    "sku" TEXT,
    "barcode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPresentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdStock" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qtyBase" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdInventoryMovement" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "ad_licoreria"."AdInventoryMovementType" NOT NULL,
    "qtyBase" DECIMAL(18,4) NOT NULL,
    "presentationId" TEXT,
    "qtyPresentation" DECIMAL(65,30),
    "operatorId" TEXT,
    "reference" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdInventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdStockTransfer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "status" "ad_licoreria"."AdTransferStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "AdStockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdStockTransferLine" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT,
    "qty" DECIMAL(18,4) NOT NULL,
    "qtyBase" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "AdStockTransferLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdCustomer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdSale" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "customerId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "status" "ad_licoreria"."AdSaleStatus" NOT NULL DEFAULT 'draft',
    "totalUsd" DECIMAL(18,4) NOT NULL,
    "totalBs" DECIMAL(18,4) NOT NULL,
    "discountUsd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voidedAt" TIMESTAMP(3),

    CONSTRAINT "AdSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdSaleLine" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,
    "qtyBase" DECIMAL(18,4) NOT NULL,
    "unitPriceUsd" DECIMAL(18,4) NOT NULL,
    "unitPriceBs" DECIMAL(18,4) NOT NULL,
    "lineTotalUsd" DECIMAL(18,4) NOT NULL,
    "lineTotalBs" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "AdSaleLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdSalePayment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "reference" TEXT,
    "bank" TEXT,

    CONSTRAINT "AdSalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdTableSpace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "warehouseId" TEXT,

    CONSTRAINT "AdTableSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "tableId" TEXT,
    "mesoneraId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "status" "ad_licoreria"."AdAccountStatus" NOT NULL DEFAULT 'ABIERTA',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdAccountLine" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "qtyOrdered" DECIMAL(18,4) NOT NULL,
    "qtyServed" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unitPriceUsd" DECIMAL(18,4) NOT NULL,
    "unitPriceBs" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "AdAccountLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPrepaid" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "receiptRef" TEXT,
    "status" "ad_licoreria"."AdPrepaidStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalQtyBase" DECIMAL(18,4) NOT NULL,
    "remainingBase" DECIMAL(18,4) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPrepaid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPrepaidConsumption" (
    "id" TEXT NOT NULL,
    "prepaidId" TEXT NOT NULL,
    "qtyBase" DECIMAL(18,4) NOT NULL,
    "operatorId" TEXT,
    "verifiedPhone" TEXT,
    "verifiedDocument" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdPrepaidConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdCashClosure" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "expectedCashUsd" DECIMAL(18,4) NOT NULL,
    "expectedCashBs" DECIMAL(18,4) NOT NULL,
    "countedCashUsd" DECIMAL(18,4) NOT NULL,
    "countedCashBs" DECIMAL(18,4) NOT NULL,
    "differenceUsd" DECIMAL(18,4) NOT NULL,
    "differenceBs" DECIMAL(18,4) NOT NULL,
    "status" "ad_licoreria"."AdClosureStatus" NOT NULL DEFAULT 'CLOSED',
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCashClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdInventoryClosure" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" "ad_licoreria"."AdClosureStatus" NOT NULL DEFAULT 'CLOSED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdInventoryClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdInventoryClosureLine" (
    "id" TEXT NOT NULL,
    "closureId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "theoreticalBase" DECIMAL(18,4) NOT NULL,
    "physicalBase" DECIMAL(18,4) NOT NULL,
    "differenceBase" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "AdInventoryClosureLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdAuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "operatorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdTenant_projectId_key" ON "ad_licoreria"."AdTenant"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AdTenant_slug_key" ON "ad_licoreria"."AdTenant"("slug");

-- CreateIndex
CREATE INDEX "AdWarehouse_tenantId_idx" ON "ad_licoreria"."AdWarehouse"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AdWarehouse_tenantId_code_key" ON "ad_licoreria"."AdWarehouse"("tenantId", "code");

-- CreateIndex
CREATE INDEX "AdOperator_tenantId_idx" ON "ad_licoreria"."AdOperator"("tenantId");

-- CreateIndex
CREATE INDEX "AdOperator_userId_idx" ON "ad_licoreria"."AdOperator"("userId");

-- CreateIndex
CREATE INDEX "AdOperator_warehouseId_idx" ON "ad_licoreria"."AdOperator"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "AdOperator_tenantId_username_key" ON "ad_licoreria"."AdOperator"("tenantId", "username");

-- CreateIndex
CREATE INDEX "AdOperatorPermission_permission_idx" ON "ad_licoreria"."AdOperatorPermission"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "AdOperatorPermission_operatorId_permission_key" ON "ad_licoreria"."AdOperatorPermission"("operatorId", "permission");

-- CreateIndex
CREATE INDEX "AdCategory_tenantId_idx" ON "ad_licoreria"."AdCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AdCategory_tenantId_slug_key" ON "ad_licoreria"."AdCategory"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "AdProduct_tenantId_idx" ON "ad_licoreria"."AdProduct"("tenantId");

-- CreateIndex
CREATE INDEX "AdProduct_categoryId_idx" ON "ad_licoreria"."AdProduct"("categoryId");

-- CreateIndex
CREATE INDEX "AdPresentation_productId_idx" ON "ad_licoreria"."AdPresentation"("productId");

-- CreateIndex
CREATE INDEX "AdStock_productId_idx" ON "ad_licoreria"."AdStock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AdStock_warehouseId_productId_key" ON "ad_licoreria"."AdStock"("warehouseId", "productId");

-- CreateIndex
CREATE INDEX "AdInventoryMovement_warehouseId_createdAt_idx" ON "ad_licoreria"."AdInventoryMovement"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "AdInventoryMovement_productId_idx" ON "ad_licoreria"."AdInventoryMovement"("productId");

-- CreateIndex
CREATE INDEX "AdStockTransfer_tenantId_idx" ON "ad_licoreria"."AdStockTransfer"("tenantId");

-- CreateIndex
CREATE INDEX "AdStockTransfer_fromWarehouseId_idx" ON "ad_licoreria"."AdStockTransfer"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "AdStockTransfer_toWarehouseId_idx" ON "ad_licoreria"."AdStockTransfer"("toWarehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "AdStockTransfer_tenantId_documentNumber_key" ON "ad_licoreria"."AdStockTransfer"("tenantId", "documentNumber");

-- CreateIndex
CREATE INDEX "AdStockTransferLine_transferId_idx" ON "ad_licoreria"."AdStockTransferLine"("transferId");

-- CreateIndex
CREATE INDEX "AdCustomer_tenantId_idx" ON "ad_licoreria"."AdCustomer"("tenantId");

-- CreateIndex
CREATE INDEX "AdCustomer_tenantId_phone_idx" ON "ad_licoreria"."AdCustomer"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "AdCustomer_tenantId_document_idx" ON "ad_licoreria"."AdCustomer"("tenantId", "document");

-- CreateIndex
CREATE INDEX "AdSale_tenantId_createdAt_idx" ON "ad_licoreria"."AdSale"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AdSale_warehouseId_idx" ON "ad_licoreria"."AdSale"("warehouseId");

-- CreateIndex
CREATE INDEX "AdSale_operatorId_idx" ON "ad_licoreria"."AdSale"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "AdSale_tenantId_receiptNumber_key" ON "ad_licoreria"."AdSale"("tenantId", "receiptNumber");

-- CreateIndex
CREATE INDEX "AdSaleLine_saleId_idx" ON "ad_licoreria"."AdSaleLine"("saleId");

-- CreateIndex
CREATE INDEX "AdSalePayment_saleId_idx" ON "ad_licoreria"."AdSalePayment"("saleId");

-- CreateIndex
CREATE INDEX "AdTableSpace_tenantId_idx" ON "ad_licoreria"."AdTableSpace"("tenantId");

-- CreateIndex
CREATE INDEX "AdAccount_tenantId_idx" ON "ad_licoreria"."AdAccount"("tenantId");

-- CreateIndex
CREATE INDEX "AdAccount_warehouseId_idx" ON "ad_licoreria"."AdAccount"("warehouseId");

-- CreateIndex
CREATE INDEX "AdAccount_mesoneraId_idx" ON "ad_licoreria"."AdAccount"("mesoneraId");

-- CreateIndex
CREATE INDEX "AdAccountLine_accountId_idx" ON "ad_licoreria"."AdAccountLine"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "AdPrepaid_qrToken_key" ON "ad_licoreria"."AdPrepaid"("qrToken");

-- CreateIndex
CREATE INDEX "AdPrepaid_tenantId_idx" ON "ad_licoreria"."AdPrepaid"("tenantId");

-- CreateIndex
CREATE INDEX "AdPrepaid_customerId_idx" ON "ad_licoreria"."AdPrepaid"("customerId");

-- CreateIndex
CREATE INDEX "AdPrepaidConsumption_prepaidId_idx" ON "ad_licoreria"."AdPrepaidConsumption"("prepaidId");

-- CreateIndex
CREATE INDEX "AdCashClosure_tenantId_createdAt_idx" ON "ad_licoreria"."AdCashClosure"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AdCashClosure_warehouseId_idx" ON "ad_licoreria"."AdCashClosure"("warehouseId");

-- CreateIndex
CREATE INDEX "AdInventoryClosure_tenantId_idx" ON "ad_licoreria"."AdInventoryClosure"("tenantId");

-- CreateIndex
CREATE INDEX "AdInventoryClosureLine_closureId_idx" ON "ad_licoreria"."AdInventoryClosureLine"("closureId");

-- CreateIndex
CREATE INDEX "AdAuditEvent_tenantId_createdAt_idx" ON "ad_licoreria"."AdAuditEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AdAuditEvent_entity_entityId_idx" ON "ad_licoreria"."AdAuditEvent"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdWarehouse" ADD CONSTRAINT "AdWarehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdOperator" ADD CONSTRAINT "AdOperator_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdOperator" ADD CONSTRAINT "AdOperator_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdOperatorPermission" ADD CONSTRAINT "AdOperatorPermission_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "ad_licoreria"."AdOperator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCategory" ADD CONSTRAINT "AdCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdProduct" ADD CONSTRAINT "AdProduct_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdProduct" ADD CONSTRAINT "AdProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ad_licoreria"."AdCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPresentation" ADD CONSTRAINT "AdPresentation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdStock" ADD CONSTRAINT "AdStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdStock" ADD CONSTRAINT "AdStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdInventoryMovement" ADD CONSTRAINT "AdInventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdInventoryMovement" ADD CONSTRAINT "AdInventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdStockTransfer" ADD CONSTRAINT "AdStockTransfer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdStockTransfer" ADD CONSTRAINT "AdStockTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdStockTransfer" ADD CONSTRAINT "AdStockTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdStockTransferLine" ADD CONSTRAINT "AdStockTransferLine_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "ad_licoreria"."AdStockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdStockTransferLine" ADD CONSTRAINT "AdStockTransferLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdStockTransferLine" ADD CONSTRAINT "AdStockTransferLine_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCustomer" ADD CONSTRAINT "AdCustomer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdSale" ADD CONSTRAINT "AdSale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdSale" ADD CONSTRAINT "AdSale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdSale" ADD CONSTRAINT "AdSale_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "ad_licoreria"."AdOperator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdSale" ADD CONSTRAINT "AdSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "ad_licoreria"."AdCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD CONSTRAINT "AdSaleLine_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "ad_licoreria"."AdSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD CONSTRAINT "AdSaleLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdSaleLine" ADD CONSTRAINT "AdSaleLine_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdSalePayment" ADD CONSTRAINT "AdSalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "ad_licoreria"."AdSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdTableSpace" ADD CONSTRAINT "AdTableSpace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAccount" ADD CONSTRAINT "AdAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAccount" ADD CONSTRAINT "AdAccount_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAccount" ADD CONSTRAINT "AdAccount_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "ad_licoreria"."AdTableSpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAccount" ADD CONSTRAINT "AdAccount_mesoneraId_fkey" FOREIGN KEY ("mesoneraId") REFERENCES "ad_licoreria"."AdOperator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAccount" ADD CONSTRAINT "AdAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "ad_licoreria"."AdCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAccountLine" ADD CONSTRAINT "AdAccountLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ad_licoreria"."AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAccountLine" ADD CONSTRAINT "AdAccountLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAccountLine" ADD CONSTRAINT "AdAccountLine_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPrepaid" ADD CONSTRAINT "AdPrepaid_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPrepaid" ADD CONSTRAINT "AdPrepaid_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "ad_licoreria"."AdCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPrepaidConsumption" ADD CONSTRAINT "AdPrepaidConsumption_prepaidId_fkey" FOREIGN KEY ("prepaidId") REFERENCES "ad_licoreria"."AdPrepaid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCashClosure" ADD CONSTRAINT "AdCashClosure_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCashClosure" ADD CONSTRAINT "AdCashClosure_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdInventoryClosure" ADD CONSTRAINT "AdInventoryClosure_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdInventoryClosure" ADD CONSTRAINT "AdInventoryClosure_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdInventoryClosureLine" ADD CONSTRAINT "AdInventoryClosureLine_closureId_fkey" FOREIGN KEY ("closureId") REFERENCES "ad_licoreria"."AdInventoryClosure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAuditEvent" ADD CONSTRAINT "AdAuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAuditEvent" ADD CONSTRAINT "AdAuditEvent_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "ad_licoreria"."AdOperator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

