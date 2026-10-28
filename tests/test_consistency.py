"""Konsistenz der Release-Dateien: Versionen, Muster, Markenbilder, Manifest.

Fangen typische Fehler vor dem Release ab, etwa eine vergessene Versionsanhebung.
"""
import json
import re
import struct
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "release_notes_manager"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def manifest():
    return json.loads(read(INTEGRATION / "manifest.json"))


@pytest.fixture(scope="module")
def admin_html():
    return read(INTEGRATION / "release-notes.html")


class TestManifest:
    def test_required_keys(self, manifest):
        for key in ("domain", "name", "version", "documentation", "issue_tracker"):
            assert manifest.get(key), key

    def test_domain_matches_folder(self, manifest):
        assert manifest["domain"] == INTEGRATION.name

    def test_keys_are_sorted_like_hassfest_wants(self, manifest):
        # hassfest: domain, name, danach alphabetisch
        keys = list(manifest)
        assert keys[:2] == ["domain", "name"]
        assert keys[2:] == sorted(keys[2:])

    def test_yaml_setup_declares_a_config_schema(self):
        # hassfest verlangt ein CONFIG_SCHEMA, wenn die Integration async_setup implementiert
        init = read(INTEGRATION / "__init__.py")
        assert "async def async_setup(" in init
        assert re.search(r"^CONFIG_SCHEMA = cv\.\w+\(", init, re.M)

    def test_hacs_json(self):
        hacs = json.loads(read(ROOT / "hacs.json"))
        assert hacs["name"]
        assert hacs["homeassistant"]


class TestVersions:
    def test_package_version_is_used_everywhere(self, manifest):
        version = manifest["version"]
        assert json.loads(read(ROOT / "frontend" / "package.json"))["version"] == version
        lock = json.loads(read(ROOT / "frontend" / "package-lock.json"))
        assert lock["version"] == version
        assert lock["packages"][""]["version"] == version

    def test_admin_version_is_consistent(self, admin_html):
        const = re.search(r"const ADMIN_VERSION = '([^']+)'", admin_html).group(1)
        meta = re.search(r'<meta id="version-meta" name="version" content="([^"]+)"', admin_html).group(1)
        title = re.search(r"<title>.*Admin v([\d.]+)</title>", admin_html).group(1)
        footer = re.search(r'class="version-footer">\s*Admin: v([\d.]+)', admin_html).group(1)
        assert const == meta == title == footer
        # Der Server meldet diese Version; bei Abweichung lädt sich die Seite neu
        init = read(INTEGRATION / "__init__.py")
        assert re.search(r'^ADMIN_VERSION = "([^"]+)"', init, re.M).group(1) == const

    def test_changelog_and_readme_name_the_current_version(self, manifest):
        version = manifest["version"]
        assert re.search(r"^## \[%s\] - \d{4}-\d{2}-\d{2}" % re.escape(version), read(ROOT / "CHANGELOG.md"), re.M)
        assert re.search(r"^\*\*Version:\*\* %s\b" % re.escape(version), read(ROOT / "README.md"), re.M)

    def test_changelog_is_newest_first(self):
        versions = re.findall(r"^## \[([\d.]+)\]", read(ROOT / "CHANGELOG.md"), re.M)
        keys = [tuple(int(p) for p in v.split(".")) for v in versions]
        assert keys == sorted(keys, reverse=True)


class TestVersionPatterns:
    """Backend (Python) und Admin-Interface (JavaScript) müssen dieselben Muster verwenden."""

    def test_patterns_are_identical(self, load_module, admin_html):
        versioning = load_module("versioning")
        calver = re.search(r"const CALVER = /(.+)/;", admin_html).group(1)
        semver = re.search(r"const SEMVER = /(.+)/;", admin_html).group(1)
        assert calver == versioning.CALVER_PATTERN.pattern
        assert semver == versioning.SEMVER_PATTERN.pattern

    def test_default_scheme_is_the_same(self, load_module, admin_html):
        assert load_module("versioning").DEFAULT_SCHEME == "calver"
        assert re.search(r"settings\.versionScheme === 'semver'\) \? 'semver' : 'calver'", admin_html)


def png_size(path: Path):
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", path.name
    return struct.unpack(">II", data[16:24])


class TestBrandImages:
    """Markenbilder für Home Assistant und HACS (ab HA 2026.3, Ordner brand/)."""

    def test_icons(self):
        # Das Icon hat eine eigene Fläche und wirkt auf hellem und dunklem Grund, eine dark_-Variante entfällt
        assert png_size(INTEGRATION / "brand" / "icon.png") == (256, 256)
        assert png_size(INTEGRATION / "brand" / "icon@2x.png") == (512, 512)

    @pytest.mark.parametrize("prefix", ["", "dark_"])
    def test_logos(self, prefix):
        width, height = png_size(INTEGRATION / "brand" / f"{prefix}logo.png")
        assert 128 <= min(width, height) <= 256 and width >= height
        width, height = png_size(INTEGRATION / "brand" / f"{prefix}logo@2x.png")
        assert 256 <= min(width, height) <= 512 and width >= height


class TestBundle:
    def test_card_bundle_is_shipped(self):
        bundle = INTEGRATION / "frontend" / "release-notes-card.js"
        assert bundle.stat().st_size > 10_000

    def test_no_home_assistant_logo_path(self, admin_html):
        # Das Home-Assistant-Symbol gehört dem HA-Projekt und darf nicht verwendet werden
        marker = "M21.8,13H20V21H13V17.67"
        assert marker not in admin_html
        assert marker not in read(INTEGRATION / "frontend" / "release-notes-card.js")


class TestReadmeAndLinks:
    """HACS rendert das README ohne HTML wie <picture> und zeigt Bilder nur bei gültiger Adresse."""

    @pytest.fixture
    def readme(self):
        return read(ROOT / "README.md")

    def test_banner_is_a_plain_markdown_image(self, readme):
        assert "<picture" not in readme and "<img" not in readme

    def test_readme_images_exist_in_the_repository(self, readme):
        urls = re.findall(r"!\[[^\]]*\]\((https://raw\.githubusercontent\.com/[^/]+/[^/]+/main/([^)]+))\)", readme)
        assert urls, "kein Bild über raw.githubusercontent.com eingebunden"
        for _, path in urls:
            assert (ROOT / path).is_file(), path

    def test_repository_links_use_one_name(self, readme, manifest):
        text = readme + json.dumps(manifest) + read(ROOT / "CHANGELOG.md")
        slugs = set(re.findall(r"github\.com/(atheile-ha/[\w.-]+?)(?=[/\"')\s`]|$)", text))
        slugs |= set(re.findall(r"raw\.githubusercontent\.com/(atheile-ha/[\w.-]+?)/main", text))
        assert len(slugs) == 1, slugs

    def test_repository_links_match_the_real_repository(self, readme):
        # In GitHub Actions bekannt; lokal übersprungen. Ein falscher Name führt zu 404 bei Bildern und Links.
        import os

        actual = os.environ.get("GITHUB_REPOSITORY")
        if not actual:
            pytest.skip("GITHUB_REPOSITORY nicht gesetzt")
        assert f"github.com/{actual}" in readme
