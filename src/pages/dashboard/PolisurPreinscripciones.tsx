import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { PolisurPreinscripcionesAdmin } from "@/components/polisur/PolisurPreinscripcionesAdmin";
import { POLISUR_SESSION_KEY } from "@/content/polisur-preinscripcion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

export default function PolisurPreinscripciones() {
  const [clave, setClave] = useState("");
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(POLISUR_SESSION_KEY);
    if (saved) {
      setClave(saved);
      setAuthed(true);
    }
  }, []);

  async function onAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/polisur-medios?action=auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: clave.trim() }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || "Clave no válida.");
      }
      sessionStorage.setItem(POLISUR_SESSION_KEY, clave.trim());
      setAuthed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clave no válida.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardPage
      title="Preinscripciones POLISUR"
      description="Listado de aspirantes con nombre, correo, teléfono y unidad de interés."
    >
      {!authed ? (
        <form onSubmit={onAuth} noValidate className="max-w-md space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Clave institucional</span>
            <Input
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Verificando…" : "Ingresar"}
          </Button>
        </form>
      ) : (
        <PolisurPreinscripcionesAdmin clave={clave} tone="dashboard" />
      )}
    </DashboardPage>
  );
}
