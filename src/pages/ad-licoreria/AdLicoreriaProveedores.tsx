import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";

export default function AdLicoreriaProveedores() {
  const { hasPermission } = useAdLicoreria();
  const [name, setName] = useState("");
  const [idDoc, setIdDoc] = useState("");
  const [phone, setPhone] = useState("");
  const [creditDays, setCreditDays] = useState(15);
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [msg, setMsg] = useState("");

  async function refresh() {
    const r = await adCommerceClient.listSuppliers();
    if (r.ok) setList(r.data as Record<string, unknown>[]);
    else setMsg(r.error);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function create() {
    if (!hasPermission("suppliers.manage")) {
      setMsg("Sin permiso suppliers.manage");
      return;
    }
    const r = await adCommerceClient.createSupplier({
      name,
      identification: idDoc,
      phone,
      creditDays,
      defaultCurrency: "USD",
    });
    setMsg(r.ok ? "Proveedor creado" : r.error);
    if (r.ok) {
      setName("");
      await refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-3">
        <h1 className="text-xl font-semibold">Proveedores</h1>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.compras}>
          Ir a compras
        </Link>
      </div>
      <section className="ad-panel grid gap-2 sm:grid-cols-4">
        <input className="ad-input" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="ad-input" placeholder="RIF/CI" value={idDoc} onChange={(e) => setIdDoc(e.target.value)} />
        <input className="ad-input" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="ad-input" type="number" value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value))} />
        <button type="button" className="ad-btn" onClick={() => void create()}>
          Crear
        </button>
      </section>
      {msg && <p className="text-sm">{msg}</p>}
      <ul className="ad-panel space-y-2 text-sm">
        {list.map((s) => (
          <li key={String(s.id)}>
            <strong>{String(s.name)}</strong> · {String(s.identification ?? "—")} · crédito{" "}
            {String(s.creditDays)}d
          </li>
        ))}
        {!list.length && <li className="text-[var(--ad-muted)]">Sin proveedores (modo API).</li>}
      </ul>
    </div>
  );
}
