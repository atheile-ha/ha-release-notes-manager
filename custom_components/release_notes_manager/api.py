"""REST API endpoints for Release Notes Manager."""
import hashlib
import logging
import json
from pathlib import Path
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


class ReleaseNotesPageView(HomeAssistantView):
    """
    Handle /release-notes/release-notes.html - Admin-Interface.

    Ersetzt die frühere StaticPathConfig mit cache_headers=False: die sendete
    gar keinen Cache-Control-Header, sodass Browser und Companion-App die Seite
    nach eigener Schätzung zwischenspeichern durften. Jetzt fragt der Browser bei
    jedem Aufruf per ETag nach und bekommt bei unveränderter Datei nur ein 304.
    Ausgeliefert wird ausschließlich diese Seite, nicht das ganze
    Integrationsverzeichnis.
    """

    url = "/release-notes/{filename}"
    name = "release_notes_manager:page"
    requires_auth = False  # iframe/Dashboard-Tab kann kein Token mitsenden

    PAGES = ("release-notes.html",)

    def __init__(self, hass: HomeAssistant):
        """Initialize view."""
        self._hass = hass
        self._dir = Path(__file__).parent

    async def get(self, request, filename):
        """Return the page with revalidation headers."""
        if filename not in self.PAGES:
            raise web.HTTPNotFound()
        body = await self._hass.async_add_executor_job((self._dir / filename).read_bytes)
        etag = '"' + hashlib.sha256(body).hexdigest()[:16] + '"'
        headers = {"Cache-Control": "no-cache", "ETag": etag}
        if request.headers.get("If-None-Match") == etag:
            return web.Response(status=304, headers=headers)
        return web.Response(body=body, content_type="text/html", charset="utf-8", headers=headers)


class ReleaseNotesVersionView(HomeAssistantView):
    """
    Handle /api/release_notes_manager/version
    - GET to get current versions of backend and admin dashboard

    Used by each frontend for auto-reload on its own version mismatch.
    Backend und Admin-Dashboard werden unabhängig voneinander
    versioniert - jede Datei hat ihre eigene Versionsnummer, die nur bei
    tatsächlichen Änderungen an genau dieser Datei erhöht wird.
    """

    url = "/api/release_notes_manager/version"
    name = "api:release_notes_manager:version"
    requires_auth = False  # Local-only usage

    def __init__(self, hass: HomeAssistant, versions: dict):
        """Initialize view."""
        self._hass = hass
        self._versions = versions

    async def get(self, request):
        """Return current backend/admin versions."""
        return web.json_response(self._versions, headers={
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        })


class ReleaseNotesDataView(HomeAssistantView):
    """
    Handle /api/release_notes_manager/data
    - GET to load data
    - POST to save data
    
    Changed in v0.5.0: Uses HA-Storage instead of direct file access.
    """
    
    url = "/api/release_notes_manager/data"
    name = "api:release_notes_manager:data"
    requires_auth = False  # Local-only usage
    
    def __init__(self, hass: HomeAssistant, storage):
        """Initialize view."""
        self._hass = hass
        self._storage = storage
    
    async def get(self, request):
        """Load all data from HA-Storage."""
        try:
            data = await self._storage.async_load()
            
            # Return data with CORS headers for local access
            return web.json_response(data, headers={
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            })
        
        except Exception as e:
            _LOGGER.error("Error loading data: %s", str(e))
            return web.json_response(
                {"error": str(e)},
                status=500
            )
    
    async def post(self, request):
        """Save all data (bulk update)."""
        try:
            body = await request.json()
            data_str = body.get('data')
            
            if not data_str:
                return web.json_response(
                    {"error": "Missing 'data' in request"},
                    status=400
                )
            
            # Parse release data
            try:
                data = json.loads(data_str)
            except json.JSONDecodeError as e:
                _LOGGER.error("Invalid JSON data: %s", str(e))
                return web.json_response(
                    {"error": f"Invalid JSON: {str(e)}"},
                    status=400
                )
            
            # Validate structure
            if not isinstance(data, dict):
                return web.json_response(
                    {"error": "Invalid data structure"},
                    status=400
                )
            
            # Save to HA-Storage
            success = await self._storage.async_save(data)
            
            if success:
                return web.json_response({
                    "status": "saved",
                    "releases": len(data.get('releases', [])),
                    "knownIssues": len(data.get('knownIssues', [])),
                    "categories": len(data.get('categories', []))
                })
            else:
                return web.json_response(
                    {"error": "Failed to save data"},
                    status=500
                )
        
        except Exception as e:
            _LOGGER.error("Error in API endpoint: %s", str(e))
            return web.json_response(
                {"error": str(e)},
                status=500
            )


def register_api_views(hass: HomeAssistant, storage, versions: dict) -> None:
    """
    Register all API views.

    versions: dict mit den Keys "backend" und "admin" - siehe
    __init__.py für die Versionierungs-Konvention.
    """
    # HTML page (Admin)
    page_view = ReleaseNotesPageView(hass)
    hass.http.register_view(page_view)
    _LOGGER.info("Registered page view: %s", page_view.url)

    # Data endpoint
    data_view = ReleaseNotesDataView(hass, storage)
    hass.http.register_view(data_view)
    _LOGGER.info("Registered API view: %s (GET + POST)", data_view.url)

    # Version endpoint
    version_view = ReleaseNotesVersionView(hass, versions)
    hass.http.register_view(version_view)
    _LOGGER.info("Registered API view: %s (GET)", version_view.url)
