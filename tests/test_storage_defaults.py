from unittest.mock import MagicMock


def test_default_settings_keep_existing_behavior(load_module):
    settings = load_module("storage").ReleaseNotesStorage(MagicMock())._get_default_settings()
    assert settings["autoUpdateDocs"] is True
    assert settings["versionScheme"] == "calver"
    assert settings["versionPrefill"] is False


def test_default_categories_use_color_ids(load_module):
    categories = load_module("storage").ReleaseNotesStorage(MagicMock())._get_default_categories()
    assert categories
    for category in categories:
        assert set(category) == {"id", "label", "color"}
        assert not category["color"].startswith("bg-")
    assert len({c["id"] for c in categories}) == len(categories)
