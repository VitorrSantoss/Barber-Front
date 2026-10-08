import { useEffect, useState } from "react";
import type { Appointment } from "./types";

/** Data local no formato da API (yyyy-MM-dd). */
export function localDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Monta o dataHora (LocalDateTime) que a API espera para um horário "HH:mm". */
export function toDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/**
 * Ordem da fila: quem já chegou vale pela horaChegada (é o que a API usa);
 * horário marcado ainda não chegou e vale pela data/hora marcada.
 */
export function compareQueue(a: Appointment, b: Appointment): number {
  const key = (x: Appointment) => (x.scheduled ? x.dateTime : (x.arrivedAt ?? x.dateTime)) ?? x.time;
  return key(a).localeCompare(key(b));
}

export function isActive(a: Appointment): boolean {
  return a.status === "aguardando" || a.status === "em_atendimento";
}

/** Relógio que reavalia a cada `ms` (para marcar horários que já passaram). */
export function useNow(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
