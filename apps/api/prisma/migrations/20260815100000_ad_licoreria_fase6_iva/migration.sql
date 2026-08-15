-- AlterEnum
ALTER TYPE "ad_licoreria"."AdPurchaseStatus" ADD VALUE 'PRELIMINARY';


-- AlterTable
ALTER TABLE "ad_licoreria"."AdPayable" ADD COLUMN     "paymentMethodId" TEXT,
ADD COLUMN     "subtotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "warehouseId" TEXT;


-- AlterTable
ALTER TABLE "ad_licoreria"."AdProduct" ADD COLUMN     "taxable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ad_licoreria"."AdPurchase" ADD COLUMN     "grandTotalBs" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "grandTotalUsd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotalBs" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotalUsd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "taxBs" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRateDefault" DECIMAL(8,6) NOT NULL DEFAULT 0.16,
ADD COLUMN     "taxUsd" DECIMAL(18,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ad_licoreria"."AdPurchaseLine" ADD COLUMN     "lineTaxBs" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "lineTaxUsd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "lineTotalWithTaxBs" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "lineTotalWithTaxUsd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(8,6) NOT NULL DEFAULT 0.16,
ADD COLUMN     "taxable" BOOLEAN NOT NULL DEFAULT false;

