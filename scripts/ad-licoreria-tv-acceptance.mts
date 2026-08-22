/**
 * Prueba de aceptación A&D — Fase 10.2 TV / Digital Signage (A–Q).
 * Ejecutar: npx tsx scripts/ad-licoreria-tv-acceptance.mts
 *
 * MOCK — preparado para WebSocket backend.
 */
import { adTvRepository } from "../src/services/ad-licoreria/tv/repository.ts";
import { adTvRealtime } from "../src/services/ad-licoreria/tv/realtime.ts";
import { adLicoreriaRepository } from "../src/services/ad-licoreria/repository.ts";
import {
  canOperatePos,
  hasPermission,
} from "../src/lib/ad-licoreria/access.ts";
import { canAccessPath } from "../src/lib/ad-licoreria/route-access.ts";

type Status = "PASS" | "FAIL";
type Row = { id: string; prueba: string; resultado: Status; detalle: string };
const rows: Row[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function run(id: string, name: string, fn: () => void) {
  try {
    adTvRepository.reset();
    adLicoreriaRepository.reset();
    fn();
    rows.push({ id, prueba: name, resultado: "PASS", detalle: "—" });
    console.log(`✅ ${id} ${name}`);
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    rows.push({ id, prueba: name, resultado: "FAIL", detalle });
    console.log(`❌ ${id} ${name}: ${detalle}`);
  }
}

console.log("\n=== A&D Fase 10.2 — TV / Digital Signage ===\n");

run("A", "Crear pantalla", () => {
  const r = adTvRepository.createScreen({
    name: "TV VIP",
    location: "VIP",
    userName: "Administrador",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.code.startsWith("TV-"), "código");
  assert(r.data.status === "OFFLINE", "offline inicial");
  assert(
    adTvRepository.listAudit().some((a) => a.action === "TV_CREATED"),
    "audit create",
  );
});

run("B", "Vincular pantalla", () => {
  const screen = adTvRepository.listScreens()[0];
  const begin = adTvRepository.beginPairing({ screenId: screen.id });
  assert(begin.ok, "begin");
  assert(begin.data.status === "PAIRING", "pairing");
  assert(/^A&D-\d{4}$/.test(begin.data.pairingCode ?? ""), "código A&D");
  const pair = adTvRepository.pairWithCode({
    pairingCode: begin.data.pairingCode!,
    userName: "Administrador",
  });
  assert(pair.ok, pair.ok ? "" : pair.error);
  assert(pair.data.paired, "paired");
  assert(pair.data.status === "ONLINE", "online");
  assert(
    adTvRepository.listAudit().some((a) => a.action === "TV_PAIRED"),
    "audit pair",
  );
});

run("C", "Desvincular", () => {
  const screen = adTvRepository.listScreens()[0];
  adTvRepository.beginPairing({ screenId: screen.id });
  const code = adTvRepository.getScreen(screen.id)!.pairingCode!;
  adTvRepository.pairWithCode({ pairingCode: code, userName: "Admin" });
  const u = adTvRepository.unpairScreen({
    screenId: screen.id,
    userName: "Admin",
  });
  assert(u.ok, u.ok ? "" : u.error);
  assert(!u.data.paired, "unpaired");
  assert(u.data.status === "OFFLINE", "offline");
  assert(
    adTvRepository.listAudit().some((a) => a.action === "TV_UNPAIRED"),
    "audit unpair",
  );
});

run("D", "Crear contenido", () => {
  const r = adTvRepository.createContent({
    name: "Promo test",
    type: "PROMOTION",
    url: "https://example.com/promo.jpg",
    durationSec: 10,
    userName: "Admin",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.type === "PROMOTION", "type");
});

run("E", "Crear grupo", () => {
  const r = adTvRepository.createGroup({
    name: "EVENTO",
    userName: "Admin",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.name === "EVENTO", "name");
});

run("F", "Agregar pantallas al grupo", () => {
  const g = adTvRepository.createGroup({ name: "MIX", userName: "Admin" });
  assert(g.ok, "group");
  const a = adTvRepository.addScreenToGroup({
    groupId: g.data.id,
    screenId: "tvs-001",
    userName: "Admin",
  });
  const b = adTvRepository.addScreenToGroup({
    groupId: g.data.id,
    screenId: "tvs-002",
    userName: "Admin",
  });
  assert(a.ok && b.ok, "add");
  assert(a.data.screenIds.includes("tvs-001"), "member 1");
  assert(b.data.screenIds.includes("tvs-002"), "member 2");
  assert(
    adTvRepository.listAudit().some((x) => x.action === "GROUP_CHANGED"),
    "audit group",
  );
});

run("G", "PLAY individual", () => {
  const r = adTvRepository.dispatchCommand({
    command: "PLAY",
    screenIds: ["tvs-001"],
    contentId: "tvc-promo-viernes",
    position: 0,
    userName: "Admin",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.command === "PLAY", "cmd");
  assert(r.data.screenIds.length === 1, "one");
  assert(r.data.contentId === "tvc-promo-viernes", "content");
  assert(typeof r.data.issuedAt === "string", "issuedAt");
  const s = adTvRepository.getScreen("tvs-001")!;
  assert(s.playbackState === "PLAYING", "playing");
  assert(s.currentContentId === "tvc-promo-viernes", "loaded");
});

run("H", "PLAY grupo", () => {
  const r = adTvRepository.dispatchCommand({
    command: "PLAY",
    groupId: "tvg-barra",
    contentId: "tvc-promo-cerveza",
    position: 0,
    userName: "Admin",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.screenIds.includes("tvs-001"), "barra member");
  assert(
    adTvRepository.getScreen("tvs-001")!.playbackState === "PLAYING",
    "playing",
  );
});

run("I", "PLAY todas", () => {
  let received = 0;
  const unsub = adTvRealtime.subscribe((env) => {
    if (env.command.command === "PLAY") received += 1;
  });
  const r = adTvRepository.dispatchCommand({
    command: "PLAY",
    all: true,
    contentId: "tvc-video-bienvenida",
    position: 0,
    userName: "Admin",
  });
  unsub();
  assert(r.ok, r.ok ? "" : r.error);
  assert(r.data.screenIds.length === 3, "tres pantallas");
  assert(received >= 1, "realtime broadcast");
  for (const id of ["tvs-001", "tvs-002", "tvs-003"]) {
    assert(
      adTvRepository.getScreen(id)!.playbackState === "PLAYING",
      `play ${id}`,
    );
  }
});

run("J", "PAUSE", () => {
  adTvRepository.dispatchCommand({
    command: "PLAY",
    all: true,
    contentId: "tvc-promo-viernes",
    userName: "Admin",
  });
  const r = adTvRepository.dispatchCommand({
    command: "PAUSE",
    all: true,
    userName: "Admin",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(
    adTvRepository.getScreen("tvs-001")!.playbackState === "PAUSED",
    "paused",
  );
});

run("K", "STOP", () => {
  const r = adTvRepository.dispatchCommand({
    command: "STOP",
    all: true,
    userName: "Admin",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(
    adTvRepository.getScreen("tvs-001")!.playbackState === "STOPPED",
    "stopped",
  );
  assert(adTvRepository.getScreen("tvs-001")!.positionSec === 0, "pos 0");
});

run("L", "Volumen", () => {
  const r = adTvRepository.dispatchCommand({
    command: "SET_VOLUME",
    screenIds: ["tvs-001"],
    volume: 40,
    userName: "Admin",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(adTvRepository.getScreen("tvs-001")!.volume === 40, "vol 40");
  assert(
    adTvRepository.listAudit().some((a) => a.action === "VOLUME_CHANGED"),
    "audit vol",
  );
});

run("M", "Mute", () => {
  const r = adTvRepository.dispatchCommand({
    command: "MUTE",
    screenIds: ["tvs-002"],
    muted: true,
    userName: "Admin",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(adTvRepository.getScreen("tvs-002")!.isMuted === true, "muted");
});

run("N", "Cambio de contenido", () => {
  const r = adTvRepository.dispatchCommand({
    command: "LOAD_CONTENT",
    screenIds: ["tvs-003"],
    contentId: "tvc-menu",
    position: 0,
    userName: "Admin",
  });
  assert(r.ok, r.ok ? "" : r.error);
  assert(
    adTvRepository.getScreen("tvs-003")!.currentContentId === "tvc-menu",
    "menu",
  );
  assert(
    adTvRepository.listAudit().some((a) => a.action === "CONTENT_LOADED"),
    "audit load",
  );
});

run("O", "Usuario TV sin acceso POS", () => {
  const tv = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-tv-barra")!;
  assert(tv.role === "tv", "rol");
  assert(!canOperatePos(tv), "no POS");
  assert(!hasPermission(tv, "pos.sell"), "no pos.sell");
  assert(!hasPermission(tv, "inventory.read"), "no inv");
  assert(!hasPermission(tv, "cop.read"), "no cop");
  assert(!hasPermission(tv, "closures.create"), "no cierres");
  assert(!hasPermission(tv, "users.manage"), "no users");
  assert(!canAccessPath(tv, "/ventas"), "ruta ventas bloqueada");
  assert(!canAccessPath(tv, "/inventario"), "ruta inv bloqueada");
  assert(!canAccessPath(tv, "/cop"), "ruta cop bloqueada");
  assert(!canAccessPath(tv, "/configuracion"), "ruta config bloqueada");
});

run("P", "Usuario TV con permiso TV", () => {
  const tv = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-tv-barra")!;
  const adminTv = adLicoreriaRepository
    .getState()
    .operators.find((o) => o.id === "op-tv-admin")!;
  assert(hasPermission(tv, "tv.view"), "tvbarra view");
  assert(hasPermission(tv, "tv.control"), "tvbarra control");
  assert(canAccessPath(tv, "/tv"), "ruta tv");
  assert(canAccessPath(tv, "/tv/control"), "ruta control");
  assert(hasPermission(adminTv, "tv.manage"), "tvadmin manage");
  assert(hasPermission(adminTv, "tv.content.manage"), "content");
  assert(hasPermission(adminTv, "tv.groups.manage"), "groups");
  assert(hasPermission(adminTv, "tv.screen.manage"), "screens");
  assert(!canOperatePos(adminTv), "tvadmin no POS");
});

run("Q", "Auditoría", () => {
  adTvRepository.createScreen({
    name: "Audit TV",
    location: "Test",
    userName: "Auditor",
  });
  const s = adTvRepository.listScreens()[0];
  const begin = adTvRepository.beginPairing({ screenId: s.id });
  adTvRepository.pairWithCode({
    pairingCode: begin.data.pairingCode!,
    userName: "Auditor",
  });
  adTvRepository.dispatchCommand({
    command: "PLAY",
    screenIds: [s.id],
    contentId: "tvc-promo-viernes",
    userName: "Auditor",
  });
  adTvRepository.dispatchCommand({
    command: "PAUSE",
    screenIds: [s.id],
    userName: "Auditor",
  });
  adTvRepository.dispatchCommand({
    command: "STOP",
    screenIds: [s.id],
    userName: "Auditor",
  });
  adTvRepository.dispatchCommand({
    command: "SET_VOLUME",
    screenIds: [s.id],
    volume: 55,
    userName: "Auditor",
  });
  const actions = new Set(adTvRepository.listAudit().map((a) => a.action));
  for (const need of [
    "TV_CREATED",
    "TV_PAIRED",
    "PLAY",
    "PAUSE",
    "STOP",
    "VOLUME_CHANGED",
  ]) {
    assert(actions.has(need as never), `falta ${need}`);
  }
  const playEvt = adTvRepository.listAudit().find((a) => a.action === "PLAY")!;
  assert(playEvt.userName === "Auditor", "usuario");
  assert(!!playEvt.createdAt, "fecha");
});

const pass = rows.filter((r) => r.resultado === "PASS").length;
const fail = rows.filter((r) => r.resultado === "FAIL").length;
console.log("\n--- Resumen ---");
console.table(rows);
console.log(`\nResultado: ${pass}/${rows.length} PASS · ${fail} FAIL\n`);
process.exit(fail > 0 ? 1 : 0);
