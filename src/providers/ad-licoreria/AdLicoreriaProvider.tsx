import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AD_DEMO_ACCOUNTS,
  AD_DEMO_AUDIT,
  AD_DEMO_CASH,
  AD_DEMO_CUSTOMERS,
  AD_DEMO_MOVEMENTS,
  AD_DEMO_PRESENTATIONS,
  AD_DEMO_PRODUCTS,
  AD_DEMO_SALES,
  AD_DEMO_SERVICE_LOGS,
  AD_DEMO_STOCK,
  AD_DEMO_TABLES,
  AD_DEMO_WAREHOUSES,
} from "@/content/ad-licoreria/demo-data";
import { toBaseUnits } from "@/lib/ad-licoreria/conversions";
import type {
  AdAccount,
  AdAuditEvent,
  AdCashSession,
  AdCustomer,
  AdInventoryMovement,
  AdPaymentLine,
  AdPresentation,
  AdProduct,
  AdSale,
  AdSaleLine,
  AdServiceLog,
  AdStockBalance,
  AdTable,
  AdWarehouse,
} from "@/types/ad-licoreria";
import { addPrices, multiplyPrice } from "@/lib/ad-licoreria/conversions";

type AdStore = {
  products: AdProduct[];
  presentations: AdPresentation[];
  warehouses: AdWarehouse[];
  stock: AdStockBalance[];
  movements: AdInventoryMovement[];
  tables: AdTable[];
  accounts: AdAccount[];
  customers: AdCustomer[];
  sales: AdSale[];
  serviceLogs: AdServiceLog[];
  cash: AdCashSession;
  audit: AdAuditEvent[];
  getStock: (productId: string, warehouseId: string) => number;
  getPresentationsFor: (productId: string) => AdPresentation[];
  transferStock: (input: {
    productId: string;
    presentationId: string;
    qtyPresentation: number;
    fromId: string;
    toId: string;
    userName: string;
    reason?: string;
  }) => { ok: true } | { ok: false; error: string };
  serveAccount: (input: {
    accountId: string;
    productId: string;
    presentationId: string;
    qty: number;
    mesoneraName: string;
  }) => { ok: true } | { ok: false; error: string };
  completeSale: (input: {
    lines: AdSaleLine[];
    payments: AdPaymentLine[];
    warehouseId: string;
    userName: string;
  }) => { ok: true; sale: AdSale } | { ok: false; error: string };
};

const AdLicoreriaContext = createContext<AdStore | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AdLicoreriaProvider({ children }: { children: ReactNode }) {
  const [products] = useState(AD_DEMO_PRODUCTS);
  const [presentations] = useState(AD_DEMO_PRESENTATIONS);
  const [warehouses] = useState(AD_DEMO_WAREHOUSES);
  const [stock, setStock] = useState(AD_DEMO_STOCK);
  const [movements, setMovements] = useState(AD_DEMO_MOVEMENTS);
  const [tables] = useState(AD_DEMO_TABLES);
  const [accounts, setAccounts] = useState(AD_DEMO_ACCOUNTS);
  const [customers] = useState(AD_DEMO_CUSTOMERS);
  const [sales, setSales] = useState(AD_DEMO_SALES);
  const [serviceLogs, setServiceLogs] = useState(AD_DEMO_SERVICE_LOGS);
  const [cash] = useState(AD_DEMO_CASH);
  const [audit, setAudit] = useState(AD_DEMO_AUDIT);

  const getStock = useCallback(
    (productId: string, warehouseId: string) =>
      stock.find(
        (s) => s.productId === productId && s.warehouseId === warehouseId,
      )?.qtyBase ?? 0,
    [stock],
  );

  const getPresentationsFor = useCallback(
    (productId: string) =>
      presentations.filter((p) => p.productId === productId && p.active),
    [presentations],
  );

  const adjustStock = useCallback(
    (productId: string, warehouseId: string, deltaBase: number) => {
      setStock((prev) => {
        const idx = prev.findIndex(
          (s) => s.productId === productId && s.warehouseId === warehouseId,
        );
        if (idx === -1) {
          return [
            ...prev,
            { productId, warehouseId, qtyBase: Math.max(0, deltaBase) },
          ];
        }
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qtyBase: Math.max(0, next[idx].qtyBase + deltaBase),
        };
        return next;
      });
    },
    [],
  );

  const transferStock: AdStore["transferStock"] = useCallback(
    ({ productId, presentationId, qtyPresentation, fromId, toId, userName, reason }) => {
      const pres = presentations.find((p) => p.id === presentationId);
      if (!pres) return { ok: false, error: "Presentación no encontrada" };
      const qtyBase = toBaseUnits(pres, qtyPresentation);
      const available = getStock(productId, fromId);
      if (qtyBase > available) {
        return { ok: false, error: "Stock insuficiente en origen" };
      }
      adjustStock(productId, fromId, -qtyBase);
      adjustStock(productId, toId, qtyBase);
      const mov: AdInventoryMovement = {
        id: uid("mov"),
        type: "traslado",
        productId,
        presentationId,
        qtyPresentation,
        qtyBase,
        warehouseFromId: fromId,
        warehouseToId: toId,
        userName,
        reason,
        createdAt: new Date().toISOString(),
      };
      setMovements((m) => [mov, ...m]);
      setAudit((a) => [
        {
          id: uid("aud"),
          action: "traslado",
          entity: "inventario",
          entityId: mov.id,
          userName,
          detail: `Traslado ${qtyBase} u. base (${qtyPresentation} × ${pres.name})`,
          createdAt: mov.createdAt,
        },
        ...a,
      ]);
      return { ok: true };
    },
    [adjustStock, getStock, presentations],
  );

  const serveAccount: AdStore["serveAccount"] = useCallback(
    ({ accountId, productId, presentationId, qty, mesoneraName }) => {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return { ok: false, error: "Cuenta no encontrada" };
      const line = account.lines.find(
        (l) => l.productId === productId && l.presentationId === presentationId,
      );
      if (!line) return { ok: false, error: "Producto no está en la cuenta" };
      const available = line.qtyPaid - line.qtyServed;
      if (qty <= 0 || qty > available) {
        return { ok: false, error: `Solo hay ${available} disponibles` };
      }
      const pres = presentations.find((p) => p.id === presentationId);
      if (!pres) return { ok: false, error: "Presentación no encontrada" };
      const qtyBase = toBaseUnits(pres, qty);
      const barraStock = getStock(productId, "wh-barra");
      if (qtyBase > barraStock) {
        return { ok: false, error: "Stock insuficiente en barra" };
      }

      adjustStock(productId, "wh-barra", -qtyBase);
      setAccounts((prev) =>
        prev.map((a) =>
          a.id !== accountId
            ? a
            : {
                ...a,
                updatedAt: new Date().toISOString(),
                lines: a.lines.map((l) =>
                  l.productId === productId && l.presentationId === presentationId
                    ? { ...l, qtyServed: l.qtyServed + qty }
                    : l,
                ),
              },
        ),
      );
      const log: AdServiceLog = {
        id: uid("svc"),
        accountId,
        tableId: account.tableId,
        productId,
        presentationId,
        qtyServed: qty,
        qtyBase,
        mesoneraName,
        createdAt: new Date().toISOString(),
      };
      setServiceLogs((s) => [log, ...s]);
      setMovements((m) => [
        {
          id: uid("mov"),
          type: "consumo",
          productId,
          presentationId,
          qtyPresentation: qty,
          qtyBase,
          warehouseFromId: "wh-barra",
          userName: mesoneraName,
          reason: `Servicio cuenta #${account.number}`,
          reference: account.id,
          createdAt: log.createdAt,
        },
        ...m,
      ]);
      setAudit((a) => [
        {
          id: uid("aud"),
          action: "servicio",
          entity: "cuenta",
          entityId: accountId,
          userName: mesoneraName,
          detail: `Sirvió ${qty} × ${pres.name} en cuenta #${account.number}`,
          createdAt: log.createdAt,
        },
        ...a,
      ]);
      return { ok: true };
    },
    [accounts, adjustStock, getStock, presentations],
  );

  const completeSale: AdStore["completeSale"] = useCallback(
    ({ lines, payments, warehouseId, userName }) => {
      if (!lines.length) return { ok: false, error: "Agregue productos" };
      if (!payments.length) return { ok: false, error: "Registre pagos" };

      for (const line of lines) {
        const available = getStock(line.productId, warehouseId);
        if (line.qtyBase > available) {
          return { ok: false, error: "Stock insuficiente para la venta" };
        }
      }

      const subtotal = lines.reduce(
        (acc, l) => addPrices(acc, multiplyPrice(l.unitPrice, l.qty)),
        { usd: 0, bs: 0 },
      );

      for (const line of lines) {
        adjustStock(line.productId, warehouseId, -line.qtyBase);
        setMovements((m) => [
          {
            id: uid("mov"),
            type: "venta",
            productId: line.productId,
            presentationId: line.presentationId,
            qtyPresentation: line.qty,
            qtyBase: line.qtyBase,
            warehouseFromId: warehouseId,
            userName,
            reason: "Venta POS",
            createdAt: new Date().toISOString(),
          },
          ...m,
        ]);
      }

      const sale: AdSale = {
        id: uid("sale"),
        lines,
        payments,
        subtotal,
        total: subtotal,
        warehouseId,
        userName,
        status: "completed",
        createdAt: new Date().toISOString(),
      };
      setSales((s) => [sale, ...s]);
      setAudit((a) => [
        {
          id: uid("aud"),
          action: "venta",
          entity: "pos",
          entityId: sale.id,
          userName,
          detail: `Venta ${formatSaleId(sale.id)} total $${sale.total.usd}`,
          createdAt: sale.createdAt,
        },
        ...a,
      ]);
      return { ok: true, sale };
    },
    [adjustStock, getStock],
  );

  const value = useMemo<AdStore>(
    () => ({
      products,
      presentations,
      warehouses,
      stock,
      movements,
      tables,
      accounts,
      customers,
      sales,
      serviceLogs,
      cash,
      audit,
      getStock,
      getPresentationsFor,
      transferStock,
      serveAccount,
      completeSale,
    }),
    [
      products,
      presentations,
      warehouses,
      stock,
      movements,
      tables,
      accounts,
      customers,
      sales,
      serviceLogs,
      cash,
      audit,
      getStock,
      getPresentationsFor,
      transferStock,
      serveAccount,
      completeSale,
    ],
  );

  return (
    <AdLicoreriaContext.Provider value={value}>
      {children}
    </AdLicoreriaContext.Provider>
  );
}

function formatSaleId(id: string) {
  return id.slice(-6).toUpperCase();
}

export function useAdLicoreria() {
  const ctx = useContext(AdLicoreriaContext);
  if (!ctx) {
    throw new Error("useAdLicoreria must be used within AdLicoreriaProvider");
  }
  return ctx;
}
