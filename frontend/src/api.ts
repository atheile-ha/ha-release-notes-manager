import type { CardData, HomeAssistant } from "./types";

export function fetchData(hass: HomeAssistant): Promise<CardData> {
  return hass.callWS<CardData>({ type: "release_notes_manager/data" });
}

// Calls onUpdate after every save in the backend (admin interface or update
// tracker). The websocket library subscribes again after a reconnect.
export function subscribeUpdates(
  hass: HomeAssistant,
  onUpdate: () => void,
): Promise<() => Promise<void>> {
  return hass.connection.subscribeMessage<{ updated: boolean }>(() => onUpdate(), {
    type: "release_notes_manager/subscribe",
  });
}

// Runs retry each time the websocket connection is (re-)established; Home
// Assistant may have restarted with other data. Returns the function that
// stops watching.
export function onConnectionReady(hass: HomeAssistant, retry: () => void): () => void {
  const handler = (): void => retry();
  hass.connection.addEventListener("ready", handler);
  return () => hass.connection.removeEventListener("ready", handler);
}
