import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { fileToDataUrl } from "@/services/ad-licoreria/design/apply";
import { adDesignRepository } from "@/services/ad-licoreria/design/repository";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import {
  AD_TYPOGRAPHY_PRESETS,
  type AdHeroAlign,
  type AdSiteBanner,
  type AdSiteDesign,
  type AdTypographyPreset,
} from "@/types/ad-licoreria-design";

type Tab =
  | "marca"
  | "tema"
  | "tipo"
  | "hero"
  | "secciones"
  | "destacados"
  | "banners"
  | "galeria"
  | "popup"
  | "footer"
  | "seo";

const COLOR_FIELDS: { key: keyof AdSiteDesign["colors"]; label: string }[] = [
  { key: "primary", label: "Principal" },
  { key: "secondary", label: "Secundario" },
  { key: "bg", label: "Fondo" },
  { key: "bgAlt", label: "Fondo alt." },
  { key: "panel", label: "Panel" },
  { key: "card", label: "Tarjetas" },
  { key: "text", label: "Texto" },
  { key: "muted", label: "Texto sec." },
  { key: "border", label: "Bordes" },
  { key: "success", label: "Éxito" },
  { key: "danger", label: "Peligro" },
  { key: "warning", label: "Advertencia" },
  { key: "button", label: "Botones" },
  { key: "buttonHover", label: "Hover botón" },
];

/**
 * Admin · Diseño web completo (Fase 10.3).
 * Borrador → Guardar → Publicar. Preview sin guardar.
 */
export default function AdLicoreriaConfigDiseno() {
  const {
    siteDesign,
    saveSiteDesignDraft,
    publishSiteDesign,
    discardSiteDesignDraft,
    getSiteDesignDraft,
    resetSiteDesign,
    hasPermission,
    getCurrentOperator,
  } = useAdLicoreria();

  const navigate = useNavigate();
  const session = getCurrentOperator();
  const canEdit = hasPermission("settings.manage") || session?.role === "admin";
  const userName = session?.name ?? "Admin";

  const [draft, setDraft] = useState<AdSiteDesign>(() =>
    structuredClone(getSiteDesignDraft()),
  );
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<Tab>("marca");
  const [editingBanner, setEditingBanner] = useState<string | null>(null);

  const publishedAt = siteDesign.publishedAt;

  function patch(partial: Partial<AdSiteDesign>) {
    setDraft((d) => ({ ...d, ...partial }));
  }

  function patchBrand(partial: Partial<AdSiteDesign["brand"]>) {
    setDraft((d) => ({ ...d, brand: { ...d.brand, ...partial } }));
  }

  function patchColor(key: keyof AdSiteDesign["colors"], value: string) {
    setDraft((d) => {
      const colors = { ...d.colors, [key]: value };
      if (key === "primary") colors.gold = value;
      if (key === "secondary") colors.burgundy = value;
      return { ...d, colors };
    });
  }

  function patchHero(partial: Partial<AdSiteDesign["hero"]>) {
    setDraft((d) => ({ ...d, hero: { ...d.hero, ...partial } }));
  }

  async function onImage(
    setter: (url: string) => void,
    file: File | null,
  ) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("Solo imágenes");
      return;
    }
    if (file.size > 2_500_000) {
      setMsg("Máx. ~2.5 MB en mock");
      return;
    }
    setter(await fileToDataUrl(file));
  }

  function save() {
    if (!canEdit) return;
    const r = saveSiteDesignDraft(draft, userName);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setDraft(structuredClone(r.data));
    setMsg("Borrador guardado (aún no publicado en Home)");
  }

  function publish() {
    if (!canEdit) return;
    const saved = saveSiteDesignDraft(draft, userName);
    if (!saved.ok) {
      setMsg(saved.error);
      return;
    }
    const r = publishSiteDesign(userName);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setDraft(structuredClone(r.data));
    setMsg("✓ Cambios publicados — el Home ya usa esta configuración");
  }

  function discard() {
    if (!canEdit) return;
    const r = discardSiteDesignDraft();
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setDraft(structuredClone(r.data));
    setMsg("Cambios descartados — se restauró el último borrador guardado");
  }

  function preview() {
    adDesignRepository.setPreviewSession(draft);
    navigate(AD_LICORERIA_ROUTES.configDisenoPreview);
  }

  function restore() {
    if (!canEdit) return;
    if (
      !window.confirm(
        "¿Restaurar el diseño predeterminado A&D?\nSolo afecta la configuración visual (no productos ni datos operativos).",
      )
    ) {
      return;
    }
    const r = resetSiteDesign(userName);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setDraft(structuredClone(r.data));
    setMsg("Diseño predeterminado restaurado y publicado");
  }

  function moveSection(id: string, dir: "up" | "down") {
    const sorted = [...draft.sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= sorted.length) return;
    const a = sorted[idx].order;
    sorted[idx] = { ...sorted[idx], order: sorted[swap].order };
    sorted[swap] = { ...sorted[swap], order: a };
    patch({ sections: sorted });
  }

  function updateBanner(id: string, partial: Partial<AdSiteBanner>) {
    patch({
      banners: draft.banners.map((b) =>
        b.id === id ? { ...b, ...partial } : b,
      ),
    });
  }

  const sortedBanners = useMemo(
    () => [...draft.banners].sort((a, b) => a.order - b.order),
    [draft.banners],
  );

  if (!canEdit) {
    return (
      <div className="ad-panel space-y-2">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          Solo ADMIN o usuarios con <code>settings.manage</code>.
        </p>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.configuracion}>
          Volver
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "marca", label: "Marca" },
    { id: "tema", label: "Tema" },
    { id: "tipo", label: "Tipografía" },
    { id: "hero", label: "Hero" },
    { id: "secciones", label: "Secciones" },
    { id: "destacados", label: "Destacados" },
    { id: "banners", label: "Banners" },
    { id: "galeria", label: "Galería" },
    { id: "popup", label: "Popup" },
    { id: "footer", label: "Footer" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Administración visual</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Diseño web
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ad-muted)]">
            Controla la apariencia del portal público. Borrador → Publicar.
            Mock localStorage · preparado para API.
          </p>
          <p className="mt-1 text-xs text-[var(--ad-muted)]">
            Publicado:{" "}
            {publishedAt
              ? new Date(publishedAt).toLocaleString("es-VE")
              : "defaults"}
            {siteDesign.publishedBy ? ` · ${siteDesign.publishedBy}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ad-btn ad-btn--gold" onClick={preview}>
            PREVISUALIZAR HOME
          </button>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.home}>
            Home publicado
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 sticky top-0 z-10 bg-[var(--ad-bg)] py-2">
        <button type="button" className="ad-btn ad-btn--gold" onClick={save}>
          GUARDAR CAMBIOS
        </button>
        <button type="button" className="ad-btn ad-btn--gold" onClick={publish}>
          PUBLICAR CAMBIOS
        </button>
        <button type="button" className="ad-btn" onClick={discard}>
          DESCARTAR CAMBIOS
        </button>
        <button type="button" className="ad-btn" onClick={preview}>
          VISTA PREVIA
        </button>
        <button type="button" className="ad-btn" onClick={restore}>
          RESTAURAR DISEÑO PREDETERMINADO
        </button>
      </div>
      {msg ? (
        <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
      ) : null}

      <div className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ad-btn ${tab === t.id ? "ad-btn--gold" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "marca" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2">
          {(
            [
              ["commercialName", "Nombre comercial"],
              ["shortName", "Nombre corto"],
              ["tagline", "Tagline"],
              ["phone", "Teléfono"],
              ["whatsapp", "WhatsApp"],
              ["address", "Dirección"],
              ["instagram", "Instagram"],
              ["facebook", "Facebook"],
              ["tiktok", "TikTok"],
              ["schedule", "Horario"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm text-[var(--ad-muted)]">
              {label}
              <input
                className="ad-input mt-1"
                value={draft.brand[key]}
                onChange={(e) => patchBrand({ [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="text-sm text-[var(--ad-muted)] sm:col-span-2">
            Descripción
            <textarea
              className="ad-input mt-1 min-h-[4rem]"
              value={draft.brand.description}
              onChange={(e) => patchBrand({ description: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)] sm:col-span-2">
            Texto legal / footer
            <textarea
              className="ad-input mt-1 min-h-[3rem]"
              value={draft.brand.legalText}
              onChange={(e) => patchBrand({ legalText: e.target.value })}
            />
          </label>
          {(
            [
              ["logoUrl", "Logo principal"],
              ["logoAltUrl", "Logo alternativo"],
              ["faviconUrl", "Favicon"],
              ["socialImageUrl", "Imagen social / share"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <p className="text-sm text-[var(--ad-muted)]">{label}</p>
              <input
                className="ad-input"
                value={draft.brand[key]}
                onChange={(e) => patchBrand({ [key]: e.target.value })}
              />
              <input
                type="file"
                accept="image/*"
                className="text-xs text-[var(--ad-muted)]"
                onChange={(e) =>
                  void onImage(
                    (url) => patchBrand({ [key]: url }),
                    e.target.files?.[0] ?? null,
                  )
                }
              />
              {draft.brand[key] ? (
                <img
                  src={draft.brand[key]}
                  alt=""
                  className="h-12 w-12 object-contain border border-[var(--ad-line)]"
                />
              ) : null}
            </div>
          ))}
          <div className="sm:col-span-2 flex flex-wrap gap-3 text-sm">
            {(
              [
                ["showPhone", "Teléfono"],
                ["showWhatsapp", "WhatsApp"],
                ["showAddress", "Dirección"],
                ["showInstagram", "Instagram"],
                ["showFacebook", "Facebook"],
                ["showTiktok", "TikTok"],
                ["showSchedule", "Horario"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.brand[key]}
                  onChange={(e) => patchBrand({ [key]: e.target.checked })}
                />
                Mostrar {label}
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "tema" ? (
        <section className="ad-panel space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COLOR_FIELDS.map(({ key, label }) => (
              <label key={key} className="text-sm text-[var(--ad-muted)]">
                {label}
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-12 cursor-pointer border border-[var(--ad-line)] bg-transparent"
                    value={
                      draft.colors[key]?.startsWith("#")
                        ? draft.colors[key].slice(0, 7)
                        : "#000000"
                    }
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
          </div>
          <div
            className="rounded border p-4"
            style={{
              background: draft.colors.panel,
              color: draft.colors.text,
              borderColor: draft.colors.border,
            }}
          >
            <p className="text-xs uppercase opacity-60">Previsualización tema</p>
            <p
              className="ad-display text-3xl"
              style={{ color: draft.colors.primary }}
            >
              {draft.brand.commercialName}
            </p>
            <p style={{ color: draft.colors.muted }}>{draft.brand.tagline}</p>
            <button
              type="button"
              className="mt-3 rounded px-3 py-2 text-sm font-semibold"
              style={{
                background: draft.colors.button,
                color: draft.colors.bg,
              }}
            >
              Botón ejemplo
            </button>
          </div>
        </section>
      ) : null}

      {tab === "tipo" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[var(--ad-muted)]">
            Preset tipográfico
            <select
              className="ad-select mt-1"
              value={draft.typography.preset}
              onChange={(e) => {
                const preset = e.target.value as AdTypographyPreset;
                const fonts = AD_TYPOGRAPHY_PRESETS[preset];
                patch({
                  typography: {
                    ...draft.typography,
                    preset,
                    headingFont: fonts.headingFont,
                    bodyFont: fonts.bodyFont,
                  },
                });
              }}
            >
              <option value="classic">Clásico (Cormorant + DM Sans)</option>
              <option value="modern">Modern (DM Sans)</option>
              <option value="elegant">Elegante (Cormorant)</option>
            </select>
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Peso títulos
            <input
              className="ad-input mt-1"
              type="number"
              min={400}
              max={800}
              step={100}
              value={draft.typography.headingWeight}
              onChange={(e) =>
                patch({
                  typography: {
                    ...draft.typography,
                    headingWeight: Number(e.target.value) || 600,
                  },
                })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Escala general
            <select
              className="ad-select mt-1"
              value={draft.typography.scale}
              onChange={(e) =>
                patch({
                  typography: {
                    ...draft.typography,
                    scale: Number(e.target.value),
                  },
                })
              }
            >
              <option value={0.9}>Compacta 90%</option>
              <option value={1}>Normal 100%</option>
              <option value={1.1}>Amplia 110%</option>
            </select>
          </label>
          <p className="sm:col-span-2 text-xs text-[var(--ad-muted)]">
            Fuentes externas CDN: extensión futura. Hoy solo presets seguros ya
            cargados en el shell A&D.
          </p>
        </section>
      ) : null}

      {tab === "hero" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[var(--ad-muted)]">
            Título
            <input
              className="ad-input mt-1"
              value={draft.hero.title}
              onChange={(e) => patchHero({ title: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Subtítulo
            <input
              className="ad-input mt-1"
              value={draft.hero.subtitle}
              onChange={(e) => patchHero({ subtitle: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)] sm:col-span-2">
            Descripción
            <textarea
              className="ad-input mt-1 min-h-[4rem]"
              value={draft.hero.description}
              onChange={(e) => patchHero({ description: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Imagen / fondo URL
            <input
              className="ad-input mt-1"
              value={draft.hero.backgroundUrl}
              onChange={(e) => patchHero({ backgroundUrl: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Video fondo URL
            <input
              className="ad-input mt-1"
              value={draft.hero.videoUrl}
              onChange={(e) => patchHero({ videoUrl: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Overlay
            <input
              className="ad-input mt-1"
              value={draft.hero.overlay}
              onChange={(e) => patchHero({ overlay: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Alineación
            <select
              className="ad-select mt-1"
              value={draft.hero.align}
              onChange={(e) =>
                patchHero({ align: e.target.value as AdHeroAlign })
              }
            >
              <option value="left">IZQUIERDA</option>
              <option value="center">CENTRO</option>
              <option value="right">DERECHA</option>
            </select>
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            CTA primario · texto
            <input
              className="ad-input mt-1"
              value={draft.hero.primaryLabel}
              onChange={(e) => patchHero({ primaryLabel: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            CTA primario · enlace
            <input
              className="ad-input mt-1"
              value={draft.hero.primaryHref}
              onChange={(e) => patchHero({ primaryHref: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.hero.primaryVisible}
              onChange={(e) =>
                patchHero({ primaryVisible: e.target.checked })
              }
            />
            Mostrar botón primario
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            CTA secundario · texto
            <input
              className="ad-input mt-1"
              value={draft.hero.secondaryLabel}
              onChange={(e) => patchHero({ secondaryLabel: e.target.value })}
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            CTA secundario · enlace
            <input
              className="ad-input mt-1"
              value={draft.hero.secondaryHref}
              onChange={(e) => patchHero({ secondaryHref: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.hero.secondaryVisible}
              onChange={(e) =>
                patchHero({ secondaryVisible: e.target.checked })
              }
            />
            Mostrar botón secundario
          </label>
        </section>
      ) : null}

      {tab === "secciones" ? (
        <section className="ad-panel space-y-2">
          <p className="text-sm text-[var(--ad-muted)]">
            ↑ ↓ orden · 👁 mostrar/ocultar
          </p>
          {[...draft.sections]
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ad-line)] py-2"
              >
                <span>
                  {s.order}. {s.label}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() => moveSection(s.id, "up")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() => moveSection(s.id, "down")}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() =>
                      patch({
                        sections: draft.sections.map((x) =>
                          x.id === s.id
                            ? { ...x, visible: !x.visible }
                            : x,
                        ),
                      })
                    }
                  >
                    {s.visible ? "👁 Visible" : "👁 Oculto"}
                  </button>
                </div>
              </div>
            ))}
        </section>
      ) : null}

      {tab === "destacados" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.featuredProducts.enabled}
              onChange={(e) =>
                patch({
                  featuredProducts: {
                    ...draft.featuredProducts,
                    enabled: e.target.checked,
                  },
                })
              }
            />
            Mostrar productos destacados (consume catálogo demo, no lo duplica)
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Cantidad
            <input
              className="ad-input mt-1"
              type="number"
              min={1}
              max={12}
              value={draft.featuredProducts.count}
              onChange={(e) =>
                patch({
                  featuredProducts: {
                    ...draft.featuredProducts,
                    count: Number(e.target.value) || 4,
                  },
                })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Título
            <input
              className="ad-input mt-1"
              value={draft.featuredProducts.title}
              onChange={(e) =>
                patch({
                  featuredProducts: {
                    ...draft.featuredProducts,
                    title: e.target.value,
                  },
                })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)] sm:col-span-2">
            Subtítulo
            <input
              className="ad-input mt-1"
              value={draft.featuredProducts.subtitle}
              onChange={(e) =>
                patch({
                  featuredProducts: {
                    ...draft.featuredProducts,
                    subtitle: e.target.value,
                  },
                })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Texto botón
            <input
              className="ad-input mt-1"
              value={draft.featuredProducts.buttonLabel}
              onChange={(e) =>
                patch({
                  featuredProducts: {
                    ...draft.featuredProducts,
                    buttonLabel: e.target.value,
                  },
                })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Enlace
            <input
              className="ad-input mt-1"
              value={draft.featuredProducts.linkHref}
              onChange={(e) =>
                patch({
                  featuredProducts: {
                    ...draft.featuredProducts,
                    linkHref: e.target.value,
                  },
                })
              }
            />
          </label>
          {(
            [
              ["showImage", "Imagen"],
              ["showPrice", "Precio"],
              ["showButton", "Botón"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featuredProducts[k]}
                onChange={(e) =>
                  patch({
                    featuredProducts: {
                      ...draft.featuredProducts,
                      [k]: e.target.checked,
                    },
                  })
                }
              />
              Mostrar {label}
            </label>
          ))}
        </section>
      ) : null}

      {tab === "banners" ? (
        <section className="space-y-3">
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() => {
              const next = adDesignRepository.createBanner(draft);
              patch({ banners: next.banners });
              setEditingBanner(next.banners[next.banners.length - 1]?.id ?? null);
            }}
          >
            CREAR banner
          </button>
          {sortedBanners.map((b) => (
            <article key={b.id} className="ad-panel space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="ad-panel-title">
                  {b.title}{" "}
                  <span className="text-xs text-[var(--ad-muted)]">
                    #{b.order} · {b.active ? "ACTIVO" : "INACTIVO"}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() =>
                      setEditingBanner(editingBanner === b.id ? null : b.id)
                    }
                  >
                    EDITAR
                  </button>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() => {
                      const next = adDesignRepository.duplicateBanner(
                        draft,
                        b.id,
                      );
                      patch({ banners: next.banners });
                    }}
                  >
                    DUPLICAR
                  </button>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() =>
                      updateBanner(b.id, { active: !b.active })
                    }
                  >
                    {b.active ? "DESACTIVAR" : "ACTIVAR"}
                  </button>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() => {
                      const next = adDesignRepository.reorderBanner(
                        draft,
                        b.id,
                        "up",
                      );
                      patch({ banners: next.banners });
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() => {
                      const next = adDesignRepository.reorderBanner(
                        draft,
                        b.id,
                        "down",
                      );
                      patch({ banners: next.banners });
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() =>
                      patch({
                        banners: draft.banners.filter((x) => x.id !== b.id),
                      })
                    }
                  >
                    ELIMINAR
                  </button>
                </div>
              </div>
              {/* Preview */}
              <div
                className="h-24 rounded border border-[var(--ad-line)] bg-cover bg-center p-3"
                style={{
                  backgroundImage: b.imageUrl
                    ? `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.6)), url(${b.imageUrl})`
                    : undefined,
                  backgroundColor: draft.colors.panel,
                }}
              >
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs opacity-70">{b.subtitle}</p>
              </div>
              {editingBanner === b.id ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["title", "Título"],
                      ["subtitle", "Subtítulo"],
                      ["imageUrl", "Imagen desktop"],
                      ["imageUrlMobile", "Imagen móvil"],
                      ["ctaLabel", "CTA"],
                      ["ctaHref", "URL"],
                      ["position", "Posición"],
                      ["startsAt", "Fecha inicio (ISO)"],
                      ["endsAt", "Fecha fin (ISO)"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-sm text-[var(--ad-muted)]">
                      {label}
                      <input
                        className="ad-input mt-1"
                        value={String(b[key] ?? "")}
                        onChange={(e) =>
                          updateBanner(b.id, { [key]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {tab === "galeria" ? (
        <section className="space-y-3">
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() =>
              patch({
                gallery: [
                  ...draft.gallery,
                  {
                    id: `gal-${Date.now()}`,
                    title: "Nueva imagen",
                    description: "",
                    imageUrl: "",
                    order: draft.gallery.length + 1,
                    active: true,
                  },
                ],
              })
            }
          >
            Agregar imagen
          </button>
          {draft.gallery
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((g) => (
              <article key={g.id} className="ad-panel grid gap-2 sm:grid-cols-2">
                <label className="text-sm text-[var(--ad-muted)]">
                  Título
                  <input
                    className="ad-input mt-1"
                    value={g.title}
                    onChange={(e) =>
                      patch({
                        gallery: draft.gallery.map((x) =>
                          x.id === g.id
                            ? { ...x, title: e.target.value }
                            : x,
                        ),
                      })
                    }
                  />
                </label>
                <label className="text-sm text-[var(--ad-muted)]">
                  URL imagen
                  <input
                    className="ad-input mt-1"
                    value={g.imageUrl}
                    onChange={(e) =>
                      patch({
                        gallery: draft.gallery.map((x) =>
                          x.id === g.id
                            ? { ...x, imageUrl: e.target.value }
                            : x,
                        ),
                      })
                    }
                  />
                </label>
                <label className="text-sm text-[var(--ad-muted)] sm:col-span-2">
                  Descripción
                  <input
                    className="ad-input mt-1"
                    value={g.description ?? ""}
                    onChange={(e) =>
                      patch({
                        gallery: draft.gallery.map((x) =>
                          x.id === g.id
                            ? { ...x, description: e.target.value }
                            : x,
                        ),
                      })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={g.active}
                    onChange={(e) =>
                      patch({
                        gallery: draft.gallery.map((x) =>
                          x.id === g.id
                            ? { ...x, active: e.target.checked }
                            : x,
                        ),
                      })
                    }
                  />
                  Activo
                </label>
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() =>
                    patch({
                      gallery: draft.gallery.filter((x) => x.id !== g.id),
                    })
                  }
                >
                  Eliminar
                </button>
              </article>
            ))}
        </section>
      ) : null}

      {tab === "popup" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.popup.enabled}
              onChange={(e) =>
                patch({
                  popup: { ...draft.popup, enabled: e.target.checked },
                })
              }
            />
            Popup activo
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Título
            <input
              className="ad-input mt-1"
              value={draft.popup.title}
              onChange={(e) =>
                patch({ popup: { ...draft.popup, title: e.target.value } })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Imagen URL
            <input
              className="ad-input mt-1"
              value={draft.popup.imageUrl}
              onChange={(e) =>
                patch({ popup: { ...draft.popup, imageUrl: e.target.value } })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)] sm:col-span-2">
            Texto
            <textarea
              className="ad-input mt-1 min-h-[3rem]"
              value={draft.popup.text}
              onChange={(e) =>
                patch({ popup: { ...draft.popup, text: e.target.value } })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Botón
            <input
              className="ad-input mt-1"
              value={draft.popup.buttonLabel}
              onChange={(e) =>
                patch({
                  popup: { ...draft.popup, buttonLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Enlace
            <input
              className="ad-input mt-1"
              value={draft.popup.buttonHref}
              onChange={(e) =>
                patch({
                  popup: { ...draft.popup, buttonHref: e.target.value },
                })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.popup.oncePerSession}
              onChange={(e) =>
                patch({
                  popup: {
                    ...draft.popup,
                    oncePerSession: e.target.checked,
                  },
                })
              }
            />
            Una vez por sesión
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Inicio
            <input
              className="ad-input mt-1"
              value={draft.popup.startsAt}
              onChange={(e) =>
                patch({ popup: { ...draft.popup, startsAt: e.target.value } })
              }
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Fin
            <input
              className="ad-input mt-1"
              value={draft.popup.endsAt}
              onChange={(e) =>
                patch({ popup: { ...draft.popup, endsAt: e.target.value } })
              }
            />
          </label>
        </section>
      ) : null}

      {tab === "footer" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2">
          {(
            [
              ["logoUrl", "Logo"],
              ["description", "Descripción"],
              ["phone", "Teléfono"],
              ["whatsapp", "WhatsApp"],
              ["address", "Dirección"],
              ["schedule", "Horario"],
              ["copyright", "Copyright"],
              ["legalText", "Texto legal"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm text-[var(--ad-muted)]">
              {label}
              <input
                className="ad-input mt-1"
                value={draft.footer[key]}
                onChange={(e) =>
                  patch({
                    footer: { ...draft.footer, [key]: e.target.value },
                  })
                }
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.footer.showSocial}
              onChange={(e) =>
                patch({
                  footer: { ...draft.footer, showSocial: e.target.checked },
                })
              }
            />
            Mostrar redes
          </label>
        </section>
      ) : null}

      {tab === "seo" ? (
        <section className="ad-panel grid gap-3 sm:grid-cols-2">
          {(
            [
              ["title", "Title"],
              ["description", "Description"],
              ["keywords", "Keywords"],
              ["socialImageUrl", "Imagen social"],
              ["faviconUrl", "Favicon"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm text-[var(--ad-muted)]">
              {label}
              <input
                className="ad-input mt-1"
                value={draft.seo[key]}
                onChange={(e) =>
                  patch({ seo: { ...draft.seo, [key]: e.target.value } })
                }
              />
            </label>
          ))}
        </section>
      ) : null}
    </div>
  );
}
