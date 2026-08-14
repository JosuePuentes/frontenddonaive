/**
 * Servicio WhatsApp desacoplado (MOCK).
 * No envía mensajes reales; deja lista la interfaz para API futura.
 */
import type {
  AdWhatsAppMessage,
  AdWhatsAppTemplate,
  AdWhatsAppTemplateCode,
} from "@/types/ad-licoreria";
import { uid } from "@/lib/ad-licoreria/conversions";

export const AD_WHATSAPP_TEMPLATES: AdWhatsAppTemplate[] = [
  {
    code: "purchase_thanks",
    name: "Gracias por su compra",
    description: "Recibo post-venta",
  },
  {
    code: "pending_items",
    name: "Productos pendientes",
    description: "Cuenta con mercancía por servir",
  },
  {
    code: "prepaid_balance",
    name: "Saldo prepago",
    description: "Saldo disponible del prepago",
  },
  {
    code: "prepaid_consume",
    name: "Consumo prepago",
    description: "Aviso de consumo parcial",
  },
  {
    code: "account_closed",
    name: "Cuenta cerrada",
    description: "Resumen al cerrar cuenta",
  },
];

type SendInput = {
  toPhone: string;
  template: AdWhatsAppTemplateCode;
  body: string;
  customerId?: string;
  receiptNumber?: string;
};

let logs: AdWhatsAppMessage[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const adWhatsAppService = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getTemplates() {
    return AD_WHATSAPP_TEMPLATES;
  },

  getLogs() {
    return logs;
  },

  /** Mock: encola y marca como mock_sent. No llama APIs externas. */
  async send(input: SendInput): Promise<AdWhatsAppMessage> {
    const phone = input.toPhone.trim();
    if (!phone) {
      const failed: AdWhatsAppMessage = {
        id: uid("wa"),
        toPhone: "",
        template: input.template,
        body: input.body,
        customerId: input.customerId,
        receiptNumber: input.receiptNumber,
        status: "failed",
        createdAt: new Date().toISOString(),
      };
      logs = [failed, ...logs];
      emit();
      return failed;
    }
    const msg: AdWhatsAppMessage = {
      id: uid("wa"),
      toPhone: phone,
      template: input.template,
      body: input.body,
      customerId: input.customerId,
      receiptNumber: input.receiptNumber,
      status: "mock_sent",
      createdAt: new Date().toISOString(),
    };
    logs = [msg, ...logs];
    emit();
    return msg;
  },

  buildPurchaseThanks(input: {
    customerName: string;
    receiptNumber: string;
    totalUsd: number;
    totalBs: number;
    paymentSummary: string;
    itemsSummary: string;
  }) {
    return [
      `A&D Licorería & Bodegón`,
      `Gracias por su compra, ${input.customerName}.`,
      `Recibo: ${input.receiptNumber}`,
      `Fecha: ${new Date().toLocaleString("es-VE")}`,
      input.itemsSummary,
      `Total: $${input.totalUsd.toFixed(2)} · Bs ${input.totalBs.toLocaleString("es-VE")}`,
      `Pago: ${input.paymentSummary}`,
    ].join("\n");
  },

  buildPendingItems(input: {
    customerName: string;
    accountNumber: string;
    pendingSummary: string;
  }) {
    return [
      `A&D Licorería & Bodegón`,
      `${input.customerName}, su cuenta #${input.accountNumber} tiene productos pendientes:`,
      input.pendingSummary,
    ].join("\n");
  },

  buildPrepaidBalance(input: {
    customerName: string;
    code: string;
    balanceSummary: string;
  }) {
    return [
      `A&D Licorería & Bodegón`,
      `${input.customerName}, saldo prepago ${input.code}:`,
      input.balanceSummary,
    ].join("\n");
  },

  buildPrepaidConsume(input: {
    customerName: string;
    code: string;
    before: number;
    consumed: number;
    after: number;
    productName: string;
  }) {
    return [
      `A&D Licorería & Bodegón`,
      `${input.customerName}, consumo en ${input.code}:`,
      `${input.productName}: −${input.consumed}`,
      `Antes: ${input.before} · Ahora: ${input.after}`,
    ].join("\n");
  },

  buildAccountClosed(input: {
    customerName: string;
    receiptNumber: string;
    totalUsd: number;
  }) {
    return [
      `A&D Licorería & Bodegón`,
      `${input.customerName}, su cuenta fue cerrada.`,
      `Recibo: ${input.receiptNumber}`,
      `Total: $${input.totalUsd.toFixed(2)}`,
    ].join("\n");
  },
};
