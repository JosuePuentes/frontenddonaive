import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getAdRepository,
  getAdDataSourceMode,
} from "@/services/ad-licoreria/repository-adapter";
import type { AdResult } from "@/services/ad-licoreria/repository";
import {
  loadAdSession,
  subscribeAdSession,
} from "@/services/ad-licoreria/session";
import type {
  AdAccount,
  AdAppSettings,
  AdCustomer,
  AdDailyClosure,
  AdInventoryClosure,
  AdInventoryClosureLine,
  AdInventoryMovement,
  AdInventoryMovementType,
  AdInvoiceDraft,
  AdOperator,
  AdPayment,
  AdPaymentMethodCode,
  AdPaymentMethodConfig,
  AdPrepaidAccount,
  AdPresentation,
  AdProduct,
  AdPurchase,
  AdPurchaseRequest,
  AdReceipt,
  AdSale,
  AdSaleItem,
  AdSiteDesign,
  AdStockTransfer,
  AdStockTransferStatus,
  AdWarehouse,
} from "@/types/ad-licoreria";
import type { AdRepositoryState } from "@/services/ad-licoreria/repository";

type AdStore = AdRepositoryState & {
  dataSource: "mock" | "api";
  apiSessionReady: boolean;
  hydrateApi: () => Promise<AdResult>;
  getStock: (productId: string, warehouseId: string) => number;
  getPresentationsFor: (productId: string) => AdPresentation[];
  getPaymentMethods: (activeOnly?: boolean) => AdPaymentMethodConfig[];
  updateSettings: (patch: Partial<AdAppSettings>) => AdResult;
  updateSiteDesign: (
    patch: Partial<AdSiteDesign> & { colors?: Partial<AdSiteDesign["colors"]> },
    userName?: string,
  ) => AdResult<AdSiteDesign>;
  saveSiteDesignDraft: (
    patch: Partial<AdSiteDesign> & { colors?: Partial<AdSiteDesign["colors"]> },
    userName?: string,
  ) => AdResult<AdSiteDesign>;
  publishSiteDesign: (userName?: string) => AdResult<AdSiteDesign>;
  discardSiteDesignDraft: () => AdResult<AdSiteDesign>;
  getSiteDesignDraft: () => AdSiteDesign;
  resetSiteDesign: (userName?: string) => AdResult<AdSiteDesign>;
  upsertPaymentMethod: (
    method: AdPaymentMethodConfig,
  ) => AdResult<AdPaymentMethodConfig>;
  upsertWarehouse: (
    warehouse: AdWarehouse,
  ) => AdResult<AdWarehouse> | Promise<AdResult<AdWarehouse>>;
  upsertOperator: (
    operator: AdOperator,
  ) => AdResult<AdOperator> | Promise<AdResult<AdOperator>>;
  getPosOperatorsForWarehouse: (warehouseId: string) => AdOperator[];
  getFloorOperatorsForWarehouse: (warehouseId: string) => AdOperator[];
  upsertProduct: (
    product: AdProduct,
  ) => AdResult<AdProduct> | Promise<AdResult<AdProduct>>;
  upsertPresentation: (
    pres: AdPresentation,
  ) => AdResult<AdPresentation> | Promise<AdResult<AdPresentation>>;
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
    warehouseId?: string;
    prepaid?: boolean;
    notes?: string;
  }) => AdResult<AdAccount> | Promise<AdResult<AdAccount>>;
  addAccountItem: (input: {
    accountId: string;
    productId: string;
    presentationId: string;
    qty: number;
    userName: string;
    deductStock?: boolean;
    warehouseId?: string;
  }) => AdResult<AdAccount> | Promise<AdResult<AdAccount>>;
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
  }) => AdResult | Promise<AdResult>;
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
  }) => AdResult | Promise<AdResult>;
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
  }) => AdResult<AdAccount> | Promise<AdResult<AdAccount>>;
  closeAccount: (input: {
    accountId: string;
    userName: string;
    notes?: string;
    settlePendingAs?: "commitment" | "prepaid";
  }) => AdResult<AdAccount> | Promise<AdResult<AdAccount>>;
  getCustomerSummary: ReturnType<
    typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.getCustomerSummary
  > extends infer R
    ? (customerId: string) => R
    : never;
  createPrepaid: (input: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerDocumentId?: string;
    warehouseId?: string;
    items: { productId: string; presentationId: string; qty: number }[];
    payments?: Omit<AdPayment, "id" | "createdAt">[];
    userName: string;
    linkedAccountId?: string;
    linkedReceiptNumber?: string;
    skipStockDeduction?: boolean;
  }) => AdResult<AdPrepaidAccount> | Promise<AdResult>;
  consumePrepaid: (input: {
    prepaidId: string;
    productId: string;
    presentationId: string;
    qty: number;
    mesoneraName: string;
    verifyPhone?: string;
    verifyDocumentId?: string;
  }) => AdResult | Promise<AdResult>;
  findPrepaidByQr: (tokenOrCode: string) => AdPrepaidAccount | undefined;
  findReceipt: (numberOrId: string) => AdReceipt | undefined;
  completeSale: (input: {
    items: AdSaleItem[];
    payments: Omit<AdPayment, "id" | "createdAt">[];
    warehouseId: string;
    userName: string;
    operatorId?: string;
    tableId?: string;
    mesoneraName?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    accountId?: string;
    discountUsd?: number;
    discountBs?: number;
    notes?: string;
    continueWithShortage?: boolean;
    shortageDecision?: string;
    shortageReasonCode?: string;
    shortageReasonNote?: string;
  }) => AdResult<AdSale> | Promise<AdResult>;
  voidSale: (input: {
    saleId: string;
    userName: string;
    reason: string;
    authorizedBy: string;
  }) => AdResult<AdSale> | Promise<AdResult<AdSale>>;
  upsertCustomer: (
    customer: AdCustomer,
  ) => AdResult<AdCustomer> | Promise<AdResult<AdCustomer>>;
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
  }) => AdResult<AdPurchase> | Promise<AdResult>;
  createDailyClosure: (input: {
    userName: string;
    countedCashUsd: number;
    countedCashBs: number;
    notes?: string;
    operatorId?: string;
    warehouseId?: string;
  }) => AdResult<AdDailyClosure> | Promise<AdResult>;
  createInventoryClosure: (input: {
    lines: AdInventoryClosureLine[];
    createdBy: string;
    warehouseId?: string;
    notes?: string;
    applyAdjustments?: boolean;
  }) => AdResult<AdInventoryClosure> | Promise<AdResult>;
  getOperationalAvailability: (
    productId: string,
    requestedBase?: number,
    preferredWarehouseId?: string,
  ) => ReturnType<
    typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.getOperationalAvailability
  >;
  getAvailabilityMessage: (
    productId: string,
    requestedBase?: number,
    preferredWarehouseId?: string,
  ) => string;
  createInvoiceDraft: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.createInvoiceDraft;
  confirmInvoiceDraft: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.confirmInvoiceDraft;
  cancelInvoiceDraft: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.cancelInvoiceDraft;
  createTransferDraft: (
    input: Parameters<
      typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.createTransferDraft
    >[0],
  ) => AdResult<AdStockTransfer> | Promise<AdResult>;
  updateTransferDraft: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.updateTransferDraft;
  confirmTransfer: (
    input: Parameters<
      typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.confirmTransfer
    >[0],
  ) => AdResult<AdStockTransfer> | Promise<AdResult>;
  advanceTransferStatus: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.advanceTransferStatus;
  createPurchaseRequest: (
    input: Parameters<
      typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.createPurchaseRequest
    >[0],
  ) => AdResult<AdPurchaseRequest> | Promise<AdResult>;
  fulfillPurchaseRequest: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.fulfillPurchaseRequest;
  getCopDashboard: () => ReturnType<
    typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.getCopDashboard
  >;
  getCopReports: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.getCopReports;
  logDocumentAction: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.logDocumentAction;
  setInventoryQty: (
    productId: string,
    warehouseId: string,
    qtyBase: number,
  ) => AdResult | Promise<AdResult>;
  getCurrentOperator: () => AdOperator | null;
  setCurrentOperator: (
    operatorId: string | null,
  ) => AdResult<AdOperator | null>;
  canAccessWarehouse: (warehouseId: string, operatorId?: string) => boolean;
  hasPermission: (
    permission: import("@/types/ad-licoreria").AdPermission,
    operatorId?: string,
  ) => boolean;
  setRolePermissions: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.setRolePermissions;
  getRolePermissionMatrix: () => ReturnType<
    typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.getRolePermissionMatrix
  >;
  createWarehouse: (
    input: Parameters<
      typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.createWarehouse
    >[0],
  ) => AdResult<AdWarehouse> | Promise<AdResult<AdWarehouse>>;
  setWarehouseActive: (
    input: Parameters<
      typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.setWarehouseActive
    >[0],
  ) => AdResult | Promise<AdResult>;
  reassignMesonera: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.reassignMesonera;
  upsertTable: typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository.upsertTable;
  getAccountsForMesonera: (mesoneraId: string) => AdAccount[];
};

const AdLicoreriaContext = createContext<AdStore | null>(null);

function bindRepo() {
  return getAdRepository();
}

export function AdLicoreriaProvider({ children }: { children: ReactNode }) {
  const mode = getAdDataSourceMode();
  const sessionVersion = useSyncExternalStore(
    subscribeAdSession,
    () => (loadAdSession()?.operatorId ?? "none"),
    () => "none",
  );

  const repo = bindRepo();

  const snap = useSyncExternalStore(
    (onStoreChange) => repo.subscribe(onStoreChange),
    () => repo.getState(),
    () => repo.getState(),
  );

  useEffect(() => {
    if (mode !== "api") return;
    if (!loadAdSession()) return;
    const apiRepo = repo as typeof import("@/services/ad-licoreria/api-backed-repository").adApiBackedRepository;
    if (typeof apiRepo.hydrateFromApi === "function") {
      void apiRepo.hydrateFromApi();
    }
  }, [mode, sessionVersion, repo]);

  const value = useMemo<AdStore>(() => {
    const r = bindRepo();
    return {
      ...snap,
      dataSource: mode,
      apiSessionReady: mode === "mock" || Boolean(loadAdSession()),
      hydrateApi: async () => {
        if (mode !== "api") return { ok: true, data: undefined };
        const api = r as typeof import("@/services/ad-licoreria/api-backed-repository").adApiBackedRepository;
        return api.hydrateFromApi();
      },
      getStock: (productId, warehouseId) => r.getStock(productId, warehouseId),
      getPresentationsFor: (productId) => r.getPresentationsFor(productId),
      getPaymentMethods: (activeOnly) => r.getPaymentMethods(activeOnly),
      updateSettings: (patch) => r.updateSettings(patch),
      updateSiteDesign: (patch, userName) =>
        r.updateSiteDesign(patch, userName),
      saveSiteDesignDraft: (patch, userName) =>
        r.saveSiteDesignDraft(patch, userName),
      publishSiteDesign: (userName) => r.publishSiteDesign(userName),
      discardSiteDesignDraft: () => r.discardSiteDesignDraft(),
      getSiteDesignDraft: () => r.getSiteDesignDraft(),
      resetSiteDesign: (userName) => r.resetSiteDesign(userName),
      upsertPaymentMethod: (m) => r.upsertPaymentMethod(m),
      upsertWarehouse: (w) => r.upsertWarehouse(w),
      upsertOperator: (o) => r.upsertOperator(o),
      getPosOperatorsForWarehouse: (warehouseId) =>
        r.getPosOperatorsForWarehouse(warehouseId),
      getFloorOperatorsForWarehouse: (warehouseId) =>
        r.getFloorOperatorsForWarehouse(warehouseId),
      upsertProduct: (p) => r.upsertProduct(p),
      upsertPresentation: (p) => r.upsertPresentation(p),
      registerMovement: (input) => r.registerMovement(input),
      transferStock: (input) =>
        (
          r as typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository
        ).transfer
          ? (
              r as typeof import("@/services/ad-licoreria/repository").adLicoreriaRepository
            ).transfer(input)
          : { ok: false, error: "transfer no disponible" },
      openAccount: (input) => r.openAccount(input),
      addAccountItem: (input) => r.addAccountItem(input),
      updateAccountItemQty: (input) => r.updateAccountItemQty(input),
      removeAccountItem: (input) => r.removeAccountItem(input),
      serveAccountItem: (input) => r.serveAccountItem(input),
      addAccountPayment: (input) => r.addAccountPayment(input),
      applyDiscount: (input) => r.applyDiscount(input),
      reopenAccount: (input) => r.reopenAccount(input),
      voidAccount: (input) => r.voidAccount(input),
      closeAccount: (input) => r.closeAccount(input),
      getCustomerSummary: (id) => r.getCustomerSummary(id) as AdStore["getCustomerSummary"] extends (id: string) => infer R ? R : never,
      createPrepaid: (input) => r.createPrepaid(input),
      consumePrepaid: (input) => r.consumePrepaid(input),
      findPrepaidByQr: (q) => r.findPrepaidByQr(q),
      findReceipt: (q) => r.findReceipt(q),
      completeSale: (input) => r.completeSale(input),
      voidSale: (input) => r.voidSale(input),
      upsertCustomer: (c) => r.upsertCustomer(c),
      createPurchase: (input) => r.createPurchase(input),
      createDailyClosure: (input) => r.createDailyClosure(input),
      createInventoryClosure: (input) => r.createInventoryClosure(input),
      getOperationalAvailability: (productId, requestedBase, preferredWarehouseId) =>
        r.getOperationalAvailability(
          productId,
          requestedBase ?? 0,
          preferredWarehouseId,
        ),
      getAvailabilityMessage: (productId, requestedBase, preferredWarehouseId) =>
        r.getAvailabilityMessage(
          productId,
          requestedBase ?? 0,
          preferredWarehouseId,
        ),
      createInvoiceDraft: (input) => r.createInvoiceDraft(input),
      confirmInvoiceDraft: (input) => r.confirmInvoiceDraft(input),
      cancelInvoiceDraft: (input) => r.cancelInvoiceDraft(input),
      createTransferDraft: (input) => r.createTransferDraft(input),
      updateTransferDraft: (input) => r.updateTransferDraft(input),
      confirmTransfer: (input) => r.confirmTransfer(input),
      advanceTransferStatus: (input) => r.advanceTransferStatus(input),
      createPurchaseRequest: (input) => r.createPurchaseRequest(input),
      fulfillPurchaseRequest: (input) => r.fulfillPurchaseRequest(input),
      getCopDashboard: () => r.getCopDashboard(),
      getCopReports: () => r.getCopReports(),
      logDocumentAction: (input) => r.logDocumentAction(input),
      setInventoryQty: (productId, warehouseId, qtyBase) =>
        r.setInventoryQty(productId, warehouseId, qtyBase),
      getCurrentOperator: () => r.getCurrentOperator(),
      setCurrentOperator: (id) => r.setCurrentOperator(id),
      canAccessWarehouse: (warehouseId, operatorId) =>
        r.canAccessWarehouse(warehouseId, operatorId),
      hasPermission: (permission, operatorId) =>
        r.hasPermission(permission, operatorId),
      setRolePermissions: (input) => r.setRolePermissions(input),
      getRolePermissionMatrix: () => r.getRolePermissionMatrix(),
      createWarehouse: (input) => r.createWarehouse(input),
      setWarehouseActive: (input) => r.setWarehouseActive(input),
      reassignMesonera: (input) => r.reassignMesonera(input),
      upsertTable: (table) => r.upsertTable(table),
      getAccountsForMesonera: (id) => r.getAccountsForMesonera(id),
    } as AdStore;
  }, [snap, mode, sessionVersion]);

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

export type {
  AdInvoiceDraft,
  AdStockTransfer,
  AdPurchaseRequest,
  AdStockTransferStatus,
};
