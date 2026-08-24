import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import {
  DS_ADMIN_SESSION_KEY,
  DsLicensesAdmin,
} from "@/components/donaive-software/DsLicensesAdmin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

export default function DonaiveSoftwareActivaciones() {
  const [clave, setClave] = useState("");
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(DS_ADMIN_SESSION_KEY);
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
      const res = await fetch(
        `/api/ds-licenses?action=list&clave=${encodeURIComponent(clave.trim())}`,
      );
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || "Clave no válida.");
      }
      sessionStorage.setItem(DS_ADMIN_SESSION_KEY, clave.trim());
      setAuthed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clave no válida.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardPage
      title="Activación Donaive Software"
      description="Crea licencias por negocio, aprueba equipos y genera códigos de un solo uso."
    >
      {!authed ? (
        <form onSubmit={onAuth} noValidate className="max-w-md space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Clave admin Donaive Software</span>
            <Input
              type="password"
              autoComplete="off"
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
        <DsLicensesAdmin clave={clave} />
      )}
    </DashboardPage>
  );
}
