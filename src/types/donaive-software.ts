/** Tipos Donaive Software — usuarios, roles y permisos (offline-first). */

export type DsRole =
  | "admin"
  | "supervisor"
  | "cajero"
  | "inventario"
  | "finanzas";

export type DsPermission =
  | "pos.sell"
  | "pos.refund"
  | "pos.discount"
  | "pos.closures"
  | "inventory.read"
  | "inventory.adjust"
  | "inventory.products"
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
  | "analysis.view"
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
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  currency: "USD" | "BS";
  invoiceRate?: number;
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
