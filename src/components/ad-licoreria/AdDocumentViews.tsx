import type { ReactNode } from "react";
import type { AdInvoiceDraft, AdPayment, AdReceipt, AdSale } from "@/types/ad-licoreria";
import { formatAdPrice } from "@/lib/ad-licoreria/conversions";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { adLicoreriaBrand } from "@/content/ad-licoreria/brand";

type MoneyLine = { label: string; usd?: number; bs?: number };

function printNode(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const w = window.open("", "_blank", "noopener,noreferrer,width=480,height=720");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Documento A&D</title>
    <style>
      body{font-family:Georgia,serif;color:#111;padding:24px;max-width:420px;margin:0 auto}
      h1{font-size:1.4rem;margin:0 0 .25rem} .muted{color:#666;font-size:.8rem}
      table{width:100%;border-collapse:collapse;margin:12px 0;font-size:.85rem}
      th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}
      .right{text-align:right} .badge{display:inline-block;border:1px solid #999;padding:2px 6px;font-size:.65rem;letter-spacing:.08em}
      @media print{button{display:none}}
    </style></head><body>${node.innerHTML}
    <p class="muted">A&D Licorería & Bodegón · documento mock</p>
    <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
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

export type { MoneyLine };
