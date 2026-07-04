"""
Serialise the generated dataset into the Atlas backup JSON format.
"""
import json
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from .config import ATLAS_VERSION, PROFILE_EMAIL, SCHEMA_VERSION
from .models import (
    Event, EventPerson, FollowUp, Person, PersonTag, Profile, Relationship, Tag,
)


def _clean(d: Dict[str, Any]) -> Dict[str, Any]:
    """Remove internal-only keys that don't belong in the export."""
    return {k: v for k, v in d.items() if not k.startswith("_")}


def build_backup(
    profile: Profile,
    people: list,
    events: list,
    tags: list,
    follow_ups: list,
    event_people: list,
    person_tags: list,
    relationships: list,
    exported_at: Optional[str] = None,
) -> Dict[str, Any]:
    """Assemble the full Atlas backup structure."""
    if exported_at is None:
        exported_at = datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + "000Z"

    return {
        "meta": {
            "schema_version": SCHEMA_VERSION,
            "atlas_version": ATLAS_VERSION,
            "export_type": "full_backup",
            "exported_at": exported_at,
            "email": PROFILE_EMAIL,
        },
        "profile": asdict(profile),
        "people": [asdict(p) for p in people],
        "events": [asdict(e) for e in events],
        "tags": [asdict(t) for t in tags],
        "follow_ups": [asdict(f) for f in follow_ups],
        "event_people": [asdict(ep) for ep in event_people],
        "person_tags": [asdict(pt) for pt in person_tags],
        "relationships": [asdict(r) for r in relationships],
    }


def write_json(backup: Dict[str, Any], path: str) -> None:
    """Write the backup dict to a JSON file with nice formatting."""
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(backup, fh, indent=2, ensure_ascii=False)
