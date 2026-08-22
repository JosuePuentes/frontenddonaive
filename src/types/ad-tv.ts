/**
 * Dominio A&D TV / Digital Signage.
 * Preparado para backend + WebSocket (sin implementar aún).
 */

export type AdTvScreenStatus = "ONLINE" | "OFFLINE" | "PAIRING";

export type AdTvContentType =
  | "IMAGE"
  | "VIDEO"
  | "YOUTUBE"
  | "TEXT"
  | "MENU"
  | "PROMOTION";

export type AdTvPlaybackState = "IDLE" | "PLAYING" | "PAUSED" | "STOPPED";

export type AdTvCommandType =
  | "PLAY"
  | "PAUSE"
  | "STOP"
  | "SEEK"
  | "SET_VOLUME"
  | "MUTE"
  | "LOAD_CONTENT"
  | "SYNC"
  | "RESTART";

export type AdTvScreen = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: AdTvScreenStatus;
  pairingCode?: string | null;
  pairingToken?: string | null;
  paired: boolean;
  currentContentId?: string | null;
  /** Lista en bucle (fotos/videos/YouTube) en esta TV. */
  playlistIds?: string[] | null;
  currentGroupId?: string | null;
  volume: number;
  isMuted: boolean;
  playbackState: AdTvPlaybackState;
  positionSec: number;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdTvContent = {
  id: string;
  name: string;
  type: AdTvContentType;
  url: string;
  durationSec: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdTvGroup = {
  id: string;
  name: string;
  code: string;
  screenIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdTvCommand = {
  id: string;
  command: AdTvCommandType;
  screenIds: string[];
  contentId?: string | null;
  /** Varios ítems: la TV los pasa uno tras otro. */
  contentIds?: string[] | null;
  position?: number;
  volume?: number;
  muted?: boolean;
  issuedAt: string;
  issuedBy: string;
};

export type AdTvAuditAction =
  | "TV_CREATED"
  | "TV_DELETED"
  | "TV_UPDATED"
  | "TV_PAIRED"
  | "TV_UNPAIRED"
  | "CONTENT_CREATED"
  | "CONTENT_DELETED"
  | "CONTENT_LOADED"
  | "GROUP_CREATED"
  | "GROUP_CHANGED"
  | "PLAY"
  | "PAUSE"
  | "STOP"
  | "VOLUME_CHANGED"
  | "MUTE"
  | "RESTART"
  | "SYNC";

export type AdTvAuditEvent = {
  id: string;
  action: AdTvAuditAction;
  userName: string;
  screenId?: string;
  screenName?: string;
  detail: string;
  createdAt: string;
};

export type AdTvRealtimeEnvelope = {
  type: "command";
  command: AdTvCommand;
};
