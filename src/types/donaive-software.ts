/** Tipos Donaive Software — usuarios, roles y permisos (offline-first). */

export type DsRole =
  | "admin"
  | "supervisor"
  | "cajero"
  | "inventario"
  | "finanzas"
  | "presidente";

export type DsPermission =
  | "pos.sell"
  | "pos.refund"
  | "pos.discount"
  | "pos.closures"
  | "inventory.read"
  | "inventory.adjust"
  | "inventory.products"
  | "inventory.movements"
  | "purchases.create"
  | "purchases.manage"
  | "purchases.approve"
  | "clients.read"
  | "clients.manage"
  | "suppliers.manage"
  | "finance.rates"
  | "finance.cpp"
  | "finance.accounts"
  | "finance.manage"
  | "reports.read"
  | "reports.daily"
  | "analysis.view"
  | "planning.view"
  | "president.view"
  | "inventory.master.view"
  | "inventory.general.view"
  | "inventory.general.export"
  | "pos.fiscal"
  | "users.manage"
  | "settings.manage"
  | "license.manage";

export type DsUser = {
  id: string;
  username: string;
  name: string;
  role: DsRole;
  active: boolean;
  /** Hash local (no texto plano). */
  passwordHash: string;
  /** Permisos explícitos; si existe, reemplaza defaults del rol. */
  customPermissions?: DsPermission[];
  /** Quita permisos aunque el rol los tenga. */
  deniedPermissions?: DsPermission[];
  createdAt: string;
  updatedAt: string;
};

export type DsSession = {
  userId: string;
  username: string;
  name: string;
  role: DsRole;
  loggedInAt: string;
  /** Usuario presidente validado en servidor Donaive (no local). */
  remotePresident?: boolean;
};

/** Producto con stock y CPP en unidades base. */
export type DsProduct = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  unitsPerBox: number;
  taxable: boolean;
  utilityPercent: number;
  stock: { qtyBase: number; unitCostUsd: number };
  saleUnitUsd?: number;
  saleBoxUsd?: number;
  /** Calculado por algoritmo (no editar manual). */
  minQtyBase?: number;
  maxQtyBase?: number;
  preferredSupplierId?: string;
};

export type DsPurchaseLine = {
  key: string;
  productId: string;
  productLabel: string;
  sku: string;
  unitsPerBox: number;
  buyMode: "UNIT" | "BOX";
  qty: number;
  qtyBonus: number;
  costMode: "UNIT" | "PRESENTATION" | "TOTAL";
  unitCost: number;
  presentationCost: number;
  lineTotal: number;
  taxable: boolean;
  utilityPercent: number;
};

export type DsExtraInvoiceTax = {
  id: string;
  name: string;
  amountBs: number;
  allocateToCost: boolean;
};

export type DsPurchase = {
  id: string;
  supplierId?: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  currency: "USD" | "BS";
  invoiceRate?: number;
  paymentCondition: "CONTADO" | "CREDITO";
  creditDays?: number;
  dueDate?: string;
  extraTaxes: DsExtraInvoiceTax[];
  lines: DsPurchaseLine[];
  notes?: string;
  subtotal: number;
  tax: number;
  extraTaxesTotal: number;
  extraTaxesTotalBs: number;
  grandTotal: number;
  createdAt: string;
  createdBy?: string;
};

export type DsClient = {
  id: string;
  name: string;
  phone?: string;
  documentId?: string;
  email?: string;
  address?: string;
  creditLimitUsd: number;
  creditDays: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DsSupplier = {
  id: string;
  name: string;
  identification?: string;
  phone?: string;
  contactName?: string;
  defaultCurrency: "USD" | "BS";
  creditDays: number;
  creditLimit: number;
  /** Días de despacho / entrega del proveedor. */
  leadTimeDays: number;
  /** Productos que vende este proveedor. */
  productIds: string[];
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DsStockUrgency = "CRITICAL" | "BUY" | "OK" | "OVER";

export type DsAccountPayment = {
  id: string;
  amount: number;
  paidAt: string;
  method?: string;
  reference?: string;
  note?: string;
  bankId?: string;
};

export type DsAccountStatus =
  | "PENDIENTE"
  | "PARCIAL"
  | "PAGADA"
  | "VENCIDA"
  | "ANULADA";

export type DsPayable = {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseId?: string;
  invoiceNumber: string;
  currency: "USD" | "BS";
  amount: number;
  paidAmount: number;
  balance: number;
  dueDate?: string;
  status: DsAccountStatus;
  issuedAt: string;
  payments: DsAccountPayment[];
  notes?: string;
};

export type DsReceivable = {
  id: string;
  clientId: string;
  clientName: string;
  saleId?: string;
  concept: string;
  currency: "USD" | "BS";
  amount: number;
  paidAmount: number;
  balance: number;
  dueDate?: string;
  status: DsAccountStatus;
  issuedAt: string;
  payments: DsAccountPayment[];
  notes?: string;
};

export type DsPaymentMethod =
  | "efectivo_usd"
  | "efectivo_bs"
  | "pago_movil"
  | "transferencia"
  | "zelle"
  | "tarjeta"
  | "otro";

export type DsPayment = {
  method: DsPaymentMethod;
  currency: "USD" | "BS";
  amount: number;
  reference?: string;
  bankId?: string;
};

export type DsChangeLine = {
  currency: "USD" | "BS";
  amount: number;
};

export type DsBank = {
  id: string;
  name: string;
  currency: "USD" | "BS";
  paymentMethods: DsPaymentMethod[];
  active: boolean;
  createdAt: string;
};

export type DsBankMovementKind = "INCOME" | "OUTCOME";

export type DsBankMovement = {
  id: string;
  bankId: string;
  kind: DsBankMovementKind;
  amount: number;
  amountUsd: number;
  amountBs: number;
  method?: DsPaymentMethod;
  reference: string;
  note: string;
  createdAt: string;
  operatorId?: string;
};

export type DsCashSession = {
  id: string;
  registerId: string;
  registerName: string;
  shiftNumber: number;
  openedAt: string;
  openedBy: string;
  closedAt?: string;
  closedBy?: string;
  openingCashUsd: number;
  openingCashBs: number;
  closingCashUsd?: number;
  closingCashBs?: number;
  status: "open" | "closed";
  saleIds: string[];
  notes?: string;
};

export type DsSaleLine = {
  key: string;
  productId: string;
  productLabel: string;
  sku: string;
  sellMode: "UNIT" | "BOX";
  qty: number;
  qtyBase: number;
  unitPriceUsd: number;
  unitPriceBs: number;
  lineTotalUsd: number;
  lineTotalBs: number;
  unitCostUsd: number;
};

export type DsSale = {
  id: string;
  receiptNumber: string;
  lines: DsSaleLine[];
  payments: DsPayment[];
  totalUsd: number;
  totalBs: number;
  bcvRateAtSale: number;
  saleKind?: "NORMAL" | "FISCAL";
  fiscalPrinter?: "printer_1" | "printer_2";
  status: "completed" | "voided";
  createdAt: string;
  createdBy?: string;
  operatorId?: string;
  clientId?: string;
  clientName?: string;
  clientDocument?: string;
  change?: DsChangeLine[];
  creditUsdRemaining?: number;
  returnedAt?: string;
  originSaleId?: string;
  creditAppliedUsd?: number;
  sessionId?: string;
  registerId?: string;
};

export type DsCashClosure = {
  id: string;
  date: string;
  salesCount: number;
  voidedCount: number;
  totalUsd: number;
  totalBs: number;
  byMethod: Record<string, { usd: number; bs: number }>;
  expectedCashUsd: number;
  expectedCashBs: number;
  countedCashUsd: number;
  countedCashBs: number;
  diffUsd: number;
  diffBs: number;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  operatorId?: string;
};

export type DsStockMovement = {
  id: string;
  type: "VENTA" | "COMPRA" | "AJUSTE" | "DEVOLUCION";
  productId: string;
  productLabel: string;
  qtyBase: number;
  unitCostUsd?: number;
  note?: string;
  refId?: string;
  saleKind?: "NORMAL" | "FISCAL";
  createdAt: string;
  createdBy?: string;
};

export type DsGeneralInventoryMovement = {
  id: string;
  productId: string;
  productLabel: string;
  qtyBase: number;
  reason: "COMPRA" | "VENTA_FISCAL" | "AJUSTE" | "DEVOLUCION";
  refId?: string;
  createdAt: string;
  createdBy?: string;
};

export type DsGeneralInventoryState = {
  stockByProduct: Record<string, number>;
  movements: DsGeneralInventoryMovement[];
};

export type DsFiscalSettings = {
  pinHash: string | null;
  updatedAt: string;
};
