"""
Core generation logic.

Produces community-structured Atlas data that looks like a genuine CRM used
by one person over several years, rather than random noise.

Communities
-----------
tech        – engineers, researchers at big tech and AI labs
healthcare  – NHS clinicians, HealthTech companies
academia    – professors, PhD students, research fellows
biotech     – pharma/biotech scientists, medical devices
founders    – startup founders, early employees
vc          – venture capitalists, angels
consulting  – strategy consultants

People within the same community are more likely to know each other.
Events bridge communities: a Healthcare AI Summit draws tech + healthcare;
a Founders Forum draws founders + vc + tech.
"""
import random
from collections import defaultdict
from datetime import date, timedelta
from typing import Dict, List, Optional, Tuple

from faker import Faker

from .config import DatasetConfig, PROFILE_UUID, PROFILE_NAME, PROFILE_EMAIL
from .models import (
    Event, EventPerson, FollowUp, Person, PersonTag, Profile, Relationship, Tag,
)
from .templates import (
    COMMUNITY_COMPANIES, COMMUNITY_ROLES, COMPANY_EMAIL_DOMAINS,
    DEFAULT_EMAIL_DOMAIN, EVENT_TEMPLATES, EVENT_COMMUNITY_CROSSOVER,
    TAG_TEMPLATES, PERSON_NOTE_TEMPLATES, ENCOUNTER_NOTE_TEMPLATES,
    FOLLOW_UP_NOTE_TEMPLATES, TOPICS,
)
from .utils import (
    make_uuid, random_past_ts, slightly_after_ts, ts_near_date,
    random_past_date, random_future_date, weighted_sample_no_replace, slug,
)

# ---------------------------------------------------------------------------
# Community weights for person assignment
# ---------------------------------------------------------------------------
_COMMUNITIES = ["tech", "healthcare", "academia", "biotech", "founders", "vc", "consulting"]
_COMMUNITY_WEIGHTS = [0.25, 0.20, 0.20, 0.10, 0.10, 0.05, 0.10]

# Relationship type weights per community pair scenario
_REL_TYPES = ["works_with", "met_together", "friend", "introduced_by", "co_founder"]


class AtlasGenerator:
    def __init__(self, config: DatasetConfig, seed: int):
        self.config = config
        self.rng = random.Random(seed)
        self.faker = Faker("en_GB")
        self.faker.seed_instance(seed)

        self.owner_id = PROFILE_UUID

        # Populated in order during generate()
        self.profile: Optional[Profile] = None
        self.people: List[Person] = []
        self.events: List[Event] = []
        self.tags: List[Tag] = []
        self.follow_ups: List[FollowUp] = []
        self.event_people: List[EventPerson] = []
        self.person_tags: List[PersonTag] = []
        self.relationships: List[Relationship] = []

        # Internal indexes (not exported)
        self._person_community: List[str] = []
        self._event_community: List[str] = []
        self._person_id_to_idx: Dict[str, int] = {}

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def generate(self) -> dict:
        # Deterministic exported_at so --seed N always produces identical bytes.
        exported_at = random_past_ts(self.rng, max_days=1)

        self.profile = self._gen_profile()
        self.people = self._gen_people()
        self._person_id_to_idx = {p.id: i for i, p in enumerate(self.people)}
        self.events = self._gen_events()
        self.event_people = self._gen_event_links()
        self.tags = self._gen_tags()
        self.person_tags = self._gen_tag_links()
        self.relationships = self._gen_relationships()
        self.follow_ups = self._gen_follow_ups()
        return {
            "profile": self.profile,
            "people": self.people,
            "events": self.events,
            "tags": self.tags,
            "follow_ups": self.follow_ups,
            "event_people": self.event_people,
            "person_tags": self.person_tags,
            "relationships": self.relationships,
            "exported_at": exported_at,
        }

    # ------------------------------------------------------------------
    # Profile
    # ------------------------------------------------------------------

    def _gen_profile(self) -> Profile:
        ts = random_past_ts(self.rng, max_days=5 * 365)
        return Profile(
            id=PROFILE_UUID,
            full_name=PROFILE_NAME,
            avatar_url=None,
            created_at=ts,
            updated_at=ts,
        )

    # ------------------------------------------------------------------
    # People
    # ------------------------------------------------------------------

    def _gen_people(self) -> List[Person]:
        people = []
        for _ in range(self.config.people):
            community = self.rng.choices(_COMMUNITIES, weights=_COMMUNITY_WEIGHTS, k=1)[0]
            self._person_community.append(community)

            company = self.rng.choice(COMMUNITY_COMPANIES[community])
            role = self.rng.choice(COMMUNITY_ROLES[community])

            first = self.faker.first_name()
            last = self.faker.last_name()
            name = f"{first} {last}"

            domain = COMPANY_EMAIL_DOMAINS.get(company, DEFAULT_EMAIL_DOMAIN)
            email_local = f"{first.lower().replace(' ', '')}.{last.lower().replace(' ', '')}"
            email = f"{email_local}@{domain}" if self.rng.random() < 0.80 else None

            linkedin = (
                f"https://www.linkedin.com/in/{slug(first)}-{slug(last)}-{make_uuid(self.rng)[:8]}"
                if self.rng.random() < 0.70
                else None
            )
            phone = self.faker.phone_number() if self.rng.random() < 0.40 else None
            notes = self._gen_person_notes(community, role, company) if self.rng.random() < 0.55 else None

            created = random_past_ts(self.rng, max_days=5 * 365)
            updated = slightly_after_ts(self.rng, created, max_extra_days=90) if self.rng.random() < 0.4 else created

            people.append(Person(
                id=make_uuid(self.rng),
                owner_id=self.owner_id,
                name=name,
                company=company,
                role=role,
                linkedin_url=linkedin,
                email=email,
                phone=phone,
                notes=notes,
                created_at=created,
                updated_at=updated,
            ))
        return people

    def _gen_person_notes(self, community: str, role: str, company: str) -> str:
        template = self.rng.choice(PERSON_NOTE_TEMPLATES)
        topic = self.rng.choice(TOPICS)
        event_name = self.rng.choice(EVENT_TEMPLATES)["name"]
        return (
            template
            .replace("{event}", event_name)
            .replace("{topic}", topic)
            .replace("{company}", company)
            .replace("{community}", community.replace("_", " "))
            .replace("{intro_person}", self.faker.name())
        )

    # ------------------------------------------------------------------
    # Events
    # ------------------------------------------------------------------

    def _gen_events(self) -> List[Event]:
        events = []
        n = self.config.events
        pool = list(EVENT_TEMPLATES)

        # For large datasets, generate year-labelled repeats of the same events
        if n > len(pool):
            expanded = list(pool)
            years = list(range(2021, 2027))
            for tmpl in pool:
                for year in years:
                    expanded.append({**tmpl, "name": f"{tmpl['name']} {year}"})
            pool = expanded

        # Shuffle deterministically and pick n
        self.rng.shuffle(pool)
        selected = pool[:n] if n <= len(pool) else pool * (n // len(pool) + 1)
        selected = selected[:n]

        for tmpl in selected:
            community = tmpl.get("community", self.rng.choice(_COMMUNITIES))
            self._event_community.append(community)

            event_date = random_past_date(self.rng, max_days=5 * 365)
            created = ts_near_date(self.rng, event_date)
            updated = slightly_after_ts(self.rng, created, max_extra_days=30) if self.rng.random() < 0.2 else created

            events.append(Event(
                id=make_uuid(self.rng),
                owner_id=self.owner_id,
                name=tmpl["name"],
                event_date=event_date,
                location=tmpl.get("location"),
                description=tmpl.get("description"),
                created_at=created,
                updated_at=updated,
            ))
        return events

    # ------------------------------------------------------------------
    # Event links (event_people)
    # ------------------------------------------------------------------

    def _gen_event_links(self) -> List[EventPerson]:
        if not self.events or not self.people:
            return []

        target = self.config.event_links
        per_event = max(1, target // len(self.events))
        seen: set = set()
        links: List[EventPerson] = []

        for i, event in enumerate(self.events):
            ec = self._event_community[i]
            related = EVENT_COMMUNITY_CROSSOVER.get(ec, [])

            # Build per-person weights
            weights = []
            for j, _ in enumerate(self.people):
                pc = self._person_community[j]
                if pc == ec:
                    weights.append(12)
                elif pc in related:
                    weights.append(4)
                else:
                    weights.append(1)

            n_attend = min(per_event, len(self.people))
            attendee_idxs = weighted_sample_no_replace(
                self.rng, list(range(len(self.people))), weights, n_attend
            )

            for j in attendee_idxs:
                key = (event.id, self.people[j].id)
                if key in seen:
                    continue
                seen.add(key)
                note = self._gen_encounter_note() if self.rng.random() < 0.30 else None
                links.append(EventPerson(
                    event_id=event.id,
                    person_id=self.people[j].id,
                    owner_id=self.owner_id,
                    encounter_note=note,
                    created_at=ts_near_date(self.rng, event.event_date),
                ))

            if len(links) >= target:
                break

        # Top-up if short (due to deduplication)
        if len(links) < target:
            remaining = list({
                (i, j)
                for i in range(len(self.events))
                for j in range(len(self.people))
                if (self.events[i].id, self.people[j].id) not in seen
            })
            self.rng.shuffle(remaining)
            for i, j in remaining:
                if len(links) >= target:
                    break
                key = (self.events[i].id, self.people[j].id)
                seen.add(key)
                links.append(EventPerson(
                    event_id=self.events[i].id,
                    person_id=self.people[j].id,
                    owner_id=self.owner_id,
                    encounter_note=None,
                    created_at=ts_near_date(self.rng, self.events[i].event_date),
                ))

        return links

    def _gen_encounter_note(self) -> str:
        template = self.rng.choice(ENCOUNTER_NOTE_TEMPLATES)
        topic = self.rng.choice(TOPICS)
        return (
            template
            .replace("{topic}", topic)
            .replace("{intro_person}", self.faker.name())
        )

    # ------------------------------------------------------------------
    # Tags
    # ------------------------------------------------------------------

    def _gen_tags(self) -> List[Tag]:
        n = self.config.tags
        pool = list(TAG_TEMPLATES)
        self.rng.shuffle(pool)
        selected = pool[:n]

        tags = []
        for name, color in selected:
            ts = random_past_ts(self.rng, max_days=5 * 365)
            tags.append(Tag(
                id=make_uuid(self.rng),
                owner_id=self.owner_id,
                name=name,
                color=color,
                created_at=ts,
            ))
        return tags

    # ------------------------------------------------------------------
    # Tag links (person_tags)
    # ------------------------------------------------------------------

    def _gen_tag_links(self) -> List[PersonTag]:
        if not self.tags or not self.people:
            return []

        target = self.config.tag_links
        seen: set = set()
        links: List[PersonTag] = []

        # Build a mapping: tag name → likely community
        community_tag_keywords: Dict[str, List[str]] = {
            "tech": ["AI", "Machine Learning", "NLP", "Computer Vision", "Data Science",
                     "Reinforcement Learning", "Open Source", "CTO", "CPO"],
            "healthcare": ["NHS", "Clinician", "GP", "Surgeon", "Cardiology", "Radiology",
                           "Oncology", "Neurology", "Psychiatry", "Paediatrics",
                           "Emergency Medicine", "Primary Care", "Secondary Care",
                           "Tertiary Care", "Ophthalmology", "Renal", "Respiratory",
                           "Diabetes", "Neurosurgery", "Transplant", "Intensive Care",
                           "Mental Health", "Public Health", "Healthcare", "Digital Health",
                           "Medtech", "Medical Devices", "Wearables", "Remote Monitoring"],
            "academia": ["Professor", "PhD Student", "Medical Student", "Researcher",
                         "Publication", "Grant Funding", "Alumni"],
            "biotech": ["Biotech", "Genomics", "Drug Discovery", "Clinical Trials",
                        "Regulatory Affairs", "Bioinformatics", "Precision Medicine",
                        "Longevity", "Healthspan", "Patent"],
            "founders": ["Founder", "Entrepreneur", "Startup", "CTO", "CMO"],
            "vc": ["Investor", "Venture Capital", "Angel Investor", "Board Member",
                   "Non-Exec Director", "Trustee"],
            "consulting": ["Strategy", "Consulting", "Advisor", "Mentor"],
        }

        def tag_weight_for_person(tag_name: str, person_idx: int) -> int:
            pc = self._person_community[person_idx]
            keywords = community_tag_keywords.get(pc, [])
            for kw in keywords:
                if kw.lower() in tag_name.lower() or tag_name.lower() in kw.lower():
                    return 8
            return 1

        # Clamp target to max possible unique combinations
        max_possible = len(self.people) * len(self.tags)
        actual_target = min(target, max_possible)

        # Pre-compute weights per tag (reused for top-up)
        tag_weights = []
        for tag in self.tags:
            w = [tag_weight_for_person(tag.name, j) for j in range(len(self.people))]
            tag_weights.append(w)

        # Main pass: distribute evenly across tags
        n_links_per_tag = max(1, actual_target // len(self.tags))
        for t_idx, tag in enumerate(self.tags):
            idxs = weighted_sample_no_replace(
                self.rng, list(range(len(self.people))), tag_weights[t_idx], n_links_per_tag
            )
            for j in idxs:
                key = (self.people[j].id, tag.id)
                if key not in seen:
                    seen.add(key)
                    links.append(PersonTag(
                        person_id=self.people[j].id,
                        tag_id=tag.id,
                        owner_id=self.owner_id,
                    ))
            if len(links) >= actual_target:
                return links

        # Top-up pass: cycle through tags until we hit the target
        t_idx = 0
        attempts = 0
        max_attempts = (actual_target - len(links)) * 20
        while len(links) < actual_target and attempts < max_attempts:
            tag = self.tags[t_idx % len(self.tags)]
            t_idx += 1
            attempts += 1
            j = self.rng.choices(range(len(self.people)), weights=tag_weights[t_idx % len(self.tags)], k=1)[0]
            key = (self.people[j].id, tag.id)
            if key not in seen:
                seen.add(key)
                links.append(PersonTag(
                    person_id=self.people[j].id,
                    tag_id=tag.id,
                    owner_id=self.owner_id,
                ))

        return links

    # ------------------------------------------------------------------
    # Relationships
    # ------------------------------------------------------------------

    def _gen_relationships(self) -> List[Relationship]:
        target = self.config.relationships
        if len(self.people) < 2 or target == 0:
            return []

        rel_set: set = set()   # frozenset of (person_a_idx, person_b_idx)
        rels: List[Relationship] = []

        # Build auxiliary indexes
        event_attendees: Dict[str, List[int]] = defaultdict(list)
        for ep in self.event_people:
            idx = self._person_id_to_idx.get(ep.person_id)
            if idx is not None:
                event_attendees[ep.event_id].append(idx)

        company_people: Dict[str, List[int]] = defaultdict(list)
        for i, p in enumerate(self.people):
            if p.company:
                company_people[p.company].append(i)

        community_people: Dict[str, List[int]] = defaultdict(list)
        for i, comm in enumerate(self._person_community):
            community_people[comm].append(i)

        def add_rel(ai: int, bi: int, rel_type: str) -> bool:
            key = (min(ai, bi), max(ai, bi))
            if key in rel_set:
                return False
            rel_set.add(key)
            pa, pb = self.people[ai], self.people[bi]
            rels.append(Relationship(
                id=make_uuid(self.rng),
                owner_id=self.owner_id,
                person_a=pa.id,
                person_b=pb.id,
                type=rel_type,
                created_at=random_past_ts(self.rng, max_days=5 * 365),
            ))
            return True

        # --- Phase 1: co-event pairs → met_together (40 % of target) -------
        quota1 = int(target * 0.40)
        event_ids = list(event_attendees.keys())
        self.rng.shuffle(event_ids)
        for eid in event_ids:
            attendees = event_attendees[eid]
            if len(attendees) < 2:
                continue
            pairs = [
                (attendees[x], attendees[y])
                for x in range(len(attendees))
                for y in range(x + 1, len(attendees))
            ]
            self.rng.shuffle(pairs)
            for ai, bi in pairs:
                if len(rels) >= quota1:
                    break
                add_rel(ai, bi, "met_together")
            if len(rels) >= quota1:
                break

        # --- Phase 2: same-company → works_with / co_founder (30 %) --------
        quota2 = int(target * 0.70)
        companies = list(company_people.keys())
        self.rng.shuffle(companies)
        for company in companies:
            members = company_people[company]
            if len(members) < 2:
                continue
            tries = min(len(members) * 3, 200)
            for _ in range(tries):
                if len(rels) >= quota2:
                    break
                ai, bi = self.rng.sample(members, 2)
                # Founders at the same company → co_founder; everyone else → works_with
                comm = self._person_community[ai]
                rt = "co_founder" if comm == "founders" and self.rng.random() < 0.5 else "works_with"
                add_rel(ai, bi, rt)
            if len(rels) >= quota2:
                break

        # --- Phase 3: same-community pairs (20 %) ---------------------------
        quota3 = int(target * 0.90)
        comms = list(community_people.keys())
        self.rng.shuffle(comms)
        for comm in comms:
            members = community_people[comm]
            if len(members) < 2:
                continue
            tries = min(len(members) * 3, 500)
            for _ in range(tries):
                if len(rels) >= quota3:
                    break
                ai, bi = self.rng.sample(members, 2)
                rt = self._community_rel_type(comm, ai, bi)
                add_rel(ai, bi, rt)
            if len(rels) >= quota3:
                break

        # --- Phase 4: random fill-up ----------------------------------------
        all_idxs = list(range(len(self.people)))
        for _ in range((target - len(rels)) * 10):
            if len(rels) >= target:
                break
            ai, bi = self.rng.sample(all_idxs, 2)
            rt = self.rng.choice(["met_together", "friend", "introduced_by"])
            add_rel(ai, bi, rt)

        return rels

    def _community_rel_type(self, comm: str, ai: int, bi: int) -> str:
        comm_b = self._person_community[bi]
        # Founder + VC → introduced_by
        if {comm, comm_b} == {"founders", "vc"}:
            return "introduced_by"
        # Academia → friends or collaborators
        if "academia" in (comm, comm_b):
            return self.rng.choice(["friend", "met_together", "introduced_by"])
        # Same consulting firm → works_with
        if comm == "consulting":
            return "works_with"
        return self.rng.choice(["met_together", "friend", "introduced_by"])

    # ------------------------------------------------------------------
    # Follow-ups
    # ------------------------------------------------------------------

    def _gen_follow_ups(self) -> List[FollowUp]:
        follow_ups = []
        today = date.today()

        for _ in range(self.config.follow_ups):
            person = self.rng.choice(self.people)

            r = self.rng.random()
            if r < 0.35:
                # Completed in the past
                status = "done"
                days_ago = self.rng.randint(7, 730)
                due_date = today - timedelta(days=days_ago)
                completed_date = due_date + timedelta(days=self.rng.randint(0, 7))
                completed_at = (
                    f"{completed_date.isoformat()}T"
                    f"{self.rng.randint(9,18):02d}:{self.rng.randint(0,59):02d}:00.000Z"
                )
            elif r < 0.55:
                # Upcoming (pending)
                status = "pending"
                days_ahead = self.rng.randint(3, 90)
                due_date = today + timedelta(days=days_ahead)
                completed_at = None
            elif r < 0.70:
                # Overdue (pending, due in the past)
                status = "pending"
                days_ago = self.rng.randint(1, 60)
                due_date = today - timedelta(days=days_ago)
                completed_at = None
            elif r < 0.80:
                # Snoozed
                status = "snoozed"
                days_ahead = self.rng.randint(14, 180)
                due_date = today + timedelta(days=days_ahead)
                completed_at = None
            else:
                # Due today or very soon
                status = "pending"
                days_ahead = self.rng.randint(0, 3)
                due_date = today + timedelta(days=days_ahead)
                completed_at = None

            created = random_past_ts(self.rng, max_days=365)
            note = self._gen_follow_up_note()

            follow_ups.append(FollowUp(
                id=make_uuid(self.rng),
                owner_id=self.owner_id,
                person_id=person.id,
                due_date=due_date.strftime("%Y-%m-%d"),
                note=note,
                status=status,
                completed_at=completed_at,
                created_at=created,
                updated_at=created,
            ))

        return follow_ups

    def _gen_follow_up_note(self) -> str:
        template = self.rng.choice(FOLLOW_UP_NOTE_TEMPLATES)
        topic = self.rng.choice(TOPICS)
        event_name = self.rng.choice(EVENT_TEMPLATES)["name"]
        community = self.rng.choice(_COMMUNITIES)
        company_list = COMMUNITY_COMPANIES.get(community, ["the company"])
        company = self.rng.choice(company_list)
        return (
            template
            .replace("{topic}", topic)
            .replace("{event}", event_name)
            .replace("{company}", company)
            .replace("{community}", community)
            .replace("{contact}", self.faker.name())
        )
