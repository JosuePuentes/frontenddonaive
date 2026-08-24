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
