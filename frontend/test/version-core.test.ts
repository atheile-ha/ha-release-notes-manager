import { describe, expect, it } from "vitest";
import adminHtml from "../../custom_components/release_notes_manager/release-notes.html?raw";

// Das Admin-Interface ist reines JavaScript ohne Build. Der Test liest den Block zwischen den Markern aus der Datei.
const block = /\/\/ <version-core>\n([\s\S]*?)\/\/ <\/version-core>/.exec(adminHtml);
if (!block) throw new Error("version-core block not found in release-notes.html");

interface Core {
  schemeOf(settings: unknown): "calver" | "semver";
  matches(scheme: string, version: string | undefined): boolean;
  nextCalver(versions: (string | undefined)[], year: number, month: number): string;
}
const core = new Function(`${block[1]}\nreturn VersionCore;`)() as Core;

describe("schemeOf", () => {
  it("nimmt calver, wenn nichts oder etwas Unbekanntes eingestellt ist", () => {
    expect(core.schemeOf(undefined)).toBe("calver");
    expect(core.schemeOf({})).toBe("calver");
    expect(core.schemeOf({ versionScheme: "x" })).toBe("calver");
    expect(core.schemeOf({ versionScheme: "semver" })).toBe("semver");
  });
});

describe("matches", () => {
  it("erkennt YYYY.MM.ZZ mit und ohne führende Null im Monat", () => {
    expect(core.matches("calver", "2026.10.3")).toBe(true);
    expect(core.matches("calver", "2026.9.3")).toBe(true);
    expect(core.matches("calver", "2026.09.3")).toBe(true);
    expect(core.matches("calver", "26.9.3")).toBe(false);
    expect(core.matches("calver", "1.4.2")).toBe(false);
    expect(core.matches("calver", "2026.10")).toBe(false);
  });

  it("erkennt xx.yy.zz und trennt es von der Jahresschreibweise", () => {
    expect(core.matches("semver", "1.4.2")).toBe(true);
    expect(core.matches("semver", "0.8.0")).toBe(true);
    expect(core.matches("semver", "2026.10.3")).toBe(false);
    expect(core.matches("semver", "1.4")).toBe(false);
    expect(core.matches("semver", " 1.4.2 ")).toBe(true);
  });

  it("lehnt leere Eingaben ab", () => {
    expect(core.matches("calver", "")).toBe(false);
    expect(core.matches("semver", undefined)).toBe(false);
  });
});

describe("nextCalver", () => {
  it("zählt im laufenden Monat weiter", () => {
    expect(core.nextCalver(["2026.10.2", "2026.10.1", "2026.9.3", "1.4.2"], 2026, 10)).toBe("2026.10.3");
    expect(core.nextCalver(["2026.10.9", "2026.10.10"], 2026, 10)).toBe("2026.10.11");
  });

  it("beginnt im neuen Monat bei 1", () => {
    expect(core.nextCalver(["2026.9.3"], 2026, 10)).toBe("2026.10.1");
    expect(core.nextCalver([], 2026, 10)).toBe("2026.10.1");
  });

  it("schreibt den Monat ohne führende Null und erkennt auch die Schreibweise mit Null", () => {
    expect(core.nextCalver(["2026.01.2"], 2026, 1)).toBe("2026.1.3");
  });

  it("ignoriert Versionen anderer Jahre und fremde Schreibweisen", () => {
    expect(core.nextCalver(["2025.10.7", "abc", undefined, ""], 2026, 10)).toBe("2026.10.1");
  });
});
