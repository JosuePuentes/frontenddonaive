/**
 * Seed mock A&D — separado de la UI y de cualquier API real.
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
  AdPrepaidAccount,
  AdPrepaidConsumption,
  AdPresentation,
  AdProduct,
  AdSale,
  AdServiceLog,
  AdTable,
  AdWarehouse,
} from "@/types/ad-licoreria";

const now = () => new Date().toISOString();

export const AD_DEMO_SETTINGS: AdAppSettings = {
  exchangeRateUsdToBs: 370,
  suggestBsFromRate: true,
  brandName: "A&D",
  brandTagline: "LICORERÍA & BODEGÓN",
};

export const AD_DEMO_OPERATORS: AdOperator[] = [
  { id: "op-admin", name: "Admin A&D", role: "admin", active: true },
  { id: "op-maria", name: "María", role: "mesonera", active: true },
  { id: "op-carlos", name: "Carlos", role: "mesonera", active: true },
  { id: "op-caja", name: "Cajero", role: "cajero", active: true },
  { id: "op-inv", name: "Inventario", role: "inventario", active: true },
];

export const AD_DEMO_CATEGORIES: AdCategory[] = [
  { id: "cat-cerveza", name: "Cervezas", slug: "cervezas", active: true },
  { id: "cat-licor", name: "Licores", slug: "licores", active: true },
  { id: "cat-whisky", name: "Whisky", slug: "whisky", active: true },
  { id: "cat-ron", name: "Ron", slug: "ron", active: true },
  { id: "cat-vodka", name: "Vodka", slug: "vodka", active: true },
  { id: "cat-ginebra", name: "Ginebra", slug: "ginebra", active: true },
  { id: "cat-tequila", name: "Tequila", slug: "tequila", active: true },
  { id: "cat-vino", name: "Vinos", slug: "vinos", active: true },
  { id: "cat-refresco", name: "Refrescos", slug: "refrescos", active: true },
  { id: "cat-agua", name: "Agua", slug: "agua", active: true },
  { id: "cat-hielo", name: "Hielo", slug: "hielo", active: true },
  { id: "cat-snack", name: "Snacks", slug: "snacks", active: true },
  { id: "cat-comida", name: "Comida", slug: "comida", active: true },
  { id: "cat-otro", name: "Otros", slug: "otros", active: true },
];

export const AD_DEMO_WAREHOUSES: AdWarehouse[] = [
  {
    id: "wh-1",
    name: "Depósito 1",
    code: "DEP1",
    kind: "principal",
    active: true,
  },
  {
    id: "wh-2",
    name: "Depósito 2 / Barra",
    code: "DEP2",
    kind: "barra",
    active: true,
  },
];

export const AD_DEMO_PRODUCTS: AdProduct[] = [
  {
    id: "prod-regional",
    name: "Cerveza Regional",
    brand: "Regional",
    categoryId: "cat-cerveza",
    sku: "CER-REG",
    barcode: "7591001000100",
    description: "Cerveza Regional",
    baseUnitLabel: "unidad",
    cost: { usd: 0.5, bs: 185 },
    minStockBase: 48,
    active: true,
    createdAt: now(),
  },
  {
    id: "prod-polar",
    name: "Cerveza Polar",
    brand: "Polar",
    categoryId: "cat-cerveza",
    sku: "CER-POLAR",
    baseUnitLabel: "unidad",
    cost: { usd: 0.55, bs: 200 },
    minStockBase: 36,
    active: true,
    createdAt: now(),
  },
  {
    id: "prod-ron",
    name: "Ron Santa Teresa Gran Reserva",
    brand: "Santa Teresa",
    categoryId: "cat-ron",
    sku: "RON-ST-GR",
    baseUnitLabel: "botella",
    cost: { usd: 12, bs: 4440 },
    minStockBase: 6,
    active: true,
    createdAt: now(),
  },
  {
    id: "prod-refresco",
    name: "Refresco 1.5L",
    brand: "Pepsi",
    categoryId: "cat-refresco",
    sku: "REF-15",
    baseUnitLabel: "unidad",
    cost: { usd: 0.9, bs: 330 },
    minStockBase: 12,
    active: true,
    createdAt: now(),
  },
  {
    id: "prod-agua",
    name: "Agua mineral 600ml",
    brand: "Minalba",
    categoryId: "cat-agua",
    sku: "AGU-600",
    baseUnitLabel: "unidad",
    cost: { usd: 0.3, bs: 110 },
    minStockBase: 24,
    active: true,
    createdAt: now(),
  },
];

/** Conversiones configurables (no hardcodeadas en lógica de negocio). */
export const AD_DEMO_PRESENTATIONS: AdPresentation[] = [
  {
    id: "pres-reg-1",
    productId: "prod-regional",
    name: "Individual",
    code: "REG-1",
    unitsPerPresentation: 1,
    price: { usd: 1, bs: 370 },
    active: true,
  },
  {
    id: "pres-reg-balde",
    productId: "prod-regional",
    name: "Balde",
    code: "REG-BALDE",
    unitsPerPresentation: 10,
    price: { usd: 5, bs: 1850 },
    active: true,
  },
  {
    id: "pres-reg-caja",
    productId: "prod-regional",
    name: "Caja",
    code: "REG-CAJA",
    unitsPerPresentation: 36,
    price: { usd: 28, bs: 10360 },
    active: true,
  },
  {
    id: "pres-polar-1",
    productId: "prod-polar",
    name: "Individual",
    unitsPerPresentation: 1,
    price: { usd: 1, bs: 370 },
    active: true,
  },
  {
    id: "pres-polar-balde",
    productId: "prod-polar",
    name: "Balde",
    unitsPerPresentation: 6,
    price: { usd: 5, bs: 1850 },
    active: true,
  },
  {
    id: "pres-polar-caja",
    productId: "prod-polar",
    name: "Caja",
    unitsPerPresentation: 36,
    price: { usd: 28, bs: 10360 },
    active: true,
  },
  {
    id: "pres-ron-1",
    productId: "prod-ron",
    name: "Botella 750ml",
    unitsPerPresentation: 1,
    price: { usd: 22, bs: 8140 },
    active: true,
  },
  {
    id: "pres-ref-1",
    productId: "prod-refresco",
    name: "Unidad",
    unitsPerPresentation: 1,
    price: { usd: 1.5, bs: 555 },
    active: true,
  },
  {
    id: "pres-agua-1",
    productId: "prod-agua",
    name: "Unidad",
    unitsPerPresentation: 1,
    price: { usd: 0.6, bs: 220 },
    active: true,
  },
];

export const AD_DEMO_INVENTORY: AdInventoryItem[] = [
  { productId: "prod-regional", warehouseId: "wh-1", qtyBase: 1000 },
  { productId: "prod-regional", warehouseId: "wh-2", qtyBase: 120 },
  { productId: "prod-polar", warehouseId: "wh-1", qtyBase: 800 },
  { productId: "prod-polar", warehouseId: "wh-2", qtyBase: 90 },
  { productId: "prod-ron", warehouseId: "wh-1", qtyBase: 40 },
  { productId: "prod-ron", warehouseId: "wh-2", qtyBase: 8 },
  { productId: "prod-refresco", warehouseId: "wh-1", qtyBase: 200 },
  { productId: "prod-refresco", warehouseId: "wh-2", qtyBase: 40 },
  { productId: "prod-agua", warehouseId: "wh-1", qtyBase: 300 },
  { productId: "prod-agua", warehouseId: "wh-2", qtyBase: 50 },
];

export const AD_DEMO_TABLES: AdTable[] = [
  { id: "mesa-1", number: "1", capacity: 4, status: "disponible", active: true },
  { id: "mesa-2", number: "2", capacity: 4, status: "ocupada", active: true },
  {
    id: "mesa-3",
    number: "3",
    capacity: 6,
    status: "cuenta_abierta",
    active: true,
  },
  {
    id: "mesa-12",
    number: "12",
    capacity: 8,
    status: "cuenta_prepagada",
    active: true,
  },
  { id: "mesa-18", number: "18", capacity: 4, status: "disponible", active: true },
];

export const AD_DEMO_CUSTOMERS: AdCustomer[] = [
  {
    id: "cli-1",
    name: "Juan Pérez",
    phone: "0414-0000000",
    documentId: "V-12345678",
    notes: "Cliente frecuente — prepago cerveza",
    active: true,
    createdAt: now(),
  },
  {
    id: "cli-2",
    name: "Eventos Corporativos",
    phone: "0424-1111111",
    notes: "Pedidos por caja",
    active: true,
    createdAt: now(),
  },
];

export const AD_DEMO_ACCOUNTS: AdAccount[] = [
  {
    id: "acc-184",
    number: "000184",
    tableId: "mesa-12",
    mesoneraId: "op-maria",
    mesoneraName: "María",
    customerId: "cli-1",
    customerName: "Juan Pérez",
    status: "PREPAGADA",
    prepaid: true,
    items: [
      {
        id: "acci-1",
        productId: "prod-regional",
        presentationId: "pres-reg-1",
        qty: 20,
        qtyServed: 5,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: 20,
      },
    ],
    payments: [
      {
        id: "pay-1",
        method: "efectivo_usd",
        currency: "USD",
        amount: 20,
        createdAt: now(),
      },
    ],
    openedAt: now(),
    updatedAt: now(),
  },
  {
    id: "acc-185",
    number: "000185",
    tableId: "mesa-3",
    mesoneraId: "op-carlos",
    mesoneraName: "Carlos",
    status: "ABIERTA",
    prepaid: false,
    items: [
      {
        id: "acci-2",
        productId: "prod-polar",
        presentationId: "pres-polar-1",
        qty: 8,
        qtyServed: 8,
        unitPrice: { usd: 1, bs: 370 },
        qtyBase: 8,
      },
    ],
    payments: [],
    openedAt: now(),
    updatedAt: now(),
  },
];

export const AD_DEMO_PREPAIDS: AdPrepaidAccount[] = [
  {
    id: "pp-125",
    code: "A&D-2026-000125",
    qrToken: "ad_qr_pp_000125_x7k9m2",
    customerId: "cli-1",
    customerName: "Juan Pérez",
    status: "ACTIVO",
    items: [
      {
        id: "ppi-1",
        productId: "prod-regional",
        presentationId: "pres-reg-1",
        qtyPurchased: 20,
        qtyConsumed: 11,
        unitPrice: { usd: 1, bs: 370 },
        qtyBasePerUnit: 1,
      },
      {
        id: "ppi-2",
        productId: "prod-refresco",
        presentationId: "pres-ref-1",
        qtyPurchased: 3,
        qtyConsumed: 1,
        unitPrice: { usd: 1.5, bs: 555 },
        qtyBasePerUnit: 1,
      },
      {
        id: "ppi-3",
        productId: "prod-agua",
        presentationId: "pres-agua-1",
        qtyPurchased: 2,
        qtyConsumed: 2,
        unitPrice: { usd: 0.6, bs: 220 },
        qtyBasePerUnit: 1,
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
];

export const AD_DEMO_PREPAID_CONSUMPTIONS: AdPrepaidConsumption[] = [
  {
    id: "ppc-1",
    prepaidId: "pp-125",
    productId: "prod-regional",
    presentationId: "pres-reg-1",
    qty: 4,
    qtyBase: 4,
    mesoneraName: "María",
    createdAt: now(),
  },
  {
    id: "ppc-2",
    prepaidId: "pp-125",
    productId: "prod-regional",
    presentationId: "pres-reg-1",
    qty: 7,
    qtyBase: 7,
    mesoneraName: "María",
    createdAt: now(),
  },
  {
    id: "ppc-3",
    prepaidId: "pp-125",
    productId: "prod-refresco",
    presentationId: "pres-ref-1",
    qty: 1,
    qtyBase: 1,
    mesoneraName: "Carlos",
    createdAt: now(),
  },
  {
    id: "ppc-4",
    prepaidId: "pp-125",
    productId: "prod-agua",
    presentationId: "pres-agua-1",
    qty: 2,
    qtyBase: 2,
    mesoneraName: "María",
    createdAt: now(),
  },
];

export const AD_DEMO_MOVEMENTS: AdInventoryMovement[] = [
  {
    id: "mov-1",
    type: "TRASLADO_SALIDA",
    productId: "prod-regional",
    presentationId: "pres-reg-1",
    qtyPresentation: 100,
    qtyBase: 100,
    warehouseId: "wh-1",
    warehouseFromId: "wh-1",
    warehouseToId: "wh-2",
    userName: "Admin A&D",
    reason: "Reposición Depósito 2",
    createdAt: now(),
  },
  {
    id: "mov-2",
    type: "TRASLADO_ENTRADA",
    productId: "prod-regional",
    presentationId: "pres-reg-1",
    qtyPresentation: 100,
    qtyBase: 100,
    warehouseId: "wh-2",
    warehouseFromId: "wh-1",
    warehouseToId: "wh-2",
    userName: "Admin A&D",
    reason: "Reposición Depósito 2",
    createdAt: now(),
  },
];

export const AD_DEMO_SALES: AdSale[] = [];
export const AD_DEMO_SERVICE_LOGS: AdServiceLog[] = [];
export const AD_DEMO_DAILY_CLOSURES: AdDailyClosure[] = [];
export const AD_DEMO_INVENTORY_CLOSURES: AdInventoryClosure[] = [];

export const AD_DEMO_AUDIT: AdAuditEvent[] = [
  {
    id: "aud-1",
    action: "traslado",
    entity: "inventario",
    entityId: "mov-1",
    userName: "Admin A&D",
    detail: "100 Regional: DEP1 → DEP2",
    createdAt: now(),
  },
];
