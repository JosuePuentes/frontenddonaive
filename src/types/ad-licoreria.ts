/**
 * Modelos de dominio A&D Licorería & Bodegón.
 * Preparados para API + PostgreSQL + Prisma sin rehacer la UI.
 */

export type MoneyCurrency = "USD" | "BS";

export type AdPrice = {
  usd: number;
  bs: number;
};

export type AdRole =
  | "admin"
  | "supervisor"
  | "mesonera"
  | "cajero"
  | "inventario";

/** Permisos granulares (independientes del rol; roles otorgan defaults). */
export type AdPermission =
  | "pos.sell"
  | "pos.refund"
  | "pos.discount"
  | "pos.close_account"
  | "inventory.read"
  | "inventory.adjust"
  | "inventory.transfer"
  | "inventory.receive"
  | "purchase.create"
  | "purchase.approve"
  | "cop.read"
  | "cop.transfer"
  | "cop.purchase_request"
  | "reports.read"
  | "users.manage"
  | "deposits.manage"
  | "settings.manage"
  | "accounts.open"
  | "accounts.serve"
  | "tables.manage"
  | "clients.read"
  | "closures.create";

/** @deprecated preferir AdPermission — módulos UI legacy. */
export type AdModulePermission =
  | "ventas"
  | "cuentas"
  | "pagos"
  | "clientes"
  | "cierres_caja"
  | "mesas"
  | "servir"
  | "inventario"
  | "depositos"
  | "kardex"
  | "conteos"
  | "productos"
  | "reportes"
  | "configuracion"
  | "anulaciones"
  | "descuentos";

/** Mapa legado módulo ← rol (nav / compat). */
export const AD_ROLE_PERMISSIONS: Record<AdRole, AdModulePermission[]> = {
  admin: [
    "ventas",
    "cuentas",
    "pagos",
    "clientes",
    "cierres_caja",
    "mesas",
    "servir",
    "inventario",
    "depositos",
    "kardex",
    "conteos",
    "productos",
    "reportes",
    "configuracion",
    "anulaciones",
    "descuentos",
  ],
  supervisor: [
    "ventas",
    "cuentas",
    "pagos",
    "clientes",
    "cierres_caja",
    "mesas",
    "servir",
    "inventario",
    "depositos",
    "kardex",
    "conteos",
    "productos",
    "reportes",
    "anulaciones",
    "descuentos",
  ],
  cajero: [
    "ventas",
    "cuentas",
    "pagos",
    "clientes",
    "cierres_caja",
    "mesas",
    "reportes",
  ],
  mesonera: ["mesas", "cuentas", "servir"],
  inventario: ["inventario", "depositos", "kardex", "conteos", "productos"],
};

/**
 * Usuario operativo (futuro User + WarehouseUserAssignment).
 * Sin contraseñas en el mock — preparado para auth futura.
 */
export type AdOperator = {
  id: string;
  /** Login / handle único (sin password en mock). */
  username: string;
  name: string;
  phone?: string;
  role: AdRole;
  active: boolean;
  /**
   * Depósito asignado.
   * null = transversal (admin / inventario / supervisor).
   * Obligatorio para cajero/mesonera.
   */
  warehouseId?: string | null;
  posEnabled?: boolean;
  inventoryAccess?: boolean;
  copAccess?: boolean;
  purchaseAccess?: boolean;
  closuresAccess?: boolean;
  /** Permisos extra sobre el rol. */
  customPermissions?: AdPermission[];
  /** Permisos denegados explícitamente. */
  deniedPermissions?: AdPermission[];
  createdAt?: string;
};

export type AdCategory = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

export type AdProduct = {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  sku: string;
  barcode?: string;
  description?: string;
  baseUnitLabel: string;
  cost: AdPrice;
  minStockBase: number;
  active: boolean;
  createdAt: string;
};

export type AdPresentation = {
  id: string;
  productId: string;
  name: string;
  code?: string;
  /** Factor de conversión a unidad base (configurable). */
  unitsPerPresentation: number;
  price: AdPrice;
  minPrice?: AdPrice;
  maxPrice?: AdPrice;
  specialPrice?: AdPrice;
  sku?: string;
  barcode?: string;
  active: boolean;
};

export type AdWarehouse = {
  id: string;
  name: string;
  /** Código interno estable (ej. WH-001). */
  code: string;
  kind: "principal" | "barra" | "otro";
  active: boolean;
  responsibleUserId?: string | null;
};

export type AdInventoryItem = {
  productId: string;
  warehouseId: string;
  qtyBase: number;
};

export type AdInventoryMovementType =
  | "COMPRA"
  | "VENTA"
  | "TRASLADO_ENTRADA"
  | "TRASLADO_SALIDA"
  | "AJUSTE_ENTRADA"
  | "AJUSTE_SALIDA"
  | "DEVOLUCION"
  | "INVENTARIO_INICIAL"
  | "CONSUMO_CUENTA"
  | "CONTEO_FISICO"
  | "PERDIDA"
  | "ROTURA";

export type AdInventoryMovement = {
  id: string;
  type: AdInventoryMovementType;
  productId: string;
  presentationId?: string;
  qtyPresentation: number;
  qtyBase: number;
  warehouseId: string;
  warehouseFromId?: string;
  warehouseToId?: string;
  userName: string;
  reason?: string;
  reference?: string;
  createdAt: string;
};

export type AdSpaceType =
  | "mesa"
  | "barra"
  | "area"
  | "privado"
  | "terraza"
  | "otro";

export type AdTableStatus =
  | "disponible"
  | "ocupada"
  | "cuenta_abierta"
  | "cuenta_prepagada"
  | "reservada"
  | "cerrada";

export type AdTable = {
  id: string;
  number: string;
  /** Código operativo ej. MESA-01, BAR-01. */
  code?: string;
  label?: string;
  spaceType?: AdSpaceType;
  capacity: number;
  status: AdTableStatus;
  active: boolean;
  /** Depósito al que pertenece el espacio. */
  warehouseId?: string | null;
};

/** Código estable del método de pago. */
export type AdPaymentMethodCode =
  | "efectivo_usd"
  | "efectivo_bs"
  | "pago_movil"
  | "transferencia"
  | "zelle"
  | "tarjeta"
  | "qr"
  | "otro";

/** @deprecated usar AdPaymentMethodCode — alias de compatibilidad. */
export type AdPaymentMethod = AdPaymentMethodCode;

export type AdPaymentMethodConfig = {
  id: string;
  code: AdPaymentMethodCode;
  name: string;
  currency: MoneyCurrency;
  active: boolean;
  requiresReference: boolean;
  requiresVoucher: boolean;
  requiresBank: boolean;
  notes?: string;
};

export type AdPayment = {
  id: string;
  method: AdPaymentMethodCode;
  currency: MoneyCurrency;
  amount: number;
  bank?: string;
  reference?: string;
  originPhone?: string;
  voucherNote?: string;
  createdAt: string;
};

export type AdAccountStatus =
  | "ABIERTA"
  | "PREPAGADA"
  | "PARCIALMENTE_PAGADA"
  | "PAGADA"
  | "CERRADA"
  | "CANCELADA";

export type AdAccountItem = {
  id: string;
  productId: string;
  presentationId: string;
  /** Solicitadas. */
  qty: number;
  /** Servidas. */
  qtyServed: number;
  unitPrice: AdPrice;
  qtyBase: number;
};

export type AdAccount = {
  id: string;
  number: string;
  receiptNumber?: string;
  tableId?: string;
  mesoneraId?: string;
  mesoneraName?: string;
  cashierName?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  status: AdAccountStatus;
  prepaid: boolean;
  items: AdAccountItem[];
  payments: AdPayment[];
  discountUsd: number;
  discountBs: number;
  discountReason?: string;
  openedAt: string;
  closedAt?: string;
  closedBy?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  notes?: string;
  updatedAt: string;
};

export type AdPrepaidItem = {
  id: string;
  productId: string;
  presentationId: string;
  qtyPurchased: number;
  qtyConsumed: number;
  unitPrice: AdPrice;
  qtyBasePerUnit: number;
};

export type AdPrepaidStatus = "ACTIVO" | "AGOTADO" | "CERRADO" | "VENCIDO";

export type AdPrepaidAccount = {
  id: string;
  code: string;
  qrToken: string;
  receiptNumber?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  status: AdPrepaidStatus;
  items: AdPrepaidItem[];
  createdAt: string;
  updatedAt: string;
};

export type AdPrepaidConsumption = {
  id: string;
  prepaidId: string;
  productId: string;
  presentationId: string;
  qty: number;
  qtyBase: number;
  mesoneraName: string;
  createdAt: string;
};

export type AdQrReference = {
  token: string;
  kind: "prepaid" | "account" | "receipt";
  entityId: string;
  code: string;
};

export type AdCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  /** Nombre completo (derivado / display). */
  name: string;
  /** Obligatorio en flujo normal. */
  phone: string;
  documentId?: string;
  email?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
};

export type AdSaleItem = {
  productId: string;
  presentationId: string;
  qty: number;
  unitPrice: AdPrice;
  qtyBase: number;
};

export type AdSale = {
  id: string;
  receiptNumber: string;
  accountId?: string;
  tableId?: string;
  mesoneraId?: string;
  mesoneraName?: string;
  cashierName?: string;
  operatorId?: string;
  operatorRole?: AdRole;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: AdSaleItem[];
  payments: AdPayment[];
  subtotal: AdPrice;
  discountUsd: number;
  discountBs: number;
  total: AdPrice;
  warehouseId: string;
  userName: string;
  status: "completed" | "voided";
  voidReason?: string;
  notes?: string;
  createdAt: string;
};

export type AdReceipt = {
  id: string;
  number: string;
  kind: "sale" | "account" | "prepaid";
  saleId?: string;
  accountId?: string;
  prepaidId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  mesoneraName?: string;
  cashierName?: string;
  tableNumber?: string;
  items: {
    productName: string;
    presentationName: string;
    qty: number;
    qtyServed?: number;
    unitPrice: AdPrice;
    lineTotal: AdPrice;
  }[];
  payments: AdPayment[];
  subtotal: AdPrice;
  discountUsd: number;
  discountBs: number;
  total: AdPrice;
  paidUsd: number;
  paidBs: number;
  balanceUsd: number;
  notes?: string;
  createdAt: string;
};

export type AdPurchaseItem = {
  id: string;
  productId: string;
  presentationId: string;
  qty: number;
  qtyBase: number;
  unitCost: AdPrice;
  lineCost: AdPrice;
};

export type AdPurchase = {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  warehouseId: string;
  items: AdPurchaseItem[];
  totalCost: AdPrice;
  paymentMethod?: AdPaymentMethodCode;
  reference?: string;
  userName: string;
  createdAt: string;
  notes?: string;
};

export type AdDailyClosure = {
  id: string;
  date: string;
  warehouseId?: string;
  operatorId?: string;
  salesCount: number;
  totalUsd: number;
  totalBs: number;
  collectedUsd: number;
  collectedBs: number;
  pendingUsd: number;
  discountUsd: number;
  voidedCount: number;
  expectedCashUsd: number;
  countedCashUsd: number;
  cashDifferenceUsd: number;
  expectedCashBs: number;
  countedCashBs: number;
  cashDifferenceBs: number;
  openAccounts: number;
  closedAccounts: number;
  prepaidsActive: number;
  byMethod: Partial<
    Record<AdPaymentMethodCode, { usd: number; bs: number }>
  >;
  byMesonera: { name: string; salesCount: number; totalUsd: number }[];
  createdAt: string;
  createdBy: string;
  notes?: string;
};

export type AdInventoryClosureLine = {
  productId: string;
  warehouseId: string;
  theoreticalBase: number;
  physicalBase: number;
  differenceBase: number;
};

export type AdInventoryClosure = {
  id: string;
  warehouseId?: string;
  lines: AdInventoryClosureLine[];
  createdAt: string;
  createdBy: string;
  notes?: string;
};

export type AdAppSettings = {
  exchangeRateUsdToBs: number;
  suggestBsFromRate: boolean;
  brandName: string;
  brandTagline: string;
  whatsappEnabled: boolean;
};

export type AdServiceLog = {
  id: string;
  accountId?: string;
  prepaidId?: string;
  tableId?: string;
  productId: string;
  presentationId: string;
  qtyServed: number;
  qtyBase: number;
  mesoneraName: string;
  createdAt: string;
};

export type AdAuditEvent = {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userName: string;
  detail: string;
  beforeValue?: string;
  afterValue?: string;
  reason?: string;
  createdAt: string;
};

/** WhatsApp — arquitectura desacoplada (sin envío real). */
export type AdWhatsAppTemplateCode =
  | "purchase_thanks"
  | "pending_items"
  | "prepaid_balance"
  | "prepaid_consume"
  | "account_closed";

export type AdWhatsAppMessage = {
  id: string;
  toPhone: string;
  template: AdWhatsAppTemplateCode;
  body: string;
  customerId?: string;
  receiptNumber?: string;
  status: "queued" | "mock_sent" | "failed";
  createdAt: string;
};

export type AdWhatsAppTemplate = {
  code: AdWhatsAppTemplateCode;
  name: string;
  description: string;
};

export type AdWhatsAppLog = AdWhatsAppMessage;

/* ─── Fase 7: COP / disponibilidad / transferencias / documentos ─── */

export type AdStockTransferStatus =
  | "BORRADOR"
  | "SOLICITADA"
  | "AUTORIZADA"
  | "ENVIADA"
  | "RECIBIDA"
  | "CANCELADA";

export type AdStockTransferLine = {
  id: string;
  productId: string;
  presentationId: string;
  qty: number;
  qtyBase: number;
  observation?: string;
};

export type AdStockTransfer = {
  id: string;
  /** Provisional hasta confirmar; definitivo TR-YYYY-###### */
  number: string;
  provisional: boolean;
  fromWarehouseId: string;
  toWarehouseId: string;
  lines: AdStockTransferLine[];
  status: AdStockTransferStatus;
  reason?: string;
  notes?: string;
  createdBy: string;
  authorizedBy?: string;
  sentBy?: string;
  receivedBy?: string;
  cancelledBy?: string;
  /** Salida origen al pasar a ENVIADA */
  stockOutAt?: string;
  /** Entrada destino al pasar a RECIBIDA */
  stockInAt?: string;
  relatedAccountId?: string;
  relatedDraftId?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
};

export type AdPurchaseRequestStatus =
  | "SOLICITADA"
  | "APROBADA"
  | "ORDENADA"
  | "RECIBIDA"
  | "CANCELADA";

/** Solicitud de compra originada por faltante (pre-compra real). */
export type AdPurchaseRequest = {
  id: string;
  number: string;
  productId: string;
  presentationId: string;
  qty: number;
  qtyBase: number;
  warehouseId: string;
  status: AdPurchaseRequestStatus;
  /** Operación que originó la necesidad. */
  relatedAccountId?: string;
  relatedDraftId?: string;
  relatedTransferId?: string;
  reason: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Compromiso / obligación con cliente tras cerrar cuenta con pendiente.
 * NO bloquea disponibilidad operativa de ventas nuevas.
 */
export type AdCustomerCommitment = {
  id: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  accountId: string;
  accountNumber: string;
  productId: string;
  presentationId: string;
  qtyRemaining: number;
  qtyBaseRemaining: number;
  status: "PENDIENTE" | "CUMPLIDO" | "CANCELADO";
  createdAt: string;
  updatedAt: string;
};

export type AdWarehouseAvailability = {
  warehouseId: string;
  physical: number;
  committedActive: number;
  softReservedOutbound: number;
  availableOperational: number;
};

export type AdFulfillmentPlan = {
  needed: number;
  fromPreferred: number;
  transferSuggestion: number;
  transferFromId?: string;
  purchaseNeeded: number;
  shortfall: number;
  canFulfillFully: boolean;
};

export type AdOperationalAvailability = {
  productId: string;
  requestedBase: number;
  byWarehouse: AdWarehouseAvailability[];
  physicalTotal: number;
  committedActiveTotal: number;
  availableOperationalTotal: number;
  customerPendingBase: number;
  customerCommitmentDeficit: number;
  pendingTransfers: number;
  pendingPurchases: number;
  plan: AdFulfillmentPlan;
  status:
    | "OK"
    | "TRANSFER_NEEDED"
    | "PURCHASE_NEEDED"
    | "TRANSFER_AND_PURCHASE"
    | "COMMITMENT_DEFICIT";
};

export type AdInvoiceDraftStatus = "PRELIMINAR" | "CONFIRMADA" | "CANCELADA";

export type AdInvoiceDraft = {
  id: string;
  provisionalNumber: string;
  status: AdInvoiceDraftStatus;
  kind: "pos_sale" | "account_close";
  operatorId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerDocumentId?: string;
  tableId?: string;
  tableNumber?: string;
  mesoneraName?: string;
  cashierName: string;
  warehouseId: string;
  items: AdSaleItem[];
  payments: Omit<AdPayment, "id" | "createdAt">[];
  discountUsd: number;
  discountBs: number;
  discountReason?: string;
  notes?: string;
  /** Snapshot de alertas de abastecimiento al crear el preliminar. */
  supplyAlerts: {
    productId: string;
    productName: string;
    requestedBase: number;
    availableOperational: number;
    shortfall: number;
    availability: AdOperationalAvailability;
  }[];
  continueWithShortage: boolean;
  shortageDecision?: string;
  createdAt: string;
  confirmedAt?: string;
  receiptNumber?: string;
  saleId?: string;
};
