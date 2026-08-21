import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurCrest } from "@/components/polisur/PolisurCrest";
import { PolisurPreinscripcionesAdmin } from "@/components/polisur/PolisurPreinscripcionesAdmin";
import { PolisurSiteAdmin } from "@/components/polisur/PolisurSiteAdmin";
import { POLISUR_ASSET_SLOTS } from "@/content/polisur-asset-slots";
import { POLISUR_SESSION_KEY } from "@/content/polisur-preinscripcion";

const SESSION_KEY = POLISUR_SESSION_KEY;
const NUEVO_CONCEPTO = "__nuevo__";

const CARPETAS = [
  { id: "logo", label: "Logos / insignias" },
  { id: "home", label: "Home" },
  { id: "unidad-canina", label: "Unidad Canina" },
  { id: "extras", label: "Otros (sin asignar aún)" },
] as const;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function extensionFromFile(file: File | null, folder: string) {
  const type = file?.type || "";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  return folder === "home" || folder === "unidad-canina" ? "jpg" : "png";
}

type SlotState = {
  path: string;
  status: "MISSING" | "EMPTY" | "OK" | "UNKNOWN";
  bytes: number;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

async function readApiJson(res: Response): Promise<{
  ok?: boolean;
  error?: string;
  slots?: SlotState[];
  path?: string;
}> {
  const text = await res.text();
  try {
    return JSON.parse(text) as {
      ok?: boolean;
      error?: string;
      slots?: SlotState[];
      path?: string;
    };
  } catch {
    throw new Error(
      res.ok
        ? "El servidor no devolvió una respuesta válida."
        : `No se pudo contactar el registro documental (${res.status}).`,
    );
  }
}

export default function PolisurMedios() {
  const [clave, setClave] = useState("");
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    POLISUR_ASSET_SLOTS[0].id,
  );
  const [file, setFile] = useState<File | null>(null);
  const [concepto, setConcepto] = useState("");
  const [carpeta, setCarpeta] =
    useState<(typeof CARPETAS)[number]["id"]>("logo");
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [modulo, setModulo] = useState<
    "sitio" | "documentos" | "preinscripciones"
  >("sitio");

  const selected = useMemo(
    () => POLISUR_ASSET_SLOTS.find((s) => s.id === selectedId) ?? null,
    [selectedId],
  );

  const customPath = useMemo(() => {
    const slug = slugify(concepto) || "concepto";
    const ext = extensionFromFile(file, carpeta);
    return `public/polisur/${carpeta}/${slug}.${ext}`;
  }, [concepto, carpeta, file]);

  const destinationPath = selected?.path ?? customPath;

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setClave(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed || !clave) return;
    void refreshStatus(clave);
  }, [authed, clave]);

  async function refreshStatus(currentClave: string) {
    try {
      const res = await fetch(
        `/api/polisur-medios?action=status&clave=${encodeURIComponent(currentClave)}`,
      );
      if (!res.ok) {
        // En Vercel status puede no listar disco; no es bloqueante.
        setSlots(
          POLISUR_ASSET_SLOTS.map((s) => ({
            path: s.path,
            status: "UNKNOWN" as const,
            bytes: 0,
          })),
        );
        return;
      }
      const data = await res.json();
      if (data.slots) setSlots(data.slots);
    } catch {
      setSlots(
        POLISUR_ASSET_SLOTS.map((s) => ({
          path: s.path,
          status: "UNKNOWN" as const,
          bytes: 0,
        })),
      );
    }
  }

  async function onAuth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/polisur-medios?action=auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: clave.trim() }),
      });
      const data = await readApiJson(res);
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Clave institucional no válida.");
      }
      sessionStorage.setItem(SESSION_KEY, clave);
      setAuthed(true);
      setMessage("Identificación aceptada. Puede registrar material fotográfico.");
    } catch (err) {
      setAuthed(false);
      sessionStorage.removeItem(SESSION_KEY);
      setError(err instanceof Error ? err.message : "Error de acceso.");
    } finally {
      setBusy(false);
    }
  }

  function onLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setClave("");
    setFile(null);
    setMessage(null);
    setError(null);
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Seleccione una fotografía o logo.");
      return;
    }
    if (selectedId === NUEVO_CONCEPTO && !slugify(concepto)) {
      setError("Escriba un nombre de concepto para renombrar el archivo.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const dataBase64 = await readFileAsDataUrl(file);
      const res = await fetch("/api/polisur-medios?action=upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clave,
          path: destinationPath,
          dataBase64,
        }),
      });
      const data = await readApiJson(res);
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo registrar el archivo.");
      }
      setMessage(`Registrado: ${destinationPath}`);
      setFile(null);
      await refreshStatus(clave);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(path: string) {
    const short = path.replace("public/polisur/", "");
    const ok = window.confirm(
      `¿Eliminar ${short} del registro? Esta acción borra el archivo del repositorio.`,
    );
    if (!ok) return;
    setDeletingPath(path);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/polisur-medios?action=delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave, path }),
      });
      const data = await readApiJson(res);
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo eliminar el archivo.");
      }
      setMessage(`Eliminado: ${path}`);
      await refreshStatus(clave);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setDeletingPath(null);
    }
  }

  return (
    <>
      <PageMeta
        title="Registro documental — POLISUR"
        description="Acceso institucional para registro de material fotográfico oficial."
      />

      <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]">
        <div className="ps-container py-12 sm:py-16">
          <div className="flex items-start gap-4">
            <PolisurCrest size="lg" />
            <div>
              <p className="ps-eyebrow">Uso interno</p>
              <h1 className="mt-2 text-3xl text-[var(--ps-white)] sm:text-4xl">
                Registro documental
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ps-steel-300)]">
                Área reservada para la carga de material fotográfico e insignias
                oficiales. Las imágenes se conservan sin alteraciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--ps-navy-900)]">
        <div className="ps-container max-w-4xl py-12 sm:py-16">
          {!authed ? (
            <form onSubmit={onAuth} noValidate className="space-y-6">
              <div>
                <p className="ps-eyebrow">Identificación institucional</p>
                <h2 className="mt-3 text-2xl text-[var(--ps-white)]">
                  Acceso institucional
                </h2>
                <p className="mt-3 text-sm text-[var(--ps-steel-400)]">
                  Ingrese la clave institucional para editar el contenido del
                  portal, documentos y preinscripciones.
                </p>
              </div>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--ps-steel-400)]">
                  Clave de acceso
                </span>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="mt-2 w-full border border-[var(--ps-line-strong)] bg-[var(--ps-navy-950)] px-3 py-3 text-sm text-[var(--ps-paper)] outline-none focus:border-[var(--ps-mint)]/60"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="border-b border-[var(--ps-mint)]/70 pb-1 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ps-paper)] disabled:opacity-50"
              >
                {busy ? "Verificando…" : "Ingresar"}
              </button>
            </form>
          ) : (
            <div className="space-y-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="ps-eyebrow">Sesión activa</p>
                  <h2 className="mt-2 text-2xl text-[var(--ps-white)]">
                    {modulo === "preinscripciones"
                      ? "Preinscripciones"
                      : modulo === "sitio"
                        ? "Contenido de la web"
                        : "Carga de material"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)] underline-offset-4 hover:text-[var(--ps-paper)] hover:underline"
                >
                  Cerrar sesión
                </button>
              </div>

              <div className="flex flex-wrap gap-6 border-b border-[var(--ps-line)]">
                <button
                  type="button"
                  onClick={() => setModulo("sitio")}
                  className={
                    modulo === "sitio"
                      ? "border-b border-[var(--ps-mint)] pb-2 text-xs uppercase tracking-[0.14em] text-[var(--ps-white)]"
                      : "pb-2 text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)]"
                  }
                >
                  Sitio web
                </button>
                <button
                  type="button"
                  onClick={() => setModulo("preinscripciones")}
                  className={
                    modulo === "preinscripciones"
                      ? "border-b border-[var(--ps-mint)] pb-2 text-xs uppercase tracking-[0.14em] text-[var(--ps-white)]"
                      : "pb-2 text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)]"
                  }
                >
                  Preinscripciones
                </button>
                <button
                  type="button"
                  onClick={() => setModulo("documentos")}
                  className={
                    modulo === "documentos"
                      ? "border-b border-[var(--ps-mint)] pb-2 text-xs uppercase tracking-[0.14em] text-[var(--ps-white)]"
                      : "pb-2 text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)]"
                  }
                >
                  Documentos
                </button>
              </div>

              {modulo === "sitio" ? (
                <PolisurSiteAdmin clave={clave} />
              ) : null}

              {modulo === "preinscripciones" ? (
                <PolisurPreinscripcionesAdmin clave={clave} tone="polisur" />
              ) : null}

              {modulo === "documentos" ? (
                <>
              <form onSubmit={onUpload} noValidate className="space-y-6">
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.16em] text-[var(--ps-steel-400)]">
                    Destino documental
                  </span>
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="mt-2 w-full border border-[var(--ps-line-strong)] bg-[var(--ps-navy-950)] px-3 py-3 text-sm text-[var(--ps-paper)] outline-none focus:border-[var(--ps-mint)]/60"
                  >
                    {POLISUR_ASSET_SLOTS.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label} — {slot.path.replace("public/", "")}
                      </option>
                    ))}
                    <option value={NUEVO_CONCEPTO}>
                      Nuevo concepto — nombrar y guardar
                    </option>
                  </select>
                </label>

                {selectedId === NUEVO_CONCEPTO ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-[var(--ps-steel-400)]">
                        Nombre del concepto
                      </span>
                      <input
                        type="text"
                        value={concepto}
                        onChange={(e) => setConcepto(e.target.value)}
                        placeholder="Ej. VISIPOL, Cuadrantes de Paz"
                        className="mt-2 w-full border border-[var(--ps-line-strong)] bg-[var(--ps-navy-950)] px-3 py-3 text-sm text-[var(--ps-paper)] outline-none focus:border-[var(--ps-mint)]/60"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-[var(--ps-steel-400)]">
                        Carpeta
                      </span>
                      <select
                        value={carpeta}
                        onChange={(e) =>
                          setCarpeta(
                            e.target.value as (typeof CARPETAS)[number]["id"],
                          )
                        }
                        className="mt-2 w-full border border-[var(--ps-line-strong)] bg-[var(--ps-navy-950)] px-3 py-3 text-sm text-[var(--ps-paper)] outline-none focus:border-[var(--ps-mint)]/60"
                      >
                        {CARPETAS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.16em] text-[var(--ps-steel-400)]">
                    Archivo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="mt-2 block w-full text-sm text-[var(--ps-steel-300)] file:mr-4 file:border file:border-[var(--ps-line-strong)] file:bg-transparent file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-[0.12em] file:text-[var(--ps-paper)]"
                  />
                </label>

                <p className="text-xs leading-relaxed text-[var(--ps-steel-400)]">
                  Se registrará exactamente en{" "}
                  <span className="text-[var(--ps-steel-300)]">
                    {destinationPath}
                  </span>
                  . No se modifican rostros, uniformes ni el contenido visual.
                </p>

                <button
                  type="submit"
                  disabled={busy}
                  className="border-b border-[var(--ps-mint)]/70 pb-1 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ps-paper)] disabled:opacity-50"
                >
                  {busy ? "Registrando…" : "Registrar material"}
                </button>
              </form>

              {slots.length > 0 ? (
                <div>
                  <p className="ps-eyebrow">Archivos registrados</p>
                  <ul className="mt-4 divide-y divide-[var(--ps-line)] border-y border-[var(--ps-line)]">
                    {slots.map((slot) => (
                      <li
                        key={slot.path}
                        className="flex items-center justify-between gap-3 py-3 text-sm"
                      >
                        <span className="min-w-0 truncate text-[var(--ps-steel-300)]">
                          {slot.path.replace("public/polisur/", "")}
                        </span>
                        <button
                          type="button"
                          disabled={Boolean(deletingPath) || busy}
                          onClick={() => void onDelete(slot.path)}
                          className="shrink-0 text-xs uppercase tracking-[0.12em] text-[var(--ps-steel-400)] underline-offset-4 hover:text-[var(--ps-paper)] hover:underline disabled:opacity-50"
                        >
                          {deletingPath === slot.path
                            ? "Eliminando…"
                            : "Eliminar"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
                </>
              ) : null}
            </div>
          )}

          {message ? (
            <p className="mt-8 border-l-2 border-[var(--ps-mint)]/70 pl-3 text-sm text-[var(--ps-paper)]">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-8 border-l-2 border-red-500/70 pl-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
