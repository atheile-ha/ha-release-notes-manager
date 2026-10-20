import { ReleaseNotesCard } from "./release-notes-card";
import { keepDefined } from "./registry";

keepDefined([["release-notes-card", ReleaseNotesCard]], {
  onIncomplete: () =>
    console.warn("release_notes_manager: the element registry of this page refuses the card"),
});

// Makes the card appear in the dashboard card picker.
interface CustomCardEntry {
  type: string;
  name: string;
  description?: string;
}
const registry = window as unknown as { customCards?: CustomCardEntry[] };
registry.customCards = registry.customCards ?? [];
if (!registry.customCards.some((entry) => entry.type === "release-notes-card")) {
  registry.customCards.push({
    type: "release-notes-card",
    name: "Release Notes",
    description: "Releases, Änderungen und bekannte Fehler aus dem Release Notes Manager",
  });
}
