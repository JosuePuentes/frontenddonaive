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
import { asAdAsync } from "@/services/ad-licoreria/async-result";
import type { AdResult } from "@/services/ad-licoreria/repository";
import { adLicoreriaRepository } from "@/services/ad-licoreria/repository";
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
  AdPermission,
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
  AdTable,
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
  upsertWarehouse: (warehouse: AdWarehouse) => Promise<AdResult<AdWarehouse>>;
  upsertOperator: (operator: AdOperator) => Promise<AdResult<AdOperator>>;
  getPosOperatorsForWarehouse: (warehouseId: string) => AdOperator[];
  getFloorOperatorsForWarehouse: (warehouseId: string) => AdOperator[];
  upsertProduct: (product: AdProduct) => Promise<AdResult<AdProduct>>;
  upsertPresentation: (
    pres: AdPresentation,
  ) => Promise<AdResult<AdPresentation>>;
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
  }) => Promise<AdResult<AdInventoryMovement>>;
  transferStock: (input: {
    productId: string;
    presentationId: string;
    qtyPresentation: number;
    fromId: string;
    toId: string;
    userName: string;
    reason?: string;
  }) => Promise<AdResult>;
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
  }) => Promise<AdResult<AdAccount>>;
  addAccountItem: (input: {
    accountId: string;
    productId: string;
    presentationId: string;
    qty: number;
    userName: string;
    deductStock?: boolean;
    warehouseId?: string;
  }) => Promise<AdResult<AdAccount>>;
  updateAccountItemQty: (input: {
    accountId: string;
    itemId: string;
    qty: number;
    userName: string;
  }) => Promise<AdResult<AdAccount>>;
  removeAccountItem: (input: {
    accountId: string;
    itemId: string;
    userName: string;
  }) => Promise<AdResult<AdAccount>>;
  serveAccountItem: (input: {
    accountId: string;
    itemId: string;
    qty: number;
    mesoneraName: string;
    warehouseId?: string;
  }) => Promise<AdResult>;
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
  }) => Promise<AdResult>;
  applyDiscount: (input: {
    accountId: string;
    discountUsd: number;
    discountBs: number;
    reason: string;
    userName: string;
    authorizedBy: string;
  }) => Promise<AdResult<AdAccount>>;
  reopenAccount: (input: {
    accountId: string;
    userName: string;
    reason: string;
  }) => Promise<AdResult<AdAccount>>;
  voidAccount: (input: {
    accountId: string;
    userName: string;
    reason: string;
    authorizedBy: string;
    warehouseId?: string;
  }) => Promise<AdResult<AdAccount>>;
  closeAccount: (input: {
    accountId: string;
    userName: string;
    notes?: string;
    settlePendingAs?: "commitment" | "prepaid";
  }) => Promise<AdResult<AdAccount>>;
  getCustomerSummary: (
    customerId: string,
  ) => ReturnType<typeof adLicoreriaRepository.getCustomerSummary>;
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
  }) => Promise<AdResult<AdPrepaidAccount>>;
  consumePrepaid: (input: {
    prepaidId: string;
    productId: string;
    presentationId: string;
    qty: number;
    mesoneraName: string;
    verifyPhone?: string;
    verifyDocumentId?: string;
  }) => Promise<AdResult>;
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
  }) => Promise<AdResult<AdSale>>;
  voidSale: (input: {
    saleId: string;
    userName: string;
    reason: string;
    authorizedBy: string;
  }) => Promise<AdResult<AdSale>>;
  upsertCustomer: (customer: AdCustomer) => Promise<AdResult<AdCustomer>>;
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
  }) => Promise<AdResult<AdPurchase>>;
  createDailyClosure: (input: {
    userName: string;
    countedCashUsd: number;
    countedCashBs: number;
    notes?: string;
    operatorId?: string;
    warehouseId?: string;
  }) => Promise<AdResult<AdDailyClosure>>;
  createInventoryClosure: (input: {
    lines: AdInventoryClosureLine[];
    createdBy: string;
    warehouseId?: string;
    notes?: string;
    applyAdjustments?: boolean;
  }) => Promise<AdResult<AdInventoryClosure>>;
  getOperationalAvailability: (
    productId: string,
    requestedBase?: number,
    preferredWarehouseId?: string,
  ) => ReturnType<typeof adLicoreriaRepository.getOperationalAvailability>;
  getAvailabilityMessage: (
    productId: string,
    requestedBase?: number,
    preferredWarehouseId?: string,
  ) => string;
  createInvoiceDraft: (input: {
    kind?: "pos_sale" | "account_close";
    items: AdSaleItem[];
    payments: Omit<AdPayment, "id" | "createdAt">[];
    warehouseId: string;
    cashierName: string;
    operatorId?: string;
    tableId?: string;
    mesoneraName?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerDocumentId?: string;
    discountUsd?: number;
    discountBs?: number;
    discountReason?: string;
    notes?: string;
    continueWithShortage?: boolean;
    shortageDecision?: string;
  }) => Promise<AdResult<AdInvoiceDraft>>;
  confirmInvoiceDraft: (input: {
    draftId: string;
    userName: string;
    continueWithShortage?: boolean;
    shortageDecision?: string;
    shortageReasonCode?: string;
    shortageReasonNote?: string;
  }) => Promise<AdResult<AdSale>>;
  cancelInvoiceDraft: (input: {
    draftId: string;
    userName: string;
  }) => Promise<AdResult<AdInvoiceDraft>>;
  createTransferDraft: (input: {
    fromWarehouseId: string;
    toWarehouseId: string;
    lines: {
      productId: string;
      presentationId: string;
      qty: number;
      observation?: string;
    }[];
    createdBy: string;
    reason?: string;
    notes?: string;
    relatedAccountId?: string;
    relatedDraftId?: string;
  }) => Promise<AdResult<AdStockTransfer>>;
  updateTransferDraft: (input: {
    transferId: string;
    userName: string;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    lines?: {
      productId: string;
      presentationId: string;
      qty: number;
      observation?: string;
    }[];
    reason?: string;
    notes?: string;
  }) => Promise<AdResult<AdStockTransfer>>;
  confirmTransfer: (input: {
    transferId: string;
    userName: string;
  }) => Promise<AdResult<AdStockTransfer>>;
  advanceTransferStatus: (input: {
    transferId: string;
    userName: string;
    toStatus: AdStockTransferStatus;
  }) => Promise<AdResult<AdStockTransfer>>;
  createPurchaseRequest: (input: {
    productId: string;
    presentationId: string;
    qty: number;
    warehouseId: string;
    createdBy: string;
    reason: string;
    relatedAccountId?: string;
    relatedDraftId?: string;
    relatedTransferId?: string;
    notes?: string;
  }) => Promise<AdResult<AdPurchaseRequest>>;
  fulfillPurchaseRequest: (input: {
    requestId: string;
    supplierName: string;
    invoiceNumber: string;
    date: string;
    unitCostUsd: number;
    unitCostBs: number;
    userName: string;
    paymentMethod?: AdPaymentMethodCode;
    reference?: string;
    notes?: string;
  }) => Promise<AdResult<AdPurchase>>;
  getCopDashboard: () => ReturnType<typeof adLicoreriaRepository.getCopDashboard>;
  getCopReports: typeof adLicoreriaRepository.getCopReports;
  logDocumentAction: typeof adLicoreriaRepository.logDocumentAction;
  setInventoryQty: (
    productId: string,
    warehouseId: string,
    qtyBase: number,
  ) => Promise<AdResult>;
  getCurrentOperator: () => AdOperator | null;
  setCurrentOperator: (
    operatorId: string | null,
  ) => AdResult<AdOperator | null>;
  canAccessWarehouse: (warehouseId: string, operatorId?: string) => boolean;
  hasPermission: (permission: AdPermission, operatorId?: string) => boolean;
  setRolePermissions: typeof adLicoreriaRepository.setRolePermissions;
  getRolePermissionMatrix: () => ReturnType<
    typeof adLicoreriaRepository.getRolePermissionMatrix
  >;
  createWarehouse: (input: {
    name: string;
    code?: string;
    kind?: AdWarehouse["kind"];
    responsibleUserId?: string | null;
    userName: string;
  }) => Promise<AdResult<AdWarehouse>>;
  setWarehouseActive: (input: {
    warehouseId: string;
    active: boolean;
    userName: string;
  }) => Promise<AdResult<AdWarehouse>>;
  reassignMesonera: (input: {
    accountId: string;
    newMesoneraId: string;
    userName: string;
  }) => Promise<AdResult<AdAccount>>;
  upsertTable: (table: AdTable) => Promise<AdResult<AdTable>>;
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
      upsertWarehouse: (w) => asAdAsync(r.upsertWarehouse(w)),
      upsertOperator: (o) => asAdAsync(r.upsertOperator(o)),
      getPosOperatorsForWarehouse: (warehouseId) =>
        r.getPosOperatorsForWarehouse(warehouseId),
      getFloorOperatorsForWarehouse: (warehouseId) =>
        r.getFloorOperatorsForWarehouse(warehouseId),
      upsertProduct: (p) => asAdAsync(r.upsertProduct(p)),
      upsertPresentation: (p) => asAdAsync(r.upsertPresentation(p)),
      registerMovement: (input) => asAdAsync(r.registerMovement(input)),
      transferStock: (input) => asAdAsync(r.transfer(input)),
      openAccount: (input) => asAdAsync(r.openAccount(input)),
      addAccountItem: (input) => asAdAsync(r.addAccountItem(input)),
      updateAccountItemQty: (input) =>
        asAdAsync(r.updateAccountItemQty(input)),
      removeAccountItem: (input) => asAdAsync(r.removeAccountItem(input)),
      serveAccountItem: (input) => asAdAsync(r.serveAccountItem(input)),
      addAccountPayment: (input) => asAdAsync(r.addAccountPayment(input)),
      applyDiscount: (input) => asAdAsync(r.applyDiscount(input)),
      reopenAccount: (input) => asAdAsync(r.reopenAccount(input)),
      voidAccount: (input) => asAdAsync(r.voidAccount(input)),
      closeAccount: (input) => asAdAsync(r.closeAccount(input)),
      getCustomerSummary: (id) => r.getCustomerSummary(id),
      createPrepaid: (input) => asAdAsync(r.createPrepaid(input)),
      consumePrepaid: (input) => asAdAsync(r.consumePrepaid(input)),
      findPrepaidByQr: (q) => r.findPrepaidByQr(q),
      findReceipt: (q) => r.findReceipt(q),
      completeSale: (input) => asAdAsync(r.completeSale(input)),
      voidSale: (input) => asAdAsync(r.voidSale(input)),
      upsertCustomer: (c) => asAdAsync(r.upsertCustomer(c)),
      createPurchase: (input) => asAdAsync(r.createPurchase(input)),
      createDailyClosure: (input) => asAdAsync(r.createDailyClosure(input)),
      createInventoryClosure: (input) =>
        asAdAsync(r.createInventoryClosure(input)),
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
      createInvoiceDraft: (input) => asAdAsync(r.createInvoiceDraft(input)),
      confirmInvoiceDraft: (input) => asAdAsync(r.confirmInvoiceDraft(input)),
      cancelInvoiceDraft: (input) => asAdAsync(r.cancelInvoiceDraft(input)),
      createTransferDraft: (input) => asAdAsync(r.createTransferDraft(input)),
      updateTransferDraft: (input) => asAdAsync(r.updateTransferDraft(input)),
      confirmTransfer: (input) => asAdAsync(r.confirmTransfer(input)),
      advanceTransferStatus: (input) =>
        asAdAsync(r.advanceTransferStatus(input)),
      createPurchaseRequest: (input) =>
        asAdAsync(r.createPurchaseRequest(input)),
      fulfillPurchaseRequest: (input) =>
        asAdAsync(r.fulfillPurchaseRequest(input)),
      getCopDashboard: () => r.getCopDashboard(),
      getCopReports: () => r.getCopReports(),
      logDocumentAction: (input) => r.logDocumentAction(input),
      setInventoryQty: (productId, warehouseId, qtyBase) =>
        asAdAsync(r.setInventoryQty(productId, warehouseId, qtyBase)),
      getCurrentOperator: () => r.getCurrentOperator(),
      setCurrentOperator: (id) => r.setCurrentOperator(id),
      canAccessWarehouse: (warehouseId, operatorId) =>
        r.canAccessWarehouse(warehouseId, operatorId),
      hasPermission: (permission, operatorId) =>
        r.hasPermission(permission, operatorId),
      setRolePermissions: (input) => r.setRolePermissions(input),
      getRolePermissionMatrix: () => r.getRolePermissionMatrix(),
      createWarehouse: (input) => asAdAsync(r.createWarehouse(input)),
      setWarehouseActive: (input) => asAdAsync(r.setWarehouseActive(input)),
      reassignMesonera: (input) => asAdAsync(r.reassignMesonera(input)),
      upsertTable: (table) => asAdAsync(r.upsertTable(table)),
      getAccountsForMesonera: (id) => r.getAccountsForMesonera(id),
    };
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
