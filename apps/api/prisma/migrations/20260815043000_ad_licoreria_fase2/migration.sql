-- A&D Licorería Fase 2 — extensión operativa aditiva (NO destructivo)

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdPurchaseStatus" AS ENUM ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdPurchaseRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'ORDERED', 'CANCELLED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "ad_licoreria"."AdCommitmentStatus" AS ENUM ('PENDIENTE', 'CUMPLIDO', 'ANULADO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ad_licoreria"."AdInventoryMovementType" ADD VALUE 'PREPAID_CONSUME';
ALTER TYPE "ad_licoreria"."AdInventoryMovementType" ADD VALUE 'ADJUST_IN';
ALTER TYPE "ad_licoreria"."AdInventoryMovementType" ADD VALUE 'ADJUST_OUT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ad_licoreria"."AdTransferStatus" ADD VALUE 'REQUESTED';
ALTER TYPE "ad_licoreria"."AdTransferStatus" ADD VALUE 'AUTHORIZED';
ALTER TYPE "ad_licoreria"."AdTransferStatus" ADD VALUE 'SENT';

-- AlterEnum
ALTER TYPE "ad_licoreria"."AdAccountStatus" ADD VALUE 'PAGADA';

-- AlterTable
ALTER TABLE "ad_licoreria"."AdTenant" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Caracas';

-- AlterTable
ALTER TABLE "ad_licoreria"."AdProduct" ADD COLUMN     "avgCostBs" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "avgCostUsd" DECIMAL(18,6) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ad_licoreria"."AdStockTransfer" ADD COLUMN     "receivedById" TEXT,
ADD COLUMN     "stockMoved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
-- accountNumber: default temporal para tablas vacías / filas legacy; la app asigna secuencial.
ALTER TABLE "ad_licoreria"."AdAccount" ADD COLUMN     "accountNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "closedById" TEXT,
ADD COLUMN     "discountBs" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "discountUsd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "openedById" TEXT,
ADD COLUMN     "receiptNumber" TEXT,
ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- AlterTable
-- code/customerPhone: defaults vacíos solo para filas F1 inexistentes/vacías; createPrepaid siempre setea valores reales.
ALTER TABLE "ad_licoreria"."AdPrepaid" ADD COLUMN     "code" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerDocument" TEXT,
ADD COLUMN     "customerPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sourceAccountId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warehouseId" TEXT,
ALTER COLUMN "totalQtyBase" SET DEFAULT 0,
ALTER COLUMN "remainingBase" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ad_licoreria"."AdPrepaidConsumption" ADD COLUMN     "presentationId" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "qty" DECIMAL(18,4) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ad_licoreria"."AdAccountPayment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "currency" "ad_licoreria"."AdMoneyCurrency" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "reference" TEXT,
    "bank" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatorId" TEXT,

    CONSTRAINT "AdAccountPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdServiceLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "prepaidId" TEXT,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "qtyServed" DECIMAL(18,4) NOT NULL,
    "qtyBase" DECIMAL(18,4) NOT NULL,
    "operatorId" TEXT,
    "warehouseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdServiceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPrepaidItem" (
    "id" TEXT NOT NULL,
    "prepaidId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "qtyPurchased" DECIMAL(18,4) NOT NULL,
    "qtyConsumed" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unitPriceUsd" DECIMAL(18,4) NOT NULL,
    "unitPriceBs" DECIMAL(18,4) NOT NULL,
    "qtyBasePerUnit" DECIMAL(18,6) NOT NULL,

    CONSTRAINT "AdPrepaidItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdCustomerCommitment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "accountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "qtyRemaining" DECIMAL(18,4) NOT NULL,
    "qtyBaseRemaining" DECIMAL(18,4) NOT NULL,
    "status" "ad_licoreria"."AdCommitmentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "blocksSales" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCustomerCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPurchase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "ad_licoreria"."AdPurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "currencyNote" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "totalCostUsd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalCostBs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "receivedById" TEXT,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPurchaseLine" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,
    "qtyBase" DECIMAL(18,4) NOT NULL,
    "unitCostUsd" DECIMAL(18,6) NOT NULL,
    "unitCostBs" DECIMAL(18,6) NOT NULL,
    "lineCostUsd" DECIMAL(18,4) NOT NULL,
    "lineCostBs" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "AdPurchaseLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_licoreria"."AdPurchaseRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "qtyBaseNeeded" DECIMAL(18,4) NOT NULL,
    "status" "ad_licoreria"."AdPurchaseRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdAccountPayment_accountId_idx" ON "ad_licoreria"."AdAccountPayment"("accountId");

-- CreateIndex
CREATE INDEX "AdServiceLog_accountId_idx" ON "ad_licoreria"."AdServiceLog"("accountId");

-- CreateIndex
CREATE INDEX "AdServiceLog_prepaidId_idx" ON "ad_licoreria"."AdServiceLog"("prepaidId");

-- CreateIndex
CREATE INDEX "AdPrepaidItem_prepaidId_idx" ON "ad_licoreria"."AdPrepaidItem"("prepaidId");

-- CreateIndex
CREATE INDEX "AdCustomerCommitment_tenantId_status_idx" ON "ad_licoreria"."AdCustomerCommitment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AdCustomerCommitment_productId_idx" ON "ad_licoreria"."AdCustomerCommitment"("productId");

-- CreateIndex
CREATE INDEX "AdCustomerCommitment_accountId_idx" ON "ad_licoreria"."AdCustomerCommitment"("accountId");

-- CreateIndex
CREATE INDEX "AdPurchase_tenantId_idx" ON "ad_licoreria"."AdPurchase"("tenantId");

-- CreateIndex
CREATE INDEX "AdPurchase_warehouseId_idx" ON "ad_licoreria"."AdPurchase"("warehouseId");

-- CreateIndex
CREATE INDEX "AdPurchase_status_idx" ON "ad_licoreria"."AdPurchase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdPurchase_tenantId_invoiceNumber_key" ON "ad_licoreria"."AdPurchase"("tenantId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "AdPurchaseLine_purchaseId_idx" ON "ad_licoreria"."AdPurchaseLine"("purchaseId");

-- CreateIndex
CREATE INDEX "AdPurchaseRequest_tenantId_status_idx" ON "ad_licoreria"."AdPurchaseRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AdPurchaseRequest_productId_idx" ON "ad_licoreria"."AdPurchaseRequest"("productId");

-- CreateIndex
CREATE INDEX "AdStockTransfer_status_idx" ON "ad_licoreria"."AdStockTransfer"("status");

-- CreateIndex
CREATE INDEX "AdAccount_status_idx" ON "ad_licoreria"."AdAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdAccount_tenantId_accountNumber_key" ON "ad_licoreria"."AdAccount"("tenantId", "accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdPrepaid_tenantId_code_key" ON "ad_licoreria"."AdPrepaid"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdAccountPayment" ADD CONSTRAINT "AdAccountPayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ad_licoreria"."AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdServiceLog" ADD CONSTRAINT "AdServiceLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ad_licoreria"."AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdServiceLog" ADD CONSTRAINT "AdServiceLog_prepaidId_fkey" FOREIGN KEY ("prepaidId") REFERENCES "ad_licoreria"."AdPrepaid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPrepaid" ADD CONSTRAINT "AdPrepaid_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "ad_licoreria"."AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPrepaidItem" ADD CONSTRAINT "AdPrepaidItem_prepaidId_fkey" FOREIGN KEY ("prepaidId") REFERENCES "ad_licoreria"."AdPrepaid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPrepaidItem" ADD CONSTRAINT "AdPrepaidItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPrepaidItem" ADD CONSTRAINT "AdPrepaidItem_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCustomerCommitment" ADD CONSTRAINT "AdCustomerCommitment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCustomerCommitment" ADD CONSTRAINT "AdCustomerCommitment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "ad_licoreria"."AdCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCustomerCommitment" ADD CONSTRAINT "AdCustomerCommitment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ad_licoreria"."AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCustomerCommitment" ADD CONSTRAINT "AdCustomerCommitment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdCustomerCommitment" ADD CONSTRAINT "AdCustomerCommitment_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchase" ADD CONSTRAINT "AdPurchase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchase" ADD CONSTRAINT "AdPurchase_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "ad_licoreria"."AdWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseLine" ADD CONSTRAINT "AdPurchaseLine_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ad_licoreria"."AdPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseLine" ADD CONSTRAINT "AdPurchaseLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseLine" ADD CONSTRAINT "AdPurchaseLine_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "ad_licoreria"."AdPresentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseRequest" ADD CONSTRAINT "AdPurchaseRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "ad_licoreria"."AdTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_licoreria"."AdPurchaseRequest" ADD CONSTRAINT "AdPurchaseRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ad_licoreria"."AdProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

