"""Gemeinsame Hilfen fuer die Python-Tests.

Die Integration importiert Home Assistant. Die Tests pruefen aber nur reine
Logik und brauchen Home Assistant deshalb nicht: die benoetigten Module werden
durch Platzhalter ersetzt und die Integration wird als Paket
`release_notes_manager` aus dem Quellordner geladen (ohne `__init__.py`, das
die Weboberflaeche einrichtet).
"""
import importlib
import sys
import types
from pathlib import Path
from unittest.mock import MagicMock

import pytest

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "release_notes_manager"

_STUBBED = (
    "homeassistant",
    "homeassistant.const",
    "homeassistant.core",
    "homeassistant.helpers",
    "homeassistant.helpers.device_registry",
    "homeassistant.helpers.entity_registry",
    "homeassistant.helpers.event",
    "homeassistant.helpers.storage",
    "homeassistant.helpers.dispatcher",
)


@pytest.fixture(scope="session")
def load_module():
    """Liefert eine Funktion, die ein Modul der Integration ohne Home Assistant laedt."""
    for name in _STUBBED:
        sys.modules[name] = MagicMock()
    package = types.ModuleType("release_notes_manager")
    package.__path__ = [str(INTEGRATION)]
    sys.modules["release_notes_manager"] = package

    def load(name: str):
        return importlib.import_module(f"release_notes_manager.{name}")

    return load
