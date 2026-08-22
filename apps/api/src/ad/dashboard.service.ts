/**
 * A&D Fase 8 — Dashboard financiero/operativo (solo lectura agregada).
 */
import {
  type AdRequestContext,
} from "./authorization.js";
import { computeOperationalAvailability } from "./availability.js";
import {
  pctChange,
  resolveDashboardPeriod,
  type DashboardPreset,
} from "./dashboard-period.js";
import { ForbiddenError, ValidationError } from "../errors/app-error.js";
import { getPrisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

async function latestBcv(tenantId: string): Promise<number | null> {
  const row = await getPrisma().adExchangeRate.findFirst({
    where: { tenantId, kind: "BCV" },
    orderBy: { effectiveAt: "desc" },
  });
  return row ? num(row.rate) : null;
}

function requireDashboard(ctx: AdRequestContext) {
  if (
    !ctx.permissions.has("finance.dashboard.view") &&
    !ctx.permissions.has("finance.view") &&
    !ctx.permissions.has("reports.read")
  ) {
    throw new ForbiddenError(
      "Permiso A&D requerido: finance.dashboard.view",
    );
  }
}

export const adDashboardService = {
  async getDashboard(
    ctx: AdRequestContext,
    query: {
      preset?: DashboardPreset;
      from?: string;
      to?: string;
      displayCurrency?: "USD" | "BS";
      warehouseId?: string;
      productId?: string;
      paymentMethod?: string;
      supplierId?: string;
    },
  ) {
    requireDashboard(ctx);
    const prisma = getPrisma();
    const tenant = await prisma.adTenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
    });

    let period;
    try {
      period = resolveDashboardPeriod({
        timezone: tenant.timezone,
        preset: query.preset,
        from: query.from,
        to: query.to,
      });
    } catch (e) {
      throw new ValidationError(
        e instanceof Error ? e.message : "Período inválido",
      );
    }

    const displayCurrency = query.displayCurrency ?? "USD";
    const bcvRate = await latestBcv(ctx.tenantId);
    const whFilter = query.warehouseId
      ? { warehouseId: query.warehouseId }
      : {};
    const productLineFilter = query.productId
      ? { lines: { some: { productId: query.productId } } }
      : {};
    const paymentFilter = query.paymentMethod
      ? { payments: { some: { method: query.paymentMethod } } }
      : {};
    const supplierPurchaseFilter = query.supplierId
      ? { supplierId: query.supplierId }
      : {};

    const [
      sales,
      prevSales,
      purchases,
      prevPurchases,
      payables,
      payablePayments,
      movements,
      accounts,
      warehouses,
      products,
      stocks,
      openAccounts,
      presentations,
      transfers,
      commitments,
      invMoves,
      operators,
      suppliers,
    ] = await Promise.all([
      prisma.adSale.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: "completed",
          createdAt: { gte: period.from, lt: period.to },
          ...whFilter,
          ...productLineFilter,
          ...paymentFilter,
        },
        include: {
          payments: true,
          lines: { include: { product: true, presentation: true } },
          operator: true,
          warehouse: true,
        },
      }),
      prisma.adSale.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: "completed",
          createdAt: { gte: period.previousFrom, lt: period.previousTo },
          ...whFilter,
          ...productLineFilter,
          ...paymentFilter,
        },
        include: {
          payments: true,
          lines: { include: { product: true } },
        },
      }),
      prisma.adPurchase.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: "RECEIVED",
          OR: [
            { receivedAt: { gte: period.from, lt: period.to } },
            {
              receivedAt: null,
              createdAt: { gte: period.from, lt: period.to },
            },
          ],
          ...whFilter,
          ...supplierPurchaseFilter,
        },
        include: {
          lines: { include: { product: true } },
          supplier: true,
          payable: true,
        },
      }),
      prisma.adPurchase.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: "RECEIVED",
          OR: [
            {
              receivedAt: {
                gte: period.previousFrom,
                lt: period.previousTo,
              },
            },
            {
              receivedAt: null,
              createdAt: {
                gte: period.previousFrom,
                lt: period.previousTo,
              },
            },
          ],
          ...whFilter,
          ...supplierPurchaseFilter,
        },
      }),
      prisma.adPayable.findMany({
        where: { tenantId: ctx.tenantId },
        include: { supplier: true, payments: true },
      }),
      prisma.adPayablePayment.findMany({
        where: {
          paidAt: { gte: period.from, lt: period.to },
          payable: { tenantId: ctx.tenantId },
        },
      }),
      prisma.adFinancialMovement.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: "CONFIRMED",
          confirmedAt: { gte: period.from, lt: period.to },
        },
        include: { account: true, counterAccount: true },
      }),
      prisma.adFinancialAccount.findMany({
        where: { tenantId: ctx.tenantId },
        include: { paymentMethods: true },
      }),
      prisma.adWarehouse.findMany({
        where: { tenantId: ctx.tenantId, active: true },
      }),
      prisma.adProduct.findMany({
        where: { tenantId: ctx.tenantId, active: true },
        include: { category: true, presentations: true },
      }),
      prisma.adStock.findMany({
        where: { product: { tenantId: ctx.tenantId } },
      }),
      prisma.adAccount.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: {
            in: ["ABIERTA", "PREPAGADA", "PARCIALMENTE_PAGADA", "PAGADA"],
          },
        },
        include: { lines: true },
      }),
      prisma.adPresentation.findMany({
        where: { product: { tenantId: ctx.tenantId } },
      }),
      prisma.adStockTransfer.findMany({
        where: { tenantId: ctx.tenantId },
        include: { lines: true },
      }),
      prisma.adCustomerCommitment.findMany({
        where: { tenantId: ctx.tenantId, status: "PENDIENTE" },
      }),
      prisma.adInventoryMovement.findMany({
        where: {
          createdAt: { gte: period.from, lt: period.to },
          warehouse: { tenantId: ctx.tenantId },
          ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        },
        include: { product: true, warehouse: true },
        take: 500,
        orderBy: { createdAt: "desc" },
      }),
      prisma.adOperator.findMany({
        where: { tenantId: ctx.tenantId },
        select: { id: true, username: true, name: true },
      }),
      prisma.adSupplier.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          purchases: {
            where: { status: "RECEIVED" },
            include: { lines: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          payables: true,
        },
      }),
    ]);

    const productById = new Map(products.map((p) => [p.id, p]));
    const opName = new Map(
      operators.map((o) => [o.id, o.name || o.username]),
    );

    /** —— Ventas —— */
    let salesUsd = 0;
    let salesBs = 0;
    let unitsSold = 0;
    let costHistoricalUsd = 0;
    const byMethod: Record<string, { usd: number; bs: number; count: number }> =
      {};
    const byCurrency = { USD: 0, BS: 0 };
    const byWarehouse: Record<
      string,
      { name: string; usd: number; bs: number; units: number; count: number }
    > = {};
    const byOperator: Record<
      string,
      { name: string; usd: number; count: number }
    > = {};
    const byProduct: Record<
      string,
      {
        name: string;
        brand: string | null;
        category: string | null;
        units: number;
        revenueUsd: number;
        costUsd: number;
        profitUsd: number;
      }
    > = {};
    const byPresentation: Record<
      string,
      {
        presentationId: string;
        name: string;
        productId: string;
        units: number;
        revenueUsd: number;
        costUsd: number;
        profitUsd: number;
      }
    > = {};
    const byDay: Record<string, { usd: number; bs: number; count: number }> =
      {};
    const belowCost: {
      productId: string;
      name: string;
      revenueUsd: number;
      costUsd: number;
    }[] = [];

    for (const s of sales) {
      salesUsd += num(s.totalUsd);
      salesBs += num(s.totalBs);
      const day = s.createdAt.toISOString().slice(0, 10);
      const d = byDay[day] ?? { usd: 0, bs: 0, count: 0 };
      d.usd += num(s.totalUsd);
      d.bs += num(s.totalBs);
      d.count += 1;
      byDay[day] = d;

      const wh =
        byWarehouse[s.warehouseId] ??
        {
          name: s.warehouse?.name ?? s.warehouseId,
          usd: 0,
          bs: 0,
          units: 0,
          count: 0,
        };
      wh.usd += num(s.totalUsd);
      wh.bs += num(s.totalBs);
      wh.count += 1;

      const oid = s.operatorId;
      const op =
        byOperator[oid] ??
        { name: opName.get(oid) ?? oid, usd: 0, count: 0 };
      op.usd += num(s.totalUsd);
      op.count += 1;
      byOperator[oid] = op;

      for (const p of s.payments) {
        const m = byMethod[p.method] ?? { usd: 0, bs: 0, count: 0 };
        if (p.currency === "USD") {
          m.usd += num(p.amount);
          byCurrency.USD += num(p.amount);
        } else {
          m.bs += num(p.amount);
          byCurrency.BS += num(p.amount);
        }
        m.count += 1;
        byMethod[p.method] = m;
      }

      for (const line of s.lines) {
        const qtyBase = num(line.qtyBase);
        unitsSold += qtyBase;
        wh.units += qtyBase;
        const prod = line.product ?? productById.get(line.productId);
        /** Rentabilidad histórica: SOLO snapshot de costo al vender (nunca CPP actual). */
        const snapCost = num(
          (line as { lineCostUsdSnapshot?: Prisma.Decimal | number | null })
            .lineCostUsdSnapshot,
        );
        const snapUnit = num(
          (line as { unitCostUsdSnapshot?: Prisma.Decimal | number | null })
            .unitCostUsdSnapshot,
        );
        const lineCost =
          snapCost > 0
            ? snapCost
            : snapUnit > 0
              ? snapUnit * qtyBase
              : 0;
        costHistoricalUsd += lineCost;
        const rev = num(line.lineTotalUsd);
        const pid = line.productId;
        const row =
          byProduct[pid] ??
          {
            name: prod?.name ?? pid,
            brand: prod?.brand ?? null,
            category: (productById.get(line.productId) as { category?: { name?: string } } | undefined)?.category?.name ?? null,
            units: 0,
            revenueUsd: 0,
            costUsd: 0,
            profitUsd: 0,
          };
        row.units += qtyBase;
        row.revenueUsd += rev;
        row.costUsd += lineCost;
        row.profitUsd = row.revenueUsd - row.costUsd;
        byProduct[pid] = row;

        const presId = line.presentationId;
        const presRow =
          byPresentation[presId] ??
          {
            presentationId: presId,
            name: line.presentation?.name ?? presId,
            productId: pid,
            units: 0,
            revenueUsd: 0,
            costUsd: 0,
            profitUsd: 0,
          };
        presRow.units += qtyBase;
        presRow.revenueUsd += rev;
        presRow.costUsd += lineCost;
        presRow.profitUsd = presRow.revenueUsd - presRow.costUsd;
        byPresentation[presId] = presRow;

        if (rev + 1e-9 < lineCost) {
          belowCost.push({
            productId: pid,
            name: row.name,
            revenueUsd: rev,
            costUsd: lineCost,
          });
        }
      }
      byWarehouse[s.warehouseId] = wh;
    }

    const prevSalesUsd = prevSales.reduce((a, s) => a + num(s.totalUsd), 0);
    const prevUnits = prevSales.reduce(
      (a, s) => a + s.lines.reduce((x, l) => x + num(l.qtyBase), 0),
      0,
    );
    const salesCount = sales.length;
    const ticketAvg = salesCount ? salesUsd / salesCount : 0;
    const grossProfit = salesUsd - costHistoricalUsd;
    const marginPct = salesUsd > 0 ? (grossProfit / salesUsd) * 100 : 0;

    /** —— Compras / CxP —— */
    let purchasesUsd = 0;
    let purchasesBs = 0;
    let purchasesTax = 0;
    let contado = 0;
    let credito = 0;
    for (const p of purchases) {
      const g =
        p.currency === "BS" ? num(p.grandTotalBs) : num(p.grandTotalUsd);
      const tax = p.currency === "BS" ? num(p.taxBs) : num(p.taxUsd);
      if (p.currency === "BS") purchasesBs += g;
      else purchasesUsd += g;
      purchasesTax += tax;
      if (p.paymentCondition === "CONTADO") contado += g;
      else credito += g;
    }
    const prevPurchasesTotal = prevPurchases.reduce(
      (a, p) =>
        a +
        (p.currency === "BS" ? num(p.grandTotalBs) : num(p.grandTotalUsd)),
      0,
    );

    const cxpPending = payables
      .filter((p) => ["PENDIENTE", "PARCIAL", "VENCIDA"].includes(p.status))
      .reduce((a, p) => a + num(p.balance), 0);
    const cxpCollected = payablePayments.reduce((a, p) => a + num(p.amount), 0);

    /** —— Movimientos financieros —— */
    let income = 0;
    let expense = 0;
    let expensesOnly = 0;
    let withdrawals = 0;
    let transfersOut = 0;
    let transfersIn = 0;
    let fxOps: {
      id: string;
      from: string;
      to: string;
      amount: number;
      currency: string;
      counterAmount: number | null;
      counterCurrency: string | null;
      rateUsed: number | null;
      fxDifference: number | null;
      concept: string | null;
    }[] = [];
    const expensesByConcept: Record<string, number> = {};
    const bankStats: Record<
      string,
      {
        id: string;
        name: string;
        currency: string;
        balance: number;
        income: number;
        expense: number;
        transferIn: number;
        transferOut: number;
        expenses: number;
        supplierPayments: number;
        fx: number;
      }
    > = {};

    for (const a of accounts) {
      bankStats[a.id] = {
        id: a.id,
        name: a.name,
        currency: a.currency,
        balance: num(a.balance),
        income: 0,
        expense: 0,
        transferIn: 0,
        transferOut: 0,
        expenses: 0,
        supplierPayments: 0,
        fx: 0,
      };
    }

    for (const m of movements) {
      const amt = num(m.amount);
      const st = bankStats[m.accountId];
      if (m.type === "INGRESO_VENTA") {
        income += amt;
        if (st) st.income += amt;
      } else if (m.type === "EGRESO_COMPRA") {
        expense += amt;
        if (st) {
          st.expense += amt;
          st.supplierPayments += amt;
        }
      } else if (m.type === "EGRESO_GASTO") {
        expensesOnly += amt;
        expense += amt;
        const c = m.concept ?? "Sin concepto";
        expensesByConcept[c] = (expensesByConcept[c] ?? 0) + amt;
        if (st) {
          st.expense += amt;
          st.expenses += amt;
        }
      } else if (m.type === "RETIRO") {
        withdrawals += amt;
        expense += amt;
        if (st) st.expense += amt;
      } else if (m.type === "TRANSFERENCIA" || m.type === "CAMBIO_MONEDA") {
        transfersOut += amt;
        if (st) st.transferOut += amt;
        if (m.counterAccountId && bankStats[m.counterAccountId]) {
          const cin = num(m.counterAmount) || amt;
          bankStats[m.counterAccountId].transferIn += cin;
          transfersIn += cin;
        }
        if (m.type === "CAMBIO_MONEDA") {
          if (st) st.fx += amt;
          fxOps.push({
            id: m.id,
            from: m.account?.name ?? m.accountId,
            to: m.counterAccount?.name ?? m.counterAccountId ?? "—",
            amount: amt,
            currency: m.currency,
            counterAmount: m.counterAmount != null ? num(m.counterAmount) : null,
            counterCurrency: m.counterCurrency,
            rateUsed: m.rateUsed != null ? num(m.rateUsed) : null,
            fxDifference: m.fxDifference != null ? num(m.fxDifference) : null,
            concept: m.concept,
          });
        }
      }
    }

    const netFlow = income - expense;
    const balanceByCurrency = { USD: 0, BS: 0 };
    for (const a of accounts) {
      if (!a.active) continue;
      balanceByCurrency[a.currency as "USD" | "BS"] += num(a.balance);
    }

    /** —— Inventario (motor existente) —— */
    const avAccounts = openAccounts.map((a) => ({
      status: a.status,
      warehouseId: a.warehouseId,
      lines: a.lines.map((l) => ({
        productId: l.productId,
        presentationId: l.presentationId,
        qtyOrdered: num(l.qtyOrdered),
        qtyServed: num(l.qtyServed),
      })),
    }));
    const avPresentations = presentations.map((p) => ({
      id: p.id,
      unitsPerPresentation: num(p.unitsPerPresentation),
    }));
    const avTransfers = transfers.map((t) => ({
      status: t.status,
      fromWarehouseId: t.fromWarehouseId,
      lines: t.lines
        .filter((l) => l.presentationId)
        .map((l) => ({
          productId: l.productId,
          presentationId: l.presentationId as string,
          qty: num(l.qty),
          qtyBase: num(l.qtyBase),
        })),
    }));
    const avCommitments = commitments.map((c) => ({
      productId: c.productId,
      status: c.status,
      qtyBaseRemaining: num(c.qtyBaseRemaining),
    }));
    const avStocks = stocks.map((s) => ({
      warehouseId: s.warehouseId,
      productId: s.productId,
      qtyBase: num(s.qtyBase),
    }));

    let physicalTotal = 0;
    let committedTotal = 0;
    let availableTotal = 0;
    let pendingCustomers = 0;
    let deficit = 0;
    const critical: {
      productId: string;
      name: string;
      available: number;
      physical: number;
      status: string;
    }[] = [];
    const noMovement: string[] = [];

    const movedProducts = new Set(invMoves.map((m) => m.productId));
    for (const prod of products) {
      const av = computeOperationalAvailability({
        productId: prod.id,
        requestedBase: 0,
        preferredWarehouseId: warehouses[0]?.id ?? "",
        warehouseIds: warehouses.map((w) => w.id),
        stocks: avStocks,
        accounts: avAccounts,
        presentations: avPresentations,
        transfers: avTransfers,
        commitments: avCommitments,
      });
      physicalTotal += av.physicalTotal;
      committedTotal += av.committedActiveTotal;
      availableTotal += av.availableOperationalTotal;
      pendingCustomers += av.customerPendingBase;
      deficit += av.customerCommitmentDeficit;
      if (
        av.status === "PURCHASE_NEEDED" ||
        av.status === "TRANSFER_AND_PURCHASE" ||
        av.status === "COMMITMENT_DEFICIT" ||
        (num(prod.minStockBase) > 0 &&
          av.availableOperationalTotal < num(prod.minStockBase))
      ) {
        critical.push({
          productId: prod.id,
          name: prod.name,
          available: av.availableOperationalTotal,
          physical: av.physicalTotal,
          status: av.status,
        });
      }
      if (!movedProducts.has(prod.id) && av.physicalTotal > 0) {
        noMovement.push(prod.id);
      }
    }

    const invByType: Record<string, number> = {};
    for (const m of invMoves) {
      invByType[m.type] = (invByType[m.type] ?? 0) + Math.abs(num(m.qtyBase));
    }

    /** —— Depósitos —— */
    const warehouseCompare = warehouses.map((w) => {
      const whSales = byWarehouse[w.id] ?? {
        usd: 0,
        bs: 0,
        units: 0,
        count: 0,
      };
      const whStock = stocks
        .filter((s) => s.warehouseId === w.id)
        .reduce((a, s) => a + num(s.qtyBase), 0);
      const whPurchases = purchases
        .filter((p) => p.warehouseId === w.id)
        .reduce(
          (a, p) =>
            a +
            (p.currency === "BS" ? num(p.grandTotalBs) : num(p.grandTotalUsd)),
          0,
        );
      const whTransfers = transfers.filter(
        (t) =>
          (t.fromWarehouseId === w.id || t.toWarehouseId === w.id) &&
          ["SENT", "CONFIRMED", "RECEIVED"].includes(t.status),
      ).length;
      return {
        id: w.id,
        name: w.name,
        code: w.code,
        salesUsd: whSales.usd,
        salesBs: whSales.bs,
        salesCount: whSales.count,
        units: whSales.units,
        stockUnits: whStock,
        purchases: whPurchases,
        transfers: whTransfers,
      };
    });

    /** —— Tops —— */
    const productList = Object.entries(byProduct).map(([id, v]) => ({
      productId: id,
      ...v,
      marginPct: v.revenueUsd > 0 ? (v.profitUsd / v.revenueUsd) * 100 : 0,
    }));
    const topByUnits = [...productList]
      .sort((a, b) => b.units - a.units)
      .slice(0, 15);
    const topByRevenue = [...productList]
      .sort((a, b) => b.revenueUsd - a.revenueUsd)
      .slice(0, 15);
    const topByProfit = [...productList]
      .sort((a, b) => b.profitUsd - a.profitUsd)
      .slice(0, 15);
    const worstProfit = [...productList]
      .sort((a, b) => a.profitUsd - b.profitUsd)
      .slice(0, 15);

    /** —— Proveedores —— */
    const supplierRows = suppliers.map((s) => {
      const totalBought = s.purchases.reduce(
        (a, p) =>
          a +
          (p.currency === "BS" ? num(p.grandTotalBs) : num(p.grandTotalUsd)),
        0,
      );
      const productIds = new Set<string>();
      for (const p of s.purchases) {
        for (const l of p.lines) productIds.add(l.productId);
      }
      const cxp = s.payables
        .filter((p) => ["PENDIENTE", "PARCIAL", "VENCIDA"].includes(p.status))
        .reduce((a, p) => a + num(p.balance), 0);
      return {
        id: s.id,
        name: s.name,
        totalBought,
        productsCount: productIds.size,
        purchaseCount: s.purchases.length,
        lastPurchaseAt: s.purchases[0]?.createdAt ?? null,
        cxpPending: cxp,
      };
    });

    const prevExpenses = 0;

    return {
      period: {
        preset: period.preset,
        from: period.from.toISOString(),
        to: period.to.toISOString(),
        fromDate: period.fromDate,
        toDate: period.toDate,
        previousFromDate: period.previousFromDate,
        previousToDate: period.previousToDate,
        timezone: period.timezone,
        displayCurrency,
        bcvRate,
        note: "Conversiones informativas usan BCV vigente; no se reescribe historial.",
      },
      layers: {
        historical: "CPP / costos de compra y ventas registradas",
        operational: "Disponibilidad, stock, compromisos",
        financial: "Saldos de cuentas y movimientos confirmados",
      },
      executive: {
        salesTotalUsd: salesUsd,
        salesTotalBs: salesBs,
        salesCount,
        ticketAvgUsd: ticketAvg,
        unitsSold,
        purchasesUsd,
        purchasesBs,
        expenses: expensesOnly + withdrawals,
        cxpPending,
        cxpCollected,
        estimatedProfitUsd: grossProfit,
        marginPct,
        netFlow,
        financialBalanceUsd: balanceByCurrency.USD,
        financialBalanceBs: balanceByCurrency.BS,
        note: "Saldo financiero ≠ utilidad. Utilidad usa CPP histórico, no reposición.",
      },
      comparison: {
        salesUsd: {
          current: salesUsd,
          previous: prevSalesUsd,
          delta: salesUsd - prevSalesUsd,
          pct: pctChange(salesUsd, prevSalesUsd),
        },
        units: {
          current: unitsSold,
          previous: prevUnits,
          delta: unitsSold - prevUnits,
          pct: pctChange(unitsSold, prevUnits),
        },
        profitUsd: {
          current: grossProfit,
          previous: null as number | null,
          delta: null as number | null,
          pct: null as number | null,
          note: "Comparativo de utilidad completa requiere snapshot de costo en líneas de venta (pendiente).",
        },
        purchases: {
          current: purchasesUsd + purchasesBs,
          previous: prevPurchasesTotal,
          delta: purchasesUsd + purchasesBs - prevPurchasesTotal,
          pct: pctChange(purchasesUsd + purchasesBs, prevPurchasesTotal),
        },
        netFlow: {
          current: netFlow,
          previous: null as number | null,
          delta: null as number | null,
          pct: null as number | null,
        },
        marginPct: { current: marginPct, previous: null, delta: null, pct: null },
        expenses: {
          current: expensesOnly + withdrawals,
          previous: prevExpenses,
          delta: expensesOnly + withdrawals,
          pct: null,
        },
      },
      sales: {
        byDay: Object.entries(byDay)
          .map(([date, v]) => ({ date, ...v }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        byMethod,
        byCurrency,
        byWarehouse: Object.entries(byWarehouse).map(([id, v]) => ({
          warehouseId: id,
          ...v,
        })),
        byOperator: Object.entries(byOperator).map(([id, v]) => ({
          operatorId: id,
          ...v,
        })),
        byProduct: productList.slice(0, 50),
        drill: { section: "sales", from: period.fromDate, to: period.toDate },
      },
      profitability: {
        revenueUsd: salesUsd,
        historicalCostUsd: costHistoricalUsd,
        grossProfitUsd: grossProfit,
        marginPct,
        byProduct: productList.slice(0, 40),
        byPresentation: Object.values(byPresentation)
          .sort((a, b) => b.profitUsd - a.profitUsd)
          .slice(0, 40),
        byPaymentMethod: Object.entries(byMethod).map(([method, v]) => ({
          method,
          ...v,
          note: "Utilidad por método usa ingreso del método; costo histórico es por línea de venta (snapshot).",
        })),
        belowCost: belowCost.slice(0, 30),
        critical: critical.slice(0, 30),
        distinction: {
          cppHistorico:
            "unitCostUsdSnapshot / lineCostUsdSnapshot de AdSaleLine al confirmar la venta. Inmutable.",
          costoReposicion:
            "Se recalcula con tasas actuales; no altera utilidad histórica del dashboard.",
        },
        drill: {
          section: "profitability",
          from: period.fromDate,
          to: period.toDate,
        },
      },
      payments: {
        byMethod,
        note: "Métodos con referencia especial usan lógica interna; la tasa paralela no se expone aquí.",
        drill: { section: "payments", from: period.fromDate, to: period.toDate },
      },
      banks: {
        balancesByCurrency: balanceByCurrency,
        accounts: Object.values(bankStats),
        periodIncome: income,
        periodExpense: expense,
        transfersOut,
        transfersIn,
        drill: { section: "banks" },
      },
      exchange: {
        operations: fxOps,
        count: fxOps.length,
        note: "Valor original vs convertido; no clasificar automáticamente como pérdida.",
        drill: { section: "exchange", from: period.fromDate, to: period.toDate },
      },
      purchases: {
        totalUsd: purchasesUsd,
        totalBs: purchasesBs,
        tax: purchasesTax,
        contado,
        credito,
        count: purchases.length,
        cxpGenerated: purchases
          .filter((p) => p.payable)
          .reduce(
            (a, p) => a + num(p.payable!.amount),
            0,
          ),
        cxpPaid: cxpCollected,
        cxpPending,
        topSuppliers: supplierRows
          .sort((a, b) => b.totalBought - a.totalBought)
          .slice(0, 10),
        drill: {
          section: "purchases",
          from: period.fromDate,
          to: period.toDate,
        },
      },
      expenses: {
        total: expensesOnly + withdrawals,
        gastos: expensesOnly,
        retiros: withdrawals,
        byConcept: Object.entries(expensesByConcept).map(([concept, amount]) => ({
          concept,
          amount,
        })),
        note: "Separado de compras de inventario (EGRESO_COMPRA).",
        drill: {
          section: "expenses",
          from: period.fromDate,
          to: period.toDate,
        },
      },
      inventory: {
        physicalTotal,
        committedTotal,
        availableTotal,
        pendingCustomers,
        deficit,
        critical: critical.slice(0, 25),
        noMovementCount: noMovement.length,
        highRotation: topByUnits.slice(0, 10),
        drill: { section: "inventory" },
      },
      inventoryMovements: {
        byType: invByType,
        recent: invMoves.slice(0, 40).map((m) => ({
          id: m.id,
          type: m.type,
          productId: m.productId,
          productName: m.product?.name,
          warehouseId: m.warehouseId,
          warehouseName: m.warehouse?.name,
          qtyBase: num(m.qtyBase),
          reference: m.reference,
          createdAt: m.createdAt,
        })),
        drill: {
          section: "inventoryMovements",
          from: period.fromDate,
          to: period.toDate,
        },
      },
      warehouses: warehouseCompare,
      topProducts: {
        byUnits: topByUnits,
        byRevenue: topByRevenue,
        byProfit: topByProfit,
        worstProfit,
        belowCost: belowCost.slice(0, 15),
        critical: critical.slice(0, 15),
      },
      suppliers: supplierRows
        .sort((a, b) => b.totalBought - a.totalBought)
        .slice(0, 25),
      reportsCatalog: [
        { key: "financial_summary", label: "Resumen financiero" },
        { key: "sales", label: "Ventas" },
        { key: "profit", label: "Utilidad" },
        { key: "purchases", label: "Compras" },
        { key: "expenses", label: "Gastos" },
        { key: "payables", label: "Cuentas por pagar" },
        { key: "banks", label: "Bancos" },
        { key: "movements", label: "Movimientos" },
        { key: "inventory", label: "Inventario" },
      ],
      exportReady: false,
      readOnly: true,
    };
  },

  async drillDown(
    ctx: AdRequestContext,
    query: {
      section: string;
      from?: string;
      to?: string;
      accountId?: string;
      warehouseId?: string;
      productId?: string;
      limit?: number;
    },
  ) {
    requireDashboard(ctx);
    const prisma = getPrisma();
    const tenant = await prisma.adTenant.findUniqueOrThrow({
      where: { id: ctx.tenantId },
    });
    const period = resolveDashboardPeriod({
      timezone: tenant.timezone,
      preset: query.from && query.to ? "personalizado" : "hoy",
      from: query.from,
      to: query.to,
    });
    const limit = query.limit ?? 80;

    if (query.section === "sales" || query.section === "profitability" || query.section === "payments") {
      const sales = await prisma.adSale.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: "completed",
          createdAt: { gte: period.from, lt: period.to },
          ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        },
        include: {
          payments: true,
          lines: { include: { product: true } },
          warehouse: true,
          operator: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return {
        section: query.section,
        items: sales.map((s) => ({
          id: s.id,
          receiptNumber: s.receiptNumber,
          createdAt: s.createdAt,
          warehouse: s.warehouse?.name,
          operator: s.operator?.name || s.operator?.username,
          totalUsd: num(s.totalUsd),
          totalBs: num(s.totalBs),
          payments: s.payments.map((p) => ({
            method: p.method,
            currency: p.currency,
            amount: num(p.amount),
          })),
          lines: s.lines.map((l) => ({
            productId: l.productId,
            name: l.product?.name,
            qtyBase: num(l.qtyBase),
            lineTotalUsd: num(l.lineTotalUsd),
            cppUsd: num(l.product?.avgCostUsd),
          })),
        })),
      };
    }

    if (
      query.section === "banks" ||
      query.section === "expenses" ||
      query.section === "exchange"
    ) {
      const typeIn =
        query.section === "expenses"
          ? (["EGRESO_GASTO", "RETIRO"] as Prisma.EnumAdFinancialMovementTypeFilter["in"])
          : query.section === "exchange"
            ? (["CAMBIO_MONEDA"] as Prisma.EnumAdFinancialMovementTypeFilter["in"])
            : undefined;
      const rows = await prisma.adFinancialMovement.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: "CONFIRMED",
          confirmedAt: { gte: period.from, lt: period.to },
          ...(typeIn ? { type: { in: typeIn } } : {}),
          ...(query.accountId
            ? {
                OR: [
                  { accountId: query.accountId },
                  { counterAccountId: query.accountId },
                ],
              }
            : {}),
        },
        include: { account: true, counterAccount: true },
        orderBy: { confirmedAt: "desc" },
        take: limit,
      });
      return {
        section: query.section,
        items: rows.map((m) => ({
          id: m.id,
          type: m.type,
          amount: num(m.amount),
          currency: m.currency,
          counterAmount: m.counterAmount != null ? num(m.counterAmount) : null,
          rateUsed: m.rateUsed != null ? num(m.rateUsed) : null,
          concept: m.concept,
          account: m.account?.name,
          counterAccount: m.counterAccount?.name,
          confirmedAt: m.confirmedAt,
          relatedEntity: m.relatedEntity,
          relatedId: m.relatedId,
        })),
      };
    }

    if (query.section === "purchases") {
      const rows = await prisma.adPurchase.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: "RECEIVED",
          OR: [
            { receivedAt: { gte: period.from, lt: period.to } },
            {
              receivedAt: null,
              createdAt: { gte: period.from, lt: period.to },
            },
          ],
        },
        include: { supplier: true, payable: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return {
        section: "purchases",
        items: rows.map((p) => ({
          id: p.id,
          invoiceNumber: p.invoiceNumber,
          supplier: p.supplier?.name ?? p.supplierName,
          currency: p.currency,
          grandTotal:
            p.currency === "BS" ? num(p.grandTotalBs) : num(p.grandTotalUsd),
          paymentCondition: p.paymentCondition,
          payableStatus: p.payable?.status,
          payableBalance: p.payable ? num(p.payable.balance) : null,
          receivedAt: p.receivedAt,
        })),
      };
    }

    if (query.section === "inventoryMovements" || query.section === "inventory") {
      const rows = await prisma.adInventoryMovement.findMany({
        where: {
          createdAt: { gte: period.from, lt: period.to },
          warehouse: { tenantId: ctx.tenantId },
          ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
          ...(query.productId ? { productId: query.productId } : {}),
        },
        include: { product: true, warehouse: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return {
        section: query.section,
        items: rows.map((m) => ({
          id: m.id,
          type: m.type,
          product: m.product?.name,
          warehouse: m.warehouse?.name,
          qtyBase: num(m.qtyBase),
          reference: m.reference,
          reason: m.reason,
          createdAt: m.createdAt,
        })),
      };
    }

    throw new ValidationError(`Sección drill desconocida: ${query.section}`);
  },
};
