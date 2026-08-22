import { useEffect, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";
import { isAdApiDataSource } from "@/services/ad-licoreria/data-source";
import { AdProductScanner } from "@/components/ad-licoreria/AdProductScanner";

type Promo = {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  active: boolean;
  items: { presentationId: string; qty: number; price: number }[];
  paymentMethods: { paymentMethodId: string; paymentMethod?: { name: string } }[];
};

/**
 * Fase 9 — Promociones ligadas a presentaciones y métodos de pago.
 * No muestra tasa paralela.
 */
export default function AdLicoreriaPromociones() {
  const { hasPermission, presentations, products } = useAdLicoreria();
  const [list, setList] = useState<Promo[]>([]);
  const [methods, setMethods] = useState<
    { id: string; name: string; usesSpecialRateRef: boolean }[]
  >([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [presentationId, setPresentationId] = useState("");
  const [price, setPrice] = useState(0);
  const [methodIds, setMethodIds] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  async function refresh() {
    if (!isAdApiDataSource()) {
      setMsg("Modo MOCK: CRUD de promociones requiere API.");
      return;
    }
    const [p, m] = await Promise.all([
      adCommerceClient.listPromotions(),
      adCommerceClient.listPaymentMethods(),
    ]);
    if (p.ok) setList(p.data as Promo[]);
    if (m.ok) setMethods(m.data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function create() {
    if (!hasPermission("promotions.manage")) {
      setMsg("Sin permiso promotions.manage");
      return;
    }
    if (!name.trim() || !presentationId || !(price > 0)) {
      setMsg("Nombre, presentación y precio requeridos");
      return;
    }
    const r = await adCommerceClient.createPromotion({
      name: name.trim(),
      description: description.trim() || undefined,
      currency: "USD",
      paymentMethodIds: methodIds,
      items: [{ presentationId, qty: 1, price }],
    });
    setMsg(r.ok ? "Promoción creada" : r.error);
    if (r.ok) {
      setName("");
      setDescription("");
      await refresh();
    }
  }

  async function toggle(id: string, active: boolean) {
    const r = await adCommerceClient.updatePromotion(id, { active: !active });
    setMsg(r.ok ? "Actualizada" : r.error);
    if (r.ok) await refresh();
  }

  const presOptions = presentations.filter((p) => p.active);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Promociones</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          Precio promocional por presentación y métodos de pago. Los métodos con
          referencia de dólar real se respetan internamente; la tasa paralela no
          se muestra.
        </p>
      </header>

      <AdProductScanner
        onSelect={(hit) => {
          const first = presentations.find((p) => p.productId === hit.id);
          if (first) setPresentationId(first.id);
        }}
      />

      <section className="ad-panel grid gap-2 sm:grid-cols-2">
        <input
          className="ad-input"
          placeholder="Nombre (ej. Caja Polar 36)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          className="ad-select"
          value={presentationId}
          onChange={(e) => setPresentationId(e.target.value)}
        >
          <option value="">Presentación</option>
          {presOptions.map((p) => {
            const prod = products.find((x) => x.id === p.productId);
            return (
              <option key={p.id} value={p.id}>
                {prod?.name ?? p.productId} · {p.name}
              </option>
            );
          })}
        </select>
        <input
          className="ad-input"
          type="number"
          min={0}
          step="0.01"
          placeholder="Precio promo USD"
          value={price || ""}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <div className="sm:col-span-2">
          <p className="mb-1 text-xs text-[var(--ad-muted)]">Métodos de pago</p>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <label key={m.id} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={methodIds.includes(m.id)}
                  onChange={(e) => {
                    setMethodIds((prev) =>
                      e.target.checked
                        ? [...prev, m.id]
                        : prev.filter((x) => x !== m.id),
                    );
                  }}
                />
                {m.name}
                {m.usesSpecialRateRef ? " *" : ""}
              </label>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-[var(--ad-muted)]">
            * Método con referencia financiera interna (sin revelar tasa).
          </p>
        </div>
        <button type="button" className="ad-btn" onClick={() => void create()}>
          Crear promoción
        </button>
      </section>

      {msg ? <p className="text-sm">{msg}</p> : null}

      <section className="ad-panel space-y-2">
        <h2 className="font-medium">Activas / históricas</h2>
        {list.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 py-2 text-sm"
          >
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-[var(--ad-muted)]">
                {p.description ?? "—"} · {p.currency} ·{" "}
                {p.items.map((i) => `$${Number(i.price).toFixed(2)}`).join(", ")}
              </div>
            </div>
            <button
              type="button"
              className="ad-btn"
              onClick={() => void toggle(p.id, p.active)}
            >
              {p.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
