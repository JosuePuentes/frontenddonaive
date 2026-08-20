/**
 * Elimina datos de prueba del tenant `ad-licoreria`:
 * productos, clientes, operadores demo (conserva `admin`) y transacciones asociadas.
 *
 * Uso:
 *   cd apps/api && npx tsx prisma/cleanup-ad-licoreria-demo.ts
 *
 * En Render (shell, una sola vez):
 *   npm run cleanup:ad-demo
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TENANT_SLUG = "ad-licoreria";
const KEEP_OPERATORS = new Set(["admin"]);

/** SKUs demo del seed histórico (referencia / log). */
const SEED_SKUS = ["CER-REG", "CER-POL", "RON-ST", "AGU-MIN", "SNK-MIX"];

async function cleanupTenant(tenantId: string) {
  const productIds = (
    await prisma.adProduct.findMany({
      where: { tenantId },
      select: { id: true },
    })
  ).map((p) => p.id);

  await prisma.$transaction(async (tx) => {
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

    console.log(
      JSON.stringify(
        {
          products: deletedProducts.count,
          customers: deletedCustomers.count,
          operatorsRemoved: toRemove.map((o) => o.username),
          operatorsKept: [...KEEP_OPERATORS],
          seedSkusCleared: SEED_SKUS,
        },
        null,
        2,
      ),
    );
  });
}

async function main() {
  const tenant = await prisma.adTenant.findUnique({
    where: { slug: TENANT_SLUG },
  });
  if (!tenant) {
    console.log(JSON.stringify({ ok: true, message: "Tenant no encontrado; nada que limpiar" }));
    return;
  }

  const before = {
    products: await prisma.adProduct.count({ where: { tenantId: tenant.id } }),
    customers: await prisma.adCustomer.count({ where: { tenantId: tenant.id } }),
    operators: await prisma.adOperator.count({ where: { tenantId: tenant.id } }),
  };

  await cleanupTenant(tenant.id);

  const after = {
    products: await prisma.adProduct.count({ where: { tenantId: tenant.id } }),
    customers: await prisma.adCustomer.count({ where: { tenantId: tenant.id } }),
    operators: await prisma.adOperator.count({ where: { tenantId: tenant.id } }),
  };

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenantId: tenant.id,
        slug: tenant.slug,
        before,
        after,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
