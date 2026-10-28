import { describe, expect, it } from "vitest";
import adminHtml from "../../custom_components/release_notes_manager/release-notes.html?raw";

// Der Rechenkern des Statistik-Popups liegt im Admin-Interface (reines JavaScript ohne Build).
// Der Test liest den Block zwischen den Markern aus der Datei und führt ihn aus.
const block = /\/\/ <stats-core>\n([\s\S]*?)\/\/ <\/stats-core>/.exec(adminHtml);
if (!block) throw new Error("stats-core block not found in release-notes.html");

interface Bucket {
  start: number;
  end: number;
  releases: number;
  features: number;
  changes: number;
  bugs: number;
  open: number;
  active: number;
}
interface Core {
  DAY: number;
  toMs(s: string): number;
  fromMs(ms: number): string;
  bucketStart(ms: number, g: string): number;
  bucketCount(from: number, to: number, g: string): number;
  pickGran(from: number, to: number): string;
  isoWeek(ms: number): number;
  niceTicks(max: number): { top: number; ticks: number[] };
  computeStats(
    releases: unknown[],
    o: { from: number; to: number; gran: string; match: (c: string) => boolean; allSelected: boolean },
  ): { buckets: Bucket[]; totals: Record<string, number>; gran: string };
}
const core = new Function(`${block[1]}\nreturn StatsCore;`)() as Core;

const all = (_category: string) => true;
const item = (id: number, category?: string) => ({ id, title: "x", category });
const issue = (id: number, status: "open" | "resolved", category = "general") => ({ id, title: "x", status, category });
const stats = (releases: unknown[], from: string, to: string, gran: string, match = all, allSelected = true) =>
  core.computeStats(releases, { from: core.toMs(from), to: core.toMs(to), gran, match, allSelected });

describe("Zeitabschnitte", () => {
  it("beginnt Wochen am Montag und Monate am Ersten", () => {
    expect(core.fromMs(core.bucketStart(core.toMs("2026-10-28"), "week"))).toBe("2026-10-26");
    expect(core.fromMs(core.bucketStart(core.toMs("2026-10-28"), "month"))).toBe("2026-10-01");
    expect(core.fromMs(core.bucketStart(core.toMs("2026-10-28"), "year"))).toBe("2026-01-01");
  });

  it("zählt Abschnitte über Jahreswechsel und Sommerzeit hinweg", () => {
    expect(core.bucketCount(core.toMs("2025-12-30"), core.toMs("2026-01-02"), "day")).toBe(4);
    expect(core.bucketCount(core.toMs("2025-12-30"), core.toMs("2026-01-02"), "month")).toBe(2);
    // Umstellung auf Winterzeit am 25.10.2026: jeder Tag bleibt genau ein Abschnitt
    expect(core.bucketCount(core.toMs("2026-10-24"), core.toMs("2026-10-27"), "day")).toBe(4);
  });

  it("wählt die feinste Auflösung mit höchstens 40 Abschnitten", () => {
    expect(core.pickGran(core.toMs("2026-10-01"), core.toMs("2026-10-28"))).toBe("day");
    expect(core.pickGran(core.toMs("2026-07-01"), core.toMs("2026-10-28"))).toBe("week");
    expect(core.pickGran(core.toMs("2025-05-01"), core.toMs("2026-10-28"))).toBe("month");
    expect(core.pickGran(core.toMs("2010-01-01"), core.toMs("2026-10-28"))).toBe("year");
  });

  it("berechnet ISO-Kalenderwochen", () => {
    expect(core.isoWeek(core.toMs("2026-01-01"))).toBe(1);
    expect(core.isoWeek(core.toMs("2024-12-30"))).toBe(1);
    expect(core.isoWeek(core.toMs("2021-01-03"))).toBe(53);
  });
});

describe("niceTicks", () => {
  it("liefert ganzzahlige Teilungen mit höchstens vier Intervallen", () => {
    expect(core.niceTicks(0)).toEqual({ top: 1, ticks: [0, 1] });
    expect(core.niceTicks(3).ticks).toEqual([0, 1, 2, 3]);
    expect(core.niceTicks(7)).toEqual({ top: 8, ticks: [0, 2, 4, 6, 8] });
    expect(core.niceTicks(23)).toEqual({ top: 30, ticks: [0, 10, 20, 30] });
  });
});

describe("computeStats", () => {
  const releases = [
    { id: 1, date: "2026-09-10", features: [item(1, "energy")], changes: [item(2, "update")], knownIssues: [issue(100, "open")] },
    { id: 2, date: "2026-09-20", features: [], changes: [item(3)], knownIssues: [issue(100, "open"), issue(101, "open", "heating")] },
    { id: 3, date: "2026-10-05", features: [item(4, "heating")], changes: [], knownIssues: [issue(100, "resolved"), issue(101, "open", "heating")] },
  ];

  it("summiert Features, Änderungen und Releases je Monat", () => {
    const s = stats(releases, "2026-09-01", "2026-10-28", "month");
    expect(s.buckets).toHaveLength(2);
    expect(s.buckets[0]).toMatchObject({ releases: 2, features: 1, changes: 2 });
    expect(s.buckets[1]).toMatchObject({ releases: 1, features: 1, changes: 0 });
  });

  it("zählt ein Known Issue nur einmal, im Abschnitt des ersten Auftretens", () => {
    const s = stats(releases, "2026-09-01", "2026-10-28", "month");
    expect(s.buckets[0].bugs).toBe(2);
    expect(s.buckets[1].bugs).toBe(0);
    expect(s.totals.bugs).toBe(2);
  });

  it("berechnet den Bestand offener Bugs am Ende jedes Abschnitts", () => {
    const s = stats(releases, "2026-09-01", "2026-10-28", "month");
    expect(s.buckets[0].open).toBe(2);
    // 100 ist am 05.10. gelöst, 101 bleibt offen
    expect(s.buckets[1].open).toBe(1);
    expect(s.totals.open).toBe(1);
    const early = stats(releases, "2026-09-01", "2026-10-28", "day");
    expect(early.buckets[9].open).toBe(1);
    expect(early.buckets[19].open).toBe(2);
  });

  it("zählt als Bugs im Zeitabschnitt alle, die dort zu irgendeinem Zeitpunkt offen waren", () => {
    const s = stats(releases, "2026-09-01", "2026-10-28", "month");
    // September: 100 und 101. Oktober: 100 (am 05.10. gelöst, aber im Oktober offen gewesen) und 101
    expect(s.buckets.map((b) => b.active)).toEqual([2, 2]);
    expect(s.buckets.map((b) => b.open)).toEqual([2, 1]);
    // Im Folgemonat ist 100 gelöst und zählt nicht mehr mit
    const later = stats(releases, "2026-09-01", "2026-11-10", "month");
    expect(later.buckets[2]).toMatchObject({ active: 1, open: 1 });
  });

  it("zählt ein Known Issue, das schon beim ersten Auftreten gelöst ist, als neu aber nie offen", () => {
    const s = stats([{ id: 1, date: "2026-10-01", features: [], changes: [], knownIssues: [issue(7, "resolved")] }], "2026-10-01", "2026-10-28", "month");
    expect(s.totals).toMatchObject({ bugs: 1, open: 0 });
    expect(s.buckets[0].open).toBe(0);
  });

  it("filtert nach Kategorie und zählt Releases nur bei passendem Eintrag", () => {
    const s = stats(releases, "2026-09-01", "2026-10-28", "month", (c) => c === "heating", false);
    expect(s.totals).toMatchObject({ features: 1, changes: 0, bugs: 1, releases: 2 });
    expect(s.buckets[0].releases).toBe(1);
    expect(s.buckets[0].open).toBe(1);
  });

  it("wertet Einträge ohne Kategorie als Allgemein", () => {
    const s = stats(releases, "2026-09-01", "2026-10-28", "month", (c) => c === "general", false);
    expect(s.totals.changes).toBe(1);
    expect(s.totals.bugs).toBe(1);
  });

  it("lässt Releases außerhalb des Zeitraums und ohne Datum aus", () => {
    const withBroken = [...releases, { id: 9, features: [item(9)], changes: [], knownIssues: [] }];
    const s = stats(withBroken, "2026-10-01", "2026-10-28", "month");
    expect(s.totals).toMatchObject({ releases: 1, features: 1, changes: 0 });
  });

  it("liefert für keine Releases einen leeren Zeitabschnitt", () => {
    const s = stats([], "2026-10-28", "2026-10-28", "day");
    expect(s.buckets).toHaveLength(1);
    expect(s.totals).toEqual({ releases: 0, features: 0, changes: 0, bugs: 0, open: 0 });
  });

  it("schneidet den letzten Abschnitt am Zeitraumende ab", () => {
    const s = stats(releases, "2026-09-01", "2026-10-28", "month");
    expect(core.fromMs(s.buckets[1].end)).toBe("2026-10-28");
  });
});
