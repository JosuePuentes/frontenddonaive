import type {
  AdAccount,
  AdAuditEvent,
  AdCashSession,
  AdCustomer,
  AdInventoryMovement,
  AdPresentation,
  AdProduct,
  AdSale,
  AdServiceLog,
  AdStockBalance,
  AdTable,
  AdWarehouse,
} from "@/types/ad-licoreria";

const now = () => new Date().toISOString();

export const AD_DEMO_WAREHOUSES: AdWarehouse[] = [
  {
    id: "wh-principal",
    name: "Depósito principal",
    code: "PRINCIPAL",
    kind: "principal",
    active: true,
  },
  {
    id: "wh-barra",
    name: "Depósito barra / venta",
    code: "BARRA",
    kind: "barra",
    active: true,
  },
];

export const AD_DEMO_PRODUCTS: AdProduct[] = [
  {
    id: "prod-polar",
    name: "Cerveza Polar",
    brand: "Polar",
    category: "cerveza",
    sku: "CER-POLAR",
    barcode: "7591001000011",
    description: "Cerveza Polar Pilsen",
    baseUnitLabel: "cerveza",
    cost: { usd: 0.55, bs: 55 },
    active: true,
    createdAt: now(),
  },
  {
    id: "prod-ron",
    name: "Ron Santa Teresa Gran Reserva",
    brand: "Santa Teresa",
    category: "ron",
    sku: "RON-ST-GR",
    baseUnitLabel: "botella",
    cost: { usd: 12, bs: 1200 },
    active: true,
    createdAt: now(),
  },
  {
    id: "prod-agua",
    name: "Agua mineral 600ml",
    brand: "Minalba",
    category: "agua",
    sku: "AGU-600",
    baseUnitLabel: "unidad",
    cost: { usd: 0.3, bs: 30 },
    active: true,
    createdAt: now(),
  },
  {
    id: "prod-snack",
    name: "Doritos Nacho",
    brand: "Doritos",
    category: "snack",
    sku: "SNK-DOR",
    baseUnitLabel: "unidad",
    cost: { usd: 0.8, bs: 80 },
    active: true,
    createdAt: now(),
  },
];

/** Presentaciones: inventario interno siempre en unidad base. */
export const AD_DEMO_PRESENTATIONS: AdPresentation[] = [
  {
    id: "pres-polar-1",
    productId: "prod-polar",
    name: "Individual",
    unitsPerPresentation: 1,
    price: { usd: 1, bs: 100 },
    active: true,
  },
  {
    id: "pres-polar-balde",
    productId: "prod-polar",
    name: "Balde",
    unitsPerPresentation: 6,
    price: { usd: 5, bs: 500 },
    active: true,
  },
  {
    id: "pres-polar-caja",
    productId: "prod-polar",
    name: "Caja",
    unitsPerPresentation: 36,
    price: { usd: 28, bs: 2800 },
    active: true,
  },
  {
    id: "pres-ron-botella",
    productId: "prod-ron",
    name: "Botella 750ml",
    unitsPerPresentation: 1,
    price: { usd: 22, bs: 2200 },
    active: true,
  },
  {
    id: "pres-agua-1",
    productId: "prod-agua",
    name: "Unidad",
    unitsPerPresentation: 1,
    price: { usd: 0.6, bs: 60 },
    active: true,
  },
  {
    id: "pres-agua-pack",
    productId: "prod-agua",
    name: "Pack x12",
    unitsPerPresentation: 12,
    price: { usd: 6, bs: 600 },
    active: true,
  },
  {
    id: "pres-snack-1",
    productId: "prod-snack",
    name: "Unidad",
    unitsPerPresentation: 1,
    price: { usd: 1.5, bs: 150 },
    active: true,
  },
];

export const AD_DEMO_STOCK: AdStockBalance[] = [
  { productId: "prod-polar", warehouseId: "wh-principal", qtyBase: 1000 },
  { productId: "prod-polar", warehouseId: "wh-barra", qtyBase: 120 },
  { productId: "prod-ron", warehouseId: "wh-principal", qtyBase: 48 },
  { productId: "prod-ron", warehouseId: "wh-barra", qtyBase: 6 },
  { productId: "prod-agua", warehouseId: "wh-principal", qtyBase: 240 },
  { productId: "prod-agua", warehouseId: "wh-barra", qtyBase: 36 },
  { productId: "prod-snack", warehouseId: "wh-barra", qtyBase: 40 },
];

export const AD_DEMO_CUSTOMERS: AdCustomer[] = [
  {
    id: "cli-1",
    name: "Cliente mesa 12",
    phone: "0414-0000000",
    notes: "Prepago cerveza frecuente",
    active: true,
  },
  {
    id: "cli-2",
    name: "Eventos corporativos",
    phone: "0424-1111111",
    notes: "Pedidos por caja",
    active: true,
  },
];

export const AD_DEMO_TABLES: AdTable[] = [
  { id: "mesa-1", number: "1", capacity: 4, status: "libre", active: true },
  { id: "mesa-5", number: "5", capacity: 6, status: "ocupada", active: true },
  {
    id: "mesa-12",
    number: "12",
    capacity: 8,
    status: "cuenta_abierta",
    active: true,
  },
  { id: "mesa-18", number: "18", capacity: 4, status: "libre", active: true },
];

export const AD_DEMO_ACCOUNTS: AdAccount[] = [
  {
    id: "acc-184",
    number: "000184",
    tableId: "mesa-12",
    mesoneraName: "María",
    customerId: "cli-1",
    customerName: "Cliente mesa 12",
    status: "prepago_activa",
    prepaid: true,
    lines: [
      {
        productId: "prod-polar",
        presentationId: "pres-polar-1",
        qtyPaid: 20,
        qtyServed: 5,
        unitPrice: { usd: 1, bs: 100 },
      },
    ],
    qrToken: "ad_qr_demo_000184_x7k9m2",
    createdAt: now(),
    updatedAt: now(),
  },
];

export const AD_DEMO_MOVEMENTS: AdInventoryMovement[] = [
  {
    id: "mov-1",
    type: "traslado",
    productId: "prod-polar",
    presentationId: "pres-polar-1",
    qtyPresentation: 100,
    qtyBase: 100,
    warehouseFromId: "wh-principal",
    warehouseToId: "wh-barra",
    userName: "Admin",
    reason: "Reposición barra",
    createdAt: now(),
  },
];

export const AD_DEMO_SALES: AdSale[] = [];
export const AD_DEMO_SERVICE_LOGS: AdServiceLog[] = [
  {
    id: "svc-1",
    accountId: "acc-184",
    tableId: "mesa-12",
    productId: "prod-polar",
    presentationId: "pres-polar-1",
    qtyServed: 3,
    qtyBase: 3,
    mesoneraName: "María",
    createdAt: now(),
  },
  {
    id: "svc-2",
    accountId: "acc-184",
    tableId: "mesa-12",
    productId: "prod-polar",
    presentationId: "pres-polar-1",
    qtyServed: 2,
    qtyBase: 2,
    mesoneraName: "María",
    createdAt: now(),
  },
];

export const AD_DEMO_CASH: AdCashSession = {
  id: "cash-1",
  openedAt: now(),
  openedBy: "Cajero",
  openingFloatUsd: 50,
  openingFloatBs: 5000,
  status: "open",
};

export const AD_DEMO_AUDIT: AdAuditEvent[] = [
  {
    id: "aud-1",
    action: "traslado",
    entity: "inventario",
    entityId: "mov-1",
    userName: "Admin",
    detail: "100 cervezas Polar: Principal → Barra",
    createdAt: now(),
  },
  {
    id: "aud-2",
    action: "servicio",
    entity: "cuenta",
    entityId: "acc-184",
    userName: "María",
    detail: "Sirvió 3 cervezas en mesa 12",
    createdAt: now(),
  },
];
