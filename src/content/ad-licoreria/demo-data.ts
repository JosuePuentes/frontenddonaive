/**
 * Estado mock mínimo A&D — sin productos, stock ni usuarios de prueba.
 * Solo estructura base (admin, depósitos, categorías, métodos de pago).
 */
import type {
  AdAccount,
  AdAppSettings,
  AdAuditEvent,
  AdCategory,
  AdCustomer,
  AdDailyClosure,
  AdInventoryClosure,
  AdInventoryItem,
  AdInventoryMovement,
  AdOperator,
  AdPaymentMethodConfig,
  AdPrepaidAccount,
  AdPrepaidConsumption,
  AdPresentation,
  AdProduct,
  AdPurchase,
  AdReceipt,
  AdSale,
  AdServiceLog,
  AdTable,
  AdWarehouse,
  AdWhatsAppLog,
} from "@/types/ad-licoreria";

const now = () => new Date().toISOString();

export const AD_DEMO_SETTINGS: AdAppSettings = {
  exchangeRateUsdToBs: 370,
  suggestBsFromRate: true,
  brandName: "A&D",
  brandTagline: "LICORERÍA & BODEGÓN",
  whatsappEnabled: false,
};

export const AD_DEMO_PAYMENT_METHODS: AdPaymentMethodConfig[] = [
  {
    id: "pm-cash-usd",
    code: "efectivo_usd",
    name: "Efectivo USD",
    currency: "USD",
    active: true,
    requiresReference: false,
    requiresVoucher: false,
    requiresBank: false,
  },
  {
    id: "pm-cash-bs",
    code: "efectivo_bs",
    name: "Efectivo Bs",
    currency: "BS",
    active: true,
    requiresReference: false,
    requiresVoucher: false,
    requiresBank: false,
  },
  {
    id: "pm-pago-movil",
    code: "pago_movil",
    name: "Pago móvil",
    currency: "BS",
    active: true,
    requiresReference: true,
    requiresVoucher: false,
    requiresBank: true,
  },
  {
    id: "pm-transfer",
    code: "transferencia",
    name: "Transferencia",
    currency: "BS",
    active: true,
    requiresReference: true,
    requiresVoucher: true,
    requiresBank: true,
  },
  {
    id: "pm-zelle",
    code: "zelle",
    name: "Zelle",
    currency: "USD",
    active: true,
    requiresReference: true,
    requiresVoucher: false,
    requiresBank: false,
  },
];

/** Solo admin inicial; demás usuarios se crean en Configuración → Usuarios. */
export const AD_DEMO_OPERATORS: AdOperator[] = [
  {
    id: "op-admin",
    username: "admin",
    name: "Admin A&D",
    role: "admin",
    active: true,
    warehouseId: null,
    posEnabled: false,
    inventoryAccess: true,
    copAccess: true,
    purchaseAccess: true,
    closuresAccess: true,
    mockCredential: "AdDemo#2026",
    createdAt: now(),
  },
];

export const AD_DEMO_CATEGORIES: AdCategory[] = [
  { id: "cat-cerveza", name: "Cervezas", slug: "cervezas", active: true },
  { id: "cat-licor", name: "Licores", slug: "licores", active: true },
  { id: "cat-ron", name: "Ron", slug: "ron", active: true },
  { id: "cat-refresco", name: "Refrescos", slug: "refrescos", active: true },
  { id: "cat-agua", name: "Agua", slug: "agua", active: true },
  { id: "cat-otro", name: "Otros", slug: "otros", active: true },
];

export const AD_DEMO_WAREHOUSES: AdWarehouse[] = [
  {
    id: "wh-1",
    name: "Bodegón",
    code: "BOD",
    kind: "principal",
    active: true,
  },
  {
    id: "wh-2",
    name: "Licorería",
    code: "LIC",
    kind: "principal",
    active: true,
  },
];

export const AD_DEMO_PRODUCTS: AdProduct[] = [];
export const AD_DEMO_PRESENTATIONS: AdPresentation[] = [];
export const AD_DEMO_INVENTORY: AdInventoryItem[] = [];
export const AD_DEMO_TABLES: AdTable[] = [];
export const AD_DEMO_CUSTOMERS: AdCustomer[] = [];
export const AD_DEMO_ACCOUNTS: AdAccount[] = [];
export const AD_DEMO_PREPAIDS: AdPrepaidAccount[] = [];
export const AD_DEMO_PREPAID_CONSUMPTIONS: AdPrepaidConsumption[] = [];
export const AD_DEMO_MOVEMENTS: AdInventoryMovement[] = [];
export const AD_DEMO_SALES: AdSale[] = [];
export const AD_DEMO_RECEIPTS: AdReceipt[] = [];
export const AD_DEMO_PURCHASES: AdPurchase[] = [];
export const AD_DEMO_WHATSAPP_LOGS: AdWhatsAppLog[] = [];
export const AD_DEMO_SERVICE_LOGS: AdServiceLog[] = [];
export const AD_DEMO_DAILY_CLOSURES: AdDailyClosure[] = [];
export const AD_DEMO_INVENTORY_CLOSURES: AdInventoryClosure[] = [];
export const AD_DEMO_AUDIT: AdAuditEvent[] = [];
