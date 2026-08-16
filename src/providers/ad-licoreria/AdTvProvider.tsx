/**
 * Provider MOCK A&D TV.
 * UI → este provider → repository → realtime transport.
 * MOCK — preparado para WebSocket backend.
 */
import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  adTvRepository,
  type AdTvRepositoryState,
} from "@/services/ad-licoreria/tv/repository";
import { adTvRealtime } from "@/services/ad-licoreria/tv/realtime";

type AdTvActions = {
  listScreens: typeof adTvRepository.listScreens;
  getScreen: typeof adTvRepository.getScreen;
  listContents: typeof adTvRepository.listContents;
  listGroups: typeof adTvRepository.listGroups;
  listAudit: typeof adTvRepository.listAudit;
  createScreen: typeof adTvRepository.createScreen;
  updateScreen: typeof adTvRepository.updateScreen;
  deleteScreen: typeof adTvRepository.deleteScreen;
  beginPairing: typeof adTvRepository.beginPairing;
  pairWithCode: typeof adTvRepository.pairWithCode;
  pairWithCodeRemote: typeof adTvRepository.pairWithCodeRemote;
  unpairScreen: typeof adTvRepository.unpairScreen;
  heartbeat: typeof adTvRepository.heartbeat;
  createContent: typeof adTvRepository.createContent;
  createGroup: typeof adTvRepository.createGroup;
  setGroupScreens: typeof adTvRepository.setGroupScreens;
  addScreenToGroup: typeof adTvRepository.addScreenToGroup;
  removeScreenFromGroup: typeof adTvRepository.removeScreenFromGroup;
  dispatchCommand: typeof adTvRepository.dispatchCommand;
  reset: typeof adTvRepository.reset;
  realtime: typeof adTvRealtime;
};

type AdTvStore = AdTvRepositoryState & AdTvActions;

const AdTvContext = createContext<AdTvStore | null>(null);

function getSnapshot() {
  return adTvRepository.getState();
}

/** Acciones estables: no recrear en cada sync (evita reinicios del reproductor). */
const TV_ACTIONS: AdTvActions = {
  listScreens: () => adTvRepository.listScreens(),
  getScreen: (id) => adTvRepository.getScreen(id),
  listContents: () => adTvRepository.listContents(),
  listGroups: () => adTvRepository.listGroups(),
  listAudit: () => adTvRepository.listAudit(),
  createScreen: (input) => adTvRepository.createScreen(input),
  updateScreen: (input) => adTvRepository.updateScreen(input),
  deleteScreen: (input) => adTvRepository.deleteScreen(input),
  beginPairing: (input) => adTvRepository.beginPairing(input),
  pairWithCode: (input) => adTvRepository.pairWithCode(input),
  pairWithCodeRemote: (input) => adTvRepository.pairWithCodeRemote(input),
  unpairScreen: (input) => adTvRepository.unpairScreen(input),
  heartbeat: (id) => adTvRepository.heartbeat(id),
  createContent: (input) => adTvRepository.createContent(input),
  createGroup: (input) => adTvRepository.createGroup(input),
  setGroupScreens: (input) => adTvRepository.setGroupScreens(input),
  addScreenToGroup: (input) => adTvRepository.addScreenToGroup(input),
  removeScreenFromGroup: (input) =>
    adTvRepository.removeScreenFromGroup(input),
  dispatchCommand: (input) => adTvRepository.dispatchCommand(input),
  reset: () => adTvRepository.reset(),
  realtime: adTvRealtime,
};

export function AdTvProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(
    adTvRepository.subscribe,
    getSnapshot,
    getSnapshot,
  );

  const value = useMemo<AdTvStore>(
    () => ({
      ...snap,
      ...TV_ACTIONS,
    }),
    [snap],
  );

  return (
    <AdTvContext.Provider value={value}>{children}</AdTvContext.Provider>
  );
}

export function useAdTv() {
  const ctx = useContext(AdTvContext);
  if (!ctx) {
    throw new Error("useAdTv must be used within AdTvProvider");
  }
  return ctx;
}
