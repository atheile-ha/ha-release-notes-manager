# Changelog - Release Notes Manager

## [0.7.0] - 2026-10-21

### ⚠️ Breaking Changes

**Widget-Seite entfernt - iframe-Card durch die Dashboard-Karte ersetzen**
- `release-notes-widget.html` gibt es nicht mehr, eine bestehende iframe-Card zeigt nach dem Update einen 404-Fehler
- Ersetzen durch:
  ```yaml
  type: custom:release-notes-card
  ```
- Der Einstellungsbereich des alten Widgets (Auto-Collapse-Regler) entfällt; die Zeit wird jetzt über die Option `auto_collapse` der Karte gesetzt

### 🎉 Neue Features

**Dashboard-Karte `custom:release-notes-card` statt iframe-Card**

**Neues Design mit Light- und Dark-Mode**
- Admin-Interface und Karte verwenden die Theme-Variablen von Home Assistant statt fest eingetragener Farben
- Die Karte folgt direkt dem aktiven HA-Theme. Das Admin-Interface übernimmt es im Modus „Automatisch“ (die Seite läuft same-origin im iframe), außerhalb von HA die Systemeinstellung; unter **Einstellungen → Darstellung** auch manuell auf Hell oder Dunkel umschaltbar
- Kategorie-Farbauswahl klappt direkt unter der Kategorie im Dialog auf statt als Popup

### 🐛 Bugfixes

**Widget übernimmt neue Daten automatisch**

### 🔒 Sicherheit

- Unter `/release-notes/` war bisher das gesamte Integrationsverzeichnis abrufbar (inkl. Python-Quellen); ausgeliefert wird jetzt nur noch `release-notes.html`
- Die Karte liest über die angemeldete Websocket-Verbindung statt über die offene REST-API

### 🔧 Technisch

- Migration: Gespeicherte Farbklassen werden beim Laden anhand des Farbtons auf Farb-IDs abgebildet (auch Backend-Standards wie `bg-teal-500`, unbekannte Werte → Grau); das Admin-Interface speichert die Umstellung einmalig, die Karte stellt nur für die Anzeige um. Standardkategorien und Kategorien des Update-Trackers verwenden jetzt Farb-IDs
- Neu: `websocket.py` (`release_notes_manager/data`, `release_notes_manager/subscribe`), `const.py`, `frontend/` (Lit + TypeScript + Vite, Tests mit vitest); das gebaute Bundle `custom_components/release_notes_manager/frontend/release-notes-card.js` ist eingecheckt
- `manifest.json`: `after_dependencies` für `frontend`, `http`, `websocket_api`
- Backend-Version: v0.7.0 (`__init__.py`, `api.py`, `storage.py`, `update_tracker.py`, `websocket.py`)
- Admin-Version: v0.7.0 (`release-notes.html`)
- Widget-Version: entfällt (`release-notes-widget.html` entfernt, ersetzt durch die Karte)

---

## [0.6.4] - 2026-08-19

### 🐛 Bugfix

**Admin/Widget: Offene bekannte Fehler fielen beim Anlegen eines neuen Releases zufällig raus**
- Die globale Liste der offenen bekannten Fehler (aus der `createNewRelease()` beim manuellen Anlegen eines Releases die Vorschläge übernimmt) wurde beim Speichern eines Releases bisher komplett durch dessen eigene `knownIssues`-Liste ersetzt - unabhängig davon, ob gerade der neueste Release oder ein alter Release (z. B. für eine kleine Korrektur) gespeichert wurde
- Dadurch konnte das erneute Speichern eines älteren Releases die globale Liste auf ihren damaligen Stand zurücksetzen und einen Fehler daraus entfernen, der in allen dazwischenliegenden und neueren Releases weiterhin korrekt als offen gelistet war
- Die globale Liste wird beim Speichern jetzt aus allen Releases neu aufgebaut (je Fehler-ID der jeweils neueste Stand nach Datum), statt durch die Liste des zuletzt gespeicherten Releases überschrieben zu werden - betroffene Bestandsdaten heilen sich dadurch beim nächsten Speichern eines beliebigen Releases automatisch selbst

### 🔧 Technisch

- Backend-Version: v0.6.3 (unverändert)
- Admin-Version: v0.6.1 (`release-notes.html`)
- Widget-Version: v0.5.4 (`release-notes-widget.html`)

---

## [0.6.3] - 2026-08-16

### 🐛 Bugfix

**Update-Tracker: Doppelte Einträge für ein und dasselbe Update**
- Der Tracker führte bisher zwei getrennte Warteschlangen mit zwei unabhängigen Timern (Live-Erkennung 5 Min. / HA-Start-Erkennung 2 Min.). Da der Versions-Cache bewusst erst beim Schreiben aktualisiert wird, konnte derselbe Versionswechsel in beiden Warteschlangen landen und zweimal dokumentiert werden - typischerweise bei Updates, die einen Neustart erfordern: beim Hochfahren meldet die neu angelegte Entität den Wechsel als `state_changed`, kurz darauf fällt er zusätzlich beim Baseline-Vergleich auf
- Ebenso konnte ein kurzzeitig `unavailable` werdender Update-Entity denselben Wechsel mehrfach in dieselbe Warteschlange legen - das erzeugte zwei Einträge, aber nur **eine** Benachrichtigung
- Es gibt jetzt nur noch **eine** Warteschlange, verschlüsselt nach Entitäts-ID: pro Entität steht höchstens ein Ereignis an, der Timer wird auf die jeweils frühere Frist vorgezogen

**Update-Tracker: Falsche "Deinstallation" bei spät ladenden Integrationen**
- War eine Integration (z. B. über HACS verwaltet) zum Zeitpunkt von `EVENT_HOMEASSISTANT_STARTED` noch nicht geladen, wurde sie als Deinstallation dokumentiert
- Vor dem Schreiben wird jedes vorgemerkte Ereignis jetzt gegen den aktuellen Zustand gegengeprüft: eine wieder vorhandene Entität verwirft die Deinstallations-Meldung, eine zwischenzeitlich erneut geänderte Version verwirft den veralteten Eintrag

**Zusätzliche Absicherung gegen Duplikate**
- Vor dem Anlegen wird geprüft, ob ein identischer Eintrag (Titel, Details, Kategorie) im Ziel-Release bereits existiert - falls ja, wird er übersprungen, der Versions-Cache aber trotzdem nachgezogen, damit dasselbe Ereignis nicht dauerhaft erneut erkannt wird
- Benachrichtigungs-IDs sind jetzt millisekundengenau; zwei Benachrichtigungen innerhalb derselben Sekunde überschrieben sich zuvor gegenseitig

### 🔧 Technisch

- Backend-Version: v0.6.3 (`update_tracker.py`)
- Admin-Version: v0.6.0 (unverändert)
- Widget-Version: v0.5.3 (unverändert)

---

## [0.6.2] - 2026-08-13

### 🐛 Bugfix

**Update-Tracker: Offene bekannte Fehler wurden bei automatisch angelegten Releases nicht übernommen**
- Beim manuellen Anlegen eines Releases im Admin-Dashboard werden offene bekannte Fehler automatisch als Vorschlag in das neue Release übernommen - das fehlte bisher, wenn der Update-Tracker selbst ein neues Tages-Release anlegt
- Automatisch angelegte Releases übernehmen jetzt ebenfalls alle offenen (nicht gelösten) bekannten Fehler, markiert als übernommen (`inheritedFrom`), analog zu `createNewRelease()` im Admin-Dashboard
- Betrifft nur das Neu-Anlegen eines Releases; wird ein bereits bestehendes Tages-Release wiederverwendet, bleibt dessen `knownIssues`-Liste unverändert

### 🔧 Technisch

- Backend-Version: v0.6.2 (`update_tracker.py`)
- Admin-Version: v0.6.0 (unverändert)
- Widget-Version: v0.5.3 (unverändert)

---

## [0.6.1] - 2026-08-13

### 🐛 Bugfix

**Update-Tracker: Falsche "Update"-Einträge beim ersten Lauf nach Integrationen ohne sofortigen Datenabruf**
- Bei manchen Integrationen ist `installed_version` beim `EVENT_HOMEASSISTANT_STARTED`-Zeitpunkt noch nicht bekannt (`None`), weil der erste Datenabruf noch aussteht. Die Baseline übernahm diesen `None`-Wert; sobald die Integration kurz darauf ihren echten Wert meldete, wurde das fälschlich als abgeschlossenes Update (`"? → ..."`) dokumentiert
- Ein Wechsel von "noch unbekannt" auf den ersten echten Wert erzeugt jetzt keinen Eintrag mehr, sondern trägt den Cache nur still nach - wie bei der eigentlichen Baseline

### 🔧 Technisch

- Backend-Version: v0.6.1 (`update_tracker.py`)
- Admin-Version: v0.6.0 (unverändert)
- Widget-Version: v0.5.3 (unverändert)

---

## [0.6.0] - 2026-08-13

### 🎉 Neue Features

**Automatische Update-Dokumentation über Home-Assistant-Update-Entitäten**
- Beobachtet alle `update.*`-Entitäten der Instanz und legt bei abgeschlossenen Updates automatisch einen Eintrag `"[alte Version] → [neue Version]"` in der Kategorie "Update" an
- Neu hinzukommende bzw. verschwindende Update-Entitäten (Integration/Add-on installiert bzw. deinstalliert) werden ebenfalls dokumentiert (Kategorie "Integration / Addon")
- Erkennung basiert auf einem persistierten Versions-Cache statt auf der reinen on/off-Transition, damit Updates, die einen HA-Neustart erfordern, zuverlässig erkannt werden
- Sammelt mehrere Ereignisse (5 Minuten bei laufendem Betrieb, 2 Minuten ab HA-Start bei Neustart-Updates) zu einer gemeinsamen Benachrichtigung
- Erstlauf nach Aktivierung legt nur eine stille Baseline an, ohne Alt-Einträge für längst installierte Komponenten zu erzeugen
- Neuer Einstellungsbereich im Admin-Dashboard (⚙️ Einstellungen) zum Ein-/Ausschalten der Funktion (Standard: aktiviert)
- Versionierung neu erstellter Tages-Releases folgt einem fortlaufenden Zähler pro Monat (`YYYY.M.N`)

### 🔧 Technisch

- Neues Modul `update_tracker.py`
- Admin-Version: v0.6.0 (Settings-Toggle)
- Backend-Version: v0.6.0 (Update-Tracker, Storage-Settings-Default)
- Widget-Version: v0.5.3 (unverändert)

---

## [0.5.5] - 2026-08-13

### 🎉 Neue Features

**Admin: Einträge innerhalb eines Bereichs per Drag'n'Drop umsortieren**
- Ein Eintrag lässt sich jetzt auch direkt auf einem anderen Eintrag im selben Bereich ablegen, um ihn davor oder danach einzusortieren (statt nur zwischen "Neue Features" und "Änderungen/Bugfixes" zu wechseln)
- Ob vor oder nach dem Zieleintrag eingefügt wird, richtet sich danach, ob in der oberen oder unteren Hälfte der Zielkarte losgelassen wird; eine blaue Linie zeigt die Einfügeposition während des Ziehens an
- Funktioniert auch bereichsübergreifend: Ablegen auf einer konkreten Karte im jeweils anderen Bereich positioniert den Eintrag dort gezielt, statt ihn immer nur oben einzufügen

### 🔧 Technisch

- Admin-Version: v0.5.5 (Drag'n'Drop-Umsortierung)
- Backend-Version: v0.5.2 (unverändert)
- Widget-Version: v0.5.3 (unverändert)

---

## [0.5.4] - 2026-08-13

### 🎉 Neue Features

**Admin: Drag'n'Drop zwischen "Neue Features" und "Änderungen/Bugfixes"**
- Einträge im Release-Bearbeiten-Formular lassen sich per Ziehpunkt (⠿) zwischen den beiden Abschnitten verschieben, ohne sie löschen und neu anlegen zu müssen
- Ziel-Abschnitt wird während des Ziehens optisch hervorgehoben

### 🔧 Technisch

- Admin-Version: v0.5.4 (Drag'n'Drop)
- Backend-Version: v0.5.2 (unverändert)
- Widget-Version: v0.5.3 (unverändert)

---

## [0.5.3] - 2026-08-12

### 🎉 Neue Features

**Admin: Einstellungen-Popup mit Export / Import**
- Neue Schaltfläche "🔧 Einstellungen" im Admin-Interface zwischen "Kategorien" und "+ Neues Release" öffnet ein Popup mit Abschnitt "💾 Daten"
- Export lädt den aktuellen Datenstand (Releases, bekannte Fehler, Kategorien) als JSON-Datei herunter
- Import liest eine JSON-Datei ein und ersetzt nach Bestätigung den aktuellen Datenstand vollständig damit
- Nur im Admin-Interface verfügbar, nicht im Widget
- Das Einstellungen-Popup ist bewusst erweiterbar angelegt, um künftig weitere Einstellungen (z.B. Darstellung, Zugriff) als eigene Abschnitte aufzunehmen

### 🐛 Bugfixes

**Versions-Tracking von Backend/Admin/Widget entkoppelt**
- Der `/api/release_notes_manager/version`-Endpoint lieferte bisher nur eine einzelne Versionsnummer, gegen die sowohl das Admin- als auch das Widget-Dashboard verglichen wurden - obwohl beide unabhängig voneinander versioniert werden. Dadurch stimmten Widget- und Backend-Version strukturell nie überein, was bei jedem neuen Browser/Gerät einen unnötigen Reload des kompletten Dashboards auslöste (`window.parent.location.reload()`).
- Der Endpoint liefert jetzt `{"backend": ..., "admin": ..., "widget": ...}`; jedes Dashboard vergleicht nur noch seine eigene Version.
- Titel, Meta-Tag und Versions-Fußzeile beider Dashboards werden jetzt aus je einer einzigen JS-Konstante abgeleitet statt an mehreren Stellen einzeln hartcodiert zu sein (u.a. stand im Admin-Meta-Tag noch "0.5.0", im Widget-Titel noch "v0.3.0").

**Admin: Zeilenumbrüche in Bearbeitungsfeldern**
- Beim erneuten Öffnen eines Releases zum Bearbeiten wurden mehrzeilige Detailtexte mit literalem `<br>` statt echten Zeilenumbrüchen angezeigt. Ursache: Die `esc()`-Funktion für die Leseansicht wandelt `\n` in `<br>` um und wurde fälschlich auch zum Befüllen der Eingabefelder verwendet. Neue Funktion `escInput()` (ohne `<br>`-Umwandlung) wird jetzt für alle `value`-Attribute und `<textarea>`-Inhalte verwendet.

### 🔧 Technisch

- Backend-Version: v0.5.2 (Versions-API umgebaut)
- Admin-Version: v0.5.3 (Versions-Check-Fix, Zeilenumbruch-Fix, Export/Import)
- Widget-Version: v0.5.3 (Versions-Check-Fix)
- `hacs.json`: Mindest-HA-Version auf 2024.7.0 korrigiert (vorher 2023.1.0 - `StaticPathConfig`/`async_register_static_paths`, seit v0.5.0 verwendet, gibt es erst ab HA 2024.7)
- `storage.py`: totes Cache-Überbleibsel aus `async_save()` entfernt
- `INFO.md` entfernt: war durch einen Merge-Unfall in der v0.5.1-Historie verloren gegangen (README verlinkte seitdem ins Leere) und duplizierte ohnehin größtenteils die README. Inhalte (Verwendung, Troubleshooting) in README.md übernommen; `hacs.json` bekommt stattdessen `"render_readme": true`, damit HACS die README statt des (seit HACS 2.0 kaum noch genutzten) info.md anzeigt

---

## [0.5.2] - 2026-01-03

### 🐛 Bugfixes

**Widget: Fehlende Fixes nachgeholt**
- Badge-Zählung im Widget korrigiert: Gelöste Known Issues werden jetzt mitgezählt
- Zeilenumbrüche im Widget funktionieren jetzt korrekt

**Hinweis:** Diese Fixes waren in v0.5.1 nur im Admin-Interface, nicht im Widget vorhanden.

### 🔧 Technisch

- Widget-Version: v0.5.2
- Backend-Version: v0.5.1 (unverändert)
- Admin-Version: v0.5.1 (unverändert)

---

## [0.5.1] - 2026-01-02

### 🎉 Neue Features

**Auto-Reload bei Updates**
- Widget und Admin-Interface prüfen automatisch Backend-Version
- Bei Versions-Mismatch: Automatischer Reload (einmalig)
- Kein manuelles Cache-Busting mehr nötig!
- localStorage verhindert Reload-Loops

### 🐛 Bugfixes

**Zeilenumbrüche in Textfeldern**
- Beschreibungen, Changelogs und Known Issues zeigen jetzt Zeilenumbrüche korrekt an
- `esc()` Funktion konvertiert `\n` → `<br>`
- Betrifft: Admin-Interface und Dashboard-Widget

**Gelöste Fehler in Badge-Zählung**
- Gelöste Known Issues werden jetzt im Änderungs-Badge mitgezählt
- Vorher: Nur explizite "Änderungen" gezählt
- Jetzt: Änderungen + gelöste Fehler dieser Version
- Beispiel: 3 Änderungen + 2 gelöste Bugs = Badge "5 Änderungen"

### 🔧 Technisch

- API-Endpoint hinzugefügt: `GET /api/release_notes_manager/version`
- Auto-Reload JavaScript in Widget und Admin
- `esc()` Funktion erweitert: `.replace(/\n/g,'<br>')`
- `getSummaryBadges()` zählt gelöste Issues
- Frontend-Version: v0.5.1
- Backend-Version: v0.5.1

---

## [0.5.0] - 2026-01-02

### 🎯 Major Changes

**HA-Storage Migration**
- Daten werden in `.storage/release_notes_manager` gespeichert
- Automatische Migration von v0.4.0 Daten beim ersten Start
- Rollback-Sicherheit: Alte Daten werden als `.migrated` gesichert

**Frontend-Serving modernisiert**
- Assets direkt aus Integration bereitgestellt
- Kein Kopieren nach `/config/www/` mehr nötig
- Neue URLs: `/release-notes/` statt `/local/release-notes/`

**API modernisiert**
- GET-Endpoint: `/api/release_notes_manager/data` - Daten laden
- POST-Endpoint: `/api/release_notes_manager/data` - Daten speichern
- Nur offizielle Home Assistant APIs verwendet

### ✅ Features erhalten

Alle 11 Features aus v0.4.0 vollständig erhalten:
- Suche und Filterung
- Kategorien und Status
- Known Issues Tracking
- Dark Mode, Responsive Design
- Auto-Reload, Changelog-Ansicht
- Badge-System, Import/Export
- Backup-Funktionen
- Multi-Language (DE)

### 🐛 Bugfixes

**Critical: Cache-Bug behoben**
- Cache verhinderte Migration beim ersten Start
- Symptom: HA-Storage blieb leer (0 releases)
- Fix: Cache-System entfernt (HA-Storage ist schnell genug)
- Migration läuft jetzt garantiert

**HTML-Versionen korrigiert**
- Meta-Tags auf v0.5.0 aktualisiert
- Footer zeigt korrekte Versionen
- Admin: "Backend v0.5.0 | Frontend v0.5.0"
- Widget: "Backend v0.5.0 | Widget v0.5.0"

**API-Endpoint hinzugefügt**
- v0.5.0 (initial) hatte nur POST-Endpoint
- GET-Endpoint fehlte → HTML konnte Daten nicht laden
- Fix: GET + POST in einem Endpoint vereint

### ⚠️ Breaking Changes

**Dashboard-URLs geändert:**
```yaml
# ALT (v0.4.0):
url: /local/release-notes/release-notes-widget.html?

# NEU (v0.5.0):
url: /release-notes/release-notes-widget.html?
```

**Datenspeicherung:**
- ALT: `/config/www/release_data.json`
- NEU: `/config/.storage/release_notes_manager`

**Automatische Migration:**
- Erfolgt beim ersten Start nach Update
- Alte Datei wird als `.migrated` gesichert
- Kein Datenverlust möglich

### 📊 Getestet mit

- Home Assistant 2025.12.5
- Migration von v0.4.0 mit 37+ releases
- HACS Installation
- Manuelle Installation

---

## [0.4.0] - 2025-12-XX

### Features
- 11 neue Features
- UI-Verbesserungen
- Performance-Optimierungen
- Vollständiges Admin-Interface
- Dashboard-Widget

---

## [0.3.x] - 2025-11-XX

### Initial Release
- Erste HACS-Version
- Basis-Release-Verwaltung
- Einfaches Frontend

---

**Repository:** https://github.com/atheile-ha/ha-release-notes-manager  
**HACS:** Custom Repository  
**Lizenz:** MIT
