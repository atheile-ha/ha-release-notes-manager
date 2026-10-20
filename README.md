# 📝 Home Assistant Release Notes Manager

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)

Ein elegantes Tool zur Verwaltung und Anzeige von Release Notes direkt in Home Assistant.

## ✨ Features

- 📋 **Release-Verwaltung** - Versionen, Kategorien, Status-Tracking
- ⚠️ **Known Issues** - Bekannte Probleme dokumentieren, verfolgen und beim nächsten Release automatisch übernehmen
- 🎨 **Admin-Interface (Eingabe-Dashboard)** - Vollständiges Verwaltungs-Interface zum Erstellen und Bearbeiten von Releases
- 🖥️ **Dashboard-Karte** (`custom:release-notes-card`) - Kompakte Anzeige der neuesten Releases, aktualisiert sich sofort nach jedem Speichern
- 🌓 **Light/Dark Mode** - Folgt dem aktiven Home-Assistant-Theme, im Admin-Interface manuell umschaltbar
- 🔍 **Suche & Filter** - Schnell das richtige Release finden
- 🔄 **Immer aktuell** - Karte und Seiten werden nach einem Update ohne manuelles Cache-Leeren neu geladen
- 🔧 **Einstellungen** - Popup im Admin-Interface, u.a. mit Export/Import des Datenstands als JSON
- 🖱️ **Drag'n'Drop** - Einträge im Admin-Interface zwischen "Neue Features" und "Änderungen/Bugfixes" verschieben und innerhalb eines Bereichs umsortieren
- 🔄 **Automatische Update-Dokumentation** - Beobachtet alle `update.*`-Entitäten der Instanz und legt bei abgeschlossenen Updates sowie neu hinzugekommenen/entfernten Integrationen automatisch passende Release-Notes-Einträge an (ein-/ausschaltbar in den Einstellungen)

## 🆕 Version 0.7.0

### ⚠️ Breaking Change

Die Widget-Seite `release-notes-widget.html` wurde entfernt. Bestehende iframe-Cards zeigen nach dem Update einen 404-Fehler und müssen durch `type: custom:release-notes-card` ersetzt werden (siehe [Konfiguration](#️-konfiguration)).

### Neu in dieser Version:

✅ **Dashboard-Karte statt iframe-Card**
- Das Widget ist jetzt eine eigene Lovelace-Karte (`custom:release-notes-card`) wie in ha_ev-charge-record und erscheint in der Kartenauswahl - keine iframe-Card mehr nötig
- Sie aktualisiert sich sofort, sobald im Admin-Interface gespeichert oder ein Update automatisch dokumentiert wird
- Die Daten kommen über die angemeldete Websocket-Verbindung von Home Assistant
- Optionen `title`, `count` und `auto_collapse` (siehe [Konfiguration](#️-konfiguration))

✅ **Neues Design mit Light- und Dark-Mode**
- Admin-Interface und Karte folgen dem aktiven Home-Assistant-Theme; im Admin-Interface unter **Einstellungen → Darstellung** auch manuell auf Hell oder Dunkel umschaltbar
- Kartenaufbau angelehnt an [ha_ev-charge-record](https://github.com/atheile-ha/ha_ev-charge-record): Chips für die Zusammenfassung, aufklappbare Details, Chip „Aktuell“ für das neueste Release
- Kategorie-Farben sind für beide Themes abgestimmt (Kontrast mindestens 4,5:1); gespeicherte Farben werden beim ersten Öffnen des Admin-Interfaces automatisch umgestellt

✅ **Kein manueller Cache-Parameter mehr**
- Der `?=vX.X.X`-Parameter in den Dashboard-URLs entfällt: Karte und Seiten werden nach einem Update automatisch neu geladen

Vollständige Versionshistorie: [CHANGELOG.md](CHANGELOG.md)

## 🏗️ Architektur

- **HA-Storage basiert:** Daten werden in Home Assistant's offiziellem Storage-System (`/config/.storage/release_notes_manager`) gespeichert
- **Dashboard-Karte:** ein Bundle (`frontend/release-notes-card.js`), das Home Assistant in jedes Dashboard lädt. Die URL enthält Paketversion, Datei-Hash und HA-Startzeit, damit Browser und Companion-App nach einem Update die neue Fassung laden
- **Websocket:** `release_notes_manager/data` liefert Releases und Kategorien, `release_notes_manager/subscribe` meldet jedes Speichern an die Karte (nur für angemeldete Benutzer)
- **Admin-Interface direkt aus der Integration:** unter `/release-notes/release-notes.html`, ausgeliefert mit `Cache-Control: no-cache` und ETag; kein Kopieren nach `/config/www/` nötig
- **REST-API:** `GET`/`POST /api/release_notes_manager/data` zum Laden/Speichern im Admin-Interface, `GET /api/release_notes_manager/version` liefert die Versionsstände von Backend und Admin-Interface
- **Unabhängige Versionsstände:** Backend und Admin-Interface (`release-notes.html`) haben jeweils eigene Versionsnummern, die nur erhöht werden, wenn an genau dieser Datei etwas geändert wurde. Die Paketversion in `manifest.json` wird davon unabhängig bei jedem Release hochgezählt; die Karte verwendet die Paketversion.

## 🚀 Installation

### Via HACS (empfohlen)

1. HACS öffnen
2. Menü (⋮) → "Benutzerdefinierte Repositories"
3. Repository: `https://github.com/atheile-ha/ha-release-notes-manager`
4. Kategorie: **Integration**
5. "Release Notes Manager" installieren
6. Home Assistant neu starten

### Manuelle Installation

1. Kopiere `custom_components/release_notes_manager` nach `/config/custom_components/`
2. Home Assistant neu starten

## ⚙️ Konfiguration

**configuration.yaml:**
```yaml
release_notes_manager:

# Optional: Debug-Logging
logger:
  default: info
  logs:
    custom_components.release_notes_manager: debug
```

**Dashboard-Karte:**

Die Karte steht nach dem Neustart in der Kartenauswahl unter „Release Notes“ zur Verfügung, oder in YAML:
```yaml
type: custom:release-notes-card
# Optional:
title: Release Notes   # Überschrift der Karte
count: 1               # Anzahl Releases beim Öffnen (1-50)
auto_collapse: 30      # Sekunden nach der letzten Bedienung, bis die Karte auf das neueste Release zurückklappt (0 = aus)
```

Die Karte lädt über die angemeldete Websocket-Verbindung von Home Assistant und aktualisiert sich sofort, wenn im Admin-Interface gespeichert oder ein Update automatisch dokumentiert wird. Sie folgt dem aktiven Theme (hell/dunkel).

**Admin-Interface als Dashboard-Tab:**
```yaml
title: Release Notes
icon: mdi:note-text
url: /release-notes/release-notes.html
```

**Admin-Interface direkt im Browser:**
```
http://DEINE-IP:8123/release-notes/release-notes.html
```

## 📖 Verwendung

### Release erstellen

1. Admin-Interface öffnen (`/release-notes/release-notes.html`)
2. **"+ Neues Release"** klicken
3. Formular ausfüllen:
   - Version (z.B. "2025.1.0")
   - Name (optional)
   - Datum
   - Features, Änderungen/Bugfixes, bekannte Fehler
4. **"Speichern"** klicken

### Known Issue hinzufügen

1. Release bearbeiten (Stift-Symbol)
2. Zu **"Bekannte Fehler"** scrollen
3. **"+ Hinzufügen"** klicken
4. Titel und Details eingeben
5. **"Speichern"**

Offene bekannte Fehler werden beim Anlegen eines neuen Release automatisch als Vorschlag übernommen und können dort als gelöst markiert werden.

### Kategorien verwalten

1. Oben rechts **"Kategorien"** klicken
2. Neue Kategorie hinzufügen oder bestehende bearbeiten
3. Farbe anpassen (Klick auf das Label)

### Automatische Update-Dokumentation

Läuft standardmäßig aktiviert im Hintergrund und benötigt keine Konfiguration:

- Schließt eine `update.*`-Entität in Home Assistant ein Update ab, wird automatisch ein Eintrag `"[alte Version] → [neue Version]"` in der Kategorie **"Update"** im passenden Tages-Release angelegt (neues Release wird bei Bedarf automatisch erstellt, Versionsschema `YYYY.M.N`)
- Neu hinzugekommene bzw. entfernte `update.*`-Entitäten werden als **"Neuinstallation"**/**"Deinstallation"** in der Kategorie **"Integration / Addon"** dokumentiert
- Mehrere gleichzeitige Ereignisse werden zu einer gemeinsamen Benachrichtigung gebündelt (Home Assistant → Mitteilungen)
- Beim ersten Aktivieren wird nur eine stille Bestandsaufnahme durchgeführt, es entstehen keine rückwirkenden Einträge für bereits installierte Komponenten
- Jedes Ereignis wird pro Entität nur einmal vorgemerkt und vor dem Schreiben nochmals gegen den aktuellen Zustand geprüft - Updates mit Neustart, kurzzeitig nicht verfügbare Entitäten oder spät ladende Integrationen erzeugen dadurch weder doppelte noch falsche Einträge

**Ein-/Ausschalten:** Admin-Interface → **Einstellungen** → Abschnitt „Automatische Update-Dokumentation“

## 🐛 Troubleshooting

### Releases werden nicht angezeigt / Dashboard zeigt eine alte Version

**Lösung 1: Seite neu laden**

Karte und Seiten werden nach einem Update automatisch neu geladen. Zeigt die Companion-App nach einem Update oder Neustart „Karte nicht gefunden“, die App einmal vollständig schließen und neu öffnen. Im Browser hilft notfalls:
```
Strg + Shift + R (Hard Reload)
```

**Lösung 2: Logs prüfen**
```
Einstellungen → System → Protokolle
Suche: "release_notes_manager"
```

### 404 Error beim Öffnen

**URL prüfen:**
- ✅ Richtig: `/release-notes/release-notes.html?...`
- ❌ Falsch: `/local/release-notes/...` (alte URL-Struktur vor v0.5.0)

**configuration.yaml prüfen:**
```yaml
release_notes_manager:  # Muss vorhanden sein!
```

### Speichern funktioniert nicht

**Logs prüfen:**
```
Einstellungen → System → Protokolle
Suche: "Error"
```

**API-Endpoint testen:**
```bash
# In Browser Developer Tools (F12) Console:
fetch('/api/release_notes_manager/data')
  .then(r => r.json())
  .then(d => console.log(d))
```

## 🛠️ Entwicklung

Die Dashboard-Karte liegt als TypeScript-Quelle (Lit) in `frontend/` und wird mit Vite zu `custom_components/release_notes_manager/frontend/release-notes-card.js` gebaut. Das Bundle ist eingecheckt, damit HACS es ohne Node ausliefert - nach Änderungen an `frontend/src` neu bauen und mit committen:

```bash
cd frontend
npm install
npm run typecheck && npm test && npm run build
```

## 🤝 Support

- [GitHub Issues](https://github.com/atheile-ha/ha-release-notes-manager/issues)
- [Troubleshooting](#-troubleshooting)

## 📜 Lizenz

MIT License - siehe [LICENSE](LICENSE)

---

Entwickelt für die Home Assistant Community 🏠

**Version:** 0.7.0  
**Repository:** https://github.com/atheile-ha/ha-release-notes-manager
