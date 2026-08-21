import { useEffect, useState } from "react";
import { polisurUnitLabel } from "@/content/polisur-preinscripcion";
import type { PolisurPreinscripcion } from "@/types/polisur-preinscripcion";
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

function PolisurPreinscripcionesAdmin({
  clave,
  tone = "polisur",
}: PolisurPreinscripcionesAdminProps) {
  const { site } = usePolisurSite();
  const [items, setItems] = useState<PolisurPreinscripcion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPolisur = tone === "polisur";
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const labelFor = (id: string) => polisurUnitLabel(id, site.units);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/polisur-preinscripciones?action=list&clave=${encodeURIComponent(clave)}`,
        );
        const text = await res.text();
        let payload: { ok?: boolean; error?: string; items?: PolisurPreinscripcion[] } =
          {};
        try {
          payload = JSON.parse(text) as {
            ok?: boolean;
            error?: string;
            items?: PolisurPreinscripcion[];
          };
        } catch {
          throw new Error("No se pudo leer el registro de preinscripciones.");
        }
        if (!res.ok || !payload.ok) {
          throw new Error(payload.error || "No se pudieron cargar las preinscripciones.");
        }
        if (!cancelled) {
          const next = payload.items ?? [];
          setItems(next);
          setSelectedId(next[0]?.id ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las preinscripciones.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [clave]);

  if (loading) {
    return (
      <p className={isPolisur ? "text-sm text-[var(--ps-steel-400)]" : "text-sm text-muted-foreground"}>
        Cargando preinscripciones…
      </p>
    );
  }

  if (error) {
    return (
      <p className={isPolisur ? "border-l-2 border-red-500/70 pl-3 text-sm text-red-200" : "text-sm text-destructive"}>
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className={isPolisur ? "text-sm text-[var(--ps-steel-400)]" : "text-sm text-muted-foreground"}>
        Aún no hay preinscripciones registradas.
      </p>
    );
  }

  return (
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
                <span className="text-sm font-semibold">
                  {item.nombres} {item.apellidos}
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
            <p className={isPolisur ? "ps-eyebrow" : "text-xs uppercase tracking-[0.14em] text-muted-foreground"}>
              Detalle
            </p>
            <h3 className={isPolisur ? "mt-2 text-2xl text-[var(--ps-white)]" : "mt-2 text-xl font-semibold"}>
              {selected.nombres} {selected.apellidos}
            </h3>
          </div>
          <dl className="grid gap-3 text-sm">
            <DetailRow tone={tone} label="Correo" value={selected.correo} />
            <DetailRow tone={tone} label="Teléfono" value={selected.telefono} />
            <DetailRow
              tone={tone}
              label="Unidad"
              value={labelFor(selected.unidad)}
            />
            <DetailRow
              tone={tone}
              label="Cédula"
              value={selected.cedula}
            />
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
        </article>
      ) : null}
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
