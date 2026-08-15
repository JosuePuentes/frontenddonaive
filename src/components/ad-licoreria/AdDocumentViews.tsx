import type { ReactNode } from "react";
import type { AdInvoiceDraft, AdPayment, AdReceipt, AdSale } from "@/types/ad-licoreria";
import { formatAdPrice } from "@/lib/ad-licoreria/conversions";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { adLicoreriaBrand } from "@/content/ad-licoreria/brand";
import { printDocumentElement } from "@/lib/ad-licoreria/document-export";

type MoneyLine = { label: string; usd?: number; bs?: number };

function printNode(id: string) {
  printDocumentElement(id, "Documento A&D");
}

export function AdPreliminarDocument(props: {
  draft: AdInvoiceDraft;
  productName: (id: string) => string;
  presentationName: (id: string) => string;
  warehouseName?: string;
  onBack: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmLabel?: string;
  footerExtra?: ReactNode;
}) {
  const { draft } = props;
  const subUsd = draft.items.reduce((a, i) => a + i.unitPrice.usd * i.qty, 0);
  const subBs = draft.items.reduce((a, i) => a + i.unitPrice.bs * i.qty, 0);
  const paidUsd = draft.payments
    .filter((p) => p.currency === "USD")
    .reduce((a, p) => a + p.amount, 0);
  const paidBs = draft.payments
    .filter((p) => p.currency === "BS")
    .reduce((a, p) => a + p.amount, 0);
  const netUsd = Math.max(0, subUsd - (draft.discountUsd || 0));
  const netBs = Math.max(0, subBs - (draft.discountBs || 0));
  const docId = `ad-prelim-${draft.id}`;

  return (
    <div className="ad-doc-shell space-y-4">
      <div id={docId} className="ad-doc">
        <p className="ad-eyebrow">Documento preliminar</p>
        <h2 className="ad-display text-3xl text-[var(--ad-gold-soft)]">
          {adLicoreriaBrand.name}
        </h2>
        <p className="text-sm text-[var(--ad-muted)]">
          {adLicoreriaBrand.tagline}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="ad-badge">PRELIMINAR</span>
          <span className="ad-badge">{draft.provisionalNumber}</span>
        </div>
        <dl className="ad-doc__meta mt-4">
          <div>
            <dt>Depósito</dt>
            <dd>{props.warehouseName ?? warehouseLabel(draft.warehouseId)}</dd>
          </div>
          <div>
            <dt>Usuario</dt>
            <dd>{draft.cashierName}</dd>
          </div>
          <div>
            <dt>Cliente</dt>
            <dd>{draft.customerName ?? "—"}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{new Date(draft.createdAt).toLocaleString("es-VE")}</dd>
          </div>
          {draft.tableNumber ? (
            <div>
              <dt>Mesa</dt>
              <dd>{draft.tableNumber}</dd>
            </div>
          ) : null}
          {draft.mesoneraName ? (
            <div>
              <dt>Mesonera</dt>
              <dd>{draft.mesoneraName}</dd>
            </div>
          ) : null}
        </dl>
        <table className="ad-table mt-4">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Pres.</th>
              <th>Cant.</th>
              <th>USD</th>
              <th>Bs</th>
            </tr>
          </thead>
          <tbody>
            {draft.items.map((it, i) => (
              <tr key={`${it.presentationId}-${i}`}>
                <td>{props.productName(it.productId)}</td>
                <td>{props.presentationName(it.presentationId)}</td>
                <td>{it.qty}</td>
                <td>{it.unitPrice.usd.toFixed(2)}</td>
                <td>{it.unitPrice.bs.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 space-y-1 text-sm">
          <li>Subtotal: {formatAdPrice({ usd: subUsd, bs: subBs })}</li>
          {(draft.discountUsd || draft.discountBs) ? (
            <li>
              Descuento: USD {draft.discountUsd} / Bs {draft.discountBs}
              {draft.discountReason ? ` · ${draft.discountReason}` : ""}
            </li>
          ) : null}
          <li className="font-medium text-[var(--ad-gold-soft)]">
            Total: USD {netUsd.toFixed(2)} · Bs {netBs.toFixed(0)}
          </li>
          <li>
            Pagos: USD {paidUsd.toFixed(2)} · Bs {paidBs.toFixed(0)}
          </li>
          <li>
            Saldo: USD {(netUsd - paidUsd).toFixed(2)} · Bs{" "}
            {(netBs - paidBs).toFixed(0)}
          </li>
        </ul>
        {draft.payments.length ? (
          <ul className="mt-2 space-y-1 text-xs text-[var(--ad-muted)]">
            {draft.payments.map((p, i) => (
              <li key={i}>
                {p.method} · {p.currency} {p.amount}
                {p.bank ? ` · ${p.bank}` : ""}
                {p.reference ? ` · ref ${p.reference}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {props.footerExtra}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="ad-btn" onClick={props.onBack}>
          Volver a editar
        </button>
        <button
          type="button"
          className="ad-btn"
          onClick={() => printNode(docId)}
        >
          Imprimir preliminar
        </button>
        <button
          type="button"
          className="ad-btn ad-btn--gold"
          disabled={props.confirmDisabled}
          onClick={props.onConfirm}
        >
          {props.confirmLabel ?? "Confirmar factura"}
        </button>
      </div>
    </div>
  );
}

export function AdReceiptDocument(props: {
  receipt: AdReceipt;
  title?: string;
  onClose?: () => void;
}) {
  const { receipt } = props;
  const docId = `ad-rcpt-${receipt.id}`;
  return (
    <div className="ad-doc-shell space-y-3">
      <div id={docId} className="ad-doc">
        <p className="ad-eyebrow">{props.title ?? "Recibo"}</p>
        <h2 className="ad-display text-3xl text-[var(--ad-gold-soft)]">
          {adLicoreriaBrand.name}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="ad-badge ad-badge--ok">{receipt.number}</span>
          <span className="ad-badge">{receipt.status ?? "emitido"}</span>
        </div>
        <dl className="ad-doc__meta mt-4">
          <div>
            <dt>Cliente</dt>
            <dd>{receipt.customerName ?? "—"}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{receipt.customerPhone ?? "—"}</dd>
          </div>
          <div>
            <dt>Cajero</dt>
            <dd>{receipt.cashierName ?? "—"}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{new Date(receipt.createdAt).toLocaleString("es-VE")}</dd>
          </div>
          {receipt.warehouseId ? (
            <div>
              <dt>Depósito</dt>
              <dd>{warehouseLabel(receipt.warehouseId)}</dd>
            </div>
          ) : null}
          {receipt.tableNumber ? (
            <div>
              <dt>Mesa</dt>
              <dd>{receipt.tableNumber}</dd>
            </div>
          ) : null}
        </dl>
        <table className="ad-table mt-3">
          <thead>
            <tr>
              <th>Ítem</th>
              <th>Cant.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((it, i) => (
              <tr key={i}>
                <td>
                  {it.productName}
                  <div className="text-xs text-[var(--ad-muted)]">
                    {it.presentationName}
                  </div>
                </td>
                <td>{it.qty}</td>
                <td>{formatAdPrice(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 space-y-1 text-sm">
          <li>Total: {formatAdPrice(receipt.total)}</li>
          <li>
            Pagado: USD {receipt.paidUsd.toFixed(2)} · Bs{" "}
            {receipt.paidBs.toFixed(0)}
          </li>
          <li>
            Saldo: USD {receipt.balanceUsd.toFixed(2)}
          </li>
        </ul>
        <PaymentList payments={receipt.payments} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="ad-btn ad-btn--gold"
          onClick={() => printNode(docId)}
        >
          Imprimir / descargar
        </button>
        {props.onClose ? (
          <button type="button" className="ad-btn" onClick={props.onClose}>
            Cerrar
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AdSaleReceiptFallback(props: {
  sale: AdSale;
  productName: (id: string) => string;
  presentationName: (id: string) => string;
  onClose?: () => void;
}) {
  const { sale } = props;
  const docId = `ad-sale-${sale.id}`;
  const paidUsd = sale.payments
    .filter((p) => p.currency === "USD")
    .reduce((a, p) => a + p.amount, 0);
  const paidBs = sale.payments
    .filter((p) => p.currency === "BS")
    .reduce((a, p) => a + p.amount, 0);
  return (
    <div className="ad-doc-shell space-y-3">
      <div id={docId} className="ad-doc">
        <p className="ad-eyebrow">Recibo confirmado</p>
        <h2 className="ad-display text-3xl text-[var(--ad-gold-soft)]">
          {sale.receiptNumber}
        </h2>
        <p className="text-sm text-[var(--ad-muted)]">
          {sale.customerName ?? "Cliente"} ·{" "}
          {warehouseLabel(sale.warehouseId)} ·{" "}
          {new Date(sale.createdAt).toLocaleString("es-VE")}
        </p>
        <table className="ad-table mt-3">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>USD</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((it, i) => (
              <tr key={i}>
                <td>
                  {props.productName(it.productId)}
                  <div className="text-xs text-[var(--ad-muted)]">
                    {props.presentationName(it.presentationId)}
                  </div>
                </td>
                <td>{it.qty}</td>
                <td>{(it.unitPrice.usd * it.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-sm">
          Total {formatAdPrice(sale.total)} · Pagado USD {paidUsd.toFixed(2)} /
          Bs {paidBs.toFixed(0)}
        </p>
        <PaymentList payments={sale.payments} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="ad-btn ad-btn--gold"
          onClick={() => printNode(docId)}
        >
          Imprimir / descargar
        </button>
        {props.onClose ? (
          <button type="button" className="ad-btn" onClick={props.onClose}>
            Cerrar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PaymentList({ payments }: { payments: AdPayment[] }) {
  if (!payments.length) return null;
  return (
    <ul className="mt-2 space-y-1 text-xs text-[var(--ad-muted)]">
      {payments.map((p) => (
        <li key={p.id}>
          {p.method} · {p.currency} {p.amount}
          {p.reference ? ` · ${p.reference}` : ""}
        </li>
      ))}
    </ul>
  );
}

export function maskDocument(doc?: string | null): string {
  if (!doc?.trim()) return "—";
  const t = doc.trim();
  if (t.length <= 4) return "****";
  return `${t.slice(0, 2)}****${t.slice(-2)}`;
}

export type AdPurchasePrintLine = {
  code: string;
  description: string;
  brand: string;
  presentation: string;
  qty: number;
  unitCost: number;
  presentationCost: number;
  lineSubtotal: number;
  taxable: boolean;
  lineTax: number;
  lineTotal: number;
};

export type AdPurchasePrintDoc = {
  title: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string | Date | null;
  paymentMethodName: string;
  currency: string;
  paymentCondition: string;
  creditDays: number | null;
  dueDate: string | Date | null;
  notes?: string | null;
  subtotal: number;
  tax: number;
  taxLabel: string;
  grandTotal: number;
  lines: AdPurchasePrintLine[];
};

function fmtDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-VE");
}

/** Documento imprimible de compra (preliminar / confirmada) — sin utilidad/margen/PVP. */
export function AdPurchaseDocument(props: {
  document: AdPurchasePrintDoc;
  onBack?: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
}) {
  const doc = props.document;
  const docId = `ad-purchase-doc-${doc.invoiceNumber}`.replace(/\s+/g, "-");
  const cur = doc.currency === "BS" ? "Bs" : "USD";

  return (
    <div className="ad-doc-shell space-y-4">
      <div id={docId} className="ad-doc">
        <p className="ad-eyebrow">{doc.title}</p>
        <h2 className="ad-display text-3xl text-[var(--ad-gold-soft)]">
          {adLicoreriaBrand.name}
        </h2>
        <p className="text-sm text-[var(--ad-muted)]">{adLicoreriaBrand.tagline}</p>
        <dl className="ad-doc__meta mt-4">
          <div>
            <dt>Proveedor</dt>
            <dd>{doc.supplierName}</dd>
          </div>
          <div>
            <dt>Nº factura</dt>
            <dd>{doc.invoiceNumber}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{fmtDate(doc.invoiceDate)}</dd>
          </div>
          <div>
            <dt>Método de pago</dt>
            <dd>{doc.paymentMethodName || "—"}</dd>
          </div>
          <div>
            <dt>Moneda</dt>
            <dd>{doc.currency}</dd>
          </div>
          <div>
            <dt>Condición</dt>
            <dd>{doc.paymentCondition}</dd>
          </div>
          <div>
            <dt>Días de crédito</dt>
            <dd>{doc.creditDays ?? "—"}</dd>
          </div>
          <div>
            <dt>Vencimiento</dt>
            <dd>{fmtDate(doc.dueDate)}</dd>
          </div>
        </dl>
        <table className="ad-table mt-4">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Marca</th>
              <th>Presentación</th>
              <th>Cant.</th>
              <th>Costo u.</th>
              <th>Costo pres.</th>
              <th>Subtotal</th>
              <th>IVA</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l, i) => (
              <tr key={`${l.code}-${i}`}>
                <td>{l.code}</td>
                <td>{l.description}</td>
                <td>{l.brand || "—"}</td>
                <td>{l.presentation}</td>
                <td>{l.qty}</td>
                <td className="tabular-nums">{l.unitCost.toFixed(4)}</td>
                <td className="tabular-nums">{l.presentationCost.toFixed(2)}</td>
                <td className="tabular-nums">{l.lineSubtotal.toFixed(2)}</td>
                <td className="tabular-nums">
                  {l.taxable ? l.lineTax.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 space-y-1 text-sm tabular-nums">
          <li>
            Subtotal: {doc.subtotal.toFixed(2)} {cur}
          </li>
          <li>
            {doc.taxLabel || "IVA 16%"}: {doc.tax.toFixed(2)} {cur}
          </li>
          <li className="text-base font-semibold">
            Total general: {doc.grandTotal.toFixed(2)} {cur}
          </li>
        </ul>
        {doc.notes ? (
          <p className="mt-2 text-xs text-[var(--ad-muted)]">Notas: {doc.notes}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {props.onBack ? (
          <button type="button" className="ad-btn" onClick={props.onBack}>
            Editar compra
          </button>
        ) : null}
        <button
          type="button"
          className="ad-btn ad-btn--gold"
          onClick={() => printNode(docId)}
        >
          Imprimir / descargar
        </button>
        {props.onConfirm ? (
          <button
            type="button"
            className="ad-btn"
            disabled={props.confirmDisabled}
            onClick={props.onConfirm}
          >
            {props.confirmLabel ?? "Confirmar compra"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export type { MoneyLine };
