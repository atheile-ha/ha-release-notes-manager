"""Automatische Update-Dokumentation ueber update.*-Entitaeten.

Beobachtet alle update.*-Entitaeten der Instanz und legt bei abgeschlossenen
Updates, Neuinstallationen und Deinstallationen automatisch Eintraege in den
Release Notes an. Siehe .claude/plans/sunny-chasing-breeze.md fuer die
vollstaendige Design-Herleitung (insbesondere: warum installed_version statt
on/off-Transition verglichen wird, und warum der Cache erst beim Flush
aktualisiert wird).

Doppelte Eintraege werden seit v0.6.3 auf drei Ebenen verhindert:
1. EINE gemeinsame Warteschlange, verschluesselt nach entity_id - dasselbe
   Ereignis kann weder mehrfach in einem Batch noch in zwei parallelen
   Batches (Live-Erkennung + HA-Start-Erkennung) landen.
2. Gegenpruefung am Ende der Wartezeit: der aktuelle Entitaets-Zustand muss
   das vorgemerkte Ereignis noch bestaetigen.
3. Duplikat-Pruefung gegen die bereits im Ziel-Release vorhandenen Eintraege.
"""
from __future__ import annotations

import logging
import re
import time
from datetime import datetime
from typing import Any

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, EVENT_STATE_CHANGED, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import CoreState, Event, HomeAssistant, State
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.storage import Store

from .storage import ReleaseNotesStorage

_LOGGER = logging.getLogger(__name__)

CACHE_STORAGE_VERSION = 1
CACHE_STORAGE_KEY = "release_notes_manager_update_cache"

LIVE_FLUSH_DELAY = 300  # 5 Minuten - Live erkannte Updates ohne Neustart
STARTUP_FLUSH_DELAY = 120  # 2 Minuten ab EVENT_HOMEASSISTANT_STARTED

CATEGORY_UPDATE = {"id": "update", "label": "Update", "color": "gray"}
CATEGORY_INTEGRATION = {"id": "integration", "label": "Integration / Addon", "color": "blue-dark"}

VERSION_PATTERN = re.compile(r"^(\d{4})\.(\d{1,2})\.(\d+)$")


class UpdateTracker:
    """Verfolgt update.*-Entitaeten und dokumentiert Versionswechsel automatisch."""

    def __init__(self, hass: HomeAssistant, storage: ReleaseNotesStorage) -> None:
        self._hass = hass
        self._storage = storage
        self._cache_store: Store = Store(hass, CACHE_STORAGE_VERSION, CACHE_STORAGE_KEY)
        self._cache: dict[str, Any] = {"baseline_done": False, "entities": {}}

        # EINE Warteschlange fuer beide Erkennungswege (Live + HA-Start),
        # verschluesselt nach entity_id: pro Entitaet steht hoechstens ein
        # Ereignis an. Zwei getrennte Listen mit zwei Timern (bis v0.6.2)
        # erzeugten doppelte Eintraege, weil ein Versionswechsel beim
        # Hochfahren sowohl als state_changed-Event (Entitaet wird angelegt)
        # als auch beim Baseline-Vergleich in EVENT_HOMEASSISTANT_STARTED
        # auffiel - der Cache wird ja erst beim Flush nachgezogen.
        self._pending: dict[str, dict[str, Any]] = {}
        self._flush_unsub = None
        self._flush_due: float | None = None

    async def async_setup(self) -> None:
        """Cache laden und Listener registrieren."""
        stored = await self._cache_store.async_load()
        if stored is not None:
            self._cache = stored

        self._hass.bus.async_listen(EVENT_STATE_CHANGED, self._async_handle_state_changed)
        self._hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, self._async_handle_started)

        # Falls die Integration erst NACH dem HA-Start (neu) geladen wird,
        # feuert EVENT_HOMEASSISTANT_STARTED nicht mehr - dann sofort nachholen.
        # (hass.state ist waehrend der normalen Boot-Phase bereits "starting",
        # nicht erst "running" - deshalb explizit auf CoreState.running pruefen.)
        if self._hass.state == CoreState.running:
            await self._async_handle_started(None)

    async def _autoupdate_enabled(self) -> bool:
        data = await self._storage.async_load()
        return bool(data.get("settings", {}).get("autoUpdateDocs", True))

    # ------------------------------------------------------------------
    # HA-Start: Baseline-Seed ODER Diff gegen persistierten Cache
    # ------------------------------------------------------------------
    async def _async_handle_started(self, event: Event | None) -> None:
        if not await self._autoupdate_enabled():
            return

        current_entities = {
            state.entity_id: state for state in self._hass.states.async_all("update")
        }

        if not self._cache.get("baseline_done"):
            entities_cache = {
                entity_id: self._snapshot(state)
                for entity_id, state in current_entities.items()
            }
            self._cache = {"baseline_done": True, "entities": entities_cache}
            await self._cache_store.async_save(self._cache)
            _LOGGER.info(
                "Update-Tracker: Baseline mit %d Entitaeten angelegt, keine Eintraege erzeugt",
                len(entities_cache),
            )
            return

        cached_entities = self._cache.get("entities", {})
        queued = False

        # Deinstallation: im Cache, aber nicht mehr live vorhanden
        for entity_id, cached in cached_entities.items():
            if entity_id not in current_entities:
                self._queue(entity_id, {
                    "entity_id": entity_id,
                    "title": cached.get("title") or entity_id,
                    "details": f"Deinstallation {cached.get('installed_version') or '?'}",
                    "category": CATEGORY_INTEGRATION,
                    "kind": "uninstall",
                })
                queued = True

        # Neuinstallation / abgeschlossenes Update
        for entity_id, state in current_entities.items():
            if await self._diff_and_queue(entity_id, state, cached_entities.get(entity_id)):
                queued = True

        if queued:
            _LOGGER.debug(
                "Update-Tracker: %d Ereignis(se) beim HA-Start vorgemerkt, Flush in %ds",
                len(self._pending), STARTUP_FLUSH_DELAY,
            )
            self._schedule_flush(STARTUP_FLUSH_DELAY)

    # ------------------------------------------------------------------
    # Laufender Betrieb
    # ------------------------------------------------------------------
    async def _async_handle_state_changed(self, event: Event) -> None:
        entity_id = event.data.get("entity_id", "")
        if not entity_id.startswith("update."):
            return

        if not await self._autoupdate_enabled():
            return

        old_state: State | None = event.data.get("old_state")
        new_state: State | None = event.data.get("new_state")
        cached_entities = self._cache.get("entities", {})

        if new_state is None:
            cached = cached_entities.get(entity_id)
            if cached is not None:
                self._queue(entity_id, {
                    "entity_id": entity_id,
                    "title": cached.get("title") or (old_state.name if old_state else entity_id),
                    "details": f"Deinstallation {cached.get('installed_version') or '?'}",
                    "category": CATEGORY_INTEGRATION,
                    "kind": "uninstall",
                })
                self._schedule_flush(LIVE_FLUSH_DELAY)
            return

        if new_state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return

        # Entitaet ist (wieder) da: eine noch anstehende Deinstallations-Meldung
        # war nur ein kurzzeitiges Verschwinden (Reload der Integration) und
        # darf nicht dokumentiert werden.
        if self._pending.get(entity_id, {}).get("kind") == "uninstall":
            del self._pending[entity_id]

        # Billige Vorab-Pruefung ohne I/O: filtert in_progress/update_percentage-Zwischenevents
        if (
            old_state is not None
            and old_state.attributes.get("installed_version") == new_state.attributes.get("installed_version")
        ):
            return

        if await self._diff_and_queue(entity_id, new_state, cached_entities.get(entity_id)):
            self._schedule_flush(LIVE_FLUSH_DELAY)

    def _queue(self, entity_id: str, item: dict[str, Any]) -> None:
        """Ereignis vormerken - pro Entitaet gewinnt immer das juengste."""
        self._pending[entity_id] = item

    def _schedule_flush(self, delay: float) -> None:
        """Flush-Timer setzen bzw. vorziehen, wenn die neue Frist frueher endet."""
        due = time.monotonic() + delay
        if self._flush_unsub is not None:
            if self._flush_due is not None and self._flush_due <= due:
                return
            self._flush_unsub()
        self._flush_due = due
        self._flush_unsub = async_call_later(self._hass, delay, self._flush_pending)

    # ------------------------------------------------------------------
    # Diff-Logik - mutiert die Pending-Queue, den Cache nur im
    # Sonderfall "Wert war noch unbekannt" (siehe Kommentar unten)
    # ------------------------------------------------------------------
    async def _diff_and_queue(
        self,
        entity_id: str,
        state: State,
        cached: dict[str, Any] | None,
    ) -> bool:
        installed_version = state.attributes.get("installed_version")
        if installed_version is None:
            return False

        if cached is None:
            if not self._cache.get("baseline_done"):
                return False
            self._queue(entity_id, {
                "entity_id": entity_id,
                "title": self._resolve_title(entity_id, state),
                "details": f"Neuinstallation {installed_version}",
                "category": CATEGORY_INTEGRATION,
                "kind": "install",
                "expected_version": installed_version,
            })
            return True

        cached_version = cached.get("installed_version")

        if cached_version is None:
            # Beim Baseline-Lauf hatte diese Entitaet noch keinen ersten
            # Datenabruf durchgefuehrt (installed_version war None). Der jetzt
            # erstmals bekannte Wert ist keine echte Versionsaenderung, nur ein
            # verspaetetes Nachtragen der Baseline - kein Eintrag, aber der
            # Cache muss sofort korrigiert werden (nicht erst beim Flush, da
            # sonst gar kein Flush fuer dieses Ereignis ausgeloest wird).
            self._cache.setdefault("entities", {})[entity_id] = self._snapshot(state)
            await self._cache_store.async_save(self._cache)
            return False

        if cached_version != installed_version:
            self._queue(entity_id, {
                "entity_id": entity_id,
                "title": self._resolve_title(entity_id, state),
                "details": f"{cached_version} → {installed_version}",
                "category": CATEGORY_UPDATE,
                "kind": "update",
                "expected_version": installed_version,
            })
            return True

        return False

    def _snapshot(self, state: State) -> dict[str, Any]:
        return {
            "installed_version": state.attributes.get("installed_version"),
            "latest_version": state.attributes.get("latest_version"),
            "title": self._resolve_title(state.entity_id, state),
        }

    def _resolve_title(self, entity_id: str, state: State) -> str:
        entry = er.async_get(self._hass).async_get(entity_id)
        if entry is not None and entry.device_id is not None:
            device = dr.async_get(self._hass).async_get(entry.device_id)
            if device is not None:
                return device.name_by_user or device.name or state.name
        return state.attributes.get("title") or state.name

    # ------------------------------------------------------------------
    # Flush
    # ------------------------------------------------------------------
    async def _flush_pending(self, _now: Any = None) -> None:
        self._flush_unsub = None
        self._flush_due = None
        pending, self._pending = self._pending, {}
        await self._flush(list(pending.values()))

    def _confirm(self, item: dict[str, Any]) -> bool:
        """Gegenpruefung am Ende der Wartezeit gegen den aktuellen Zustand.

        Faengt Ereignisse ab, die sich zwischenzeitlich erledigt haben - etwa
        eine Integration, die beim HA-Start noch nicht geladen war und deshalb
        faelschlich als Deinstallation vorgemerkt wurde.
        """
        state = self._hass.states.get(item["entity_id"])

        if item["kind"] == "uninstall":
            if state is not None:
                _LOGGER.debug(
                    "Update-Tracker: %s ist wieder vorhanden, Deinstallation verworfen",
                    item["entity_id"],
                )
                return False
            return True

        if state is None:
            _LOGGER.debug(
                "Update-Tracker: %s existiert nicht mehr, Eintrag verworfen", item["entity_id"]
            )
            return False

        expected = item.get("expected_version")
        if expected is not None and state.attributes.get("installed_version") != expected:
            _LOGGER.debug(
                "Update-Tracker: %s meldet inzwischen eine andere Version, Eintrag verworfen",
                item["entity_id"],
            )
            return False
        return True

    async def _flush(self, pending: list[dict[str, Any]]) -> None:
        pending = [item for item in pending if self._confirm(item)]
        if not pending:
            return

        data = await self._storage.async_load()
        categories = data.setdefault("categories", [])
        releases = data.setdefault("releases", [])

        release, release_created = self._resolve_target_release(releases, data.get("knownIssues", []))
        cache_entities = dict(self._cache.get("entities", {}))
        notification_lines: list[str] = []

        for item in pending:
            category_id = self._resolve_or_create_category(
                categories,
                item["category"]["id"],
                item["category"]["label"],
                item["category"]["color"],
            )

            # Letzte Absicherung: identischer Eintrag schon im Ziel-Release?
            # Der Cache wird trotzdem nachgezogen, sonst wuerde dasselbe
            # Ereignis bei jedem weiteren Durchlauf erneut erkannt.
            if self._entry_exists(release, item["title"], item["details"], category_id):
                _LOGGER.info(
                    "Update-Tracker: Eintrag '%s: %s' existiert bereits in Release %s, uebersprungen",
                    item["title"], item["details"], release["version"],
                )
            else:
                entry_id = int(time.time() * 1000) + len(release["changes"])
                release["changes"].insert(0, {
                    "id": entry_id,
                    "title": item["title"],
                    "details": item["details"],
                    "category": category_id,
                })
                notification_lines.append(f"- {item['title']}: {item['details']}")

            # Cache-Mutation erst jetzt, beim erfolgreichen Flush (Idempotenz-Prinzip)
            if item["kind"] == "uninstall":
                cache_entities.pop(item["entity_id"], None)
            else:
                state = self._hass.states.get(item["entity_id"])
                if state is not None:
                    cache_entities[item["entity_id"]] = self._snapshot(state)

        # Wurde ausschliesslich wegen Duplikaten nichts geschrieben, darf kein
        # leeres Release zurueckbleiben.
        if release_created and not release["changes"]:
            releases.remove(release)

        await self._storage.async_save(data)

        self._cache = {"baseline_done": True, "entities": cache_entities}
        await self._cache_store.async_save(self._cache)

        if not notification_lines:
            return

        _LOGGER.info(
            "Update-Tracker: %d Eintrag/Eintraege in Release %s dokumentiert",
            len(notification_lines), release["version"],
        )
        await self._notify(release["version"], notification_lines)

    def _entry_exists(
        self, release: dict[str, Any], title: str, details: str, category_id: str
    ) -> bool:
        return any(
            change.get("title") == title
            and change.get("details") == details
            and change.get("category") == category_id
            for change in release.get("changes", [])
        )

    def _resolve_target_release(
        self, releases: list[dict[str, Any]], known_issues: list[dict[str, Any]]
    ) -> tuple[dict[str, Any], bool]:
        """Ziel-Release liefern; zweiter Rueckgabewert: wurde es neu angelegt?"""
        today = datetime.now().strftime("%Y-%m-%d")

        for release in releases:
            if release.get("date") == today:
                release.setdefault("changes", [])
                release.setdefault("features", [])
                release.setdefault("knownIssues", [])
                return release, False

        year = datetime.now().year
        month = datetime.now().month

        best_counter = 0
        for release in releases:
            match = VERSION_PATTERN.match(release.get("version", ""))
            if not match:
                continue
            r_year, r_month, r_counter = int(match.group(1)), int(match.group(2)), int(match.group(3))
            if r_year == year and r_month == month:
                best_counter = max(best_counter, r_counter)

        # Wie bei manueller Release-Erstellung (createNewRelease() im Admin-
        # Dashboard): offene bekannte Fehler werden als Vorschlag uebernommen.
        inherited_issues = [
            {**issue, "inheritedFrom": True}
            for issue in known_issues
            if issue.get("status") != "resolved"
        ]

        new_release = {
            "id": int(time.time() * 1000),
            "version": f"{year}.{month}.{best_counter + 1}",
            "name": "",
            "date": today,
            "features": [],
            "changes": [],
            "knownIssues": inherited_issues,
            "comments": "",
        }
        releases.insert(0, new_release)
        return new_release, True

    def _resolve_or_create_category(
        self, categories: list[dict[str, str]], candidate_id: str, candidate_label: str, color: str
    ) -> str:
        for category in categories:
            if category.get("id") == candidate_id:
                return category["id"]
        for category in categories:
            if (category.get("label") or "").strip().lower() == candidate_label.strip().lower():
                return category["id"]
        categories.append({"id": candidate_id, "label": candidate_label, "color": color})
        return candidate_id

    async def _notify(self, version: str, lines: list[str]) -> None:
        message = "\n".join(lines)
        await self._hass.services.async_call(
            "persistent_notification",
            "create",
            {
                "title": "Release Notes aktualisiert",
                "message": f"Release {version}:\n{message}",
                # Millisekunden: zwei Benachrichtigungen innerhalb derselben
                # Sekunde haetten sonst dieselbe ID und wuerden sich gegenseitig
                # ueberschreiben (eine Doppelung waere dadurch unsichtbar).
                "notification_id": f"release_notes_manager_update_{int(time.time() * 1000)}",
            },
        )


async def async_setup_update_tracker(hass: HomeAssistant, storage: ReleaseNotesStorage) -> None:
    """Automatische Update-Dokumentation einrichten."""
    tracker = UpdateTracker(hass, storage)
    await tracker.async_setup()
