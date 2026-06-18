import type { TicketListItem } from "./tickets";

/** Data/hora curta no formato pt-BR (ex.: 18/06/26 14:30). */
export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Apenas a data (ex.: 18/06/2026). */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "short" });
  } catch {
    return iso;
  }
}

/** "Sala 12 — Prédio A / 1º Andar" a partir do objeto de localização. */
export function formatLocation(loc: TicketListItem["location"]): string {
  const extra = [loc.building, loc.floor].filter(Boolean).join(" / ");
  return extra ? `${loc.name} — ${extra}` : loc.name;
}

/** Iniciais de um nome para avatares (ex.: "Maria Souza" -> "MS"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Tamanho de arquivo legível (ex.: 1.4 MB). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
