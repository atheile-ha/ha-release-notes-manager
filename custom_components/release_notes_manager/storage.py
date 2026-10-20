"""Storage layer for Release Notes Manager - HA-Storage based."""
import logging
import json
from pathlib import Path
from typing import Any
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import SIGNAL_DATA_UPDATED

_LOGGER = logging.getLogger(__name__)

# Storage configuration
STORAGE_VERSION = 1
STORAGE_KEY = "release_notes_manager"

# Migration constants
MIGRATION_MARKER = "migrated"
OLD_DATA_FILE = "www/release_data.json"


class ReleaseNotesStorage:
    """HA-Storage based data persistence with automatic migration."""
    
    def __init__(self, hass: HomeAssistant):
        """Initialize HA-Storage."""
        self._hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._migrated = False
    
    async def async_load(self) -> dict[str, Any]:
        """Load data with automatic migration from old JSON file."""
        # Load from HA-Storage
        data = await self._store.async_load()
        
        # Migration: Check if we need to migrate from old file
        if data is None and not self._migrated:
            data = await self._migrate_from_old_file()
            self._migrated = True
        
        # Return data or default structure
        if data is not None:
            return data
        
        # No data found, return default structure
        return {
            "releases": [],
            "knownIssues": [],
            "categories": self._get_default_categories(),
            "settings": self._get_default_settings()
        }
    
    async def _migrate_from_old_file(self) -> dict[str, Any] | None:
        """
        Migrate data from old /config/www/release_data.json to HA-Storage.
        
        Migration happens exactly once when:
        - HA-Storage does not exist yet
        - Old file exists
        
        Migration process:
        1. Read old file
        2. Save to new HA-Storage
        3. Rename old file to .migrated (preserve for rollback)
        4. Log success
        
        Returns migrated data or None if no migration needed.
        """
        old_file = Path(self._hass.config.path(OLD_DATA_FILE))
        
        # Gate: Only migrate if old file exists
        if not old_file.exists():
            _LOGGER.debug("No old data file found, skipping migration")
            self._migrated = True
            return None
        
        # Gate: Check if already migrated (file renamed)
        migrated_marker = old_file.with_suffix(f'.json.{MIGRATION_MARKER}')
        if migrated_marker.exists():
            _LOGGER.debug("Migration already completed (marker found)")
            self._migrated = True
            return None
        
        try:
            _LOGGER.info(
                "Starting migration from %s to HA-Storage", 
                old_file
            )
            
            # Read old file
            data = await self._hass.async_add_executor_job(
                self._read_old_file,
                old_file
            )
            
            if data is None:
                _LOGGER.warning("Old file exists but could not be read")
                self._migrated = True
                return None
            
            # Validate data structure
            if not isinstance(data, dict):
                _LOGGER.error("Invalid data structure in old file")
                self._migrated = True
                return None
            
            # Save to new HA-Storage
            await self._store.async_save(data)
            _LOGGER.info(
                "Data migrated to HA-Storage successfully: %d releases, %d issues",
                len(data.get('releases', [])),
                len(data.get('knownIssues', []))
            )
            
            # Preserve old file for rollback (rename to .migrated)
            await self._hass.async_add_executor_job(
                old_file.rename,
                migrated_marker
            )
            _LOGGER.info(
                "Old file preserved as %s (for manual rollback)",
                migrated_marker.name
            )
            
            self._migrated = True
            return data
            
        except Exception as e:
            _LOGGER.error(
                "Migration failed: %s - Old file preserved, no data loss",
                str(e)
            )
            self._migrated = True
            return None
    
    def _read_old_file(self, file_path: Path) -> dict[str, Any] | None:
        """Read old JSON file (sync)."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            _LOGGER.error("Error reading old file: %s", str(e))
            return None
    
    async def async_save(self, data: dict[str, Any]) -> bool:
        """Save data to HA-Storage."""
        try:
            # Save to HA-Storage (atomic write with backup)
            await self._store.async_save(data)

            _LOGGER.info("Data saved to HA-Storage successfully")
            # Dashboard-Karten über die Websocket-Subscription benachrichtigen
            async_dispatcher_send(self._hass, SIGNAL_DATA_UPDATED)
            return True
            
        except Exception as e:
            _LOGGER.error("Error saving data: %s", str(e))
            return False
    
    def _get_default_categories(self) -> list[dict[str, str]]:
        """Get default categories."""
        return [
            {"id": "general", "label": "Allgemein", "color": "gray"},
            {"id": "heating", "label": "Heizung", "color": "orange"},
            {"id": "energy", "label": "Energie", "color": "green"},
            {"id": "automation", "label": "Automation", "color": "blue-dark"},
            {"id": "device", "label": "Gerät", "color": "purple"},
            {"id": "integration", "label": "Integration", "color": "pink"},
            {"id": "ui", "label": "UI/UX", "color": "blue-light"},
            {"id": "performance", "label": "Performance", "color": "yellow"},
            {"id": "security", "label": "Sicherheit", "color": "red"},
            {"id": "bugfix", "label": "Bugfix", "color": "green"},
            {"id": "breaking", "label": "Breaking Change", "color": "pink"}
        ]

    def _get_default_settings(self) -> dict[str, Any]:
        """Get default settings."""
        return {
            "autoUpdateDocs": True
        }


def get_storage(hass: HomeAssistant) -> ReleaseNotesStorage:
    """
    Get storage instance (HA-Storage based).
    
    Changed in v0.5.0: Removed storage_type parameter, always uses HA-Storage.
    """
    return ReleaseNotesStorage(hass)
