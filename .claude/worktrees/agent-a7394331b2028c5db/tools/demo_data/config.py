from dataclasses import dataclass
from typing import Dict


@dataclass
class DatasetConfig:
    people: int
    events: int
    event_links: int
    tags: int
    tag_links: int
    follow_ups: int
    relationships: int
    # Optional knobs used by the "demo" showcase preset. Existing presets
    # keep their original (wide, exponential-biased) date ranges by leaving
    # these at their defaults.
    history_days: int = 5 * 365
    event_days: int = 5 * 365
    showcase: bool = False


DATASET_SIZES: Dict[str, DatasetConfig] = {
    "small": DatasetConfig(
        people=30,
        events=8,
        event_links=70,
        tags=12,
        tag_links=55,
        follow_ups=20,
        relationships=30,
    ),
    "demo": DatasetConfig(
        people=40,
        events=10,
        event_links=100,
        tags=20,
        tag_links=65,
        follow_ups=35,
        relationships=80,
        # Everything created within the last ~9 months, events within the
        # last ~12 months, evenly spread (not exponentially clustered) so
        # the product demo reads as a realistic, recently-active CRM.
        history_days=270,
        event_days=365,
        showcase=True,
    ),
    "medium": DatasetConfig(
        people=350,
        events=75,
        event_links=900,
        tags=45,
        tag_links=800,
        follow_ups=280,
        relationships=400,
    ),
    "large": DatasetConfig(
        people=2500,
        events=500,
        event_links=7500,
        tags=80,
        tag_links=6500,
        follow_ups=2000,
        relationships=3500,
    ),
}

PROFILE_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
PROFILE_NAME = "Demo User"
PROFILE_EMAIL = "demo@atlas.local"

ATLAS_VERSION = "2.0"
SCHEMA_VERSION = "1"
