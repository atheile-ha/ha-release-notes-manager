export interface HomeAssistant {
  themes?: { darkMode?: boolean };
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      subscribeMessage: Record<string, unknown>,
    ): Promise<() => Promise<void>>;
    addEventListener(type: "ready" | "disconnected", listener: () => void): void;
    removeEventListener(type: "ready" | "disconnected", listener: () => void): void;
  };
}

export interface Category {
  id: string;
  label: string;
  // Farb-ID ('red', 'blue-dark' ...) oder bis v0.6.4 eine Tailwind-Klassenkette
  color: string;
}

export interface ReleaseItem {
  id: number;
  title: string;
  details?: string;
  category?: string;
}

export interface KnownIssue extends ReleaseItem {
  status?: "open" | "resolved";
  resolvedInVersion?: string;
  resolution?: string;
}

export interface Release {
  id: number;
  version: string;
  name?: string;
  // YYYY-MM-DD
  date: string;
  features?: ReleaseItem[];
  changes?: ReleaseItem[];
  knownIssues?: KnownIssue[];
  comments?: string;
}

export interface CardData {
  releases: Release[];
  categories: Category[];
  lastUpdate?: string | null;
}

export interface CardConfig {
  type: string;
  title?: string;
  count?: number;
  auto_collapse?: number;
}
