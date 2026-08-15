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

type AdStore = AdRepositoryState & {
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
  upsertWarehouse: (warehouse: AdWarehouse) => AdResult<AdWarehouse>;
  upsertOperator: (operator: AdOperator) => AdResult<AdOperator>;
  getPosOperatorsForWarehouse: (warehouseId: string) => AdOperator[];
  getFloorOperatorsForWarehouse: (warehouseId: string) => AdOperator[];
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
    warehouseId?: string;
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
    settlePendingAs?: "commitment" | "prepaid";
  }) => AdResult<AdAccount>;
  getCustomerSummary: (customerId: string) =>
    | ReturnType<typeof adLicoreriaRepository.getCustomerSummary>
    | undefined;
  createPrepaid: (input: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerDocumentId?: string;
    warehouseId?: string;
    skipStockDeduction?: boolean;
    linkedAccountId?: string;
    linkedReceiptNumber?: string;
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
    verifyPhone?: string;
    verifyDocumentId?: string;
  }) => AdResult;
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
    operatorId?: string;
    warehouseId?: string;
  }) => AdResult<AdDailyClosure>;
  createInventoryClosure: (input: {
    lines: AdInventoryClosureLine[];
    createdBy: string;
    warehouseId?: string;
    notes?: string;
    applyAdjustments?: boolean;
  }) => AdResult<AdInventoryClosure>;
  getOperationalAvailability: typeof adLicoreriaRepository.getOperationalAvailability;
  getAvailabilityMessage: typeof adLicoreriaRepository.getAvailabilityMessage;
  createInvoiceDraft: typeof adLicoreriaRepository.createInvoiceDraft;
  confirmInvoiceDraft: typeof adLicoreriaRepository.confirmInvoiceDraft;
  cancelInvoiceDraft: typeof adLicoreriaRepository.cancelInvoiceDraft;
  createTransferDraft: typeof adLicoreriaRepository.createTransferDraft;
  updateTransferDraft: typeof adLicoreriaRepository.updateTransferDraft;
  confirmTransfer: typeof adLicoreriaRepository.confirmTransfer;
  advanceTransferStatus: typeof adLicoreriaRepository.advanceTransferStatus;
  createPurchaseRequest: typeof adLicoreriaRepository.createPurchaseRequest;
  fulfillPurchaseRequest: typeof adLicoreriaRepository.fulfillPurchaseRequest;
  getCopDashboard: typeof adLicoreriaRepository.getCopDashboard;
  getCopReports: typeof adLicoreriaRepository.getCopReports;
  logDocumentAction: typeof adLicoreriaRepository.logDocumentAction;
  setInventoryQty: typeof adLicoreriaRepository.setInventoryQty;
  getCurrentOperator: typeof adLicoreriaRepository.getCurrentOperator;
  setCurrentOperator: typeof adLicoreriaRepository.setCurrentOperator;
  canAccessWarehouse: typeof adLicoreriaRepository.canAccessWarehouse;
  hasPermission: typeof adLicoreriaRepository.hasPermission;
  setRolePermissions: typeof adLicoreriaRepository.setRolePermissions;
  getRolePermissionMatrix: typeof adLicoreriaRepository.getRolePermissionMatrix;
  createWarehouse: typeof adLicoreriaRepository.createWarehouse;
  setWarehouseActive: typeof adLicoreriaRepository.setWarehouseActive;
  reassignMesonera: typeof adLicoreriaRepository.reassignMesonera;
  upsertTable: typeof adLicoreriaRepository.upsertTable;
  getAccountsForMesonera: typeof adLicoreriaRepository.getAccountsForMesonera;
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
      updateSiteDesign: (patch, userName) =>
        adLicoreriaRepository.updateSiteDesign(patch, userName),
      saveSiteDesignDraft: (patch, userName) =>
        adLicoreriaRepository.saveSiteDesignDraft(patch, userName),
      publishSiteDesign: (userName) =>
        adLicoreriaRepository.publishSiteDesign(userName),
      discardSiteDesignDraft: () =>
        adLicoreriaRepository.discardSiteDesignDraft(),
      getSiteDesignDraft: () => adLicoreriaRepository.getSiteDesignDraft(),
      resetSiteDesign: (userName) =>
        adLicoreriaRepository.resetSiteDesign(userName),
      upsertPaymentMethod: (m) => adLicoreriaRepository.upsertPaymentMethod(m),
      upsertWarehouse: (w) => adLicoreriaRepository.upsertWarehouse(w),
      upsertOperator: (o) => adLicoreriaRepository.upsertOperator(o),
      getPosOperatorsForWarehouse: (warehouseId) =>
        adLicoreriaRepository.getPosOperatorsForWarehouse(warehouseId),
      getFloorOperatorsForWarehouse: (warehouseId) =>
        adLicoreriaRepository.getFloorOperatorsForWarehouse(warehouseId),
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
      getOperationalAvailability: (...args) =>
        adLicoreriaRepository.getOperationalAvailability(...args),
      getAvailabilityMessage: (...args) =>
        adLicoreriaRepository.getAvailabilityMessage(...args),
      createInvoiceDraft: (input) =>
        adLicoreriaRepository.createInvoiceDraft(input),
      confirmInvoiceDraft: (input) =>
        adLicoreriaRepository.confirmInvoiceDraft(input),
      cancelInvoiceDraft: (input) =>
        adLicoreriaRepository.cancelInvoiceDraft(input),
      createTransferDraft: (input) =>
        adLicoreriaRepository.createTransferDraft(input),
      updateTransferDraft: (input) =>
        adLicoreriaRepository.updateTransferDraft(input),
      confirmTransfer: (input) =>
        adLicoreriaRepository.confirmTransfer(input),
      advanceTransferStatus: (input) =>
        adLicoreriaRepository.advanceTransferStatus(input),
      createPurchaseRequest: (input) =>
        adLicoreriaRepository.createPurchaseRequest(input),
      fulfillPurchaseRequest: (input) =>
        adLicoreriaRepository.fulfillPurchaseRequest(input),
      getCopDashboard: () => adLicoreriaRepository.getCopDashboard(),
      getCopReports: () => adLicoreriaRepository.getCopReports(),
      logDocumentAction: (input) =>
        adLicoreriaRepository.logDocumentAction(input),
      setInventoryQty: (productId, warehouseId, qtyBase) =>
        adLicoreriaRepository.setInventoryQty(productId, warehouseId, qtyBase),
      getCurrentOperator: () => adLicoreriaRepository.getCurrentOperator(),
      setCurrentOperator: (id) =>
        adLicoreriaRepository.setCurrentOperator(id),
      canAccessWarehouse: (warehouseId, operatorId) =>
        adLicoreriaRepository.canAccessWarehouse(warehouseId, operatorId),
      hasPermission: (permission, operatorId) =>
        adLicoreriaRepository.hasPermission(permission, operatorId),
      setRolePermissions: (input) =>
        adLicoreriaRepository.setRolePermissions(input),
      getRolePermissionMatrix: () =>
        adLicoreriaRepository.getRolePermissionMatrix(),
      createWarehouse: (input) =>
        adLicoreriaRepository.createWarehouse(input),
      setWarehouseActive: (input) =>
        adLicoreriaRepository.setWarehouseActive(input),
      reassignMesonera: (input) =>
        adLicoreriaRepository.reassignMesonera(input),
      upsertTable: (table) => adLicoreriaRepository.upsertTable(table),
      getAccountsForMesonera: (id) =>
        adLicoreriaRepository.getAccountsForMesonera(id),
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

export type { AdInvoiceDraft, AdStockTransfer, AdPurchaseRequest, AdStockTransferStatus };
