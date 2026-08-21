import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  activePolisurUnits,
  type PolisurUnitItem,
} from "@/content/polisur-site";
import { unitFromSearchParam } from "@/content/polisur-preinscripcion";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

type PolisurPreinscripcionFormProps = {
  defaultUnidad: string;
};

function PolisurPreinscripcionForm({
  defaultUnidad,
}: PolisurPreinscripcionFormProps) {
  const { site } = usePolisurSite();
  const units = useMemo(() => activePolisurUnits(site), [site]);
  const initial = unitFromSearchParam(defaultUnidad);

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [unidad, setUnidad] = useState(initial);
  const [mensaje, setMensaje] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (units.length === 0) return;
    if (!units.some((u) => u.id === unidad)) {
      setUnidad(units[0].id);
    }
  }, [units, unidad]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/polisur-preinscripciones?action=submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres,
          apellidos,
          cedula,
          correo,
          telefono,
          unidad,
          mensaje,
          website,
        }),
      });
      const text = await res.text();
      let payload: { ok?: boolean; error?: string } = {};
      try {
        payload = JSON.parse(text) as { ok?: boolean; error?: string };
      } catch {
        throw new Error("No se pudo enviar la preinscripción.");
      }
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || "No se pudo enviar la preinscripción.");
      }
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar la preinscripción.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="border-l-2 border-[var(--ps-mint)] pl-4">
        <p className="ps-eyebrow">Registro recibido</p>
        <h2 className="mt-3 text-2xl text-[var(--ps-white)]">
          Preinscripción enviada
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)]">
          Recibimos sus datos. La institución revisará la solicitud. Conserve
          su correo y teléfono activos para el seguimiento.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="ps-field-label">Nombres</span>
          <input
            type="text"
            name="nombres"
            autoComplete="given-name"
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            className="ps-input"
          />
        </label>
        <label className="block">
          <span className="ps-field-label">Apellidos</span>
          <input
            type="text"
            name="apellidos"
            autoComplete="family-name"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            className="ps-input"
          />
        </label>
      </div>

      <label className="block">
        <span className="ps-field-label">Cédula</span>
        <input
          type="text"
          name="cedula"
          inputMode="numeric"
          autoComplete="off"
          required
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          className="ps-input"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="ps-field-label">Correo</span>
          <input
            type="text"
            name="correo"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="ps-input"
          />
        </label>
        <label className="block">
          <span className="ps-field-label">Teléfono</span>
          <input
            type="text"
            name="telefono"
            inputMode="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="ps-input"
          />
        </label>
      </div>

      <label className="block">
        <span className="ps-field-label">Unidad a la que desea pertenecer</span>
        <select
          name="unidad"
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
          className="ps-input"
        >
          {units.map((unit: PolisurUnitItem) => (
            <option key={unit.id} value={unit.id}>
              {unit.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="ps-field-label">Mensaje (opcional)</span>
        <textarea
          name="mensaje"
          rows={4}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="ps-input min-h-28"
        />
      </label>

      <label className="hidden" aria-hidden>
        Sitio web
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>

      {error ? (
        <p className="border-l-2 border-red-500/70 pl-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy} className="ps-btn ps-btn-primary">
        {busy ? "Enviando…" : "Enviar preinscripción"}
      </button>
    </form>
  );
}

export { PolisurPreinscripcionForm };
