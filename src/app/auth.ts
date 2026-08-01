import type { ClientProfile } from "./types";

const KEY = "barberhouse_client";

export function loadProfile(): ClientProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ClientProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: ClientProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  localStorage.removeItem(KEY);
}

export function incrementVisits(profile: ClientProfile): ClientProfile {
  const updated = { ...profile, totalVisits: profile.totalVisits + 1 };
  saveProfile(updated);
  return updated;
}
