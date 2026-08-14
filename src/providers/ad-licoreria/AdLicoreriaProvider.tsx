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
  AdPaymentMethod,
  AdPrepaidAccount,
  AdPresentation,
  AdProduct,
  AdSale,
  AdSaleItem,
} from "@/types/ad-licoreria";

type AdStore = AdRepositoryState & {
  getStock: (productId: string, warehouseId: string) => number;
  getPresentationsFor: (productId: string) => AdPresentation[];
  updateSettings: (patch: Partial<AdAppSettings>) => AdResult;
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
    prepaid?: boolean;
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
  serveAccountItem: (input: {
    accountId: string;
    itemId: string;
    qty: number;
    mesoneraName: string;
  }) => AdResult;
  addAccountPayment: (input: {
    accountId: string;
    method: AdPaymentMethod;
    currency: "USD" | "BS";
    amount: number;
    userName: string;
  }) => AdResult;
  closeAccount: (input: {
    accountId: string;
    userName: string;
    notes?: string;
  }) => AdResult<AdAccount>;
  createPrepaid: (input: {
    customerId?: string;
    customerName?: string;
    items: {
      productId: string;
      presentationId: string;
      qty: number;
    }[];
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
  completeSale: (input: {
    items: AdSaleItem[];
    payments: Omit<AdPayment, "id" | "createdAt">[];
    warehouseId: string;
    userName: string;
    tableId?: string;
    mesoneraName?: string;
    customerName?: string;
    accountId?: string;
  }) => AdResult<AdSale>;
  upsertCustomer: (customer: AdCustomer) => AdResult<AdCustomer>;
  createDailyClosure: (userName: string) => AdResult<AdDailyClosure>;
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
      updateSettings: (patch) => adLicoreriaRepository.updateSettings(patch),
      upsertProduct: (p) => adLicoreriaRepository.upsertProduct(p),
      upsertPresentation: (p) => adLicoreriaRepository.upsertPresentation(p),
      registerMovement: (input) =>
        adLicoreriaRepository.registerMovement(input),
      transferStock: (input) => adLicoreriaRepository.transfer(input),
      openAccount: (input) => adLicoreriaRepository.openAccount(input),
      addAccountItem: (input) => adLicoreriaRepository.addAccountItem(input),
      serveAccountItem: (input) =>
        adLicoreriaRepository.serveAccountItem(input),
      addAccountPayment: (input) =>
        adLicoreriaRepository.addAccountPayment(input),
      closeAccount: (input) => adLicoreriaRepository.closeAccount(input),
      createPrepaid: (input) => adLicoreriaRepository.createPrepaid(input),
      consumePrepaid: (input) => adLicoreriaRepository.consumePrepaid(input),
      findPrepaidByQr: (q) => adLicoreriaRepository.findPrepaidByQr(q),
      completeSale: (input) => adLicoreriaRepository.completeSale(input),
      upsertCustomer: (c) => adLicoreriaRepository.upsertCustomer(c),
      createDailyClosure: (u) => adLicoreriaRepository.createDailyClosure(u),
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
