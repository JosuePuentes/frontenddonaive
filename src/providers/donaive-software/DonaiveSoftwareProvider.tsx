import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  activateLicense,
  clearLicense,
  loadLicense,
  type DsLicense,
} from "@/lib/donaive-software/license";
import {
  ensureDefaultAdmin,
  loadRoleMatrix,
  loadUsers,
  logout as authLogout,
  resolveCurrentUser,
  setRolePermissions as persistRolePermissions,
  upsertUser as persistUpsertUser,
  authenticate,
  type UpsertUserInput,
} from "@/lib/donaive-software/auth";
import {
  hasAnyPermission,
  hasPermission,
} from "@/lib/donaive-software/access";
import { buildCashClosure } from "@/lib/donaive-software/closures";
import {
  applyAccountPayment,
  createReceivable,
  upsertClientInList,
  upsertSupplierInList,
  type UpsertClientInput,
  type UpsertSupplierInput,
} from "@/lib/donaive-software/parties";
import {
  completeSale as runCompleteSale,
  type CartItem,
} from "@/lib/donaive-software/sales";
import {
  appendClosure,
  appendMovements,
  appendPayable,
  appendPurchase,
  appendReceivable,
  appendSale,
  loadClients,
  loadClosures,
  loadMovements,
  loadPayables,
  loadProducts,
  loadPurchases,
  loadRates,
  loadReceivables,
  loadSales,
  loadSuppliers,
  receiveStock,
  saveClients,
  savePayables,
  saveProducts,
  saveRates,
  saveReceivables,
  saveSuppliers,
  upsertProduct as persistUpsertProduct,
  type DsCashClosure,
  type DsClient,
  type DsPayable,
  type DsProduct,
  type DsRatesState,
  type DsReceivable,
  type DsSale,
  type DsStockMovement,
  type DsSupplier,
  type UpsertProductInput,
} from "@/lib/donaive-software/store";
import {
  confirmPurchase as runConfirmPurchase,
  type ConfirmPurchaseInput,
} from "@/lib/donaive-software/purchases";
import type {
  DsPayment,
  DsPermission,
  DsPurchase,
  DsRole,
  DsUser,
} from "@/types/donaive-software";

type Ctx = {
  license: DsLicense | null;
  rates: DsRatesState;
  products: DsProduct[];
  purchases: DsPurchase[];
  sales: DsSale[];
  closures: DsCashClosure[];
  movements: DsStockMovement[];
  clients: DsClient[];
  suppliers: DsSupplier[];
  payables: DsPayable[];
  receivables: DsReceivable[];
  currentUser: DsUser | null;
  users: DsUser[];
  roleMatrix: Partial<Record<DsRole, DsPermission[]>>;
  activate: (businessName: string, licenseKey?: string) => void;
  deactivate: () => void;
  login: (
    username: string,
    password: string,
  ) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  refreshUsers: () => void;
  upsertUser: (
    input: UpsertUserInput,
  ) => { ok: true; user: DsUser } | { ok: false; error: string };
  setRolePermissions: (input: {
    role: DsRole;
    permissions: DsPermission[];
  }) => { ok: true } | { ok: false; error: string };
  can: (permission: DsPermission) => boolean;
  canAny: (permissions: DsPermission[]) => boolean;
  setBcv: (rate: number) => void;
  setProtectedRate: (rate: number) => void;
  applyPurchaseCpp: (
    productId: string,
    qtyBase: number,
    unitCostUsd: number,
  ) => void;
  upsertProduct: (
    input: UpsertProductInput,
  ) => { ok: true; product: DsProduct } | { ok: false; error: string };
  confirmPurchase: (
    input: Omit<ConfirmPurchaseInput, "products" | "rateCtx"> & {
      rateCtx?: ConfirmPurchaseInput["rateCtx"];
    },
  ) => { ok: true; purchase: DsPurchase } | { ok: false; error: string };
  refreshPurchases: () => void;
  completeSale: (input: {
    cart: CartItem[];
    payments: DsPayment[];
  }) => { ok: true; sale: DsSale } | { ok: false; error: string };
  createCashClosure: (input: {
    countedCashUsd: number;
    countedCashBs: number;
    notes?: string;
    date?: string;
  }) => { ok: true; closure: DsCashClosure } | { ok: false; error: string };
  upsertClient: (
    input: UpsertClientInput,
  ) => { ok: true; client: DsClient } | { ok: false; error: string };
  upsertSupplier: (
    input: UpsertSupplierInput,
  ) => { ok: true; supplier: DsSupplier } | { ok: false; error: string };
  payPayable: (input: {
    payableId: string;
    amount: number;
    method?: string;
    reference?: string;
  }) => { ok: true; payable: DsPayable } | { ok: false; error: string };
  addReceivable: (input: {
    clientId: string;
    concept: string;
    amount: number;
    currency: "USD" | "BS";
    dueDate?: string;
    notes?: string;
  }) => { ok: true; receivable: DsReceivable } | { ok: false; error: string };
  collectReceivable: (input: {
    receivableId: string;
    amount: number;
    method?: string;
    reference?: string;
  }) => { ok: true; receivable: DsReceivable } | { ok: false; error: string };
};

const DonaiveSoftwareContext = createContext<Ctx | null>(null);

export function DonaiveSoftwareProvider({ children }: { children: ReactNode }) {
  const [license, setLicense] = useState<DsLicense | null>(null);
  const [rates, setRates] = useState<DsRatesState>(() => loadRates());
  const [products, setProducts] = useState<DsProduct[]>([]);
  const [purchases, setPurchases] = useState<DsPurchase[]>([]);
  const [sales, setSales] = useState<DsSale[]>([]);
  const [closures, setClosures] = useState<DsCashClosure[]>([]);
  const [movements, setMovements] = useState<DsStockMovement[]>([]);
  const [clients, setClients] = useState<DsClient[]>([]);
  const [suppliers, setSuppliers] = useState<DsSupplier[]>([]);
  const [payables, setPayables] = useState<DsPayable[]>([]);
  const [receivables, setReceivables] = useState<DsReceivable[]>([]);
  const [currentUser, setCurrentUser] = useState<DsUser | null>(null);
  const [users, setUsers] = useState<DsUser[]>([]);
  const [roleMatrix, setRoleMatrix] = useState<
    Partial<Record<DsRole, DsPermission[]>>
  >({});
  const [ready, setReady] = useState(false);

  const refreshUsers = useCallback(() => {
    setUsers(loadUsers());
    setRoleMatrix(loadRoleMatrix());
    setCurrentUser(resolveCurrentUser());
  }, []);

  useEffect(() => {
    setLicense(loadLicense());
    setRates(loadRates());
    setProducts(loadProducts());
    setPurchases(loadPurchases());
    setSales(loadSales());
    setClosures(loadClosures());
    setMovements(loadMovements());
    setClients(loadClients());
    setSuppliers(loadSuppliers());
    setPayables(loadPayables());
    setReceivables(loadReceivables());
    setUsers(loadUsers());
    setRoleMatrix(loadRoleMatrix());
    setCurrentUser(resolveCurrentUser());
    setReady(true);
  }, []);

  const activate = useCallback(
    (businessName: string, licenseKey?: string) => {
      const next = activateLicense({ businessName, licenseKey });
      ensureDefaultAdmin();
      setLicense(next);
      refreshUsers();
    },
    [refreshUsers],
  );

  const deactivate = useCallback(() => {
    clearLicense();
    authLogout();
    setLicense(null);
    setCurrentUser(null);
  }, []);

  const login = useCallback((username: string, password: string) => {
    const r = authenticate(username, password);
    if (!r.ok) return r;
    setCurrentUser(r.user);
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setCurrentUser(null);
  }, []);

  const upsertUser = useCallback(
    (input: UpsertUserInput) => {
      const r = persistUpsertUser(input);
      if (r.ok) refreshUsers();
      return r;
    },
    [refreshUsers],
  );

  const setRolePermissions = useCallback(
    (input: { role: DsRole; permissions: DsPermission[] }) => {
      const r = persistRolePermissions(input);
      if (r.ok) refreshUsers();
      return r;
    },
    [refreshUsers],
  );

  const canAccess = useCallback(
    (permission: DsPermission) =>
      hasPermission(currentUser, permission, roleMatrix),
    [currentUser, roleMatrix],
  );

  const canAny = useCallback(
    (permissions: DsPermission[]) =>
      hasAnyPermission(currentUser, permissions, roleMatrix),
    [currentUser, roleMatrix],
  );

  const setBcv = useCallback((rate: number) => {
    setRates((prev) => {
      const next = {
        ...prev,
        bcv: rate,
        updatedAt: new Date().toISOString(),
      };
      saveRates(next);
      return next;
    });
  }, []);

  const setProtectedRate = useCallback((rate: number) => {
    setRates((prev) => {
      const next = {
        ...prev,
        protectedRate: rate,
        updatedAt: new Date().toISOString(),
      };
      saveRates(next);
      return next;
    });
  }, []);

  const refreshPurchases = useCallback(() => {
    setPurchases(loadPurchases());
  }, []);

  const upsertProduct = useCallback(
    (input: UpsertProductInput) => {
      const r = persistUpsertProduct(products, input);
      if (r.ok) setProducts(r.products);
      return r.ok ? { ok: true as const, product: r.product } : r;
    },
    [products],
  );

  const confirmPurchaseFn = useCallback(
    (
      input: Omit<ConfirmPurchaseInput, "products" | "rateCtx"> & {
        rateCtx?: ConfirmPurchaseInput["rateCtx"];
      },
    ) => {
      const rateCtx =
        input.rateCtx ?? {
          currency: input.currency,
          bcv: rates.bcv,
          protectedRate: rates.protectedRate,
          useProtected: false,
          invoiceRate: input.invoiceRate,
        };
      const r = runConfirmPurchase({
        ...input,
        products,
        rateCtx,
        createdBy: currentUser?.name,
      });
      if (!r.ok) return r;
      saveProducts(r.products);
      setProducts(r.products);
      setPurchases(appendPurchase(r.purchase));
      if (r.payable) setPayables(appendPayable(r.payable));
      const now = new Date().toISOString();
      const movs: DsStockMovement[] = r.purchase.lines.map((l) => ({
        id: `mov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        type: "COMPRA" as const,
        productId: l.productId,
        productLabel: l.productLabel,
        qtyBase:
          (l.buyMode === "BOX" ? l.qty * Math.max(1, l.unitsPerBox) : l.qty) +
          Math.max(0, l.qtyBonus),
        note: `Compra ${r.purchase.invoiceNumber || r.purchase.id}`,
        refId: r.purchase.id,
        createdAt: now,
        createdBy: currentUser?.name,
      }));
      setMovements(appendMovements(movs));
      return { ok: true as const, purchase: r.purchase };
    },
    [products, rates, currentUser],
  );

  const applyPurchaseCpp = useCallback(
    (productId: string, qtyBase: number, unitCostUsd: number) => {
      setProducts((prev) => {
        const next = receiveStock(prev, productId, qtyBase, unitCostUsd);
        saveProducts(next);
        return next;
      });
    },
    [],
  );

  const completeSaleFn = useCallback(
    (input: { cart: CartItem[]; payments: DsPayment[] }) => {
      const r = runCompleteSale({
        products,
        cart: input.cart,
        payments: input.payments,
        bcv: rates.bcv,
        createdBy: currentUser?.name,
        operatorId: currentUser?.id,
      });
      if (!r.ok) return r;
      saveProducts(r.products);
      setProducts(r.products);
      setSales(appendSale(r.sale));
      setMovements(appendMovements(r.movements));
      return { ok: true as const, sale: r.sale };
    },
    [products, rates, currentUser],
  );

  const createCashClosureFn = useCallback(
    (input: {
      countedCashUsd: number;
      countedCashBs: number;
      notes?: string;
      date?: string;
    }) => {
      const date = input.date ?? new Date().toISOString().slice(0, 10);
      const scoped = sales.filter(
        (s) =>
          s.createdAt.slice(0, 10) === date &&
          s.status === "completed" &&
          (currentUser?.role !== "cajero" ||
            !s.operatorId ||
            s.operatorId === currentUser.id),
      );
      const already = closures.some(
        (c) =>
          c.date === date &&
          (!currentUser ||
            currentUser.role !== "cajero" ||
            c.operatorId === currentUser.id),
      );
      if (already && currentUser?.role === "cajero") {
        return {
          ok: false as const,
          error: "Ya registraste un cierre para hoy",
        };
      }
      const closure = buildCashClosure({
        sales: scoped,
        allSales: sales,
        date,
        countedCashUsd: input.countedCashUsd,
        countedCashBs: input.countedCashBs,
        notes: input.notes,
        createdBy: currentUser?.name,
        operatorId: currentUser?.id,
      });
      setClosures(appendClosure(closure));
      return { ok: true as const, closure };
    },
    [sales, closures, currentUser],
  );

  const upsertClient = useCallback((input: UpsertClientInput) => {
    const r = upsertClientInList(clients, input);
    if (!r.ok) return r;
    saveClients(r.list);
    setClients(r.list);
    return { ok: true as const, client: r.client };
  }, [clients]);

  const upsertSupplier = useCallback((input: UpsertSupplierInput) => {
    const r = upsertSupplierInList(suppliers, input);
    if (!r.ok) return r;
    saveSuppliers(r.list);
    setSuppliers(r.list);
    return { ok: true as const, supplier: r.supplier };
  }, [suppliers]);

  const payPayable = useCallback(
    (input: {
      payableId: string;
      amount: number;
      method?: string;
      reference?: string;
    }) => {
      const idx = payables.findIndex((p) => p.id === input.payableId);
      if (idx < 0) return { ok: false as const, error: "Cuenta no encontrada" };
      const r = applyAccountPayment(payables[idx], input.amount, {
        method: input.method,
        reference: input.reference,
      });
      if (!r.ok) return r;
      const next = [...payables];
      next[idx] = r.account;
      savePayables(next);
      setPayables(next);
      return { ok: true as const, payable: r.account };
    },
    [payables],
  );

  const addReceivable = useCallback(
    (input: {
      clientId: string;
      concept: string;
      amount: number;
      currency: "USD" | "BS";
      dueDate?: string;
      notes?: string;
    }) => {
      const client = clients.find((c) => c.id === input.clientId);
      if (!client) return { ok: false as const, error: "Cliente no encontrado" };
      const r = createReceivable({
        clientId: client.id,
        clientName: client.name,
        concept: input.concept,
        amount: input.amount,
        currency: input.currency,
        dueDate: input.dueDate,
        notes: input.notes,
      });
      if (!r.ok) return r;
      setReceivables(appendReceivable(r.receivable));
      return { ok: true as const, receivable: r.receivable };
    },
    [clients],
  );

  const collectReceivable = useCallback(
    (input: {
      receivableId: string;
      amount: number;
      method?: string;
      reference?: string;
    }) => {
      const idx = receivables.findIndex((p) => p.id === input.receivableId);
      if (idx < 0) return { ok: false as const, error: "Cuenta no encontrada" };
      const r = applyAccountPayment(receivables[idx], input.amount, {
        method: input.method,
        reference: input.reference,
      });
      if (!r.ok) return r;
      const next = [...receivables];
      next[idx] = r.account;
      saveReceivables(next);
      setReceivables(next);
      return { ok: true as const, receivable: r.account };
    },
    [receivables],
  );

  const value = useMemo(
    () => ({
      license,
      rates,
      products,
      purchases,
      sales,
      closures,
      movements,
      clients,
      suppliers,
      payables,
      receivables,
      currentUser,
      users,
      roleMatrix,
      activate,
      deactivate,
      login,
      logout,
      refreshUsers,
      upsertUser,
      setRolePermissions,
      can: canAccess,
      canAny,
      setBcv,
      setProtectedRate,
      applyPurchaseCpp,
      upsertProduct,
      confirmPurchase: confirmPurchaseFn,
      refreshPurchases,
      completeSale: completeSaleFn,
      createCashClosure: createCashClosureFn,
      upsertClient,
      upsertSupplier,
      payPayable,
      addReceivable,
      collectReceivable,
    }),
    [
      license,
      rates,
      products,
      purchases,
      sales,
      closures,
      movements,
      clients,
      suppliers,
      payables,
      receivables,
      currentUser,
      users,
      roleMatrix,
      activate,
      deactivate,
      login,
      logout,
      refreshUsers,
      upsertUser,
      setRolePermissions,
      canAccess,
      canAny,
      setBcv,
      setProtectedRate,
      applyPurchaseCpp,
      upsertProduct,
      confirmPurchaseFn,
      refreshPurchases,
      completeSaleFn,
      createCashClosureFn,
      upsertClient,
      upsertSupplier,
      payPayable,
      addReceivable,
      collectReceivable,
    ],
  );

  if (!ready) return null;

  return (
    <DonaiveSoftwareContext.Provider value={value}>
      {children}
    </DonaiveSoftwareContext.Provider>
  );
}

export function useDonaiveSoftware() {
  const ctx = useContext(DonaiveSoftwareContext);
  if (!ctx) {
    throw new Error("useDonaiveSoftware debe usarse dentro del provider");
  }
  return ctx;
}
