/**
 * Prueba de aceptación A&D — Fase 10.3 Diseño Web (A–M).
 * Ejecutar: npx tsx scripts/ad-licoreria-design-acceptance.mts
 */

/** localStorage mock ANTES de importar repositorios. */
const mem = new Map<string, string>();
const sessionMem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
} as Storage;
(globalThis as { sessionStorage?: Storage }).sessionStorage = {
  getItem: (k) => sessionMem.get(k) ?? null,
  setItem: (k, v) => {
    sessionMem.set(k, String(v));
  },
  removeItem: (k) => {
    sessionMem.delete(k);
  },
  clear: () => sessionMem.clear(),
  key: () => null,
  length: 0,
} as Storage;

const { adLicoreriaRepository } = await import(
  "../src/services/ad-licoreria/repository.ts"
);
const { adDesignRepository } = await import(
  "../src/services/ad-licoreria/design/repository.ts"
);
const { createDefaultSiteDesign } = await import(
  "../src/services/ad-licoreria/design/defaults.ts"
);
const { hasPermission } = await import("../src/lib/ad-licoreria/access.ts");
const { canAccessPath } = await import(
  "../src/lib/ad-licoreria/route-access.ts"
);

type Status = "PASS" | "FAIL";
type Row = { id: string; prueba: string; resultado: Status; detalle: string };
const rows: Row[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function run(id: string, name: string, fn: () => void) {
  try {
    mem.clear();
    sessionMem.clear();
    adDesignRepository.resetMemory();
    adLicoreriaRepository.reset();
    adLicoreriaRepository.setCurrentOperator("op-admin");
    fn();
    rows.push({ id, prueba: name, resultado: "PASS", detalle: "—" });
    console.log(`✅ ${id} ${name}`);
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    rows.push({ id, prueba: name, resultado: "FAIL", detalle });
    console.log(`❌ ${id} ${name}: ${detalle}`);
  }
}

console.log("\n=== A&D Fase 10.3 — Diseño Web ===\n");

run("A", "Guardar diseño", () => {
  const draft = adDesignRepository.getDraft();
  draft.brand.commercialName = "A&D Guardado";
  const r = adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  assert(r.ok, r.ok ? "" : r.error);
  assert(
    adDesignRepository.getDraft().brand.commercialName === "A&D Guardado",
    "draft name",
  );
  assert(
    adDesignRepository.getPublished().brand.commercialName ===
      createDefaultSiteDesign().brand.commercialName,
    "publicado intacto",
  );
  assert(
    adLicoreriaRepository.getSiteDesign().brand.commercialName ===
      createDefaultSiteDesign().brand.commercialName,
    "Home published sin cambio",
  );
});

run("B", "Editar colores", () => {
  const draft = adDesignRepository.getDraft();
  draft.colors.primary = "#ffaa00";
  draft.colors.bg = "#111111";
  const r = adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.colors.primary === "#ffaa00", "primary");
  assert(r.data.colors.gold === "#ffaa00", "gold mirror");
});

run("C", "Cambiar logo", () => {
  const draft = adDesignRepository.getDraft();
  draft.brand.logoUrl = "https://example.com/logo.png";
  const r = adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.brand.logoUrl.includes("logo.png"), "logo");
  assert(r.data.logoUrl.includes("logo.png"), "mirror logoUrl");
});

run("D", "Cambiar Hero", () => {
  const draft = adDesignRepository.getDraft();
  draft.hero.title = "Hero Nuevo";
  draft.hero.align = "left";
  draft.hero.primaryLabel = "Entrar ya";
  const r = adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.hero.title === "Hero Nuevo", "title");
  assert(r.data.hero.align === "left", "align");
});

run("E", "Crear banner", () => {
  let draft = adDesignRepository.getDraft();
  const before = draft.banners.length;
  draft = adDesignRepository.createBanner(draft, {
    title: "Promo Test",
    imageUrl: "https://example.com/b.jpg",
  });
  const r = adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.banners.length === before + 1, "count+1");
  assert(
    r.data.banners.some((b) => b.title === "Promo Test"),
    "title",
  );
});

run("F", "Editar banner", () => {
  let draft = adDesignRepository.getDraft();
  draft = adDesignRepository.createBanner(draft, { title: "Edit me" });
  const id = draft.banners[draft.banners.length - 1].id;
  draft = {
    ...draft,
    banners: draft.banners.map((b) =>
      b.id === id ? { ...b, subtitle: "Sub editado", ctaLabel: "Ir" } : b,
    ),
  };
  const r = adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  assert(r.ok, r.ok ? "" : r.error);
  const b = r.data.banners.find((x) => x.id === id)!;
  assert(b.subtitle === "Sub editado", "subtitle");
  assert(b.ctaLabel === "Ir", "cta");
});

run("G", "Ordenar banner", () => {
  let draft = adDesignRepository.getDraft();
  draft = {
    ...draft,
    banners: [
      { id: "b1", title: "Uno", active: true, order: 1 },
      { id: "b2", title: "Dos", active: true, order: 2 },
    ],
  };
  draft = adDesignRepository.reorderBanner(draft, "b2", "up");
  const b2 = draft.banners.find((b) => b.id === "b2")!;
  const b1 = draft.banners.find((b) => b.id === "b1")!;
  assert(b2.order < b1.order, "b2 arriba");
  const r = adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  assert(r.ok, r.ok ? "" : r.error);
});

run("H", "Activar/desactivar banner", () => {
  let draft = adDesignRepository.getDraft();
  draft = adDesignRepository.createBanner(draft, {
    title: "Toggle",
    active: true,
  });
  const id = draft.banners[draft.banners.length - 1].id;
  draft = {
    ...draft,
    banners: draft.banners.map((b) =>
      b.id === id ? { ...b, active: false } : b,
    ),
  };
  const r = adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  assert(r.ok, r.ok ? "" : r.error);
  const b = r.data.banners.find((x) => x.id === id)!;
  assert(b.active === false, "inactive");
  assert(!adDesignRepository.isBannerLive(b), "not live");
});

run("I", "Publicar", () => {
  const draft = adDesignRepository.getDraft();
  draft.brand.commercialName = "A&D Publicado";
  draft.hero.title = "Live Hero";
  adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  const r = adLicoreriaRepository.publishSiteDesign("Admin");
  assert(r.ok, r.ok ? "" : r.error);
  assert(!!r.data.publishedAt, "publishedAt");
  assert(
    adDesignRepository.getPublished().brand.commercialName === "A&D Publicado",
    "published name",
  );
});

run("J", "Home utiliza configuración publicada", () => {
  const draft = adDesignRepository.getDraft();
  draft.brand.commercialName = "Solo Borrador";
  adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  assert(
    adLicoreriaRepository.getSiteDesign().brand.commercialName !==
      "Solo Borrador",
    "Home no usa borrador",
  );
  adLicoreriaRepository.publishSiteDesign("Admin");
  assert(
    adLicoreriaRepository.getSiteDesign().brand.commercialName ===
      "Solo Borrador",
    "Home usa publicado",
  );
});

run("K", "Restaurar defaults", () => {
  const draft = adDesignRepository.getDraft();
  draft.brand.commercialName = "Temporal XYZ";
  draft.colors.primary = "#123456";
  adLicoreriaRepository.saveSiteDesignDraft(draft, "Admin");
  adLicoreriaRepository.publishSiteDesign("Admin");
  const r = adLicoreriaRepository.resetSiteDesign("Admin");
  assert(r.ok, r.ok ? "" : r.error);
  const def = createDefaultSiteDesign();
  assert(
    r.data.brand.commercialName === def.brand.commercialName,
    "nombre default",
  );
  assert(
    adLicoreriaRepository.getSiteDesign().brand.commercialName ===
      def.brand.commercialName,
    "publicado default",
  );
});

run("L", "Usuario sin permiso no accede", () => {
  const maria = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-maria")!;
  assert(!hasPermission(maria, "settings.manage"), "sin settings");
  assert(!canAccessPath(maria, "/configuracion/diseno"), "ruta bloqueada");
  adLicoreriaRepository.setCurrentOperator("op-maria");
  const r = adLicoreriaRepository.saveSiteDesignDraft(
    adDesignRepository.getDraft(),
    "María",
  );
  assert(!r.ok, "save denegado");
  const p = adLicoreriaRepository.publishSiteDesign("María");
  assert(!p.ok, "publish denegado");
});

run("M", "Preview funciona", () => {
  adLicoreriaRepository.setCurrentOperator("op-admin");
  const draft = adDesignRepository.getDraft();
  draft.hero.title = "Preview Title";
  adDesignRepository.setPreviewSession(draft);
  const preview = adDesignRepository.getPreviewSession();
  assert(!!preview, "session");
  assert(preview!.hero.title === "Preview Title", "preview hero");
  assert(
    adDesignRepository.getPublished().hero.title ===
      createDefaultSiteDesign().hero.title,
    "publicado intacto",
  );
});

const pass = rows.filter((r) => r.resultado === "PASS").length;
const fail = rows.filter((r) => r.resultado === "FAIL").length;
console.log("\n--- Resumen ---");
console.table(rows);
console.log(`\nResultado: ${pass}/${rows.length} PASS · ${fail} FAIL\n`);
process.exit(fail > 0 ? 1 : 0);
