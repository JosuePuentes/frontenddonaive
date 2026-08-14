import type { PolisurUnitId } from "@/content/polisur-preinscripcion";

export type PolisurPreinscripcion = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  correo: string;
  telefono: string;
  unidad: PolisurUnitId;
  mensaje: string;
  createdAt: string;
};

export type PolisurPreinscripcionPayload = {
  nombres: string;
  apellidos: string;
  cedula: string;
  correo: string;
  telefono: string;
  unidad: string;
  mensaje?: string;
  /** Honeypot — no completar */
  website?: string;
};
