import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  adLicoreriaRepository,
  type AdRepositoryState,
  type AdResult,
} from "@/services/ad-licoreria/repository";
import type {
  AdAccount,
  AdAppSettings,
  AdCustomer,
  AdDailyClosure,
  AdInventoryClosure,
  AdInventoryClosureLine,
  AdInventoryMovement,
  AdInventoryMovementType,
  AdPayment,
  AdPaymentMethodCode,
  AdPaymentMethodConfig,
  AdPrepaidAccount,
  AdPresentation,
  AdProduct,
  AdPurchase,
  AdReceipt,
  AdSale,
  AdSaleItem,
} from "@/types/ad-licoreria";

type AdStore = AdRepositoryState & {
  getStock: (productId: string, warehouseId: string) => number;
  getPresentationsFor: (productId: string) => AdPresentation[];
  getPaymentMethods: (activeOnly?: boolean) => AdPaymentMethodConfig[];
  updateSettings: (patch: Partial<AdAppSettings>) => AdResult;
  upsertPaymentMethod: (
    method: AdPaymentMethodConfig,
  ) => AdResult<AdPaymentMethodConfig>;
  upsertProduct: (product: AdProduct) => AdResult<AdProduct>;
  upsertPresentation: (pres: AdPresentation) => AdResult<AdPresentation>;
  registerMovement: (input: {
    type: AdInventoryMovementType;
    productId: string;
    presentationId?: string;
    qtyPresentation: number;
    warehouseId: string;
    warehouseFromId?: string;
    warehouseToId?: string;
    userName: string;
    reason?: string;
    reference?: string;
  }) => AdResult<AdInventoryMovement>;
  transferStock: (input: {
    productId: string;
    presentationId: string;
    qtyPresentation: number;
    fromId: string;
    toId: string;
    userName: string;
    reason?: string;
  }) => AdResult;
  openAccount: (input: {
    tableId?: string;
    mesoneraId?: string;
    mesoneraName: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    prepaid?: boolean;
    notes?: string;
  }) => AdResult<AdAccount>;
  addAccountItem: (input: {
    accountId: string;
    productId: string;
    presentationId: string;
    qty: number;
    userName: string;
    deductStock?: boolean;
    warehouseId?: string;
  }) => AdResult<AdAccount>;
  updateAccountItemQty: (input: {
    accountId: string;
    itemId: string;
    qty: number;
    userName: string;
  }) => AdResult<AdAccount>;
  removeAccountItem: (input: {
    accountId: string;
    itemId: string;
    userName: string;
  }) => AdResult<AdAccount>;
  serveAccountItem: (input: {
    accountId: string;
    itemId: string;
    qty: number;
    mesoneraName: string;
    warehouseId?: string;
  }) => AdResult;
  addAccountPayment: (input: {
    accountId: string;
    method: AdPaymentMethodCode;
    currency: "USD" | "BS";
    amount: number;
    userName: string;
    bank?: string;
    reference?: string;
    originPhone?: string;
    voucherNote?: string;
  }) => AdResult;
  applyDiscount: (input: {
    accountId: string;
    discountUsd: number;
    discountBs: number;
    reason: string;
    userName: string;
    authorizedBy: string;
  }) => AdResult<AdAccount>;
  reopenAccount: (input: {
    accountId: string;
    userName: string;
    reason: string;
  }) => AdResult<AdAccount>;
  voidAccount: (input: {
    accountId: string;
    userName: string;
    reason: string;
    authorizedBy: string;
    warehouseId?: string;
  }) => AdResult<AdAccount>;
  closeAccount: (input: {
    accountId: string;
    userName: string;
    notes?: string;
  }) => AdResult<AdAccount>;
  getCustomerSummary: (customerId: string) =>
    | ReturnType<typeof adLicoreriaRepository.getCustomerSummary>
    | undefined;
  createPrepaid: (input: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    items: {
      productId: string;
      presentationId: string;
      qty: number;
    }[];
    payments?: Omit<AdPayment, "id" | "createdAt">[];
    userName: string;
  }) => AdResult<AdPrepaidAccount>;
  consumePrepaid: (input: {
    prepaidId: string;
    productId: string;
    presentationId: string;
    qty: number;
    mesoneraName: string;
  }) => AdResult;
  findPrepaidByQr: (tokenOrCode: string) => AdPrepaidAccount | undefined;
  findReceipt: (numberOrId: string) => AdReceipt | undefined;
  completeSale: (input: {
    items: AdSaleItem[];
    payments: Omit<AdPayment, "id" | "createdAt">[];
    warehouseId: string;
    userName: string;
    tableId?: string;
    mesoneraName?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    accountId?: string;
    discountUsd?: number;
    discountBs?: number;
    notes?: string;
  }) => AdResult<AdSale>;
  voidSale: (input: {
    saleId: string;
    userName: string;
    reason: string;
    authorizedBy: string;
  }) => AdResult<AdSale>;
  upsertCustomer: (customer: AdCustomer) => AdResult<AdCustomer>;
  createPurchase: (input: {
    supplierName: string;
    invoiceNumber: string;
    date: string;
    warehouseId: string;
    items: {
      productId: string;
      presentationId: string;
      qty: number;
      unitCostUsd: number;
      unitCostBs: number;
    }[];
    paymentMethod?: AdPaymentMethodCode;
    reference?: string;
    userName: string;
    notes?: string;
  }) => AdResult<AdPurchase>;
  createDailyClosure: (input: {
    userName: string;
    countedCashUsd: number;
    countedCashBs: number;
    notes?: string;
  }) => AdResult<AdDailyClosure>;
  createInventoryClosure: (input: {
    lines: AdInventoryClosureLine[];
    createdBy: string;
    warehouseId?: string;
    notes?: string;
    applyAdjustments?: boolean;
  }) => AdResult<AdInventoryClosure>;
};

const AdLicoreriaContext = createContext<AdStore | null>(null);

function getSnapshot() {
  return adLicoreriaRepository.getState();
}

export function AdLicoreriaProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(
    adLicoreriaRepository.subscribe,
    getSnapshot,
    getSnapshot,
  );

  const value = useMemo<AdStore>(
    () => ({
      ...snap,
      getStock: adLicoreriaRepository.getStock,
      getPresentationsFor: (productId) =>
        adLicoreriaRepository.getPresentationsFor(productId),
      getPaymentMethods: (activeOnly) =>
        adLicoreriaRepository.getPaymentMethods(activeOnly),
      updateSettings: (patch) => adLicoreriaRepository.updateSettings(patch),
      upsertPaymentMethod: (m) => adLicoreriaRepository.upsertPaymentMethod(m),
      upsertProduct: (p) => adLicoreriaRepository.upsertProduct(p),
      upsertPresentation: (p) => adLicoreriaRepository.upsertPresentation(p),
      registerMovement: (input) =>
        adLicoreriaRepository.registerMovement(input),
      transferStock: (input) => adLicoreriaRepository.transfer(input),
      openAccount: (input) => adLicoreriaRepository.openAccount(input),
      addAccountItem: (input) => adLicoreriaRepository.addAccountItem(input),
      updateAccountItemQty: (input) =>
        adLicoreriaRepository.updateAccountItemQty(input),
      removeAccountItem: (input) =>
        adLicoreriaRepository.removeAccountItem(input),
      serveAccountItem: (input) =>
        adLicoreriaRepository.serveAccountItem(input),
      addAccountPayment: (input) =>
        adLicoreriaRepository.addAccountPayment(input),
      applyDiscount: (input) => adLicoreriaRepository.applyDiscount(input),
      reopenAccount: (input) => adLicoreriaRepository.reopenAccount(input),
      voidAccount: (input) => adLicoreriaRepository.voidAccount(input),
      closeAccount: (input) => adLicoreriaRepository.closeAccount(input),
      getCustomerSummary: (id) => adLicoreriaRepository.getCustomerSummary(id),
      createPrepaid: (input) => adLicoreriaRepository.createPrepaid(input),
      consumePrepaid: (input) => adLicoreriaRepository.consumePrepaid(input),
      findPrepaidByQr: (q) => adLicoreriaRepository.findPrepaidByQr(q),
      findReceipt: (q) => adLicoreriaRepository.findReceipt(q),
      completeSale: (input) => adLicoreriaRepository.completeSale(input),
      voidSale: (input) => adLicoreriaRepository.voidSale(input),
      upsertCustomer: (c) => adLicoreriaRepository.upsertCustomer(c),
      createPurchase: (input) => adLicoreriaRepository.createPurchase(input),
      createDailyClosure: (input) =>
        adLicoreriaRepository.createDailyClosure(input),
      createInventoryClosure: (input) =>
        adLicoreriaRepository.createInventoryClosure(input),
    }),
    [snap],
  );

  return (
    <AdLicoreriaContext.Provider value={value}>
      {children}
    </AdLicoreriaContext.Provider>
  );
}

export function useAdLicoreria() {
  const ctx = useContext(AdLicoreriaContext);
  if (!ctx) {
    throw new Error("useAdLicoreria must be used within AdLicoreriaProvider");
  }
  return ctx;
}
