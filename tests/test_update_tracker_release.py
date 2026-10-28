"""Auswahl bzw. Anlage des Ziel-Releases der automatischen Update-Erfassung."""
from datetime import datetime
from unittest.mock import MagicMock

import pytest


class FixedDatetime(datetime):
    @classmethod
    def now(cls, tz=None):
        return cls(2026, 10, 28, 12, 0, 0)


@pytest.fixture
def tracker(load_module, monkeypatch):
    module = load_module("update_tracker")
    monkeypatch.setattr(module, "datetime", FixedDatetime)
    return module.UpdateTracker(MagicMock(), MagicMock())


def release(version, date, **extra):
    return {"id": 1, "version": version, "date": date, "features": [], "changes": [], "knownIssues": [], **extra}


def test_creates_a_calver_release_with_the_next_counter(tracker):
    releases = [release("2026.10.2", "2026-10-20"), release("2026.10.1", "2026-10-10"), release("2026.9.3", "2026-09-30")]
    new, created = tracker._resolve_target_release(releases, [], "calver")
    assert created is True
    assert new["version"] == "2026.10.3"
    assert new["date"] == "2026-10-28"
    assert releases[0] is new


def test_creates_a_semver_release_with_raised_minor(tracker):
    releases = [release("2026.10.2", "2026-10-20"), release("1.4.2", "2026-09-01")]
    new, created = tracker._resolve_target_release(releases, [], "semver")
    assert created is True
    assert new["version"] == "1.5.0"


def test_semver_starts_at_zero_one_zero(tracker):
    new, _ = tracker._resolve_target_release([release("2026.10.2", "2026-10-20")], [], "semver")
    assert new["version"] == "0.1.0"


def test_reuses_the_release_of_today_without_a_new_version(tracker):
    today = {"id": 5, "version": "2026.10.4", "date": "2026-10-28"}
    releases = [today, release("2026.10.3", "2026-10-20")]
    found, created = tracker._resolve_target_release(releases, [], "semver")
    assert created is False
    assert found is today
    assert found["changes"] == [] and found["features"] == [] and found["knownIssues"] == []
    assert len(releases) == 2


def test_new_release_takes_over_open_known_issues_only(tracker):
    issues = [
        {"id": 1, "title": "offen", "status": "open"},
        {"id": 2, "title": "gelöst", "status": "resolved"},
        {"id": 3, "title": "ohne Status"},
    ]
    new, _ = tracker._resolve_target_release([], issues, "calver")
    assert [i["id"] for i in new["knownIssues"]] == [1, 3]
    assert all(i["inheritedFrom"] is True for i in new["knownIssues"])
    assert "inheritedFrom" not in issues[0]


def test_first_release_without_history(tracker):
    new, created = tracker._resolve_target_release([], [], "calver")
    assert created is True
    assert new["version"] == "2026.10.1"
