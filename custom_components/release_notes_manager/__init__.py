"""Release Notes Manager Integration - HA-konform modernisiert."""
import hashlib
import logging
from pathlib import Path
from homeassistant.components import frontend
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.typing import ConfigType
from homeassistant.components.http import StaticPathConfig
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

from .const import CARD_BUNDLE_FILENAME, CARD_STATIC_URL_PATH, DOMAIN
from .storage import get_storage
from .api import register_api_views
from .update_tracker import async_setup_update_tracker
from .websocket import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)

# Zwei unabhängige Versionsstände. Jede Konstante wird NUR erhöht, wenn an der
# jeweiligen Datei tatsächlich etwas geändert wurde - nicht automatisch bei
# jedem Release. manifest.json führt zusätzlich die übergreifende
# Paket-/Release-Version (für HACS), die auch die Dashboard-Karte verwendet.
BACKEND_VERSION = "0.8.0"   # __init__.py, api.py, storage.py, update_tracker.py, versioning.py, websocket.py
ADMIN_VERSION = "0.8.0"     # release-notes.html (Eingabe-Dashboard)

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """
    Set up the Release Notes Manager component.
    """

    _LOGGER.info("Setting up Release Notes Manager (Backend v%s)", BACKEND_VERSION)

    # Initialize HA-Storage (with automatic migration)
    storage = get_storage(hass)

    # Trigger migration by loading data once
    # Migration happens transparently in storage.async_load()
    await storage.async_load()

    # Store in hass.data for access from API
    hass.data[DOMAIN] = {
        'storage': storage,
    }

    # Register API endpoints (inkl. Auslieferung des Admin-Interfaces unter /release-notes)
    register_api_views(hass, storage, {
        "backend": BACKEND_VERSION,
        "admin": ADMIN_VERSION,
    })

    # Dashboard-Karte (custom:release-notes-card) und ihre Websocket-Befehle
    async_register_websocket_commands(hass)
    await async_register_card(hass)

    # Automatische Update-Dokumentation ueber update.*-Entitaeten
    await async_setup_update_tracker(hass, storage)

    _LOGGER.info("Release Notes Manager setup complete (Backend v%s)", BACKEND_VERSION)
    _LOGGER.info(
        "Access Admin at: /release-notes/release-notes.html"
    )
    
    return True


def _bundle_digest(path: Path) -> str | None:
    """Return a short digest of the bundle file, or None if it cannot be read."""
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    except OSError:
        return None


async def async_register_card(hass: HomeAssistant) -> None:
    """
    Serve the card bundle and load it into every dashboard.

    Die URL trägt Paketversion, einen Hash des Bundles und den Startzeitpunkt
    von HA. Browser und Companion-App laden das Bundle dadurch nach jedem Update
    und jedem Neustart neu, obwohl es mit Cache-Headern ausgeliefert wird - ein
    manueller ?=vX-Parameter wie bei der iframe-Karte entfällt.
    """
    if "frontend" not in hass.config.components:
        _LOGGER.warning("The frontend integration is not loaded; the dashboard card is unavailable")
        return

    integration = await async_get_integration(hass, DOMAIN)
    bundle_path = Path(__file__).parent / "frontend" / CARD_BUNDLE_FILENAME
    digest = await hass.async_add_executor_job(_bundle_digest, bundle_path)
    if digest is None:
        _LOGGER.warning("The card bundle %s cannot be read", bundle_path)
    bundle_url = f"{CARD_STATIC_URL_PATH}?v={integration.version}"
    if digest is not None:
        bundle_url += f"&h={digest}"
    bundle_url += f"&s={int(dt_util.utcnow().timestamp())}"

    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_STATIC_URL_PATH, str(bundle_path), cache_headers=True)]
    )
    frontend.add_extra_js_url(hass, bundle_url)
    _LOGGER.info("Dashboard card registered: %s", bundle_url)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up from a config entry (future use)."""
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry (future use)."""
    return True
