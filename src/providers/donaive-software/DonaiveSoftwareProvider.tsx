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
  activateLicenseFromServer,
  clearLicense,
  loadLicense,
  type DsLicense,
} from "@/lib/donaive-software/license";
import { getDeviceFingerprint } from "@/lib/donaive-software/device";
import {
  checkRemoteActivation,
  presidentLoginRemote,
  redeemActivationCode,
  requestRemoteActivation,
} from "@/lib/donaive-software/license-api";
import {
  ensureDefaultAdmin,
  hashPassword,
  loadRoleMatrix,
  loadUsers,
  logout as authLogout,
  resolveCurrentUser,
  setRolePermissions as persistRolePermissions,
  upsertUser as persistUpsertUser,
  authenticate,
  savePresidentSession,
  type UpsertUserInput,
} from "@/lib/donaive-software/auth";
import {
  hasAnyPermission,
  hasPermission,
} from "@/lib/donaive-software/access";
import { buildCashClosure, nextShiftNumber } from "@/lib/donaive-software/closures";
import {
  applyAccountPayment,
  createReceivable,
  upsertClientInList,
  upsertSupplierInList,
  type UpsertClientInput,
  type UpsertSupplierInput,
} from "@/lib/donaive-software/parties";
import {
  bankForMethod,
  movementFromAccount,
  movementFromChange,
  movementFromPayment,
} from "@/lib/donaive-software/banks";
import {
  completeSale as runCompleteSale,
  type CartItem,
} from "@/lib/donaive-software/sales";
import {
  applyGeneralInventoryMovement,
  appendClosure,
  appendMovements,
  appendPayable,
  appendPurchase,
  appendReceivable,
  appendSale,
  loadFiscalSettings,
  loadGeneralInventory,
  loadBanks,
  loadBankMovements,
  loadCashSessions,
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
  saveBanks,
  saveCashSessions,
  saveClients,
  saveFiscalSettings,
  saveGeneralInventory,
  savePayables,
  saveProducts,
  saveRates,
  saveReceivables,
  saveSales,
  saveSuppliers,
  appendBankMovements,
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
  type DsGeneralInventoryState,
  type DsFiscalSettings,
  type UpsertProductInput,
} from "@/lib/donaive-software/store";
import {
  confirmPurchase as runConfirmPurchase,
  type ConfirmPurchaseInput,
} from "@/lib/donaive-software/purchases";
import type {
  DsBank,
  DsBankMovement,
  DsCashSession,
  DsChangeLine,
  DsPayment,
  DsPaymentMethod,
  DsPermission,
  DsPurchase,
  DsRole,
  DsUser,
  DsGeneralInventoryMovement,
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
  generalInventory: DsGeneralInventoryState;
  fiscalSettings: DsFiscalSettings;
  currentUser: DsUser | null;
  users: DsUser[];
  roleMatrix: Partial<Record<DsRole, DsPermission[]>>;
  activateWithCode: (
    activationCode: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  requestActivation: () => Promise<
    import("@/lib/donaive-software/license-api").DsActivationRequest
  >;
  validateLicenseOnline: () => Promise<void>;
  deactivate: () => void;
  login: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
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
      includeInGeneral?: boolean;
    },
  ) => { ok: true; purchase: DsPurchase } | { ok: false; error: string };
  refreshPurchases: () => void;
  completeSale: (input: {
    cart: CartItem[];
    payments: DsPayment[];
    saleKind?: "NORMAL" | "FISCAL";
    fiscalPrinter?: "printer_1" | "printer_2";
    fiscalPin?: string;
    clientId?: string;
    change?: DsChangeLine[];
    creditAppliedUsd?: number;
    originSaleId?: string;
  }) => { ok: true; sale: DsSale } | { ok: false; error: string };
  setFiscalPin: (pin: string) => { ok: true } | { ok: false; error: string };
  verifyFiscalPin: (pin: string) => boolean;
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
    bankId?: string;
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
    bankId?: string;
  }) => { ok: true; receivable: DsReceivable } | { ok: false; error: string };
  banks: DsBank[];
  bankMovements: DsBankMovement[];
  cashSessions: DsCashSession[];
  upsertBank: (input: {
    id?: string;
    name: string;
    currency: "USD" | "BS";
    paymentMethods: DsPaymentMethod[];
    active?: boolean;
  }) => { ok: true; bank: DsBank } | { ok: false; error: string };
  openCashSession: (input: {
    registerName?: string;
    openingCashUsd: number;
    openingCashBs: number;
    notes?: string;
  }) => { ok: true; session: DsCashSession } | { ok: false; error: string };
  closeCashSession: (input: {
    countedCashUsd: number;
    countedCashBs: number;
    notes?: string;
  }) => { ok: true; session: DsCashSession; closure: DsCashClosure } | { ok: false; error: string };
  returnSale: (saleId: string) =>
    | { ok: true; sale: DsSale }
    | { ok: false; error: string };
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
  const [generalInventory, setGeneralInventory] = useState<DsGeneralInventoryState>({
    stockByProduct: {},
    movements: [],
  });
  const [fiscalSettings, setFiscalSettings] = useState<DsFiscalSettings>({
    pinHash: null,
    updatedAt: new Date().toISOString(),
  });
  const [banks, setBanks] = useState<DsBank[]>([]);
  const [bankMovements, setBankMovements] = useState<DsBankMovement[]>([]);
  const [cashSessions, setCashSessions] = useState<DsCashSession[]>([]);
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
    setGeneralInventory(loadGeneralInventory());
    setFiscalSettings(loadFiscalSettings());
    setBanks(loadBanks());
    setBankMovements(loadBankMovements());
    setCashSessions(loadCashSessions());
    setUsers(loadUsers());
    setRoleMatrix(loadRoleMatrix());
    setCurrentUser(resolveCurrentUser());
    setReady(true);
  }, []);

  const activateWithCode = useCallback(
    async (activationCode: string) => {
      try {
        const result = await redeemActivationCode(activationCode);
        const next = activateLicenseFromServer({
          businessName: result.businessName,
          licenseId: result.licenseId,
          activationId: result.activationId,
          deviceFingerprint: getDeviceFingerprint(),
        });
        ensureDefaultAdmin();
        setLicense(next);
        refreshUsers();
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          error:
            err instanceof Error
              ? err.message
              : "No se pudo activar con ese código.",
        };
      }
    },
    [refreshUsers],
  );

  const requestActivation = useCallback(async () => {
    return requestRemoteActivation();
  }, []);

  const validateLicenseOnline = useCallback(async () => {
    const current = loadLicense();
    if (!current) return;
    try {
      const check = await checkRemoteActivation({
        activationId: current.activationId,
      });
      if (!check.ok) {
        clearLicense();
        authLogout();
        setLicense(null);
        setCurrentUser(null);
      }
    } catch {
      // Sin red: mantener licencia local (offline-first)
    }
  }, []);

  const deactivate = useCallback(() => {
    clearLicense();
    authLogout();
    setLicense(null);
    setCurrentUser(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const local = authenticate(username, password);
    if (local.ok) {
      setCurrentUser(local.user);
      return { ok: true as const };
    }

    const lic = loadLicense();
    if (lic?.licenseId) {
      try {
        const remote = await presidentLoginRemote({
          licenseId: lic.licenseId,
          username,
          password,
        });
        if (remote.ok) {
          const user = savePresidentSession(remote.user);
          setCurrentUser(user);
          return { ok: true as const };
        }
      } catch {
        // sin red
      }
    }

    return { ok: false as const, error: local.error };
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

  const verifyFiscalPin = useCallback(
    (pin: string) =>
      Boolean(
        fiscalSettings.pinHash &&
          hashPassword(pin.trim()) === fiscalSettings.pinHash,
      ),
    [fiscalSettings.pinHash],
  );

  const setFiscalPin = useCallback((pin: string) => {
    const clean = pin.trim();
    if (clean.length < 4) {
      return { ok: false as const, error: "El PIN fiscal debe tener al menos 4 dígitos." };
    }
    const next: DsFiscalSettings = {
      pinHash: hashPassword(clean),
      updatedAt: new Date().toISOString(),
    };
    saveFiscalSettings(next);
    setFiscalSettings(next);
    return { ok: true as const };
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
        includeInGeneral?: boolean;
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

      if (input.includeInGeneral) {
        let nextGeneral = generalInventory;
        for (const line of r.purchase.lines) {
          const qtyBase =
            (line.buyMode === "BOX" ? line.qty * Math.max(1, line.unitsPerBox) : line.qty) +
            Math.max(0, line.qtyBonus);
          const gm: DsGeneralInventoryMovement = {
            id: `gmov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            productId: line.productId,
            productLabel: line.productLabel,
            qtyBase,
            reason: "COMPRA",
            refId: r.purchase.id,
            createdAt: now,
            createdBy: currentUser?.name,
          };
          nextGeneral = applyGeneralInventoryMovement(nextGeneral, gm);
        }
        saveGeneralInventory(nextGeneral);
        setGeneralInventory(nextGeneral);
      }
      return { ok: true as const, purchase: r.purchase };
    },
    [products, rates, currentUser, generalInventory],
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
    (input: {
      cart: CartItem[];
      payments: DsPayment[];
      saleKind?: "NORMAL" | "FISCAL";
      fiscalPrinter?: "printer_1" | "printer_2";
      fiscalPin?: string;
      clientId?: string;
      change?: DsChangeLine[];
      creditAppliedUsd?: number;
      originSaleId?: string;
    }) => {
      const open = cashSessions.find((s) => s.status === "open");
      if (!open) {
        return { ok: false as const, error: "Abra un turno de caja antes de facturar." };
      }
      const saleKind = input.saleKind ?? "NORMAL";
      if (saleKind === "FISCAL") {
        if (!input.fiscalPrinter) {
          return { ok: false as const, error: "Seleccione impresora fiscal." };
        }
        if (!verifyFiscalPin(input.fiscalPin || "")) {
          return { ok: false as const, error: "PIN fiscal inválido." };
        }
      }
      const client = input.clientId
        ? clients.find((c) => c.id === input.clientId)
        : undefined;
      const payments = input.payments.map((p) => {
        const bank = bankForMethod(banks, p.method);
        return { ...p, bankId: bank?.id };
      });
      const r = runCompleteSale({
        products,
        cart: input.cart,
        payments,
        bcv: rates.bcv,
        createdBy: currentUser?.name,
        operatorId: currentUser?.id,
        saleKind,
        fiscalPrinter: input.fiscalPrinter,
        clientId: client?.id,
        clientName: client?.name,
        clientDocument: client?.documentId,
        change: input.change,
        creditAppliedUsd: input.creditAppliedUsd,
        originSaleId: input.originSaleId,
        sessionId: open.id,
        registerId: open.registerId,
      });
      if (!r.ok) return r;
      saveProducts(r.products);
      setProducts(r.products);
      let nextSales = appendSale(r.sale);
      if (input.originSaleId && (input.creditAppliedUsd ?? 0) > 0) {
        nextSales = nextSales.map((s) => {
          if (s.id !== input.originSaleId) return s;
          const left = Math.max(
            0,
            (s.creditUsdRemaining ?? 0) - (input.creditAppliedUsd ?? 0),
          );
          return { ...s, creditUsdRemaining: left };
        });
        saveSales(nextSales);
      }
      setSales(nextSales);
      setMovements(appendMovements(r.movements));
      if (saleKind === "FISCAL") {
        let nextGeneral = generalInventory;
        for (const line of r.sale.lines) {
          const gm: DsGeneralInventoryMovement = {
            id: `gmov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            productId: line.productId,
            productLabel: line.productLabel,
            qtyBase: -line.qtyBase,
            reason: "VENTA_FISCAL",
            refId: r.sale.id,
            createdAt: r.sale.createdAt,
            createdBy: currentUser?.name,
          };
          nextGeneral = applyGeneralInventoryMovement(nextGeneral, gm);
        }
        saveGeneralInventory(nextGeneral);
        setGeneralInventory(nextGeneral);
      }
      const extras: DsBankMovement[] = [];
      for (const pay of r.sale.payments) {
        const bank = bankForMethod(banks, pay.method);
        if (!bank) continue;
        extras.push(
          movementFromPayment({
            bank,
            payment: pay,
            bcv: rates.bcv,
            reference: r.sale.receiptNumber,
            note: `Venta ${r.sale.receiptNumber}`,
            operatorId: currentUser?.id,
          }),
        );
      }
      for (const ch of r.sale.change ?? []) {
        const method = ch.currency === "USD" ? "efectivo_usd" : "efectivo_bs";
        const bank = bankForMethod(banks, method);
        if (!bank) continue;
        extras.push(
          movementFromChange({
            bank,
            change: ch,
            bcv: rates.bcv,
            reference: r.sale.receiptNumber,
            operatorId: currentUser?.id,
          }),
        );
      }
      if (extras.length) setBankMovements(appendBankMovements(extras));
      const nextSessions = cashSessions.map((s) =>
        s.id === open.id ? { ...s, saleIds: [...s.saleIds, r.sale.id] } : s,
      );
      saveCashSessions(nextSessions);
      setCashSessions(nextSessions);
      return { ok: true as const, sale: r.sale };
    },
    [
      products,
      rates,
      currentUser,
      generalInventory,
      verifyFiscalPin,
      cashSessions,
      clients,
      banks,
    ],
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
      bankId?: string;
    }) => {
      const idx = payables.findIndex((p) => p.id === input.payableId);
      if (idx < 0) return { ok: false as const, error: "Cuenta no encontrada" };
      const bank = input.bankId
        ? banks.find((b) => b.id === input.bankId)
        : undefined;
      if (input.bankId && !bank) {
        return { ok: false as const, error: "Banco no encontrado" };
      }
      const r = applyAccountPayment(payables[idx], input.amount, {
        method: input.method,
        reference: input.reference,
        bankId: input.bankId,
      });
      if (!r.ok) return r;
      if (bank) {
        const mov = movementFromAccount({
          bank,
          kind: "OUTCOME",
          amount: input.amount,
          accountCurrency: payables[idx].currency,
          bcv: rates.bcv,
          method: (input.method as DsPaymentMethod | undefined) ?? undefined,
          reference: payables[idx].invoiceNumber,
          note: `Pago CxP ${payables[idx].invoiceNumber}`,
          operatorId: currentUser?.id,
        });
        setBankMovements(appendBankMovements([mov]));
      }
      const next = [...payables];
      next[idx] = r.account;
      savePayables(next);
      setPayables(next);
      return { ok: true as const, payable: r.account };
    },
    [payables, banks, rates.bcv, currentUser],
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
      bankId?: string;
    }) => {
      const idx = receivables.findIndex((p) => p.id === input.receivableId);
      if (idx < 0) return { ok: false as const, error: "Cuenta no encontrada" };
      const bank = input.bankId
        ? banks.find((b) => b.id === input.bankId)
        : undefined;
      const r = applyAccountPayment(receivables[idx], input.amount, {
        method: input.method,
        reference: input.reference,
        bankId: input.bankId,
      });
      if (!r.ok) return r;
      if (bank) {
        const mov = movementFromAccount({
          bank,
          kind: "INCOME",
          amount: input.amount,
          accountCurrency: receivables[idx].currency,
          bcv: rates.bcv,
          method: (input.method as DsPaymentMethod | undefined) ?? undefined,
          reference: receivables[idx].concept,
          note: `Cobro CxC ${receivables[idx].concept}`,
          operatorId: currentUser?.id,
        });
        setBankMovements(appendBankMovements([mov]));
      }
      const next = [...receivables];
      next[idx] = r.account;
      saveReceivables(next);
      setReceivables(next);
      return { ok: true as const, receivable: r.account };
    },
    [receivables, banks, rates.bcv, currentUser],
  );

  const upsertBank = useCallback(
    (input: {
      id?: string;
      name: string;
      currency: "USD" | "BS";
      paymentMethods: DsPaymentMethod[];
      active?: boolean;
    }) => {
      const name = input.name.trim();
      if (!name) return { ok: false as const, error: "Indique el nombre del banco" };
      let next = [...banks];
      let bank: DsBank;
      if (input.id) {
        const idx = next.findIndex((b) => b.id === input.id);
        if (idx < 0) return { ok: false as const, error: "Banco no encontrado" };
        bank = {
          ...next[idx],
          name,
          currency: input.currency,
          paymentMethods: input.paymentMethods,
          active: input.active !== false,
        };
        next[idx] = bank;
      } else {
        bank = {
          id: `bank_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          name,
          currency: input.currency,
          paymentMethods: input.paymentMethods,
          active: input.active !== false,
          createdAt: new Date().toISOString(),
        };
        next = [bank, ...next];
      }
      const taken = new Set(bank.paymentMethods);
      next = next.map((b) =>
        b.id === bank.id
          ? b
          : { ...b, paymentMethods: b.paymentMethods.filter((m) => !taken.has(m)) },
      );
      saveBanks(next);
      setBanks(next);
      return { ok: true as const, bank };
    },
    [banks],
  );

  const openCashSession = useCallback(
    (input: {
      registerName?: string;
      openingCashUsd: number;
      openingCashBs: number;
      notes?: string;
    }) => {
      if (cashSessions.some((s) => s.status === "open")) {
        return { ok: false as const, error: "Ya hay un turno abierto" };
      }
      const today = new Date().toISOString().slice(0, 10);
      const registerId = "caja-1";
      const session: DsCashSession = {
        id: `ses_${Date.now().toString(36)}`,
        registerId,
        registerName: input.registerName?.trim() || "Caja 1",
        shiftNumber: nextShiftNumber(cashSessions, registerId, today),
        openedAt: new Date().toISOString(),
        openedBy: currentUser?.name ?? "operador",
        openingCashUsd: Math.max(0, Number(input.openingCashUsd) || 0),
        openingCashBs: Math.max(0, Number(input.openingCashBs) || 0),
        status: "open",
        saleIds: [],
        notes: input.notes?.trim() || undefined,
      };
      const next = [session, ...cashSessions];
      saveCashSessions(next);
      setCashSessions(next);
      return { ok: true as const, session };
    },
    [cashSessions, currentUser],
  );

  const closeCashSession = useCallback(
    (input: {
      countedCashUsd: number;
      countedCashBs: number;
      notes?: string;
    }) => {
      const open = cashSessions.find((s) => s.status === "open");
      if (!open) return { ok: false as const, error: "No hay turno abierto" };
      const date = open.openedAt.slice(0, 10);
      const scoped = sales.filter(
        (s) => s.sessionId === open.id && s.status === "completed",
      );
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
      const session: DsCashSession = {
        ...open,
        status: "closed",
        closedAt: new Date().toISOString(),
        closedBy: currentUser?.name,
        closingCashUsd: input.countedCashUsd,
        closingCashBs: input.countedCashBs,
        notes: input.notes?.trim() || open.notes,
      };
      const next = cashSessions.map((s) => (s.id === open.id ? session : s));
      saveCashSessions(next);
      setCashSessions(next);
      return { ok: true as const, session, closure };
    },
    [cashSessions, sales, currentUser],
  );

  const returnSale = useCallback(
    (saleId: string) => {
      const sale = sales.find((s) => s.id === saleId);
      if (!sale) return { ok: false as const, error: "Factura no encontrada" };
      if (sale.status !== "completed") {
        return { ok: false as const, error: "Solo se devuelven facturas completadas" };
      }
      if (sale.returnedAt) {
        return { ok: false as const, error: "Esta factura ya fue devuelta" };
      }
      const now = new Date().toISOString();
      const nextProducts = products.map((p) => {
        const qty = sale.lines
          .filter((l) => l.productId === p.id)
          .reduce((a, l) => a + l.qtyBase, 0);
        if (!qty) return p;
        return {
          ...p,
          stock: { ...p.stock, qtyBase: p.stock.qtyBase + qty },
        };
      });
      saveProducts(nextProducts);
      setProducts(nextProducts);
      const movs: DsStockMovement[] = sale.lines.map((l) => ({
        id: `mov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        type: "DEVOLUCION",
        productId: l.productId,
        productLabel: l.productLabel,
        qtyBase: l.qtyBase,
        unitCostUsd: l.unitCostUsd,
        note: `Devolución ${sale.receiptNumber} — sin reembolso`,
        refId: sale.id,
        saleKind: sale.saleKind,
        createdAt: now,
        createdBy: currentUser?.name,
      }));
      setMovements(appendMovements(movs));
      if ((sale.saleKind ?? "NORMAL") === "FISCAL") {
        let nextGeneral = generalInventory;
        for (const line of sale.lines) {
          nextGeneral = applyGeneralInventoryMovement(nextGeneral, {
            id: `gmov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            productId: line.productId,
            productLabel: line.productLabel,
            qtyBase: line.qtyBase,
            reason: "DEVOLUCION",
            refId: sale.id,
            createdAt: now,
            createdBy: currentUser?.name,
          });
        }
        saveGeneralInventory(nextGeneral);
        setGeneralInventory(nextGeneral);
      }
      const updated: DsSale = {
        ...sale,
        returnedAt: now,
        creditUsdRemaining: sale.totalUsd,
      };
      const nextSales = sales.map((s) => (s.id === sale.id ? updated : s));
      saveSales(nextSales);
      setSales(nextSales);
      return { ok: true as const, sale: updated };
    },
    [sales, products, generalInventory, currentUser],
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
      generalInventory,
      fiscalSettings,
      currentUser,
      users,
      roleMatrix,
      activateWithCode,
      requestActivation,
      validateLicenseOnline,
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
      banks,
      bankMovements,
      cashSessions,
      completeSale: completeSaleFn,
      setFiscalPin,
      verifyFiscalPin,
      createCashClosure: createCashClosureFn,
      upsertClient,
      upsertSupplier,
      payPayable,
      addReceivable,
      collectReceivable,
      upsertBank,
      openCashSession,
      closeCashSession,
      returnSale,
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
      generalInventory,
      fiscalSettings,
      currentUser,
      users,
      roleMatrix,
      banks,
      bankMovements,
      cashSessions,
      activateWithCode,
      requestActivation,
      validateLicenseOnline,
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
      setFiscalPin,
      verifyFiscalPin,
      createCashClosureFn,
      upsertClient,
      upsertSupplier,
      payPayable,
      addReceivable,
      collectReceivable,
      upsertBank,
      openCashSession,
      closeCashSession,
      returnSale,
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
