import { describe, expect, it } from "vitest";
import adminHtml from "../../custom_components/release_notes_manager/release-notes.html?raw";

// Das Admin-Interface ist eine einzelne Datei mit großem Inline-Skript ohne Build.
// `new Function` übersetzt den Text nur, ohne ihn auszuführen: ein Tippfehler fiele sonst erst im Browser auf.
describe("release-notes.html", () => {
  const script = /<script>([\s\S]*?)<\/script>/.exec(adminHtml);

  it("enthält genau ein Inline-Skript, das sich übersetzen lässt", () => {
    expect(script).not.toBeNull();
    expect(adminHtml.match(/<script>/g)).toHaveLength(1);
    expect(() => new Function(script![1])).not.toThrow();
  });

  it("verwendet für Bedienelemente nur vorhandene Funktionen", () => {
    const body = script![1];
    const handlers = new Set([...adminHtml.matchAll(/\bon(?:click|input|change)="([a-zA-Z_]\w*)\(/g)].map((m) => m[1]));
    for (const name of handlers) {
      expect(body, `Funktion ${name} fehlt`).toMatch(new RegExp(`function ${name}\\b|(?:const|let) ${name}\\b`));
    }
  });
});
