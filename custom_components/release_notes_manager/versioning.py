"""Versionsschemata fuer automatisch angelegte Releases.

Zwei Schemata, einstellbar in den Einstellungen des Admin-Interfaces:

- calver: Jahr.Monat.Zaehler (YYYY.MM.ZZ), der Monat ohne fuehrende Null
  (2026.9.3). Der Zaehler beginnt jeden Monat bei 1.
- semver: Major.Minor.Bugfix (xx.yy.zz). Automatisch angelegte Releases
  erhoehen Minor und setzen Bugfix auf 0.

Beide Schreibweisen bestehen aus drei Zahlen mit Punkten. Getrennt werden sie
an der ersten Stelle: vierstellig gilt als Jahr, ein- bis dreistellig als Major.
Releases, die nicht zum gewaehlten Schema passen, bleiben unveraendert und
werden bei der Nummernvergabe ignoriert.
"""
from __future__ import annotations

import re
from collections.abc import Iterable
from datetime import date

SCHEME_CALVER = "calver"
SCHEME_SEMVER = "semver"
DEFAULT_SCHEME = SCHEME_CALVER

CALVER_PATTERN = re.compile(r"^(\d{4})\.(\d{1,2})\.(\d+)$")
SEMVER_PATTERN = re.compile(r"^(\d{1,3})\.(\d+)\.(\d+)$")


def get_scheme(settings: dict | None) -> str:
    """Gewaehltes Schema aus den Einstellungen; unbekannte Werte ergeben calver."""
    scheme = (settings or {}).get("versionScheme")
    return scheme if scheme in (SCHEME_CALVER, SCHEME_SEMVER) else DEFAULT_SCHEME


def next_calver(versions: Iterable[str], today: date) -> str:
    """Hoechster Zaehler im Monat von `today` plus 1, im neuen Monat 1."""
    best = 0
    for version in versions:
        match = CALVER_PATTERN.match(version or "")
        if match and int(match.group(1)) == today.year and int(match.group(2)) == today.month:
            best = max(best, int(match.group(3)))
    return f"{today.year}.{today.month}.{best + 1}"


def next_semver_minor(versions: Iterable[str]) -> str:
    """Hoechste Major.Minor.Bugfix-Version: Minor plus 1, Bugfix 0. Ohne passende Version 0.1.0."""
    best: tuple[int, int, int] | None = None
    for version in versions:
        match = SEMVER_PATTERN.match(version or "")
        if match:
            candidate = (int(match.group(1)), int(match.group(2)), int(match.group(3)))
            if best is None or candidate > best:
                best = candidate
    if best is None:
        return "0.1.0"
    return f"{best[0]}.{best[1] + 1}.0"


def next_version(scheme: str, versions: Iterable[str], today: date) -> str:
    """Naechste Versionsnummer fuer ein automatisch angelegtes Release."""
    versions = list(versions)
    if scheme == SCHEME_SEMVER:
        return next_semver_minor(versions)
    return next_calver(versions, today)
