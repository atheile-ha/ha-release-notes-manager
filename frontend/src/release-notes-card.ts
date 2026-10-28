import { LitElement, html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { fetchData, onConnectionReady, subscribeUpdates } from "./api";
import {
  filterReleases,
  findCategory,
  formatDateDE,
  newestReleaseId,
  openIssues,
  resolvedIssues,
  summarize,
  toColorId,
} from "./logic";
import { cardStyles } from "./styles";
import type { CardConfig, CardData, HomeAssistant, KnownIssue, Release, ReleaseItem } from "./types";

// Fallback, falls ein Ereignis der Subscription verloren geht
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_COUNT = 1;
const MAX_COUNT = 50;
const DEFAULT_AUTO_COLLAPSE_S = 30;
const MAX_AUTO_COLLAPSE_S = 3600;

// Logo der Integration (Quelle: assets/icon.svg), feste Farben in beiden Themes
const ICON_LOGO = svg`<rect width="64" height="64" rx="14" fill="#4338ca"/><rect x="16" y="11" width="28" height="38" rx="4" fill="#ffffff"/><path d="M36 11H44V19Z" fill="#4338ca"/><path d="M36 11V19H44Z" fill="#c7d2fe"/><rect x="21" y="25" width="18" height="3" rx="1.5" fill="#6462a0"/><rect x="21" y="31" width="14" height="3" rx="1.5" fill="#6462a0"/><rect x="21" y="37" width="10" height="3" rx="1.5" fill="#6462a0"/><rect x="32" y="40" width="25" height="15" rx="7.5" fill="#fbbf24"/><rect x="38" y="45" width="13" height="5" rx="2.5" fill="#312e81"/>`;
const ICON_TOP = svg`<path fill="currentColor" d="M8,11H11V21H13V11H16L12,7L8,11M4,3V5H20V3H4Z"/>`;

function isWholeNumber(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

// Read-only dashboard card: the releases in the design of the admin
// interface. Loads over the websocket connection, reloads on every save in the
// backend and after a reconnect.
export class ReleaseNotesCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config: CardConfig = { type: "custom:release-notes-card" };
  @state() private _data?: CardData;
  @state() private _failed = false;
  @state() private _search = "";
  @state() private _category = "all";
  @state() private _displayCount = DEFAULT_COUNT;
  @state() private _expanded = new Set<number>();
  @state() private _details = new Set<string>();

  private _started = false;
  private _dark = false;
  private _newestId: number | null = null;
  private _refreshTimer?: number;
  private _collapseTimer?: number;
  private _connectionUnsub?: () => void;
  private _unsubscribe?: Promise<() => Promise<void>>;

  public setConfig(config: CardConfig): void {
    if (config.count !== undefined && !isWholeNumber(config.count, 1, MAX_COUNT)) {
      throw new Error(`count must be a whole number from 1 to ${MAX_COUNT}`);
    }
    if (config.auto_collapse !== undefined && !isWholeNumber(config.auto_collapse, 0, MAX_AUTO_COLLAPSE_S)) {
      throw new Error(`auto_collapse must be a whole number of seconds from 0 to ${MAX_AUTO_COLLAPSE_S}`);
    }
    if (config.title !== undefined && typeof config.title !== "string") {
      throw new Error("title must be a text");
    }
    this._config = config;
    this._displayCount = config.count ?? DEFAULT_COUNT;
  }

  public getCardSize(): number {
    return 4 + (this._config.count ?? DEFAULT_COUNT) * 3;
  }

  public getGridOptions(): Record<string, number> {
    return { columns: 12, min_columns: 6 };
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    this._refreshTimer = window.setInterval(() => {
      if (this.hass && this._started) {
        void this._load(this.hass, true);
      }
    }, REFRESH_INTERVAL_MS);
    if (this.hass && this._started) {
      // Wieder eingehängt (z. B. nach dem Bearbeiten des Dashboards)
      this._watch(this.hass);
      void this._load(this.hass, true);
    }
  }

  public override disconnectedCallback(): void {
    window.clearInterval(this._refreshTimer);
    window.clearTimeout(this._collapseTimer);
    this._connectionUnsub?.();
    this._connectionUnsub = undefined;
    const unsubscribe = this._unsubscribe;
    this._unsubscribe = undefined;
    unsubscribe?.then((unsub) => unsub()).catch(() => undefined);
    super.disconnectedCallback();
  }

  // Home Assistant sets hass on every state change; only the first one and a
  // switch between light and dark mode matter here.
  protected override shouldUpdate(changed: PropertyValues): boolean {
    const onlyHass = changed.size === 1 && changed.has("hass");
    return !(onlyHass && this._started && Boolean(this.hass?.themes?.darkMode) === this._dark);
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (!changed.has("hass") || !this.hass) {
      return;
    }
    this._dark = Boolean(this.hass.themes?.darkMode);
    this.toggleAttribute("dark", this._dark);
    if (!this._started) {
      this._started = true;
      this._watch(this.hass);
      void this._load(this.hass, false);
    }
  }

  private _watch(hass: HomeAssistant): void {
    if (!this._unsubscribe) {
      this._unsubscribe = subscribeUpdates(hass, () => {
        if (this.hass) {
          void this._load(this.hass, true);
        }
      });
      this._unsubscribe.catch((error) => {
        console.warn("release_notes_manager: subscribing to updates failed", error);
        this._unsubscribe = undefined;
      });
    }
    if (!this._connectionUnsub) {
      // Nach einem Neustart von Home Assistant können andere Daten vorliegen
      this._connectionUnsub = onConnectionReady(hass, () => {
        if (this.hass) {
          void this._load(this.hass, !this._failed);
        }
      });
    }
  }

  private async _load(hass: HomeAssistant, silent: boolean): Promise<void> {
    try {
      const data = await fetchData(hass);
      const newest = newestReleaseId(data.releases);
      if (newest !== null && newest !== this._newestId) {
        // Beim ersten Laden und bei einem neuen Release das neueste aufklappen
        this._expanded = new Set([...this._expanded, newest]);
      }
      this._newestId = newest;
      this._data = data;
      this._failed = false;
    } catch (error) {
      console.error("release_notes_manager: loading the release notes failed", error);
      if (!silent || !this._data) {
        this._failed = true;
      }
    }
  }

  private _retry(): void {
    this._failed = false;
    if (this.hass) {
      void this._load(this.hass, false);
    }
  }

  // Nach einer Bedienung klappt die Karte nach auto_collapse Sekunden wieder
  // auf die Ausgangsansicht zurück: nur das neueste Release, aufgeklappt.
  private _touch(): void {
    window.clearTimeout(this._collapseTimer);
    const seconds = this._config.auto_collapse ?? DEFAULT_AUTO_COLLAPSE_S;
    if (seconds > 0) {
      this._collapseTimer = window.setTimeout(() => this._resetView(), seconds * 1000);
    }
  }

  private _resetView(): void {
    window.clearTimeout(this._collapseTimer);
    this._displayCount = this._config.count ?? DEFAULT_COUNT;
    this._expanded = new Set(this._newestId !== null ? [this._newestId] : []);
    this._details = new Set();
  }

  private _toggleRelease(id: number): void {
    const expanded = new Set(this._expanded);
    if (!expanded.delete(id)) {
      expanded.add(id);
    }
    this._expanded = expanded;
    this._touch();
  }

  private _toggleDetails(key: string): void {
    const details = new Set(this._details);
    if (!details.delete(key)) {
      details.add(key);
    }
    this._details = details;
    this._touch();
  }

  private _showMore(): void {
    this._displayCount = this._data?.releases.length ?? this._displayCount;
    this._touch();
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.hass) {
      return nothing;
    }
    const categories = [...(this._data?.categories ?? [])].sort((a, b) => a.label.localeCompare(b.label, "de"));
    return html`
      <div class="toolbar">
        <h2 class="title"><svg viewBox="0 0 64 64" aria-hidden="true">${ICON_LOGO}</svg>${this._config.title ?? "Release Notes"}</h2>
        <button type="button" class="icon" title="Nur neuestes Release anzeigen" aria-label="Nur neuestes Release anzeigen" @click=${this._resetView}>
          <svg viewBox="0 0 24 24" aria-hidden="true">${ICON_TOP}</svg>
        </button>
      </div>
      <div class="filters">
        <input
          type="search"
          placeholder="Suchen …"
          aria-label="Suchen"
          .value=${this._search}
          @input=${(e: Event) => {
            this._search = (e.target as HTMLInputElement).value;
            this._touch();
          }}
        />
        <select
          aria-label="Kategorie"
          @change=${(e: Event) => {
            this._category = (e.target as HTMLSelectElement).value;
            this._touch();
          }}
        >
          <option value="all" ?selected=${this._category === "all"}>Alle Kategorien</option>
          ${categories.map((c) => html`<option value=${c.id} ?selected=${this._category === c.id}>${c.label}</option>`)}
        </select>
      </div>
      ${this._renderReleases()}
    `;
  }

  private _renderReleases(): TemplateResult {
    if (!this._data) {
      return this._failed
        ? html`<div class="message">
            <span>Die Release Notes konnten nicht geladen werden.</span>
            <button type="button" class="text" @click=${this._retry}>Erneut versuchen</button>
          </div>`
        : html`<div class="message"><div class="spinner" role="progressbar" aria-label="Lädt"></div></div>`;
    }
    const filtered = filterReleases(this._data.releases, this._search, this._category);
    if (filtered.length === 0) {
      return html`<div class="message">
        ${this._data.releases.length === 0 ? "Noch keine Releases vorhanden." : "Keine Releases gefunden."}
      </div>`;
    }
    // Bei einer Suche alle Treffer zeigen, sonst nur die ersten count Releases
    const shown = this._search ? filtered : filtered.slice(0, this._displayCount);
    const remaining = filtered.length - shown.length;
    return html`
      <div class="releases">${shown.map((r) => this._renderRelease(r))}</div>
      ${remaining > 0
        ? html`<div class="more">
            <button type="button" class="text" @click=${this._showMore}>Weitere Releases laden (${remaining} verbleibend)</button>
          </div>`
        : nothing}
    `;
  }

  private _renderRelease(r: Release): TemplateResult {
    const open = this._expanded.has(r.id);
    const summary = summarize(r);
    const resolved = resolvedIssues(r);
    const issues = openIssues(r);
    const toggle = (): void => this._toggleRelease(r.id);
    return html`<div class="release${open ? " open" : ""}">
      <div
        class="release-head"
        role="button"
        tabindex="0"
        aria-expanded=${open ? "true" : "false"}
        @click=${toggle}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div class="release-title-row">
          <h3 class="release-title">Version ${r.version}${r.name ? ` - ${r.name}` : ""}</h3>
          <span class="release-date">${formatDateDE(r.date)}</span>
        </div>
        <div class="chips">
          ${r.id === this._newestId ? html`<span class="chip">Aktuell</span>` : nothing}
          ${summary.features > 0 ? this._chip("features", summary.features, summary.features === 1 ? "Feature" : "Features") : nothing}
          ${summary.changes > 0 ? this._chip("changes", summary.changes, summary.changes === 1 ? "Änderung" : "Änderungen") : nothing}
          ${summary.issues > 0 ? this._chip("issues", summary.issues, "Fehler") : nothing}
        </div>
      </div>
      ${open
        ? html`<div class="release-body">
            ${(r.features ?? []).length > 0
              ? html`<div>
                  <h4 class="group-title">Neue Features</h4>
                  <ul class="items">${(r.features ?? []).map((f) => html`<li class="item">${this._renderItem(r, "f", f)}</li>`)}</ul>
                </div>`
              : nothing}
            ${(r.changes ?? []).length > 0 || resolved.length > 0
              ? html`<div>
                  <h4 class="group-title">Änderungen / Bugfixes</h4>
                  <ul class="items">
                    ${(r.changes ?? []).map((c) => html`<li class="item">${this._renderItem(r, "c", c)}</li>`)}
                    ${resolved.map((i) => this._renderResolved(r, i))}
                  </ul>
                </div>`
              : nothing}
            ${issues.length > 0
              ? html`<div>
                  <h4 class="group-title">Bekannte Fehler</h4>
                  <ul class="items issues">${issues.map((i) => html`<li class="item issue">${this._renderItem(r, "i", i)}</li>`)}</ul>
                </div>`
              : nothing}
            ${r.comments ? html`<div class="note">${r.comments}</div>` : nothing}
          </div>`
        : nothing}
    </div>`;
  }

  private _chip(kind: string, count: number, label: string): TemplateResult {
    return html`<span class="chip ${kind}"><span class="dot"></span>${count} ${label}</span>`;
  }

  private _label(categoryId: string | undefined): TemplateResult {
    const category = findCategory(this._data?.categories ?? [], categoryId);
    return html`<span class="lbl lbl-${toColorId(category.color)}">${category.label}</span>`;
  }

  private _renderItem(r: Release, type: string, item: ReleaseItem): TemplateResult {
    const key = `${r.id}-${type}-${item.id}`;
    const open = this._details.has(key);
    return html`${this._label(item.category)}
      <div class="item-main">
        ${item.details
          ? html`<button
                type="button"
                class="item-toggle${open ? " open" : ""}"
                aria-expanded=${open ? "true" : "false"}
                @click=${() => this._toggleDetails(key)}
              >
                ${item.title}
              </button>
              ${open ? html`<div class="item-details">${item.details}</div>` : nothing}`
          : html`<div class="item-title">${item.title}</div>`}
      </div>`;
  }

  private _renderResolved(r: Release, issue: KnownIssue): TemplateResult {
    return html`<li class="item">
      ${this._label(issue.category)}
      <div class="item-main">
        <div class="item-title">${issue.title}</div>
        <div class="chips"><span class="chip done">Gelöst in ${r.version}</span></div>
        ${issue.resolution ? html`<div class="item-resolution">${issue.resolution}</div>` : nothing}
      </div>
    </li>`;
  }

  public static override styles = cardStyles;
}
