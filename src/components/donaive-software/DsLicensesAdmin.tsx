import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  adminApproveRequest,
  adminCreateLicense,
  adminGenerateCode,
  adminRejectRequest,
  adminRevokeActivation,
  adminSuspendLicense,
  fetchLicenseStore,
  type DsLicenseStore,
} from "@/lib/donaive-software/license-api";

export const DS_ADMIN_SESSION_KEY = "donaive-software-admin-clave";

type Props = {
  clave: string;
};

function countActiveDevices(store: DsLicenseStore, licenseId: string) {
  return store.activations.filter(
    (a) => a.licenseId === licenseId && a.revoked !== true,
  ).length;
}

export function DsLicensesAdmin({ clave }: Props) {
  const [store, setStore] = useState<DsLicenseStore | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [maxDevices, setMaxDevices] = useState("1");
  const [notes, setNotes] = useState("");

  const [approveLicenseByRequest, setApproveLicenseByRequest] = useState<
    Record<string, string>
  >({});

  const reload = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await fetchLicenseStore(clave);
      setStore(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setBusy(false);
    }
  }, [clave]);

  useEffect(() => {
    void reload();
    const id = window.setInterval(() => void reload(), 30_000);
    return () => window.clearInterval(id);
  }, [reload]);

  const pendingRequests = useMemo(
    () => store?.requests.filter((r) => r.status === "pending") ?? [],
    [store],
  );

  async function onCreateLicense(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await adminCreateLicense(clave, {
        businessName: businessName.trim(),
        maxDevices: Number(maxDevices) || 1,
        notes: notes.trim() || undefined,
      });
      setBusinessName("");
      setNotes("");
      setMessage("Licencia creada.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear.");
    } finally {
      setBusy(false);
    }
  }

  async function onApprove(requestId: string) {
    const licenseId = approveLicenseByRequest[requestId];
    if (!licenseId) {
      setError("Selecciona la licencia para esta solicitud.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    setLastCode(null);
    try {
      const res = await adminApproveRequest(clave, { requestId, licenseId });
      setLastCode(res.activationCode || null);
      setMessage(
        res.activationCode
          ? `Código de un solo uso: ${res.activationCode}`
          : "Solicitud aprobada.",
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aprobar.");
    } finally {
      setBusy(false);
    }
  }

  async function onReject(requestId: string) {
    setBusy(true);
    setError(null);
    try {
      await adminRejectRequest(clave, { requestId });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo rechazar.");
    } finally {
      setBusy(false);
    }
  }

  async function onGenerateCode(licenseId: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    setLastCode(null);
    try {
      const res = await adminGenerateCode(clave, { licenseId });
      setLastCode(res.activationCode || null);
      setMessage(
        res.activationCode
          ? `Nuevo código: ${res.activationCode}`
          : "Código generado.",
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar.");
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(activationId: string) {
    if (!confirm("¿Revocar este equipo? Deberá solicitar un código nuevo.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminRevokeActivation(clave, { activationId });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo revocar.");
    } finally {
      setBusy(false);
    }
  }

  async function onSuspend(licenseId: string) {
    if (!confirm("¿Suspender esta licencia en todos los equipos?")) return;
    setBusy(true);
    setError(null);
    try {
      await adminSuspendLicense(clave, { licenseId });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo suspender.");
    } finally {
      setBusy(false);
    }
  }

  if (!store) {
    return <p className="text-sm text-muted-foreground">Cargando licencias…</p>;
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}
      {lastCode ? (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 font-mono text-lg tracking-widest">
          {lastCode}
        </p>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Crear licencia</h2>
          <p className="text-sm text-muted-foreground">
            Cada licencia representa un negocio cliente. Controla cuántos
            equipos pueden activarse.
          </p>
        </div>
        <form
          onSubmit={(e) => void onCreateLicense(e)}
          className="grid max-w-xl gap-3 md:grid-cols-2"
        >
          <label className="block space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Nombre del negocio</span>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Equipos permitidos</span>
            <Input
              type="number"
              min={1}
              max={99}
              value={maxDevices}
              onChange={(e) => setMaxDevices(e.target.value)}
            />
          </label>
          <label className="block space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Notas (opcional)</span>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={busy}>
              Crear licencia
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Solicitudes pendientes</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay solicitudes nuevas de equipos.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-border p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-base font-semibold tracking-wide">
                      {req.requestCode}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {req.deviceLabel} ·{" "}
                      {new Date(req.createdAt).toLocaleString("es-VE")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block space-y-1 min-w-[220px]">
                    <span className="text-xs font-medium text-muted-foreground">
                      Licencia
                    </span>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={approveLicenseByRequest[req.id] || ""}
                      onChange={(e) =>
                        setApproveLicenseByRequest((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Seleccionar…</option>
                      {store.licenses
                        .filter((l) => l.status === "active")
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.businessName} ({countActiveDevices(store, l.id)}/
                            {l.maxDevices})
                          </option>
                        ))}
                    </select>
                  </label>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void onApprove(req.id)}
                  >
                    Aprobar y generar código
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void onReject(req.id)}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Licencias</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 text-left">Negocio</th>
                <th className="px-3 py-2 text-left">Equipos</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {store.licenses.map((lic) => (
                <tr key={lic.id} className="border-t border-border">
                  <td className="px-3 py-2">{lic.businessName}</td>
                  <td className="px-3 py-2">
                    {countActiveDevices(store, lic.id)}/{lic.maxDevices}
                  </td>
                  <td className="px-3 py-2">{lic.status}</td>
                  <td className="px-3 py-2 space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy || lic.status !== "active"}
                      onClick={() => void onGenerateCode(lic.id)}
                    >
                      Código extra
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy || lic.status !== "active"}
                      onClick={() => void onSuspend(lic.id)}
                    >
                      Suspender
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Equipos activados</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 text-left">Negocio</th>
                <th className="px-3 py-2 text-left">Equipo</th>
                <th className="px-3 py-2 text-left">Activado</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left" />
              </tr>
            </thead>
            <tbody>
              {store.activations.map((act) => {
                const lic = store.licenses.find((l) => l.id === act.licenseId);
                return (
                  <tr key={act.id} className="border-t border-border">
                    <td className="px-3 py-2">{lic?.businessName ?? act.licenseId}</td>
                    <td className="px-3 py-2">{act.deviceLabel}</td>
                    <td className="px-3 py-2">
                      {new Date(act.activatedAt).toLocaleString("es-VE")}
                    </td>
                    <td className="px-3 py-2">
                      {act.revoked ? "Revocado" : "Activo"}
                    </td>
                    <td className="px-3 py-2">
                      {!act.revoked ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void onRevoke(act.id)}
                        >
                          Revocar
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Button type="button" variant="outline" disabled={busy} onClick={() => void reload()}>
        Actualizar
      </Button>
    </div>
  );
}
