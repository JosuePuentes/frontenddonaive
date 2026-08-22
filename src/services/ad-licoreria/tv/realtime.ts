/**
 * MOCK — preparado para WebSocket backend.
 *
 * TvRealtimeTransport abstrae la sincronización multi-pantalla.
 * Hoy: bus in-memory. Mañana: WebSocket / SSE hacia apps/api.
 */

import type { AdTvCommand, AdTvRealtimeEnvelope } from "@/types/ad-tv";

export type TvRealtimeListener = (envelope: AdTvRealtimeEnvelope) => void;

export type TvRealtimeTransport = {
  connect: () => void;
  disconnect: () => void;
  sendCommand: (command: AdTvCommand) => void;
  broadcastCommand: (command: AdTvCommand) => void;
  subscribe: (listener: TvRealtimeListener) => () => void;
  unsubscribe: (listener: TvRealtimeListener) => void;
  isConnected: () => boolean;
};

/**
 * Implementación MOCK in-memory.
 * Documentación futura: el backend emitirá los mismos envelopes por WS.
 */
export function createMockTvRealtimeTransport(): TvRealtimeTransport {
  const listeners = new Set<TvRealtimeListener>();
  let connected = false;

  function emit(envelope: AdTvRealtimeEnvelope) {
    for (const listener of listeners) {
      try {
        listener(envelope);
      } catch {
        /* listener aislado */
      }
    }
  }

  return {
    connect() {
      connected = true;
    },
    disconnect() {
      connected = false;
    },
    sendCommand(command) {
      if (!connected) this.connect();
      emit({ type: "command", command });
    },
    broadcastCommand(command) {
      this.sendCommand(command);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    unsubscribe(listener) {
      listeners.delete(listener);
    },
    isConnected() {
      return connected;
    },
  };
}

export const adTvRealtime = createMockTvRealtimeTransport();
adTvRealtime.connect();
