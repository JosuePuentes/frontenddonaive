import { useEffect, useState, type FormEvent } from "react";
import {
  mergePolisurSiteContent,
  normalizePolisurNewsItem,
  type PolisurNewsItem,
  type PolisurSiteContent,
} from "@/content/polisur-site";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

type Props = { clave: string };

const inputClass =
  "mt-2 w-full border border-[var(--ps-line-strong)] bg-[var(--ps-navy-950)] px-3 py-3 text-sm text-[var(--ps-paper)] outline-none focus:border-[var(--ps-mint)]/60";

const labelClass =
  "text-xs uppercase tracking-[0.16em] text-[var(--ps-steel-400)]";

type Tab = "contacto" | "redes" | "banner" | "noticias";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function PolisurSiteAdmin({ clave }: Props) {
  const { site: liveSite, setSiteLocal, refresh } = usePolisurSite();
  const [draft, setDraft] = useState<PolisurSiteContent>(liveSite);
  const [tab, setTab] = useState<Tab>("contacto");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(liveSite);
  }, [liveSite]);

  function updateContact<K extends keyof PolisurSiteContent["contact"]>(
    key: K,
    value: PolisurSiteContent["contact"][K],
  ) {
    setDraft((prev) => ({
      ...prev,
      contact: { ...prev.contact, [key]: value },
    }));
  }

  function updateSocial<K extends keyof PolisurSiteContent["social"]>(
    key: K,
    value: PolisurSiteContent["social"][K],
  ) {
    setDraft((prev) => ({
      ...prev,
      social: { ...prev.social, [key]: value },
    }));
  }

  function updateBanner<K extends keyof PolisurSiteContent["banner"]>(
    key: K,
    value: PolisurSiteContent["banner"][K],
  ) {
    setDraft((prev) => ({
      ...prev,
      banner: { ...prev.banner, [key]: value },
    }));
  }

  function addNews() {
    const item = normalizePolisurNewsItem({
      title: "Nueva noticia",
      summary: "",
      body: "",
      imageUrl: "",
      published: false,
      publishedAt: new Date().toISOString(),
    });
    setDraft((prev) => ({ ...prev, news: [item, ...prev.news] }));
    setEditingNewsId(item.id);
    setTab("noticias");
  }

  function updateNews(id: string, patch: Partial<PolisurNewsItem>) {
    setDraft((prev) => ({
      ...prev,
      news: prev.news.map((n) =>
        n.id === id ? normalizePolisurNewsItem({ ...n, ...patch }) : n,
      ),
    }));
  }

  function removeNews(id: string) {
    setDraft((prev) => ({
      ...prev,
      news: prev.news.filter((n) => n.id !== id),
    }));
    if (editingNewsId === id) setEditingNewsId(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const payload = mergePolisurSiteContent(draft);
      const res = await fetch("/api/polisur-site?action=save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave, site: payload }),
      });
      const text = await res.text();
      let data: { ok?: boolean; site?: PolisurSiteContent; error?: string } = {};
      try {
        data = JSON.parse(text) as typeof data;
      } catch {
        throw new Error("El servidor no respondió correctamente.");
      }
      if (!res.ok || !data.ok || !data.site) {
        throw new Error(data.error || "No se pudo guardar.");
      }
      const next = mergePolisurSiteContent(data.site);
      setDraft(next);
      setSiteLocal(next);
      setMessage("Contenido del portal guardado.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "contacto", label: "Contacto" },
    { id: "redes", label: "Redes" },
    { id: "banner", label: "Banner" },
    { id: "noticias", label: "Noticias" },
  ];

  return (
    <form onSubmit={onSave} className="space-y-8" noValidate>
      <div>
        <p className="ps-eyebrow">Portal público</p>
        <h3 className="mt-2 text-xl text-[var(--ps-white)]">
          Contenido de la web
        </h3>
        <p className="mt-2 text-sm text-[var(--ps-steel-400)]">
          Contactos, redes, banner y noticias del portal. Las fotos se cargan
          en Documentos; aquí indica la URL pública (ej.{" "}
          <code className="text-[var(--ps-mint)]">/polisur/home/hero.jpg</code>
          ).
        </p>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-[var(--ps-line)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "border-b border-[var(--ps-mint)] pb-2 text-xs uppercase tracking-[0.14em] text-[var(--ps-white)]"
                : "pb-2 text-xs uppercase tracking-[0.14em] text-[var(--ps-steel-400)]"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "contacto" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dirección / sede">
            <textarea
              rows={2}
              className={inputClass}
              value={draft.contact.address}
              onChange={(e) => updateContact("address", e.target.value)}
            />
          </Field>
          <Field label="Nota de atención">
            <textarea
              rows={2}
              className={inputClass}
              value={draft.contact.note}
              onChange={(e) => updateContact("note", e.target.value)}
            />
          </Field>
          <Field label="Teléfono principal">
            <input
              className={inputClass}
              value={draft.contact.phone}
              onChange={(e) => updateContact("phone", e.target.value)}
              placeholder="Ej. 0261-0000000"
            />
          </Field>
          <Field label="Teléfono alterno">
            <input
              className={inputClass}
              value={draft.contact.phoneAlt}
              onChange={(e) => updateContact("phoneAlt", e.target.value)}
            />
          </Field>
          <Field label="Correo institucional">
            <input
              type="email"
              className={inputClass}
              value={draft.contact.email}
              onChange={(e) => updateContact("email", e.target.value)}
            />
          </Field>
          <Field label="Horario de atención">
            <input
              className={inputClass}
              value={draft.contact.hours}
              onChange={(e) => updateContact("hours", e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {tab === "redes" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["facebook", "Facebook"],
              ["instagram", "Instagram"],
              ["twitter", "X / Twitter"],
              ["youtube", "YouTube"],
              ["tiktok", "TikTok"],
              ["whatsapp", "WhatsApp (enlace wa.me)"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputClass}
                value={draft.social[key]}
                onChange={(e) => updateSocial(key, e.target.value)}
                placeholder="https://"
              />
            </Field>
          ))}
        </div>
      ) : null}

      {tab === "banner" ? (
        <div className="grid gap-4">
          <Field label="Título del banner">
            <input
              className={inputClass}
              value={draft.banner.title}
              onChange={(e) => updateBanner("title", e.target.value)}
            />
          </Field>
          <Field label="Subtítulo">
            <input
              className={inputClass}
              value={draft.banner.subtitle}
              onChange={(e) => updateBanner("subtitle", e.target.value)}
            />
          </Field>
          <Field label="Mensaje">
            <textarea
              rows={3}
              className={inputClass}
              value={draft.banner.message}
              onChange={(e) => updateBanner("message", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texto botón principal">
              <input
                className={inputClass}
                value={draft.banner.ctaPrimary}
                onChange={(e) => updateBanner("ctaPrimary", e.target.value)}
              />
            </Field>
            <Field label="Texto botón secundario">
              <input
                className={inputClass}
                value={draft.banner.ctaSecondary}
                onChange={(e) => updateBanner("ctaSecondary", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Imagen del banner (URL pública)">
            <input
              className={inputClass}
              value={draft.banner.imageUrl}
              onChange={(e) => updateBanner("imageUrl", e.target.value)}
              placeholder="/polisur/home/hero.jpg"
            />
          </Field>
        </div>
      ) : null}

      {tab === "noticias" ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--ps-steel-400)]">
              {draft.news.length} noticia(s). Solo las publicadas aparecen en
              la web.
            </p>
            <button
              type="button"
              onClick={addNews}
              className="text-xs uppercase tracking-[0.14em] text-[var(--ps-mint)] underline-offset-4 hover:underline"
            >
              Agregar noticia
            </button>
          </div>
          {draft.news.length === 0 ? (
            <p className="text-sm text-[var(--ps-steel-400)]">
              Aún no hay noticias.
            </p>
          ) : (
            <ul className="space-y-4">
              {draft.news.map((n) => {
                const open = editingNewsId === n.id;
                return (
                  <li
                    key={n.id}
                    className="border border-[var(--ps-line)] bg-[var(--ps-navy-950)]/60 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingNewsId(open ? null : n.id)}
                        className="text-left text-sm text-[var(--ps-paper)] hover:underline"
                      >
                        {n.title || "Sin título"}
                        {!n.published ? (
                          <span className="ml-2 text-xs text-[var(--ps-steel-400)]">
                            (borrador)
                          </span>
                        ) : null}
                      </button>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 text-xs text-[var(--ps-steel-300)]">
                          <input
                            type="checkbox"
                            checked={n.published}
                            onChange={(e) =>
                              updateNews(n.id, { published: e.target.checked })
                            }
                          />
                          Publicada
                        </label>
                        <button
                          type="button"
                          onClick={() => removeNews(n.id)}
                          className="text-xs uppercase tracking-[0.12em] text-red-300/80 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {open ? (
                      <div className="mt-4 grid gap-3">
                        <Field label="Título">
                          <input
                            className={inputClass}
                            value={n.title}
                            onChange={(e) =>
                              updateNews(n.id, { title: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Resumen">
                          <textarea
                            rows={2}
                            className={inputClass}
                            value={n.summary}
                            onChange={(e) =>
                              updateNews(n.id, { summary: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Cuerpo">
                          <textarea
                            rows={5}
                            className={inputClass}
                            value={n.body}
                            onChange={(e) =>
                              updateNews(n.id, { body: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Imagen (URL pública)">
                          <input
                            className={inputClass}
                            value={n.imageUrl}
                            onChange={(e) =>
                              updateNews(n.id, { imageUrl: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Fecha de publicación">
                          <input
                            className={inputClass}
                            value={n.publishedAt}
                            onChange={(e) =>
                              updateNews(n.id, { publishedAt: e.target.value })
                            }
                          />
                        </Field>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--ps-line)] pt-6">
        <button
          type="submit"
          disabled={busy}
          className="border-b border-[var(--ps-mint)]/70 pb-1 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ps-paper)] disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar contenido"}
        </button>
        {draft.updatedAt ? (
          <span className="text-xs text-[var(--ps-steel-400)]">
            Última actualización:{" "}
            {new Date(draft.updatedAt).toLocaleString("es-VE")}
          </span>
        ) : null}
      </div>

      {message ? (
        <p className="border-l-2 border-[var(--ps-mint)]/70 pl-3 text-sm text-[var(--ps-paper)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="border-l-2 border-red-500/70 pl-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </form>
  );
}
