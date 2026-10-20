import { describe, expect, it } from "vitest";
import { filterReleases, findCategory, formatDateDE, newestReleaseId, summarize, toColorId } from "../src/logic";
import type { Release } from "../src/types";

const release = (id: number, date: string, extra: Partial<Release> = {}): Release => ({
  id,
  version: `v${id}`,
  date,
  features: [],
  changes: [],
  knownIssues: [],
  ...extra,
});

describe("toColorId", () => {
  it("keeps color ids", () => {
    expect(toColorId("blue-dark")).toBe("blue-dark");
  });

  it("maps the classes stored up to v0.6.4", () => {
    expect(toColorId("bg-red-100 text-red-800")).toBe("red");
    expect(toColorId("bg-blue-200 text-blue-900")).toBe("blue-light");
    expect(toColorId("bg-blue-600 text-white")).toBe("blue-dark");
    expect(toColorId("bg-gray-800 text-white")).toBe("black");
    expect(toColorId("bg-gray-200 text-gray-800")).toBe("gray");
    expect(toColorId("bg-white text-gray-900 border border-gray-300")).toBe("white");
    expect(toColorId("bg-teal-500")).toBe("green");
    expect(toColorId("bg-rose-500")).toBe("pink");
  });

  it("falls back to gray", () => {
    expect(toColorId(undefined)).toBe("gray");
    expect(toColorId("something")).toBe("gray");
    expect(toColorId("bg-unknownhue-300")).toBe("gray");
  });
});

describe("findCategory", () => {
  it("uses general for items without category and the id for unknown ones", () => {
    const categories = [{ id: "general", label: "Allgemein", color: "gray" }];
    expect(findCategory(categories, undefined).label).toBe("Allgemein");
    expect(findCategory(categories, "gone")).toEqual({ id: "gone", label: "gone", color: "gray" });
  });
});

describe("newestReleaseId", () => {
  it("sorts by date, then by id", () => {
    expect(newestReleaseId([release(1, "2026-10-01"), release(2, "2026-09-01")])).toBe(1);
    expect(newestReleaseId([release(1, "2026-10-01"), release(2, "2026-10-01")])).toBe(2);
    expect(newestReleaseId([])).toBeNull();
  });
});

describe("filterReleases", () => {
  const releases = [
    release(1, "2026-10-01", { features: [{ id: 11, title: "Wallbox", category: "energy" }] }),
    release(2, "2026-09-01", { changes: [{ id: 21, title: "Heizkurve", category: "heating" }] }),
  ];

  it("searches case-insensitively", () => {
    expect(filterReleases(releases, "wallBOX", "all").map((r) => r.id)).toEqual([1]);
  });

  it("filters by the category of features and changes", () => {
    expect(filterReleases(releases, "", "heating").map((r) => r.id)).toEqual([2]);
    expect(filterReleases(releases, "", "all")).toHaveLength(2);
  });
});

describe("summarize", () => {
  it("counts issues resolved in this version as changes", () => {
    const r = release(1, "2026-10-01", {
      features: [{ id: 1, title: "a" }],
      changes: [{ id: 2, title: "b" }],
      knownIssues: [
        { id: 3, title: "open" },
        { id: 4, title: "fixed here", status: "resolved", resolvedInVersion: "v1" },
        { id: 5, title: "fixed elsewhere", status: "resolved", resolvedInVersion: "v0" },
      ],
    });
    expect(summarize(r)).toEqual({ features: 1, changes: 2, issues: 1 });
  });
});

describe("formatDateDE", () => {
  it("formats ISO dates", () => {
    expect(formatDateDE("2026-10-18")).toBe("18.10.2026");
    expect(formatDateDE("")).toBe("");
  });
});
