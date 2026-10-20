import type { Category, KnownIssue, Release } from "./types";

export const COLOR_IDS = [
  "white",
  "gray",
  "black",
  "red",
  "orange",
  "yellow",
  "green",
  "blue-light",
  "blue-dark",
  "purple",
  "pink",
] as const;
export type ColorId = (typeof COLOR_IDS)[number];

// Bis v0.6.4 wurden Tailwind-Klassen gespeichert (z. B. 'bg-red-100 text-red-800',
// Backend-Standard 'bg-teal-500'). Gleiche Abbildung wie toColorId() im Admin-Interface.
const LEGACY_HUES: Record<string, ColorId> = {
  white: "white",
  gray: "gray",
  slate: "gray",
  zinc: "gray",
  neutral: "gray",
  stone: "gray",
  black: "black",
  red: "red",
  rose: "pink",
  orange: "orange",
  amber: "yellow",
  yellow: "yellow",
  green: "green",
  emerald: "green",
  lime: "green",
  teal: "green",
  sky: "blue-light",
  cyan: "blue-light",
  indigo: "blue-dark",
  violet: "purple",
  purple: "purple",
  fuchsia: "pink",
  pink: "pink",
};

export function toColorId(color: string | undefined): ColorId {
  if ((COLOR_IDS as readonly string[]).includes(color ?? "")) {
    return color as ColorId;
  }
  const match = /bg-([a-z]+)(?:-(\d+))?/.exec(color ?? "");
  if (!match) {
    return "gray";
  }
  const hue = match[1];
  const shade = Number.parseInt(match[2] ?? "0", 10);
  if (hue === "blue") {
    return shade >= 500 ? "blue-dark" : "blue-light";
  }
  if (hue === "gray" && shade >= 700) {
    return "black";
  }
  return LEGACY_HUES[hue] ?? "gray";
}

export function findCategory(categories: Category[], id: string | undefined): Category {
  const wanted = id || "general";
  return categories.find((c) => c.id === wanted) ?? { id: wanted, label: wanted, color: "gray" };
}

export function formatDateDE(date: string): string {
  if (!date) {
    return "";
  }
  const [y, m, d] = date.split("-");
  return `${d}.${m}.${y}`;
}

// Neuestes Release nach Datum, bei gleichem Datum das zuletzt angelegte
export function newestReleaseId(releases: Release[]): number | null {
  const sorted = [...releases].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id,
  );
  return sorted.length > 0 ? sorted[0].id : null;
}

export function filterReleases(releases: Release[], search: string, category: string): Release[] {
  const term = search.trim().toLowerCase();
  return releases.filter((r) => {
    const matchesSearch = !term || JSON.stringify(r).toLowerCase().includes(term);
    const matchesCategory =
      category === "all" ||
      (r.features ?? []).some((f) => f.category === category) ||
      (r.changes ?? []).some((c) => c.category === category);
    return matchesSearch && matchesCategory;
  });
}

export function openIssues(release: Release): KnownIssue[] {
  return (release.knownIssues ?? []).filter((i) => i.status !== "resolved");
}

export function resolvedIssues(release: Release): KnownIssue[] {
  return (release.knownIssues ?? []).filter(
    (i) => i.status === "resolved" && i.resolvedInVersion === release.version,
  );
}

export interface Summary {
  features: number;
  // Änderungen inklusive der in dieser Version gelösten Fehler
  changes: number;
  issues: number;
}

export function summarize(release: Release): Summary {
  return {
    features: (release.features ?? []).length,
    changes: (release.changes ?? []).length + resolvedIssues(release).length,
    issues: openIssues(release).length,
  };
}
