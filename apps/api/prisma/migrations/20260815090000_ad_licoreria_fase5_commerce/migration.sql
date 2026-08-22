-- CreateEnum
CREATE TYPE "ad_licoreria"."AdPayableStatus" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdPurchaseCostMode" AS ENUM ('UNIT', 'PRESENTATION', 'TOTAL');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdPaymentCondition" AS ENUM ('CONTADO', 'CREDITO');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdExchangeRateKind" AS ENUM ('BCV', 'PROTECTED');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdPriceKind" AS ENUM ('NORMAL', 'PROMOCION', 'ESPECIAL', 'METODO_PAGO');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdPurchaseOrderStatus" AS ENUM ('DRAFT', 'PRELIMINARY', 'CONFIRMED', 'SENT', 'CANCELLED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdImportBatchStatus" AS ENUM ('UPLOADED', 'VALIDATED', 'PREVIEW', 'CONFIRMED', 'CANCELLED');



-- AlterTable
ALTER TABLE "ad_licoreria"."AdPurchase" ADD COLUMN     "bcvRateSnapshot" DECIMAL(18,6),
ADD COLUMN     "creditDays" INTEGER,
ADD COLUMN     "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceDate" TIMESTAMP(3),
ADD COLUMN     "paymentCondition" "ad_licoreria"."AdPaymentCondition" NOT NULL DEFAULT 'CONTADO',
ADD COLUMN     "paymentMethodId" TEXT,
ADD COLUMN     "protectedRateSnapshot" DECIMAL(18,6),
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "totalInvoicedBs" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "totalInvoicedUsd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "useProtectedRateRef" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ad_licoreria"."AdPurchaseLine" ADD COLUMN     "costMode" "ad_licoreria"."AdPurchaseCostMode" NOT NULL DEFAULT 'UNIT',
ADD COLUMN     "effectivePresentationCostBs" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "effectivePresentationCostUsd" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "effectiveUnitCostBs" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "effectiveUnitCostUsd" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "equivalentCostBs" DECIMAL(18,6),
ADD COLUMN     "equivalentCostUsd" DECIMAL(18,6),
ADD COLUMN     "presentationCostBs" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "presentationCostUsd" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "qtyBonus" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "qtyBonusBase" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "qtyReceivedBase" DECIMAL(18,4) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ad_licoreria"."AdSupplier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identification" TEXT,
    "phone" TEXT,
    "contactName" TEXT,
    "address" TEXT,
    "email" TEXT,
    "defaultCurrency" "ad_licoreria"."AdMoneyCurrency" NOT NULL DEFAULT 'USD',
    "creditDays" INTEGER NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPayable" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "paidAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "balance" DECIMAL(18,4) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "ad_licoreria"."AdPayableStatus" NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPayable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPayablePayment" (
    "id" TEXT NOT NULL,
    "payableId" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL,
    "paymentMethodId" TEXT,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdPayablePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdExchangeRate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" "ad_licoreria"."AdExchangeRateKind" NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPaymentMethod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "accountLabel" TEXT,
    "usesSpecialRateRef" BOOLEAN NOT NULL DEFAULT false,
    "requiresReference" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPresentationPrice" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "kind" "ad_licoreria"."AdPriceKind" NOT NULL DEFAULT 'NORMAL',
    "name" TEXT,
    "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL DEFAULT 'USD',
    "price" DECIMAL(18,4) NOT NULL,
    "utilityPercent" DECIMAL(18,6),
    "paymentMethodId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPresentationPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPromotion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL DEFAULT 'USD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPromotionItem" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "price" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "AdPromotionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPromotionPaymentMethod" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,

    CONSTRAINT "AdPromotionPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdCombo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL DEFAULT 'USD',
    "price" DECIMAL(18,4) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCombo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "AdComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdComboPaymentMethod" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,

    CONSTRAINT "AdComboPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPurchaseOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT,
    "warehouseId" TEXT,
    "documentNumber" TEXT NOT NULL,
    "status" "ad_licoreria"."AdPurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "coverageDays" INTEGER,
    "expectedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT,
    "suggestedQtyBase" DECIMAL(18,4) NOT NULL,
    "qtyBase" DECIMAL(18,4) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AdPurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdImportBatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'products',
    "fileName" TEXT,
    "status" "ad_licoreria"."AdImportBatchStatus" NOT NULL DEFAULT 'UPLOADED',
    "summary" JSONB,
    "createdById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdImportRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "raw" JSONB NOT NULL,
    "normalized" JSONB,
    "errors" JSONB,
    "action" TEXT,
    "productId" TEXT,
    "valid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdSupplier_tenantId_idx" ON "ad_licoreria"."AdSupplier"("tenantId");

-- CreateIndex
CREATE INDEX "AdSupplier_tenantId_name_idx" ON "ad_licoreria"."AdSupplier"("tenantId", "name");

-- CreateIndex
CREATE INDEX "AdSupplier_tenantId_identification_idx" ON "ad_licoreria"."AdSupplier"("tenantId", "identification");

-- CreateIndex
CREATE UNIQUE INDEX "AdPayable_purchaseId_key" ON "ad_licoreria"."AdPayable"("purchaseId");

-- CreateIndex
CREATE INDEX "AdPayable_tenantId_status_idx" ON "ad_licoreria"."AdPayable"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AdPayable_supplierId_idx" ON "ad_licoreria"."AdPayable"("supplierId");

-- CreateIndex
CREATE INDEX "AdPayable_dueDate_idx" ON "ad_licoreria"."AdPayable"("dueDate");

-- CreateIndex
CREATE INDEX "AdPayablePayment_payableId_idx" ON "ad_licoreria"."AdPayablePayment"("payableId");

-- CreateIndex
CREATE INDEX "AdExchangeRate_tenantId_kind_effectiveAt_idx" ON "ad_licoreria"."AdExchangeRate"("tenantId", "kind", "effectiveAt");

-- CreateIndex
CREATE INDEX "AdPaymentMethod_tenantId_active_idx" ON "ad_licoreria"."AdPaymentMethod"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AdPaymentMethod_tenantId_code_key" ON "ad_licoreria"."AdPaymentMethod"("tenantId", "code");

-- CreateIndex
CREATE INDEX "AdPresentationPrice_presentationId_kind_idx" ON "ad_licoreria"."AdPresentationPrice"("presentationId", "kind");

-- CreateIndex
CREATE INDEX "AdPresentationPrice_productId_idx" ON "ad_licoreria"."AdPresentationPrice"("productId");

-- CreateIndex
CREATE INDEX "AdPresentationPrice_paymentMethodId_idx" ON "ad_licoreria"."AdPresentationPrice"("paymentMethodId");

-- CreateIndex
CREATE INDEX "AdPromotion_tenantId_active_idx" ON "ad_licoreria"."AdPromotion"("tenantId", "active");

-- CreateIndex
CREATE INDEX "AdPromotionItem_promotionId_idx" ON "ad_licoreria"."AdPromotionItem"("promotionId");

-- CreateIndex
CREATE INDEX "AdPromotionItem_presentationId_idx" ON "ad_licoreria"."AdPromotionItem"("presentationId");

-- CreateIndex
CREATE UNIQUE INDEX "AdPromotionPaymentMethod_promotionId_paymentMethodId_key" ON "ad_licoreria"."AdPromotionPaymentMethod"("promotionId", "paymentMethodId");

-- CreateIndex
CREATE INDEX "AdCombo_tenantId_active_idx" ON "ad_licoreria"."AdCombo"("tenantId", "active");

-- CreateIndex
CREATE INDEX "AdComboItem_comboId_idx" ON "ad_licoreria"."AdComboItem"("comboId");

-- CreateIndex
CREATE UNIQUE INDEX "AdComboPaymentMethod_comboId_paymentMethodId_key" ON "ad_licoreria"."AdComboPaymentMethod"("comboId", "paymentMethodId");

-- CreateIndex
CREATE INDEX "AdPurchaseOrder_tenantId_status_idx" ON "ad_licoreria"."AdPurchaseOrder"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AdPurchaseOrder_supplierId_idx" ON "ad_licoreria"."AdPurchaseOrder"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "AdPurchaseOrder_tenantId_documentNumber_key" ON "ad_licoreria"."AdPurchaseOrder"("tenantId", "documentNumber");

-- CreateIndex
CREATE INDEX "AdPurchaseOrderLine_purchaseOrderId_idx" ON "ad_licoreria"."AdPurchaseOrderLine"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "AdPurchaseOrderLine_productId_idx" ON "ad_licoreria"."AdPurchaseOrderLine"("productId");

-- CreateIndex
CREATE INDEX "AdImportBatch_tenantId_status_idx" ON "ad_licoreria"."AdImportBatch"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AdImportRow_batchId_idx" ON "ad_licoreria"."AdImportRow"("batchId");

-- CreateIndex
CREATE INDEX "AdPresentation_barcode_idx" ON "ad_licoreria"."AdPresentation"("barcode");

-- CreateIndex
CREATE INDEX "AdPresentation_sku_idx" ON "ad_licoreria"."AdPresentation"("sku");

-- CreateIndex
CREATE INDEX "AdProduct_tenantId_sku_idx" ON "ad_licoreria"."AdProduct"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "AdProduct_tenantId_barcode_idx" ON "ad_licoreria"."AdProduct"("tenantId", "barcode");

-- CreateIndex
CREATE INDEX "AdProduct_tenantId_name_idx" ON "ad_licoreria"."AdProduct"("tenantId", "name");

-- CreateIndex
CREATE INDEX "AdProduct_tenantId_brand_idx" ON "ad_licoreria"."AdProduct"("tenantId", "brand");

-- CreateIndex
CREATE INDEX "AdPurchase_supplierId_idx" ON "ad_licoreria"."AdPurchase"("supplierId");

-- CreateIndex
CREATE INDEX "AdPurchaseLine_productId_idx" ON "ad_licoreria"."AdPurchaseLine"("productId");

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchase" ADD CONSTRAINT "AdPurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ad_licoreria"."AdSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchase" ADD CONSTRAINT "AdPurchase_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "ad_licoreria"."AdPaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdSupplier" ADD CONSTRAINT "AdSupplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPayable" ADD CONSTRAINT "AdPayable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPayable" ADD CONSTRAINT "AdPayable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ad_licoreria"."AdSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPayable" ADD CONSTRAINT "AdPayable_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ad_licoreria"."AdPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPayablePayment" ADD CONSTRAINT "AdPayablePayment_payableId_fkey" FOREIGN KEY ("payableId") REFERENCES "ad_licoreria"."AdPayable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdExchangeRate" ADD CONSTRAINT "AdExchangeRate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPaymentMethod" ADD CONSTRAINT "AdPaymentMethod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPresentationPrice" ADD CONSTRAINT "AdPresentationPrice_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPresentationPrice" ADD CONSTRAINT "AdPresentationPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPresentationPrice" ADD CONSTRAINT "AdPresentationPrice_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "ad_licoreria"."AdPaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPromotion" ADD CONSTRAINT "AdPromotion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPromotionItem" ADD CONSTRAINT "AdPromotionItem_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "ad_licoreria"."AdPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPromotionItem" ADD CONSTRAINT "AdPromotionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPromotionItem" ADD CONSTRAINT "AdPromotionItem_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPromotionPaymentMethod" ADD CONSTRAINT "AdPromotionPaymentMethod_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "ad_licoreria"."AdPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPromotionPaymentMethod" ADD CONSTRAINT "AdPromotionPaymentMethod_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "ad_licoreria"."AdPaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCombo" ADD CONSTRAINT "AdCombo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdComboItem" ADD CONSTRAINT "AdComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "ad_licoreria"."AdCombo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdComboItem" ADD CONSTRAINT "AdComboItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdComboItem" ADD CONSTRAINT "AdComboItem_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdComboPaymentMethod" ADD CONSTRAINT "AdComboPaymentMethod_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "ad_licoreria"."AdCombo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdComboPaymentMethod" ADD CONSTRAINT "AdComboPaymentMethod_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "ad_licoreria"."AdPaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseOrder" ADD CONSTRAINT "AdPurchaseOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseOrder" ADD CONSTRAINT "AdPurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ad_licoreria"."AdSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseOrderLine" ADD CONSTRAINT "AdPurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "ad_licoreria"."AdPurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseOrderLine" ADD CONSTRAINT "AdPurchaseOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseOrderLine" ADD CONSTRAINT "AdPurchaseOrderLine_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdImportBatch" ADD CONSTRAINT "AdImportBatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdImportRow" ADD CONSTRAINT "AdImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ad_licoreria"."AdImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

