/**
 * Limpieza total de datos operativos/demo del tenant A&D Licorería.
 * Conserva: tenant, depósitos, categorías, métodos de pago, cuentas financieras vacías, admin.
 */
import type { PrismaClient } from "@prisma/client";

export type AdCleanupDemoResult = {
  products: number;
  customers: number;
  operatorsRemoved: string[];
  operatorsKept: string[];
  tables: number;
  suppliers: number;
  sales: number;
  purchases: number;
  financialMovements: number;
  cashClosures: number;
  auditEvents: number;
};

const KEEP_OPERATORS = new Set(["admin"]);

export async function cleanupAdLicoreriaDemoData(
  prisma: PrismaClient,
  tenantId: string,
): Promise<AdCleanupDemoResult> {
  const productIds = (
    await prisma.adProduct.findMany({
      where: { tenantId },
      select: { id: true },
    })
  ).map((p) => p.id);

  const salesCount = await prisma.adSale.count({ where: { tenantId } });
  const purchasesCount = await prisma.adPurchase.count({ where: { tenantId } });

  return prisma.$transaction(async (tx) => {
    await tx.adPrepaidConsumption.deleteMany({
      where: { prepaid: { tenantId } },
    });
    await tx.adPrepaidItem.deleteMany({ where: { prepaid: { tenantId } } });
    await tx.adServiceLog.deleteMany({
      where: {
        OR: [
          { prepaid: { tenantId } },
          ...(productIds.length
            ? [{ productId: { in: productIds } }]
            : []),
        ],
      },
    });
    await tx.adPrepaid.deleteMany({ where: { tenantId } });

    await tx.adCustomerCommitment.deleteMany({ where: { tenantId } });
    await tx.adAccountPayment.deleteMany({ where: { account: { tenantId } } });
    await tx.adAccountLine.deleteMany({ where: { account: { tenantId } } });
    await tx.adAccount.deleteMany({ where: { tenantId } });

    await tx.adSalePayment.deleteMany({ where: { sale: { tenantId } } });
    await tx.adSaleLine.deleteMany({ where: { sale: { tenantId } } });
    await tx.adSale.deleteMany({ where: { tenantId } });

    await tx.adPayablePayment.deleteMany({ where: { payable: { tenantId } } });
    await tx.adPayable.deleteMany({ where: { tenantId } });
    await tx.adPurchaseLine.deleteMany({ where: { purchase: { tenantId } } });
    await tx.adPurchase.deleteMany({ where: { tenantId } });

    await tx.adPurchaseOrderLine.deleteMany({
      where: { purchaseOrder: { tenantId } },
    });
    await tx.adPurchaseOrder.deleteMany({ where: { tenantId } });

    await tx.adStockTransferLine.deleteMany({
      where: { transfer: { tenantId } },
    });
    await tx.adStockTransfer.deleteMany({ where: { tenantId } });
    await tx.adPurchaseRequest.deleteMany({ where: { tenantId } });

    await tx.adPromotionPaymentMethod.deleteMany({
      where: { promotion: { tenantId } },
    });
    await tx.adPromotionItem.deleteMany({ where: { promotion: { tenantId } } });
    await tx.adPromotion.deleteMany({ where: { tenantId } });

    await tx.adComboPaymentMethod.deleteMany({ where: { combo: { tenantId } } });
    await tx.adComboItem.deleteMany({ where: { combo: { tenantId } } });
    await tx.adCombo.deleteMany({ where: { tenantId } });

    if (productIds.length) {
      await tx.adPresentationPrice.deleteMany({
        where: { productId: { in: productIds } },
      });
    }

    await tx.adInventoryClosureLine.deleteMany({
      where: { closure: { tenantId } },
    });
    await tx.adInventoryClosure.deleteMany({ where: { tenantId } });

    const cashClosures = await tx.adCashClosure.deleteMany({ where: { tenantId } });

    const financialMovements = await tx.adFinancialMovement.deleteMany({
      where: { tenantId },
    });
    await tx.adFinancialAccount.updateMany({
      where: { tenantId },
      data: { balance: 0, openingBalance: 0 },
    });

    if (productIds.length) {
      await tx.adInventoryMovement.deleteMany({
        where: { productId: { in: productIds } },
      });
      await tx.adStock.deleteMany({ where: { productId: { in: productIds } } });
      await tx.adPresentation.deleteMany({
        where: { productId: { in: productIds } },
      });
    }

    const deletedProducts = await tx.adProduct.deleteMany({ where: { tenantId } });
    const deletedCustomers = await tx.adCustomer.deleteMany({ where: { tenantId } });

    const tables = await tx.adTableSpace.deleteMany({ where: { tenantId } });
    const suppliers = await tx.adSupplier.deleteMany({ where: { tenantId } });

    await tx.adAuthSession.deleteMany({ where: { tenantId } });
    const auditEvents = await tx.adAuditEvent.deleteMany({ where: { tenantId } });

    const demoOperators = await tx.adOperator.findMany({
      where: { tenantId },
      select: { id: true, username: true },
    });
    const toRemove = demoOperators.filter((o) => !KEEP_OPERATORS.has(o.username));
    if (toRemove.length) {
      await tx.adOperatorPermission.deleteMany({
        where: { operatorId: { in: toRemove.map((o) => o.id) } },
      });
      await tx.adOperator.deleteMany({
        where: { id: { in: toRemove.map((o) => o.id) } },
      });
    }

    return {
      products: deletedProducts.count,
      customers: deletedCustomers.count,
      operatorsRemoved: toRemove.map((o) => o.username),
      operatorsKept: [...KEEP_OPERATORS],
      tables: tables.count,
      suppliers: suppliers.count,
      sales: salesCount,
      purchases: purchasesCount,
      financialMovements: financialMovements.count,
      cashClosures: cashClosures.count,
      auditEvents: auditEvents.count,
    };
  });
}

export async function cleanupAdLicoreriaDemoBySlug(
  prisma: PrismaClient,
  slug = "ad-licoreria",
) {
  const tenant = await prisma.adTenant.findUnique({ where: { slug } });
  if (!tenant) {
    return { ok: false as const, message: "Tenant no encontrado" };
  }

  const before = {
    products: await prisma.adProduct.count({ where: { tenantId: tenant.id } }),
    customers: await prisma.adCustomer.count({ where: { tenantId: tenant.id } }),
    operators: await prisma.adOperator.count({ where: { tenantId: tenant.id } }),
    tables: await prisma.adTableSpace.count({ where: { tenantId: tenant.id } }),
    suppliers: await prisma.adSupplier.count({ where: { tenantId: tenant.id } }),
  };

  const result = await cleanupAdLicoreriaDemoData(prisma, tenant.id);

  const after = {
    products: await prisma.adProduct.count({ where: { tenantId: tenant.id } }),
    customers: await prisma.adCustomer.count({ where: { tenantId: tenant.id } }),
    operators: await prisma.adOperator.count({ where: { tenantId: tenant.id } }),
    tables: await prisma.adTableSpace.count({ where: { tenantId: tenant.id } }),
    suppliers: await prisma.adSupplier.count({ where: { tenantId: tenant.id } }),
  };

  return {
    ok: true as const,
    tenantId: tenant.id,
    slug: tenant.slug,
    before,
    after,
    deleted: result,
  };
}
