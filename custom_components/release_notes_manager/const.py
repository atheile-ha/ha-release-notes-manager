"""Konstanten des Release Notes Managers."""

DOMAIN = "release_notes_manager"

# Wird nach jedem erfolgreichen Speichern gesendet (Admin-Interface und
# Update-Tracker), damit die Dashboard-Karte sofort neu lädt.
SIGNAL_DATA_UPDATED = f"{DOMAIN}_data_updated"

# Dashboard-Karte: ein mit Vite gebautes Bundle, das im Repository liegt, damit
# HACS es ohne Node-Toolchain ausliefert. Eigener Pfad, damit es nicht mit den
# HTML-Seiten unter /release-notes kollidiert.
CARD_BUNDLE_FILENAME = "release-notes-card.js"
CARD_STATIC_URL_PATH = f"/{DOMAIN}_static/{CARD_BUNDLE_FILENAME}"
