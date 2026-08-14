/**
 * Modelos de dominio A&D Licorería & Bodegón (Fase 2).
 * Preparados para conectar backend real sin rehacer la UI.
 */

export type MoneyCurrency = "USD" | "BS";

export type AdPrice = {
  usd: number;
  bs: number;
};

export type AdRole = "admin" | "mesonera" | "cajero" | "inventario";

export type AdOperator = {
  id: string;
  name: string;
  role: AdRole;
  active: boolean;
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
  /** Etiqueta de la unidad base (ej. unidad, botella). */
  baseUnitLabel: string;
  cost: AdPrice;
  minStockBase: number;
  active: boolean;
  createdAt: string;
};

/**
 * Presentación configurable: conversión a unidad base NO hardcodeada.
 * unitsPerPresentation = cuántas unidades base descuenta 1 presentación.
 */
export type AdPresentation = {
  id: string;
  productId: string;
  name: string;
  code?: string;
  unitsPerPresentation: number;
  price: AdPrice;
  specialPrice?: AdPrice;
  sku?: string;
  barcode?: string;
  active: boolean;
};

export type AdWarehouse = {
  id: string;
  name: string;
  code: string;
  kind: "principal" | "barra" | "otro";
  active: boolean;
};

/** Stock siempre en unidades base por producto y depósito. */
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
  | "CONTEO_FISICO";

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

export type AdTableStatus =
  | "disponible"
  | "ocupada"
  | "cuenta_abierta"
  | "cuenta_prepagada"
  | "cerrada";

export type AdTable = {
  id: string;
  number: string;
  label?: string;
  capacity: number;
  status: AdTableStatus;
  active: boolean;
};

export type AdPaymentMethod =
  | "efectivo_usd"
  | "efectivo_bs"
  | "transferencia"
  | "pago_movil"
  | "qr"
  | "otro";

export type AdPayment = {
  id: string;
  method: AdPaymentMethod;
  currency: MoneyCurrency;
  amount: number;
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
  /** Cantidad vendida/pedida en presentación. */
  qty: number;
  /** Ya servida (consumo parcial). */
  qtyServed: number;
  unitPrice: AdPrice;
  /** Equivalente en unidades base de qty. */
  qtyBase: number;
};

export type AdAccount = {
  id: string;
  number: string;
  tableId?: string;
  mesoneraId?: string;
  mesoneraName?: string;
  customerId?: string;
  customerName?: string;
  status: AdAccountStatus;
  prepaid: boolean;
  items: AdAccountItem[];
  payments: AdPayment[];
  openedAt: string;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
  updatedAt: string;
};

/** Línea de prepago multiproducto. */
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
  /** Token opaco para QR (no embebe datos sensibles). */
  qrToken: string;
  customerId?: string;
  customerName?: string;
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
  kind: "prepaid" | "account";
  entityId: string;
  code: string;
};

export type AdCustomer = {
  id: string;
  name: string;
  phone?: string;
  documentId?: string;
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
  accountId?: string;
  tableId?: string;
  mesoneraName?: string;
  customerName?: string;
  items: AdSaleItem[];
  payments: AdPayment[];
  subtotal: AdPrice;
  total: AdPrice;
  warehouseId: string;
  userName: string;
  status: "completed" | "voided";
  createdAt: string;
};

export type AdDailyClosure = {
  id: string;
  date: string;
  salesCount: number;
  totalUsd: number;
  totalBs: number;
  openAccounts: number;
  closedAccounts: number;
  prepaidsActive: number;
  byMethod: Partial<Record<AdPaymentMethod, { usd: number; bs: number }>>;
  byMesonera: { name: string; salesCount: number; totalUsd: number }[];
  createdAt: string;
  createdBy: string;
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
  /** Si true, sugerir Bs = USD × tasa al editar (nunca forzar). */
  suggestBsFromRate: boolean;
  brandName: string;
  brandTagline: string;
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
  createdAt: string;
};
