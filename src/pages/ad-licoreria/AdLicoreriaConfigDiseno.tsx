import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  applySiteDesignToDom,
  fileToDataUrl,
  type AdSiteBanner,
  type AdSiteDesign,
} from "@/lib/ad-licoreria/site-design";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

/**
 * Admin · Diseño web del portal A&D (Home, colores, favicon, fondo, banners).
 * Mock local — sin API.
 */
export default function AdLicoreriaConfigDiseno() {
  const {
    siteDesign,
    updateSiteDesign,
    resetSiteDesign,
    hasPermission,
    getCurrentOperator,
  } = useAdLicoreria();

  const session = getCurrentOperator();
  const canEdit = hasPermission("settings.manage") || session?.role === "admin";

  const [draft, setDraft] = useState<AdSiteDesign>(() =>
    structuredClone(siteDesign),
  );
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<
    "marca" | "colores" | "home" | "banners"
  >("marca");

  const activeBanners = useMemo(
    () =>
      [...draft.banners]
        .filter((b) => b.active)
        .sort((a, b) => a.order - b.order),
    [draft.banners],
  );

  function patchDraft(partial: Partial<AdSiteDesign>) {
    setDraft((d) => ({ ...d, ...partial }));
  }

  function patchColor(key: keyof AdSiteDesign["colors"], value: string) {
    setDraft((d) => ({
      ...d,
      colors: { ...d.colors, [key]: value },
    }));
  }

  function save() {
    if (!canEdit) {
      setMsg("Sin permiso settings.manage");
      return;
    }
    const r = updateSiteDesign(draft, session?.name ?? "Admin");
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    applySiteDesignToDom(r.data);
    setDraft(structuredClone(r.data));
    setMsg("Diseño guardado (mock local · persiste en este navegador)");
  }

  function reset() {
    if (!canEdit) return;
    const r = resetSiteDesign(session?.name ?? "Admin");
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    applySiteDesignToDom(r.data);
    setDraft(structuredClone(r.data));
    setMsg("Diseño restablecido a valores A&D");
  }

  async function onFile(
    field: "logoUrl" | "faviconUrl" | "homeBackgroundUrl",
    file: File | null,
  ) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("Solo imágenes");
      return;
    }
    if (file.size > 2_500_000) {
      setMsg("Imagen demasiado grande (máx. ~2.5 MB en mock)");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    patchDraft({ [field]: dataUrl });
  }

  function addBanner() {
    const banner: AdSiteBanner = {
      id: `bn-${Date.now()}`,
      title: "Nuevo banner",
      subtitle: "",
      imageUrl: "",
      ctaLabel: "Ver más",
      ctaHref: AD_LICORERIA_ROUTES.inicio,
      active: true,
      order: draft.banners.length + 1,
    };
    patchDraft({ banners: [...draft.banners, banner] });
  }

  function updateBanner(id: string, patch: Partial<AdSiteBanner>) {
    patchDraft({
      banners: draft.banners.map((b) =>
        b.id === id ? { ...b, ...patch } : b,
      ),
    });
  }

  function removeBanner(id: string) {
    patchDraft({ banners: draft.banners.filter((b) => b.id !== id) });
  }

  if (!canEdit) {
    return (
      <div className="ad-panel space-y-2">
        <h1 className="ad-panel-title">Diseño web</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          Solo ADMIN con <code>settings.manage</code> puede editar el diseño.
        </p>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.configuracion}>
          Volver a configuración
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Administración visual</p>
          <h1 className="ad-panel-title">Diseño web</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ad-muted)]">
            Home, logo, favicon, fondo, colores y banners publicitarios del
            portal A&D. Mock local (sin API).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.home}>
            Ver Home
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.configuracion}>
            Config operativa
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["marca", "Marca / logo"],
            ["colores", "Colores"],
            ["home", "Home / fondo"],
            ["banners", "Banners"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`ad-btn ${tab === k ? "ad-btn--gold" : ""}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "marca" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[var(--ad-muted)] sm:col-span-2">
            Nombre de marca
            <input
              className="ad-input mt-1"
              value={draft.brandName}
              onChange={(e) => patchDraft({ brandName: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Tagline
            <input
              className="ad-input mt-1"
              value={draft.brandTagline}
              onChange={(e) => patchDraft({ brandTagline: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Descripción
            <textarea
              className="ad-input mt-1 min-h-[5rem]"
              value={draft.brandDescription}
              onChange={(e) =>
                patchDraft({ brandDescription: e.target.value })
              }
            />
          </label>
          <div className="space-y-2">
            <p className="text-sm text-[var(--ad-muted)]">Logo</p>
            <input
              className="ad-input"
              placeholder="URL o data URL"
              value={draft.logoUrl}
              onChange={(e) => patchDraft({ logoUrl: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              className="text-xs text-[var(--ad-muted)]"
              onChange={(e) => onFile("logoUrl", e.target.files?.[0] ?? null)}
            />
            {draft.logoUrl ? (
              <img
                src={draft.logoUrl}
                alt="Logo preview"
                className="mt-2 h-16 w-16 object-contain border border-[var(--ad-line)]"
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-[var(--ad-muted)]">Favicon</p>
            <input
              className="ad-input"
              placeholder="URL favicon"
              value={draft.faviconUrl}
              onChange={(e) => patchDraft({ faviconUrl: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              className="text-xs text-[var(--ad-muted)]"
              onChange={(e) =>
                onFile("faviconUrl", e.target.files?.[0] ?? null)
              }
            />
          </div>
        </section>
      ) : null}

      {tab === "colores" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["bg", "Fondo"],
              ["panel", "Paneles"],
              ["gold", "Acento / oro"],
              ["burgundy", "Borgoña"],
              ["text", "Texto"],
              ["muted", "Texto secundario"],
              ["success", "Éxito"],
              ["danger", "Peligro"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm text-[var(--ad-muted)]">
              {label}
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  className="h-10 w-12 cursor-pointer border border-[var(--ad-line)] bg-transparent"
                  value={draft.colors[key]}
                  onChange={(e) => patchColor(key, e.target.value)}
                />
                <input
                  className="ad-input"
                  value={draft.colors[key]}
                  onChange={(e) => patchColor(key, e.target.value)}
                />
              </div>
            </label>
          ))}
          <div className="sm:col-span-2 lg:col-span-4 rounded border border-[var(--ad-line)] p-4"
            style={{
              background: draft.colors.panel,
              color: draft.colors.text,
            }}
          >
            <p style={{ color: draft.colors.gold }} className="ad-display text-2xl">
              Vista previa · {draft.brandName}
            </p>
            <p style={{ color: draft.colors.muted }} className="text-sm">
              {draft.brandTagline}
            </p>
          </div>
        </section>
      ) : null}

      {tab === "home" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[var(--ad-muted)]">
            Eyebrow Home
            <input
              className="ad-input mt-1"
              value={draft.homeHeroEyebrow}
              onChange={(e) =>
                patchDraft({ homeHeroEyebrow: e.target.value })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Overlay fondo (CSS)
            <input
              className="ad-input mt-1"
              value={draft.homeBackgroundOverlay}
              onChange={(e) =>
                patchDraft({ homeBackgroundOverlay: e.target.value })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            CTA primario
            <input
              className="ad-input mt-1"
              value={draft.homePrimaryCta}
              onChange={(e) => patchDraft({ homePrimaryCta: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            CTA secundario
            <input
              className="ad-input mt-1"
              value={draft.homeSecondaryCta}
              onChange={(e) =>
                patchDraft({ homeSecondaryCta: e.target.value })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)] sm:col-span-2">
            CTA terciario
            <input
              className="ad-input mt-1"
              value={draft.homeTertiaryCta}
              onChange={(e) =>
                patchDraft({ homeTertiaryCta: e.target.value })
              }
            />
          </label>
          <div className="sm:col-span-2 space-y-2">
            <p className="text-sm text-[var(--ad-muted)]">Fondo Home</p>
            <input
              className="ad-input"
              placeholder="URL de imagen de fondo"
              value={draft.homeBackgroundUrl}
              onChange={(e) =>
                patchDraft({ homeBackgroundUrl: e.target.value })
              }
            />
            <input
              type="file"
              accept="image/*"
              className="text-xs text-[var(--ad-muted)]"
              onChange={(e) =>
                onFile("homeBackgroundUrl", e.target.files?.[0] ?? null)
              }
            />
            {draft.homeBackgroundUrl ? (
              <div
                className="mt-2 h-32 rounded border border-[var(--ad-line)] bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(${draft.homeBackgroundOverlay}, ${draft.homeBackgroundOverlay}), url(${draft.homeBackgroundUrl})`,
                }}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === "banners" ? (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="ad-btn ad-btn--gold" onClick={addBanner}>
              Agregar banner
            </button>
            <span className="text-sm text-[var(--ad-muted)] self-center">
              Activos en Home: {activeBanners.length}
            </span>
          </div>
          {draft.banners
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((b) => (
              <article key={b.id} className="ad-panel grid gap-2 sm:grid-cols-2">
                <label className="text-sm text-[var(--ad-muted)]">
                  Título
                  <input
                    className="ad-input mt-1"
                    value={b.title}
                    onChange={(e) =>
                      updateBanner(b.id, { title: e.target.value })
                    }
                  />
                </label>
                <label className="text-sm text-[var(--ad-muted)]">
                  Subtítulo
                  <input
                    className="ad-input mt-1"
                    value={b.subtitle ?? ""}
                    onChange={(e) =>
                      updateBanner(b.id, { subtitle: e.target.value })
                    }
                  />
                </label>
                <label className="text-sm text-[var(--ad-muted)]">
                  Imagen URL
                  <input
                    className="ad-input mt-1"
                    value={b.imageUrl ?? ""}
                    onChange={(e) =>
                      updateBanner(b.id, { imageUrl: e.target.value })
                    }
                  />
                </label>
                <label className="text-sm text-[var(--ad-muted)]">
                  Orden
                  <input
                    className="ad-input mt-1"
                    type="number"
                    value={b.order}
                    onChange={(e) =>
                      updateBanner(b.id, { order: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="text-sm text-[var(--ad-muted)]">
                  CTA texto
                  <input
                    className="ad-input mt-1"
                    value={b.ctaLabel ?? ""}
                    onChange={(e) =>
                      updateBanner(b.id, { ctaLabel: e.target.value })
                    }
                  />
                </label>
                <label className="text-sm text-[var(--ad-muted)]">
                  CTA enlace
                  <input
                    className="ad-input mt-1"
                    value={b.ctaHref ?? ""}
                    onChange={(e) =>
                      updateBanner(b.id, { ctaHref: e.target.value })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={b.active}
                    onChange={(e) =>
                      updateBanner(b.id, { active: e.target.checked })
                    }
                  />
                  Activo
                </label>
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => removeBanner(b.id)}
                >
                  Eliminar
                </button>
              </article>
            ))}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="ad-btn ad-btn--gold" onClick={save}>
          Guardar diseño
        </button>
        <button type="button" className="ad-btn" onClick={reset}>
          Restablecer
        </button>
      </div>
      {msg ? (
        <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
      ) : null}
      {siteDesign.updatedAt ? (
        <p className="text-xs text-[var(--ad-muted)]">
          Último guardado:{" "}
          {new Date(siteDesign.updatedAt).toLocaleString("es-VE")}
          {siteDesign.updatedBy ? ` · ${siteDesign.updatedBy}` : ""}
        </p>
      ) : null}
    </div>
  );
}
