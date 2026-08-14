/**
 * Modelo de dominio A&D Licorería & Bodegón.
 * Inventario siempre en unidad base; presentaciones convierten a base.
 */

export type MoneyCurrency = "USD" | "BS";

export type AdPrice = {
  usd: number;
  bs: number;
};

export type AdProductCategory =
  | "cerveza"
  | "licor"
  | "whisky"
  | "ron"
  | "vodka"
  | "ginebra"
  | "refresco"
  | "agua"
  | "hielo"
  | "snack"
  | "alimento"
  | "bodegon"
  | "otro";

export type AdProduct = {
  id: string;
  name: string;
  brand: string;
  category: AdProductCategory;
  sku: string;
  barcode?: string;
  description?: string;
  /** Nombre de la unidad base (ej. "cerveza", "botella", "unidad"). */
  baseUnitLabel: string;
  cost: AdPrice;
  active: boolean;
  createdAt: string;
};

export type AdPresentation = {
  id: string;
  productId: string;
  name: string;
  /** Cantidad de unidades base que representa esta presentación. */
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
export type AdStockBalance = {
  productId: string;
  warehouseId: string;
  qtyBase: number;
};

export type AdInventoryMovementType =
  | "entrada"
  | "venta"
  | "consumo"
  | "traslado"
  | "ajuste_positivo"
  | "ajuste_negativo"
  | "merma"
  | "devolucion"
  | "recepcion"
  | "inventario_fisico";

export type AdInventoryMovement = {
  id: string;
  type: AdInventoryMovementType;
  productId: string;
  presentationId?: string;
  /** Cantidad en la presentación seleccionada (si aplica). */
  qtyPresentation: number;
  /** Equivalente en unidades base (obligatorio). */
  qtyBase: number;
  warehouseFromId?: string;
  warehouseToId?: string;
  userName: string;
  reason?: string;
  reference?: string;
  createdAt: string;
};

export type AdPaymentMethod =
  | "efectivo_usd"
  | "efectivo_bs"
  | "pago_movil"
  | "transferencia"
  | "zelle"
  | "punto_venta"
  | "qr"
  | "otro";

export type AdPaymentLine = {
  method: AdPaymentMethod;
  currency: MoneyCurrency;
  amount: number;
};

export type AdSaleLine = {
  productId: string;
  presentationId: string;
  qty: number;
  unitPrice: AdPrice;
  qtyBase: number;
};

export type AdSale = {
  id: string;
  lines: AdSaleLine[];
  payments: AdPaymentLine[];
  subtotal: AdPrice;
  total: AdPrice;
  warehouseId: string;
  userName: string;
  status: "completed" | "voided";
  createdAt: string;
};

export type AdTableStatus = "libre" | "ocupada" | "cuenta_abierta" | "cerrada";

export type AdTable = {
  id: string;
  number: string;
  label?: string;
  capacity: number;
  status: AdTableStatus;
  active: boolean;
};

export type AdAccountStatus = "abierta" | "cerrada" | "prepago_activa" | "anulada";

export type AdAccountLine = {
  productId: string;
  presentationId: string;
  /** Unidades pagadas (en presentación). */
  qtyPaid: number;
  /** Unidades ya servidas (en presentación). */
  qtyServed: number;
  unitPrice: AdPrice;
};

export type AdCustomer = {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  active: boolean;
};

export type AdAccount = {
  id: string;
  number: string;
  tableId?: string;
  mesoneraName?: string;
  customerId?: string;
  customerName?: string;
  status: AdAccountStatus;
  prepaid: boolean;
  lines: AdAccountLine[];
  /** Token opaco para QR (no datos sensibles). */
  qrToken: string;
  createdAt: string;
  updatedAt: string;
};

export type AdServiceLog = {
  id: string;
  accountId: string;
  tableId?: string;
  productId: string;
  presentationId: string;
  qtyServed: number;
  qtyBase: number;
  mesoneraName: string;
  createdAt: string;
};

export type AdCashSession = {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingFloatUsd: number;
  openingFloatBs: number;
  status: "open" | "closed";
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
