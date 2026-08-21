import { useEffect, useState } from "react";
import { polisurUnitLabel } from "@/content/polisur-preinscripcion";
import type {
  PolisurPreinscripcion,
  PolisurPreinscripcionStatus,
} from "@/types/polisur-preinscripcion";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";
import { cn } from "@/lib/utils";

type PolisurPreinscripcionesAdminProps = {
  clave: string;
  tone?: "polisur" | "dashboard";
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function asStatus(value: unknown): PolisurPreinscripcionStatus {
  return value === "validado" ? "validado" : "pendiente";
}

function normalizeItems(
  items: PolisurPreinscripcion[] | undefined,
): PolisurPreinscripcion[] {
  return (items ?? []).map((item) => ({
    ...item,
    status: asStatus(item.status),
  }));
}

function PolisurPreinscripcionesAdmin({
  clave,
  tone = "polisur",
}: PolisurPreinscripcionesAdminProps) {
  const { site } = usePolisurSite();
  const [items, setItems] = useState<PolisurPreinscripcion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isPolisur = tone === "polisur";
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const labelFor = (id: string) => polisurUnitLabel(id, site.units);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/polisur-preinscripciones?action=list&clave=${encodeURIComponent(clave)}`,
      );
      const text = await res.text();
      let payload: {
        ok?: boolean;
        error?: string;
        items?: PolisurPreinscripcion[];
      } = {};
      try {
        payload = JSON.parse(text) as typeof payload;
      } catch {
        throw new Error("No se pudo leer el registro de preinscripciones.");
      }
      if (!res.ok || !payload.ok) {
        throw new Error(
          payload.error || "No se pudieron cargar las preinscripciones.",
        );
      }
      const next = normalizeItems(payload.items);
      setItems(next);
      setSelectedId((prev) =>
        prev && next.some((item) => item.id === prev)
          ? prev
          : (next[0]?.id ?? null),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las preinscripciones.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  async function onSetStatus(id: string, status: "pendiente" | "validado") {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        "/api/polisur-preinscripciones?action=setStatus",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clave, id, status }),
        },
      );
      const text = await res.text();
      let payload: {
        ok?: boolean;
        error?: string;
        items?: PolisurPreinscripcion[];
      } = {};
      try {
        payload = JSON.parse(text) as typeof payload;
      } catch {
        throw new Error("No se pudo actualizar el estado.");
      }
      if (!res.ok || !payload.ok || !payload.items) {
        throw new Error(payload.error || "No se pudo actualizar el estado.");
      }
      const next = normalizeItems(payload.items);
      setItems(next);
      setMessage(
        status === "validado"
          ? "Preinscripción marcada como validada."
          : "Preinscripción marcada como pendiente.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el estado.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (
      !window.confirm(
        "¿Eliminar esta preinscripción? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/polisur-preinscripciones?action=delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave, id }),
      });
      const text = await res.text();
      let payload: {
        ok?: boolean;
        error?: string;
        items?: PolisurPreinscripcion[];
      } = {};
      try {
        payload = JSON.parse(text) as typeof payload;
      } catch {
        throw new Error("No se pudo eliminar la preinscripción.");
      }
      if (!res.ok || !payload.ok || !payload.items) {
        throw new Error(
          payload.error || "No se pudo eliminar la preinscripción.",
        );
      }
      const next = normalizeItems(payload.items);
      setItems(next);
      setSelectedId(next[0]?.id ?? null);
      setMessage("Preinscripción eliminada.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la preinscripción.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p
        className={
          isPolisur
            ? "text-sm text-[var(--ps-steel-400)]"
            : "text-sm text-muted-foreground"
        }
      >
        Cargando preinscripciones…
      </p>
    );
  }

  if (error && items.length === 0) {
    return (
      <p
        className={
          isPolisur
            ? "border-l-2 border-red-500/70 pl-3 text-sm text-red-200"
            : "text-sm text-destructive"
        }
      >
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p
        className={
          isPolisur
            ? "text-sm text-[var(--ps-steel-400)]"
            : "text-sm text-muted-foreground"
        }
      >
        Aún no hay preinscripciones registradas.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p
          className={
            isPolisur
              ? "border-l-2 border-[var(--ps-mint)]/70 pl-3 text-sm text-[var(--ps-paper)]"
              : "text-sm text-foreground"
          }
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className={
            isPolisur
              ? "border-l-2 border-red-500/70 pl-3 text-sm text-red-200"
              : "text-sm text-destructive"
          }
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <ul
          className={cn(
            "divide-y border-y",
            isPolisur
              ? "divide-[var(--ps-line)] border-[var(--ps-line)]"
              : "divide-border border-border",
          )}
        >
          {items.map((item) => {
            const active = item.id === selectedId;
            const validated = item.status === "validado";
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 px-0 py-3 text-left",
                    isPolisur
                      ? active
                        ? "text-[var(--ps-white)]"
                        : "text-[var(--ps-steel-300)] hover:text-[var(--ps-white)]"
                      : active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {item.nombres} {item.apellidos}
                    <span
                      className={cn(
                        "text-[0.65rem] font-medium uppercase tracking-[0.12em]",
                        validated
                          ? isPolisur
                            ? "text-[var(--ps-mint)]"
                            : "text-emerald-600"
                          : isPolisur
                            ? "text-[var(--ps-steel-400)]"
                            : "text-muted-foreground",
                      )}
                    >
                      {validated ? "Validado" : "Pendiente"}
                    </span>
                  </span>
                  <span className="text-xs uppercase tracking-[0.12em]">
                    {labelFor(item.unidad)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {selected ? (
          <article
            className={cn(
              "space-y-4 border-l-2 pl-4",
              isPolisur ? "border-[var(--ps-mint)]" : "border-primary",
            )}
          >
            <div>
              <p
                className={
                  isPolisur
                    ? "ps-eyebrow"
                    : "text-xs uppercase tracking-[0.14em] text-muted-foreground"
                }
              >
                Detalle
              </p>
              <h3
                className={
                  isPolisur
                    ? "mt-2 text-2xl text-[var(--ps-white)]"
                    : "mt-2 text-xl font-semibold"
                }
              >
                {selected.nombres} {selected.apellidos}
              </h3>
            </div>
            <dl className="grid gap-3 text-sm">
              <DetailRow tone={tone} label="Estado" value={selected.status === "validado" ? "Validado" : "Pendiente"} />
              <DetailRow tone={tone} label="Correo" value={selected.correo} />
              <DetailRow tone={tone} label="Teléfono" value={selected.telefono} />
              <DetailRow
                tone={tone}
                label="Unidad"
                value={labelFor(selected.unidad)}
              />
              <DetailRow tone={tone} label="Cédula" value={selected.cedula} />
              <DetailRow
                tone={tone}
                label="Fecha"
                value={formatDate(selected.createdAt)}
              />
              <DetailRow
                tone={tone}
                label="Mensaje"
                value={selected.mensaje || "Sin mensaje"}
              />
            </dl>

            <div className="flex flex-wrap gap-3 pt-2">
              {selected.status === "validado" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onSetStatus(selected.id, "pendiente")}
                  className={
                    isPolisur
                      ? "border border-[var(--ps-line-strong)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ps-paper)] disabled:opacity-50"
                      : "border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] disabled:opacity-50"
                  }
                >
                  Marcar pendiente
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onSetStatus(selected.id, "validado")}
                  className={
                    isPolisur
                      ? "border border-[var(--ps-mint)]/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ps-mint)] disabled:opacity-50"
                      : "border border-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 disabled:opacity-50"
                  }
                >
                  Validado
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDelete(selected.id)}
                className={
                  isPolisur
                    ? "border border-red-400/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 disabled:opacity-50"
                    : "border border-destructive/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-destructive disabled:opacity-50"
                }
              >
                Eliminar
              </button>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "polisur" | "dashboard";
}) {
  const isPolisur = tone === "polisur";
  return (
    <div>
      <dt
        className={
          isPolisur
            ? "text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)]"
            : "text-xs uppercase tracking-[0.14em] text-muted-foreground"
        }
      >
        {label}
      </dt>
      <dd
        className={
          isPolisur
            ? "mt-1 break-all text-[var(--ps-paper)]"
            : "mt-1 break-all text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export { PolisurPreinscripcionesAdmin };
