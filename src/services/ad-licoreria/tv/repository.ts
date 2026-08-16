/**
 * Repositorio MOCK A&D TV / Digital Signage.
 * Separado del POS. UI → Provider → este repository → realtime transport.
 * MOCK — preparado para WebSocket backend.
 */
import {
  AD_DEMO_TV_CONTENTS,
  AD_DEMO_TV_GROUPS,
  AD_DEMO_TV_SCREENS,
} from "@/content/ad-licoreria/tv/demo-data";
import { adTvRealtime } from "@/services/ad-licoreria/tv/realtime";
import {
  fetchTvSyncState,
  pairTvOnServer,
  publishTvSyncState,
} from "@/services/ad-licoreria/tv/sync-client";
import type {
  AdTvAuditEvent,
  AdTvCommand,
  AdTvCommandType,
  AdTvContent,
  AdTvContentType,
  AdTvGroup,
  AdTvScreen,
} from "@/types/ad-tv";

export type AdTvResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type AdTvRepositoryState = {
  screens: AdTvScreen[];
  contents: AdTvContent[];
  groups: AdTvGroup[];
  audit: AdTvAuditEvent[];
  lastCommand: AdTvCommand | null;
  screenSeq: number;
  contentSeq: number;
  groupSeq: number;
};

type Listener = () => void;

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function pairingCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `A&D-${n}`;
}

function cloneState(): AdTvRepositoryState {
  return {
    screens: structuredClone(AD_DEMO_TV_SCREENS),
    contents: structuredClone(AD_DEMO_TV_CONTENTS),
    groups: structuredClone(AD_DEMO_TV_GROUPS),
    audit: [],
    lastCommand: null,
    screenSeq: 4,
    contentSeq: 10,
    groupSeq: 10,
  };
}

let state = cloneState();
const listeners = new Set<Listener>();
let syncVersion = 0;
let pushing = false;
let applyingRemote = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
/** Mientras la TV espera vínculo, no dejar que un pull viejo borre el código. */
let pairingLock: { screenId: string; pairingCode: string; token: string } | null =
  null;

function notifyLocal() {
  for (const l of listeners) l();
}

function emit() {
  notifyLocal();
  if (!applyingRemote) schedulePush();
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushNow();
  }, 200);
}

async function pushNow(opts?: { allowUnpair?: boolean }) {
  if (pushing || applyingRemote) return;
  pushing = true;
  let needsRepush = false;
  try {
    syncVersion = Math.max(syncVersion + 1, Date.now());
    const published = await publishTvSyncState(syncVersion, state, opts);
    if (!published) return;
    if (published.conflict && published.state && published.version) {
      applyRemoteState(published.state as AdTvRepositoryState, published.version);
      /** Si seguimos en pairing, republicar el código que el TV está mostrando. */
      if (pairingLock) needsRepush = true;
      return;
    }
    if (published.version) syncVersion = published.version;
  } finally {
    pushing = false;
  }
  if (needsRepush) {
    await pushNow();
  }
}

function mergePairingLock(remote: AdTvRepositoryState): AdTvRepositoryState {
  if (!pairingLock) return remote;
  const lock = pairingLock;
  const screens = remote.screens.map((s) => {
    if (s.id !== lock.screenId) return s;
    if (s.paired) {
      pairingLock = null;
      return s;
    }
    return {
      ...s,
      status: "PAIRING" as const,
      paired: false,
      pairingCode: s.pairingCode || lock.pairingCode,
      pairingToken: s.pairingToken || lock.token,
    };
  });
  return { ...remote, screens };
}

/**
 * Une contenidos locales + remotos para que un push de la TV
 * no borre la imagen que acaba de guardar el móvil.
 */
function mergeContents(
  remote: AdTvRepositoryState,
  local: AdTvRepositoryState,
): { state: AdTvRepositoryState; preservedLocal: boolean } {
  const map = new Map<string, AdTvContent>();
  for (const c of remote.contents ?? []) map.set(c.id, c);
  let preservedLocal = false;
  for (const c of local.contents ?? []) {
    const existing = map.get(c.id);
    if (!existing) {
      map.set(c.id, c);
      preservedLocal = true;
      continue;
    }
    if ((c.updatedAt || "") > (existing.updatedAt || "")) {
      map.set(c.id, c);
      preservedLocal = true;
    }
  }
  return {
    state: { ...remote, contents: [...map.values()] },
    preservedLocal,
  };
}

function applyRemoteState(remote: AdTvRepositoryState, version: number) {
  applyingRemote = true;
  let preservedLocal = false;
  try {
    const withPairing = mergePairingLock(remote);
    const merged = mergeContents(withPairing, state);
    preservedLocal = merged.preservedLocal;
    state = merged.state;
    syncVersion = version;
    for (const l of listeners) l();
    if (state.lastCommand) {
      adTvRealtime.broadcastCommand(state.lastCommand);
    }
  } finally {
    applyingRemote = false;
  }
  if (preservedLocal) {
    schedulePush();
  }
}

async function pullOnce() {
  const remote = await fetchTvSyncState();
  if (!remote?.state || !remote.version) return;
  if (remote.version <= syncVersion) return;
  applyRemoteState(remote.state as AdTvRepositoryState, remote.version);
}

export function startAdTvSync() {
  if (pollTimer != null) return;
  void (async () => {
    const remote = await fetchTvSyncState();
    if (remote?.state && remote.version > 0) {
      applyRemoteState(remote.state as AdTvRepositoryState, remote.version);
    } else {
      await pushNow();
    }
  })();
  pollTimer = setInterval(() => {
    void pullOnce();
  }, 1200);
}

export function stopAdTvSync() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

function audit(
  action: AdTvAuditEvent["action"],
  userName: string,
  detail: string,
  screen?: AdTvScreen,
) {
  state.audit = [
    {
      id: uid("tva"),
      action,
      userName,
      screenId: screen?.id,
      screenName: screen?.name,
      detail,
      createdAt: nowIso(),
    },
    ...state.audit,
  ].slice(0, 200);
}

function touch(screen: AdTvScreen): AdTvScreen {
  return {
    ...screen,
    lastSeenAt: nowIso(),
    updatedAt: nowIso(),
    status: screen.paired ? "ONLINE" : screen.status,
  };
}

function resolveTargets(input: {
  screenIds?: string[];
  groupId?: string;
  all?: boolean;
}): string[] {
  if (input.all) return state.screens.map((s) => s.id);
  if (input.groupId) {
    const g = state.groups.find((x) => x.id === input.groupId);
    return g?.screenIds ?? [];
  }
  return input.screenIds ?? [];
}

function applyCommandToScreen(
  screen: AdTvScreen,
  cmd: AdTvCommand,
): AdTvScreen {
  let next = touch(screen);
  switch (cmd.command) {
    case "LOAD_CONTENT":
      next = {
        ...next,
        currentContentId: cmd.contentId ?? next.currentContentId,
        positionSec: cmd.position ?? 0,
        playbackState: "IDLE",
      };
      break;
    case "PLAY":
      next = {
        ...next,
        currentContentId: cmd.contentId ?? next.currentContentId,
        positionSec: cmd.position ?? next.positionSec,
        playbackState: "PLAYING",
        status: "ONLINE",
      };
      break;
    case "PAUSE":
      next = { ...next, playbackState: "PAUSED" };
      break;
    case "STOP":
      next = {
        ...next,
        playbackState: "STOPPED",
        positionSec: 0,
      };
      break;
    case "SEEK":
    case "SYNC":
      next = {
        ...next,
        positionSec: cmd.position ?? next.positionSec,
      };
      break;
    case "SET_VOLUME":
      next = {
        ...next,
        volume: Math.max(0, Math.min(100, cmd.volume ?? next.volume)),
        isMuted: false,
      };
      break;
    case "MUTE":
      next = {
        ...next,
        isMuted: cmd.muted ?? !next.isMuted,
      };
      break;
    case "RESTART":
      next = {
        ...next,
        positionSec: 0,
        playbackState: next.currentContentId ? "PLAYING" : "IDLE",
      };
      break;
  }
  return next;
}

export const adTvRepository = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    startAdTvSync();
    return () => listeners.delete(listener);
  },

  getState(): AdTvRepositoryState {
    return state;
  },

  /** Fuerza pull inmediato (útil en el reproductor). */
  async refreshFromSync() {
    await pullOnce();
  },

  /** Publica el estado local ya (pairing / play). */
  async flushSync() {
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
    await pushNow();
  },

  reset() {
    state = cloneState();
    syncVersion = Date.now();
    pairingLock = null;
    emit();
  },

  listScreens() {
    return [...state.screens];
  },

  getScreen(idOrCode: string) {
    return state.screens.find(
      (s) => s.id === idOrCode || s.code === idOrCode,
    );
  },

  listContents() {
    return [...state.contents];
  },

  listGroups() {
    return [...state.groups];
  },

  listAudit() {
    return [...state.audit];
  },

  createScreen(input: {
    name: string;
    location: string;
    userName: string;
    groupId?: string;
  }): AdTvResult<AdTvScreen> {
    if (!input.name.trim()) return { ok: false, error: "Nombre obligatorio" };
    const code = `TV-${String(state.screenSeq++).padStart(3, "0")}`;
    const screen: AdTvScreen = {
      id: uid("tvs"),
      code,
      name: input.name.trim(),
      location: input.location.trim() || "Sin ubicación",
      status: "OFFLINE",
      pairingCode: null,
      pairingToken: null,
      paired: false,
      currentContentId: null,
      currentGroupId: input.groupId ?? null,
      volume: 70,
      isMuted: false,
      playbackState: "IDLE",
      positionSec: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.screens = [screen, ...state.screens];
    if (input.groupId) {
      state.groups = state.groups.map((g) =>
        g.id === input.groupId
          ? {
              ...g,
              screenIds: [...new Set([...g.screenIds, screen.id])],
              updatedAt: nowIso(),
            }
          : g,
      );
    }
    audit("TV_CREATED", input.userName, `Creó ${screen.code} · ${screen.name}`, screen);
    emit();
    return { ok: true, data: screen };
  },

  updateScreen(input: {
    screenId: string;
    name?: string;
    location?: string;
    userName: string;
  }): AdTvResult<AdTvScreen> {
    const screen = state.screens.find((s) => s.id === input.screenId);
    if (!screen) return { ok: false, error: "Pantalla no encontrada" };
    const next = {
      ...screen,
      name: input.name?.trim() || screen.name,
      location: input.location?.trim() || screen.location,
      updatedAt: nowIso(),
    };
    state.screens = state.screens.map((s) =>
      s.id === screen.id ? next : s,
    );
    audit("TV_UPDATED", input.userName, `Actualizó ${next.code}`, next);
    emit();
    return { ok: true, data: next };
  },

  deleteScreen(input: {
    screenId: string;
    userName: string;
  }): AdTvResult {
    const screen = state.screens.find((s) => s.id === input.screenId);
    if (!screen) return { ok: false, error: "Pantalla no encontrada" };
    state.screens = state.screens.filter((s) => s.id !== screen.id);
    state.groups = state.groups.map((g) => ({
      ...g,
      screenIds: g.screenIds.filter((id) => id !== screen.id),
      updatedAt: nowIso(),
    }));
    audit("TV_DELETED", input.userName, `Eliminó ${screen.code}`, screen);
    emit();
    return { ok: true, data: undefined };
  },

  /** TV pide código de vinculación (sin password admin). */
  beginPairing(input: { screenId: string }): AdTvResult<AdTvScreen> {
    const screen = state.screens.find((s) => s.id === input.screenId);
    if (!screen) return { ok: false, error: "Pantalla no encontrada" };
    if (screen.paired) {
      pairingLock = null;
      return { ok: true, data: screen };
    }
    /** Ya hay código: no regenerar ni empujar (evita parpadeos en la TV). */
    if (screen.status === "PAIRING" && screen.pairingCode) {
      pairingLock = {
        screenId: screen.id,
        pairingCode: screen.pairingCode,
        token: screen.pairingToken || uid("pair"),
      };
      return { ok: true, data: screen };
    }
    const code = screen.pairingCode || pairingCode();
    const token = screen.pairingToken || uid("pair");
    const next: AdTvScreen = {
      ...screen,
      status: "PAIRING",
      pairingCode: code,
      pairingToken: token,
      paired: false,
      lastSeenAt: nowIso(),
      updatedAt: nowIso(),
    };
    pairingLock = { screenId: next.id, pairingCode: code, token };
    state.screens = state.screens.map((s) =>
      s.id === screen.id ? next : s,
    );
    emit();
    void pushNow();
    return { ok: true, data: next };
  },

  /** Admin introduce código A&D-#### (o solo los 4 dígitos). */
  pairWithCode(input: {
    pairingCode: string;
    userName: string;
  }): AdTvResult<AdTvScreen> {
    const normalized = input.pairingCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const digits = input.pairingCode.replace(/\D/g, "").slice(-4);
    const screen = state.screens.find((s) => {
      const pc = (s.pairingCode ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      const pd = (s.pairingCode ?? "").replace(/\D/g, "").slice(-4);
      if (!pc && !pd) return false;
      if (normalized && pc === normalized) return true;
      if (digits.length === 4 && pd === digits) return true;
      return false;
    });
    if (!screen) {
      return {
        ok: false,
        error: "Código inválido o aún no sincronizado. Espere 2 s y reintente.",
      };
    }
    const next: AdTvScreen = {
      ...screen,
      paired: true,
      status: "ONLINE",
      pairingCode: null,
      lastSeenAt: nowIso(),
      updatedAt: nowIso(),
    };
    if (pairingLock?.screenId === screen.id) pairingLock = null;
    state.screens = state.screens.map((s) =>
      s.id === screen.id ? next : s,
    );
    audit("TV_PAIRED", input.userName, `Vinculó ${next.code}`, next);
    emit();
    void pushNow();
    return { ok: true, data: next };
  },

  /**
   * Vincula vía API (recomendado): aplica el estado del servidor
   * para que la TV y el móvil vean lo mismo al instante.
   */
  async pairWithCodeRemote(input: {
    pairingCode: string;
    userName: string;
  }): Promise<AdTvResult<AdTvScreen>> {
    await pullOnce();
    const remote = await pairTvOnServer({
      pairingCode: input.pairingCode,
      userName: input.userName,
    });
    if (!remote.ok) {
      /** Fallback local por si el endpoint aún no recargó. */
      const local = this.pairWithCode(input);
      if (local.ok) {
        await pushNow();
        return local;
      }
      return { ok: false, error: remote.error };
    }
    pairingLock = null;
    applyRemoteState(remote.state, remote.version);
    audit(
      "TV_PAIRED",
      input.userName,
      `Vinculó ${remote.screen.code}`,
      remote.screen,
    );
    notifyLocal();
    return { ok: true, data: remote.screen };
  },

  unpairScreen(input: {
    screenId: string;
    userName: string;
  }): AdTvResult<AdTvScreen> {
    const screen = state.screens.find((s) => s.id === input.screenId);
    if (!screen) return { ok: false, error: "Pantalla no encontrada" };
    const next: AdTvScreen = {
      ...screen,
      paired: false,
      status: "OFFLINE",
      pairingCode: null,
      pairingToken: null,
      playbackState: "IDLE",
      updatedAt: nowIso(),
    };
    state.screens = state.screens.map((s) =>
      s.id === screen.id ? next : s,
    );
    audit("TV_UNPAIRED", input.userName, `Desvinculó ${next.code}`, next);
    notifyLocal();
    void pushNow({ allowUnpair: true });
    return { ok: true, data: next };
  },

  /**
   * Heartbeat del reproductor.
   * Solo actualiza lastSeen localmente: no hace push (evita pisar
   * el código de vinculación / comandos del móvil por last-write-wins).
   */
  heartbeat(screenId: string): AdTvResult<AdTvScreen> {
    const screen = state.screens.find((s) => s.id === screenId);
    if (!screen) return { ok: false, error: "Pantalla no encontrada" };
    const next = touch({
      ...screen,
      status: screen.paired
        ? "ONLINE"
        : screen.status === "PAIRING"
          ? "PAIRING"
          : "OFFLINE",
    });
    state.screens = state.screens.map((s) =>
      s.id === screen.id ? next : s,
    );
    notifyLocal();
    return { ok: true, data: next };
  },

  createContent(input: {
    name: string;
    type: AdTvContentType;
    url: string;
    durationSec?: number;
    notes?: string;
    userName: string;
  }): AdTvResult<AdTvContent> {
    if (!input.name.trim()) return { ok: false, error: "Nombre obligatorio" };
    if (input.type !== "TEXT" && !input.url.trim()) {
      return { ok: false, error: "URL o archivo obligatorio" };
    }
    const content: AdTvContent = {
      id: uid("tvc"),
      name: input.name.trim(),
      type: input.type,
      url: input.url.trim(),
      durationSec: Math.max(1, input.durationSec ?? 10),
      active: true,
      notes: input.notes,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.contents = [content, ...state.contents];
    audit(
      "CONTENT_CREATED",
      input.userName,
      `Contenido ${content.name} (${content.type})`,
    );
    emit();
    void pushNow();
    return { ok: true, data: content };
  },

  createGroup(input: {
    name: string;
    code?: string;
    userName: string;
  }): AdTvResult<AdTvGroup> {
    if (!input.name.trim()) return { ok: false, error: "Nombre obligatorio" };
    const group: AdTvGroup = {
      id: uid("tvg"),
      name: input.name.trim().toUpperCase(),
      code: (input.code ?? input.name).trim().toUpperCase().replace(/\s+/g, "_"),
      screenIds: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.groups = [group, ...state.groups];
    audit("GROUP_CREATED", input.userName, `Grupo ${group.name}`);
    emit();
    return { ok: true, data: group };
  },

  setGroupScreens(input: {
    groupId: string;
    screenIds: string[];
    userName: string;
  }): AdTvResult<AdTvGroup> {
    const group = state.groups.find((g) => g.id === input.groupId);
    if (!group) return { ok: false, error: "Grupo no encontrado" };
    const next = {
      ...group,
      screenIds: [...new Set(input.screenIds)],
      updatedAt: nowIso(),
    };
    state.groups = state.groups.map((g) => (g.id === group.id ? next : g));
    state.screens = state.screens.map((s) =>
      next.screenIds.includes(s.id)
        ? { ...s, currentGroupId: group.id, updatedAt: nowIso() }
        : s.currentGroupId === group.id
          ? { ...s, currentGroupId: null, updatedAt: nowIso() }
          : s,
    );
    audit(
      "GROUP_CHANGED",
      input.userName,
      `${next.name}: ${next.screenIds.length} pantallas`,
    );
    emit();
    return { ok: true, data: next };
  },

  addScreenToGroup(input: {
    groupId: string;
    screenId: string;
    userName: string;
  }): AdTvResult<AdTvGroup> {
    const group = state.groups.find((g) => g.id === input.groupId);
    if (!group) return { ok: false, error: "Grupo no encontrado" };
    return this.setGroupScreens({
      groupId: input.groupId,
      screenIds: [...group.screenIds, input.screenId],
      userName: input.userName,
    });
  },

  removeScreenFromGroup(input: {
    groupId: string;
    screenId: string;
    userName: string;
  }): AdTvResult<AdTvGroup> {
    const group = state.groups.find((g) => g.id === input.groupId);
    if (!group) return { ok: false, error: "Grupo no encontrado" };
    return this.setGroupScreens({
      groupId: input.groupId,
      screenIds: group.screenIds.filter((id) => id !== input.screenId),
      userName: input.userName,
    });
  },

  /**
   * Emite comando a pantallas seleccionadas vía realtime MOCK.
   * Futuro: mismo payload por WebSocket.
   */
  dispatchCommand(input: {
    command: AdTvCommandType;
    userName: string;
    screenIds?: string[];
    groupId?: string;
    all?: boolean;
    contentId?: string;
    position?: number;
    volume?: number;
    muted?: boolean;
  }): AdTvResult<AdTvCommand> {
    const targets = resolveTargets(input);
    if (!targets.length) {
      return { ok: false, error: "Seleccione al menos una pantalla" };
    }
    if (
      (input.command === "PLAY" || input.command === "LOAD_CONTENT") &&
      !input.contentId
    ) {
      const anyMissing = targets.some((id) => {
        const s = state.screens.find((x) => x.id === id);
        return !s?.currentContentId;
      });
      if (anyMissing && !input.contentId) {
        return { ok: false, error: "Seleccione contenido" };
      }
    }

    const cmd: AdTvCommand = {
      id: uid("tcmd"),
      command: input.command,
      screenIds: targets,
      contentId: input.contentId ?? null,
      position: input.position,
      volume: input.volume,
      muted: input.muted,
      issuedAt: nowIso(),
      issuedBy: input.userName,
    };

    state.screens = state.screens.map((s) =>
      targets.includes(s.id) ? applyCommandToScreen(s, cmd) : s,
    );
    state.lastCommand = cmd;

    const auditAction =
      input.command === "PLAY"
        ? "PLAY"
        : input.command === "PAUSE"
          ? "PAUSE"
          : input.command === "STOP"
            ? "STOP"
            : input.command === "SET_VOLUME"
              ? "VOLUME_CHANGED"
              : input.command === "MUTE"
                ? "MUTE"
                : input.command === "LOAD_CONTENT"
                  ? "CONTENT_LOADED"
                  : input.command === "RESTART"
                    ? "RESTART"
                    : "SYNC";

    audit(
      auditAction,
      input.userName,
      `${input.command} → ${targets.length} pantalla(s)${
        input.contentId ? ` · ${input.contentId}` : ""
      }`,
    );

    /** MOCK realtime broadcast (futuro WebSocket). */
    adTvRealtime.broadcastCommand(cmd);
    emit();
    void pushNow();
    return { ok: true, data: cmd };
  },
};
