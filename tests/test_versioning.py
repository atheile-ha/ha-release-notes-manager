from datetime import date

import pytest

TODAY = date(2026, 10, 28)


@pytest.fixture(scope="module")
def v(load_module):
    return load_module("versioning")


class TestGetScheme:
    def test_default_is_calver(self, v):
        assert v.get_scheme(None) == "calver"
        assert v.get_scheme({}) == "calver"
        assert v.get_scheme({"versionScheme": "unbekannt"}) == "calver"

    def test_semver_is_kept(self, v):
        assert v.get_scheme({"versionScheme": "semver"}) == "semver"


class TestNextCalver:
    def test_counts_on_in_current_month(self, v):
        assert v.next_calver(["2026.10.2", "2026.10.1", "2026.9.3", "1.4.2"], TODAY) == "2026.10.3"

    def test_compares_numbers_not_text(self, v):
        assert v.next_calver(["2026.10.9", "2026.10.10"], TODAY) == "2026.10.11"

    def test_new_month_starts_at_one(self, v):
        assert v.next_calver(["2026.9.3"], TODAY) == "2026.10.1"
        assert v.next_calver([], TODAY) == "2026.10.1"

    def test_month_is_written_without_leading_zero_but_read_with_it(self, v):
        assert v.next_calver(["2026.01.2"], date(2026, 1, 5)) == "2026.1.3"

    def test_ignores_other_years_and_foreign_formats(self, v):
        assert v.next_calver(["2025.10.7", "abc", "", None], TODAY) == "2026.10.1"


class TestNextSemverMinor:
    def test_raises_minor_and_resets_bugfix(self, v):
        assert v.next_semver_minor(["1.4.2", "1.3.0"]) == "1.5.0"

    def test_compares_numbers_not_text(self, v):
        assert v.next_semver_minor(["1.9.2", "1.10.0"]) == "1.11.0"
        assert v.next_semver_minor(["2.0.0", "1.99.9"]) == "2.1.0"

    def test_ignores_calendar_versions(self, v):
        assert v.next_semver_minor(["2026.10.2", "1.4.2"]) == "1.5.0"
        assert v.next_semver_minor(["2026.10.2"]) == "0.1.0"

    def test_starts_at_zero_one_zero_without_a_match(self, v):
        assert v.next_semver_minor([]) == "0.1.0"
        assert v.next_semver_minor(["", None, "abc"]) == "0.1.0"


class TestNextVersion:
    def test_dispatches_by_scheme(self, v):
        versions = ["2026.10.2", "1.4.2"]
        assert v.next_version("calver", versions, TODAY) == "2026.10.3"
        assert v.next_version("semver", versions, TODAY) == "1.5.0"

    def test_unknown_scheme_falls_back_to_calver(self, v):
        assert v.next_version("unbekannt", ["2026.10.2"], TODAY) == "2026.10.3"

    def test_accepts_a_generator(self, v):
        assert v.next_version("semver", (x for x in ["1.0.0"]), TODAY) == "1.1.0"
