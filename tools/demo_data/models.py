from dataclasses import dataclass
from typing import Optional


@dataclass
class Profile:
    id: str
    full_name: str
    avatar_url: Optional[str]
    created_at: str
    updated_at: str


@dataclass
class Person:
    id: str
    owner_id: str
    name: str
    company: Optional[str]
    role: Optional[str]
    linkedin_url: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str


@dataclass
class Event:
    id: str
    owner_id: str
    name: str
    event_date: Optional[str]
    location: Optional[str]
    description: Optional[str]
    created_at: str
    updated_at: str


@dataclass
class Tag:
    id: str
    owner_id: str
    name: str
    color: Optional[str]
    created_at: str


@dataclass
class FollowUp:
    id: str
    owner_id: str
    person_id: str
    due_date: str
    note: Optional[str]
    status: str  # pending | done | snoozed
    completed_at: Optional[str]
    created_at: str
    updated_at: str


@dataclass
class EventPerson:
    event_id: str
    person_id: str
    owner_id: str
    encounter_note: Optional[str]
    created_at: str


@dataclass
class PersonTag:
    person_id: str
    tag_id: str
    owner_id: str


@dataclass
class Relationship:
    id: str
    owner_id: str
    person_a: str
    person_b: str
    type: str  # met_together | introduced_by | works_with | co_founder | friend
    created_at: str
