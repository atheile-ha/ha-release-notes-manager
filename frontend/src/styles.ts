import { css } from "lit";

// Colors and radii come from the active Home Assistant theme. Only the label
// palette is the card's own; [dark] is set from hass.themes.darkMode.
export const cardStyles = css`
  :host {
    display: block;
    color: var(--primary-text-color);
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, transparent));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
    overflow: hidden;
    --rn-muted: var(--secondary-text-color);
    --rn-line: var(--divider-color, rgba(127, 127, 127, 0.3));
    --rn-surface: var(--ha-card-background, var(--card-background-color, #fff));
    --rn-accent: var(--primary-color, #03a9f4);
    --rn-head-bg: color-mix(in srgb, var(--primary-text-color, #000) 4%, transparent);
    --rn-success: var(--success-color, #43a047);
    --rn-warning: var(--warning-color, #ffa600);
    --rn-info: var(--info-color, #039be5);

    /* Kategorie-Farben (hell), Kontrast >= 4,5:1 */
    --lbl-white-bg: #ffffff; --lbl-white-fg: #202124; --lbl-white-bd: #bfc3c9;
    --lbl-gray-bg: #e8eaed; --lbl-gray-fg: #3c4043;
    --lbl-black-bg: #2b2d31; --lbl-black-fg: #ffffff;
    --lbl-red-bg: #fde2e1; --lbl-red-fg: #a3221b;
    --lbl-orange-bg: #ffe8d4; --lbl-orange-fg: #9a3d0a;
    --lbl-yellow-bg: #fdf1c4; --lbl-yellow-fg: #6f4a00;
    --lbl-green-bg: #dcf3e3; --lbl-green-fg: #1b6b36;
    --lbl-blue-light-bg: #d6e9fc; --lbl-blue-light-fg: #144f8a;
    --lbl-blue-dark-bg: #1f5fbf; --lbl-blue-dark-fg: #ffffff;
    --lbl-purple-bg: #efe3fb; --lbl-purple-fg: #6a2ba3;
    --lbl-pink-bg: #fce1ee; --lbl-pink-fg: #9b1d57;
  }

  :host([dark]) {
    --lbl-white-bg: transparent; --lbl-white-fg: #f1f3f4; --lbl-white-bd: #6b6f76;
    --lbl-gray-bg: #3a3d42; --lbl-gray-fg: #dfe1e5;
    --lbl-black-bg: #e6e7e9; --lbl-black-fg: #141516;
    --lbl-red-bg: #4a1f1f; --lbl-red-fg: #ffb3ad;
    --lbl-orange-bg: #4a2a14; --lbl-orange-fg: #ffc28f;
    --lbl-yellow-bg: #463a10; --lbl-yellow-fg: #f5d66b;
    --lbl-green-bg: #173d26; --lbl-green-fg: #8fdcaa;
    --lbl-blue-light-bg: #18344f; --lbl-blue-light-fg: #9ccbfa;
    --lbl-blue-dark-bg: #2f6fd0; --lbl-blue-dark-fg: #ffffff;
    --lbl-purple-bg: #362151; --lbl-purple-fg: #d7b8fb;
    --lbl-pink-bg: #4a1b33; --lbl-pink-fg: #ffb0d4;
  }

  * {
    box-sizing: border-box;
  }

  button,
  input,
  select {
    font: inherit;
    color: inherit;
  }

  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  [role="button"]:focus-visible {
    outline: 2px solid var(--rn-accent);
    outline-offset: 2px;
  }

  .muted {
    color: var(--rn-muted);
  }

  /* Kopf */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 8px 8px 16px;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 1.15em;
    font-weight: 500;
  }

  .title svg {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
  }

  .icon {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--rn-muted);
    cursor: pointer;
  }

  .icon:hover {
    background: var(--rn-head-bg);
    color: var(--primary-text-color);
  }

  .icon svg {
    width: 20px;
    height: 20px;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 16px 12px;
  }

  .filters input {
    flex: 1 1 10rem;
    min-width: 0;
  }

  input,
  select {
    padding: 6px 10px;
    background: var(--rn-surface);
    border: 1px solid var(--rn-line);
    border-radius: 8px;
  }

  input::placeholder {
    color: var(--rn-muted);
  }

  button.text {
    padding: 6px 14px;
    background: transparent;
    border: 1px solid var(--rn-accent);
    border-radius: 8px;
    color: var(--rn-accent);
    cursor: pointer;
  }

  /* Releases */
  .releases {
    border-top: 1px solid var(--rn-line);
  }

  .release + .release {
    border-top: 1px solid var(--rn-line);
  }

  .release-head {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 44px 12px 16px;
    cursor: pointer;
  }

  .release-head::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 18px;
    width: 7px;
    height: 7px;
    margin-top: -6px;
    border-right: 2px solid var(--rn-muted);
    border-bottom: 2px solid var(--rn-muted);
    transform: rotate(45deg);
  }

  .release.open .release-head::after {
    margin-top: -2px;
    transform: rotate(-135deg);
  }

  .release-title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 12px;
  }

  .release-title {
    margin: 0;
    min-width: 0;
    font-size: 1.05em;
    font-weight: 500;
    overflow-wrap: anywhere;
  }

  .release-date {
    color: var(--rn-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .release-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 16px 16px;
    border-top: 1px solid var(--rn-line);
    background: var(--rn-head-bg);
  }

  .group-title {
    margin: 10px 0 4px;
    color: var(--rn-muted);
    font-size: 0.75em;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .items > li + li {
    border-top: 1px solid var(--rn-line);
  }

  .items.issues {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .items.issues > li + li {
    border-top: 0;
  }

  .item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
  }

  .item.issue {
    padding: 8px 10px;
    border: 1px solid color-mix(in srgb, var(--rn-warning) 40%, transparent);
    border-radius: 10px;
    background: color-mix(in srgb, var(--rn-warning) 10%, var(--rn-surface));
  }

  .item-main {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    font-weight: 500;
    overflow-wrap: anywhere;
  }

  .item-toggle {
    position: relative;
    display: block;
    width: 100%;
    padding: 0 28px 0 0;
    border: 0;
    background: none;
    font-weight: 500;
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
  }

  .item-toggle::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 6px;
    width: 6px;
    height: 6px;
    margin-top: -5px;
    border-right: 2px solid var(--rn-muted);
    border-bottom: 2px solid var(--rn-muted);
    transform: rotate(45deg);
  }

  .item-toggle.open::after {
    margin-top: -1px;
    transform: rotate(-135deg);
  }

  .item-details,
  .note {
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--rn-head-bg);
    color: var(--rn-muted);
    font-size: 0.93em;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .item-details {
    margin-top: 6px;
  }

  .item-resolution {
    margin-top: 4px;
    color: var(--rn-muted);
    font-size: 0.93em;
    white-space: pre-line;
  }

  /* Chips */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .item .chips {
    margin-top: 4px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--chip-color, var(--rn-accent)) 20%, transparent);
    color: var(--primary-text-color);
    font-size: 0.85em;
    font-weight: 500;
    line-height: 1.3;
    white-space: nowrap;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--chip-color);
  }

  .chip.features,
  .chip.done {
    --chip-color: var(--rn-success);
  }

  .chip.changes {
    --chip-color: var(--rn-info);
  }

  .chip.issues {
    --chip-color: var(--rn-warning);
  }

  /* Kategorie-Labels */
  .lbl {
    flex-shrink: 0;
    width: 8rem;
    padding: 3px 8px;
    border: 1px solid var(--lbl-bd, transparent);
    border-radius: 6px;
    background: var(--lbl-bg);
    color: var(--lbl-fg);
    font-size: 0.82em;
    font-weight: 500;
    line-height: 1.35;
    text-align: center;
    hyphens: auto;
    overflow-wrap: anywhere;
  }

  .lbl-white { --lbl-bg: var(--lbl-white-bg); --lbl-fg: var(--lbl-white-fg); --lbl-bd: var(--lbl-white-bd); }
  .lbl-gray { --lbl-bg: var(--lbl-gray-bg); --lbl-fg: var(--lbl-gray-fg); }
  .lbl-black { --lbl-bg: var(--lbl-black-bg); --lbl-fg: var(--lbl-black-fg); }
  .lbl-red { --lbl-bg: var(--lbl-red-bg); --lbl-fg: var(--lbl-red-fg); }
  .lbl-orange { --lbl-bg: var(--lbl-orange-bg); --lbl-fg: var(--lbl-orange-fg); }
  .lbl-yellow { --lbl-bg: var(--lbl-yellow-bg); --lbl-fg: var(--lbl-yellow-fg); }
  .lbl-green { --lbl-bg: var(--lbl-green-bg); --lbl-fg: var(--lbl-green-fg); }
  .lbl-blue-light { --lbl-bg: var(--lbl-blue-light-bg); --lbl-fg: var(--lbl-blue-light-fg); }
  .lbl-blue-dark { --lbl-bg: var(--lbl-blue-dark-bg); --lbl-fg: var(--lbl-blue-dark-fg); }
  .lbl-purple { --lbl-bg: var(--lbl-purple-bg); --lbl-fg: var(--lbl-purple-fg); }
  .lbl-pink { --lbl-bg: var(--lbl-pink-bg); --lbl-fg: var(--lbl-pink-fg); }

  .more {
    padding: 4px 16px 16px;
    text-align: center;
  }

  .message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px 16px;
    border-top: 1px solid var(--rn-line);
    color: var(--rn-muted);
    text-align: center;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--rn-line);
    border-top-color: var(--rn-accent);
    border-radius: 50%;
    animation: rn-spin 0.9s linear infinite;
  }

  @keyframes rn-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 450px) {
    .lbl {
      width: 6.5rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
    }
  }
`;
