"""Websocket-Befehle für die Dashboard-Karte.

Anders als die REST-API laufen sie über die angemeldete Verbindung des
HA-Frontends und sind deshalb nur für angemeldete Benutzer erreichbar.
"""
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN, SIGNAL_DATA_UPDATED

WS_DATA = f"{DOMAIN}/data"
WS_SUBSCRIBE = f"{DOMAIN}/subscribe"


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register the websocket commands of the card."""
    websocket_api.async_register_command(hass, ws_data)
    websocket_api.async_register_command(hass, ws_subscribe)


def _card_data(data: dict[str, Any]) -> dict[str, Any]:
    """Return the part of the stored data the card displays."""
    return {
        "releases": data.get("releases", []),
        "categories": data.get("categories", []),
        "lastUpdate": data.get("lastUpdate"),
    }


@websocket_api.websocket_command({vol.Required("type"): WS_DATA})
@websocket_api.async_response
async def ws_data(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Send releases and categories."""
    data = await hass.data[DOMAIN]["storage"].async_load()
    connection.send_result(msg["id"], _card_data(data))


@websocket_api.websocket_command({vol.Required("type"): WS_SUBSCRIBE})
@callback
def ws_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Send an event after every save; the card then loads the data again."""

    @callback
    def forward() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {"updated": True}))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(
        hass, SIGNAL_DATA_UPDATED, forward
    )
    connection.send_result(msg["id"])
