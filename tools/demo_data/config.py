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
