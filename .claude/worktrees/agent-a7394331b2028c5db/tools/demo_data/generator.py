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
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
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
    make_uuid, random_past_ts, random_past_ts_uniform, slightly_after_ts,
    ts_near_date, random_past_date, random_future_date,
    weighted_sample_no_replace, slug,
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
        self._apply_demo_showcase()
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
    # Shared date helper
    # ------------------------------------------------------------------

    def _past_ts(self, max_days: int) -> str:
        """
        Pick a past timestamp. The "demo" showcase preset uses a uniform
        distribution (evenly spread, no pile-up at the cap) so a short
        history_days window still looks varied; other presets keep the
        original exponential-recency-biased distribution.
        """
        if self.config.showcase:
            return random_past_ts_uniform(self.rng, max_days)
        return random_past_ts(self.rng, max_days)

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
            note_chance = 0.85 if self.config.showcase else 0.55
            notes = self._gen_person_notes(community, role, company) if self.rng.random() < note_chance else None

            created = self._past_ts(self.config.history_days)
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
        def render(template: str) -> str:
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

        template = self.rng.choice(PERSON_NOTE_TEMPLATES)
        text = render(template)

        # The "demo" showcase preset wants richer, multi-sentence notes so
        # the person-detail view reads as genuinely populated rather than
        # single generic lines. Stitch a second, distinct template on.
        if self.config.showcase:
            remaining = [t for t in PERSON_NOTE_TEMPLATES if t != template]
            template2 = self.rng.choice(remaining)
            text = f"{text} {render(template2)}"

        return text

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

        # The "demo" showcase preset spreads events evenly (with jitter)
        # across event_days instead of the exponential-recency distribution,
        # which otherwise piles many events onto the same capped date when
        # event_days is small. This gives realistic "spread over the last
        # ~12 months" conference dates.
        even_days_ago: List[int] = []
        if self.config.showcase and len(selected) > 0:
            even_days_ago = [
                int(self.config.event_days * (i + 1) / (len(selected) + 1))
                for i in range(len(selected))
            ]
            self.rng.shuffle(even_days_ago)

        for i, tmpl in enumerate(selected):
            community = tmpl.get("community", self.rng.choice(_COMMUNITIES))
            self._event_community.append(community)

            if self.config.showcase:
                days_ago = max(1, even_days_ago[i] + self.rng.randint(-12, 12))
                days_ago = min(days_ago, self.config.event_days)
                event_date = (date.today() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            else:
                event_date = random_past_date(self.rng, max_days=self.config.event_days)
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

    # Tag names the "demo" showcase preset guarantees are present so the
    # hub character and thematic domains (Healthcare, AI, Startups,
    # Investors, Research, Consulting) always have something to attach to.
    _SHOWCASE_PRIORITY_TAGS = [
        "Founder", "AI", "Healthcare", "Startup", "Digital Health",
        "Investor", "Venture Capital", "Clinician", "NHS", "Researcher",
        "Professor", "Consulting",
    ]

    def _gen_tags(self) -> List[Tag]:
        n = self.config.tags
        pool = list(TAG_TEMPLATES)

        if self.config.showcase:
            forced = [t for t in pool if t[0] in self._SHOWCASE_PRIORITY_TAGS]
            rest = [t for t in pool if t[0] not in self._SHOWCASE_PRIORITY_TAGS]
            self.rng.shuffle(rest)
            selected = (forced + rest)[:n]
        else:
            self.rng.shuffle(pool)
            selected = pool[:n]

        tags = []
        for name, color in selected:
            ts = self._past_ts(self.config.history_days)
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
                created_at=self._past_ts(self.config.history_days),
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

            created = self._past_ts(min(365, self.config.history_days))
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

    # ------------------------------------------------------------------
    # Demo showcase curation (only runs when config.showcase is True)
    # ------------------------------------------------------------------
    #
    # Everything above produces a plausible *random* community-structured
    # network. The "demo" preset additionally needs a few very specific,
    # guaranteed properties for the product demo (a clear hub character,
    # bridge people connecting communities, guaranteed relationship-type
    # variety, a shared-company cluster, etc). Rather than trying to bias
    # the probabilistic generation to *maybe* produce these, we curate them
    # deterministically as a post-processing pass, being careful to only
    # ever add/rename rows (never touch IDs in a way that would dangle a
    # foreign key) so every validateBackup() invariant keeps holding.

    def _add_relationship(self, a_id: str, b_id: str, rel_type: str) -> bool:
        if a_id == b_id:
            return False
        pairs = {frozenset((r.person_a, r.person_b)) for r in self.relationships}
        if frozenset((a_id, b_id)) in pairs:
            return False
        self.relationships.append(Relationship(
            id=make_uuid(self.rng),
            owner_id=self.owner_id,
            person_a=a_id,
            person_b=b_id,
            type=rel_type,
            created_at=self._past_ts(self.config.history_days),
        ))
        return True

    def _add_event_link(self, event_id: str, person_id: str, note: Optional[str] = None) -> bool:
        if any(ep.event_id == event_id and ep.person_id == person_id for ep in self.event_people):
            return False
        event = next((e for e in self.events if e.id == event_id), None)
        if event is None:
            return False
        self.event_people.append(EventPerson(
            event_id=event_id,
            person_id=person_id,
            owner_id=self.owner_id,
            encounter_note=note,
            created_at=ts_near_date(self.rng, event.event_date),
        ))
        return True

    def _add_tag_link(self, person_id: str, tag_id: str) -> bool:
        if any(pt.person_id == person_id and pt.tag_id == tag_id for pt in self.person_tags):
            return False
        self.person_tags.append(PersonTag(person_id=person_id, tag_id=tag_id, owner_id=self.owner_id))
        return True

    def _apply_demo_showcase(self) -> None:
        if not self.config.showcase or not self.people:
            return

        all_rel_types = ["met_together", "introduced_by", "works_with", "co_founder", "friend"]

        # --- 0. Avoid a second random "Sarah" diluting the single hub signal --
        for p in self.people[1:]:
            first, _, last = p.name.partition(" ")
            if first != "Sarah":
                continue
            new_first = self.faker.first_name()
            while new_first == "Sarah":
                new_first = self.faker.first_name()
            old_local = f"{first.lower()}.{last.lower().replace(' ', '')}"
            if p.email and p.email.startswith(old_local + "@"):
                domain = p.email.split("@", 1)[1]
                p.email = f"{new_first.lower()}.{last.lower().replace(' ', '')}@{domain}"
            p.name = f"{new_first} {last}"

        # --- 1. Turn person[0] into "Sarah", the hub founder -----------------
        sarah = self.people[0]
        sarah_id = sarah.id
        self._person_community[0] = "founders"

        established_days_ago = int(self.config.history_days * 0.85)
        created_dt = datetime.now(timezone.utc) - timedelta(
            days=established_days_ago, hours=self.rng.randint(0, 23)
        )
        sarah_created = created_dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{self.rng.randint(0, 999):03d}Z"

        sarah.name = "Sarah Okafor"
        sarah.company = "Meridian AI Health"
        sarah.role = "Founder & CEO"
        sarah.email = "sarah.okafor@meridianaihealth.com"
        sarah.linkedin_url = f"https://www.linkedin.com/in/sarah-okafor-{make_uuid(self.rng)[:8]}"
        sarah.phone = self.faker.phone_number()
        sarah.notes = (
            "Founder and CEO of Meridian AI Health, building an AI-assisted triage and "
            "diagnostic-support platform already live in three NHS trusts. Trained and "
            "practised as a clinician before moving into health tech, so she straddles "
            "both worlds fluently and is exceptionally well connected across the NHS, "
            "the AI research community, and the London health-investor scene. Gave the "
            "closing keynote on federated learning for diagnostics at the Healthcare AI "
            "Summit — very likely the single best-connected person in this network, and "
            "worth introducing to almost everyone else here."
        )
        sarah.created_at = sarah_created
        sarah.updated_at = slightly_after_ts(self.rng, sarah_created, max_extra_days=45)

        # --- 2. Shared company: give Sarah a small founding team --------------
        team_candidates = [i for i in range(1, len(self.people))]
        self.rng.shuffle(team_candidates)
        team_roles = [
            ("Co-Founder & CTO", "co_founder"),
            ("Head of Clinical Affairs", "works_with"),
            ("VP Business Development", "works_with"),
        ]
        teammates: List[Tuple[Person, str]] = []
        for (role, rel_type), idx in zip(team_roles, team_candidates):
            person = self.people[idx]
            person.company = "Meridian AI Health"
            person.role = role
            self._person_community[idx] = "founders"
            teammates.append((person, rel_type))

        for person, rel_type in teammates:
            self._add_relationship(sarah_id, person.id, rel_type)
        if len(teammates) >= 3:
            # Interesting relationship chain: Sarah co_founder-> CTO,
            # CTO works_with -> biz-dev lead.
            self._add_relationship(teammates[1][0].id, teammates[2][0].id, "works_with")
        if teammates:
            cto = teammates[0][0]
            cto.notes = (
                f"Co-founder and CTO of Meridian AI Health, joined Sarah Okafor to lead "
                f"the engineering team after they met while both working on clinical "
                f"machine learning. Deep expertise in federated learning and NHS data "
                f"governance — the two of them are effectively inseparable at industry events."
            )

        # --- 3. Bridge people spanning two communities ------------------------
        healthcare_idxs = [
            i for i in range(len(self.people))
            if self._person_community[i] == "healthcare" and i != 0
        ]
        tech_events = [e for e, c in zip(self.events, self._event_community) if c == "tech"]
        if healthcare_idxs and tech_events:
            bridge_a = self.people[healthcare_idxs[0]]
            event = tech_events[0]
            self._add_event_link(
                event.id, bridge_a.id,
                note="Struck up a conversation about AI in diagnostics with a table of ML "
                     "researchers — more relevant to clinical work than expected.",
            )
            role_txt = bridge_a.role if bridge_a.role else "Clinician"
            bridge_a.notes = (
                f"{role_txt} at {bridge_a.company}, but spends a surprising amount of spare "
                f"time at AI conferences trying to bring clinical rigour to diagnostic AI "
                f"startups. Met at {event.name} — one of the few clinicians who can hold "
                f"their own in a room full of machine learning engineers."
            )

        academia_idxs = [
            i for i in range(len(self.people))
            if self._person_community[i] == "academia" and i != 0
        ]
        vc_idxs = [
            i for i in range(len(self.people))
            if self._person_community[i] == "vc" and i != 0
        ]
        if academia_idxs and vc_idxs:
            bridge_b = self.people[academia_idxs[0]]
            vc_person = self.people[vc_idxs[0]]
            self._add_relationship(bridge_b.id, vc_person.id, "introduced_by")
            role_txt = bridge_b.role or "Researcher"
            bridge_b.notes = (
                f"{role_txt} at {bridge_b.company}, researching precision medicine. "
                f"Increasingly spends time advising early-stage biotech investors on the "
                f"science behind their deals — introduced to {vc_person.name} at "
                f"{vc_person.company} after a diligence call turned into a standing "
                f"advisory arrangement."
            )

        # --- 4. Guarantee every relationship type appears at least once ------
        present_types = {r.type for r in self.relationships}
        missing_types = [t for t in all_rel_types if t not in present_types]
        all_idxs = list(range(len(self.people)))
        for rel_type in missing_types:
            for _ in range(30):
                ai, bi = self.rng.sample(all_idxs, 2)
                if self._add_relationship(self.people[ai].id, self.people[bi].id, rel_type):
                    break

        # --- 5. Sarah: thematic tags + a guaranteed outstanding follow-up -----
        for tag in self.tags:
            if tag.name in self._SHOWCASE_PRIORITY_TAGS[:6]:
                self._add_tag_link(sarah_id, tag.id)

        today = date.today()
        due = today + timedelta(days=self.rng.randint(5, 14))
        self.follow_ups.append(FollowUp(
            id=make_uuid(self.rng),
            owner_id=self.owner_id,
            person_id=sarah_id,
            due_date=due.strftime("%Y-%m-%d"),
            note="Send warm intro to Balderton Capital for Meridian's Series A raise",
            status="pending",
            completed_at=None,
            created_at=self._past_ts(min(30, self.config.history_days)),
            updated_at=self._past_ts(min(30, self.config.history_days)),
        ))

        # --- 6. Boost Sarah to be the most-connected node in the graph --------
        self._make_sarah_most_connected(sarah_id)

    def _make_sarah_most_connected(self, sarah_id: str) -> None:
        """
        Grow (and, if truly necessary, lightly trim rivals') event/relationship
        counts so Sarah strictly leads the whole dataset on both event links
        and relationships — the "highly connected founder" hub of the graph.
        """
        def event_degrees() -> Counter:
            return Counter(ep.person_id for ep in self.event_people)

        def rel_degrees() -> Counter:
            c: Counter = Counter()
            for r in self.relationships:
                c[r.person_a] += 1
                c[r.person_b] += 1
            return c

        # --- Event links ---
        event_deg = event_degrees()
        other_ids = [p.id for p in self.people if p.id != sarah_id]
        max_event_other = max((event_deg.get(pid, 0) for pid in other_ids), default=0)
        target_event_deg = min(len(self.events), max_event_other + 3)

        attended = {ep.event_id for ep in self.event_people if ep.person_id == sarah_id}
        candidates = [e for e in self.events if e.id not in attended]
        self.rng.shuffle(candidates)
        current = event_deg.get(sarah_id, 0)
        for e in candidates:
            if current >= target_event_deg:
                break
            note = self._gen_encounter_note() if self.rng.random() < 0.4 else None
            if self._add_event_link(e.id, sarah_id, note=note):
                current += 1

        # --- Relationships ---
        rel_deg = rel_degrees()
        max_rel_other = max((rel_deg.get(pid, 0) for pid in other_ids), default=0)
        target_rel_deg = min(len(self.people) - 1, max_rel_other + 5)

        connected_ids = {r.person_a for r in self.relationships if r.person_b == sarah_id}
        connected_ids |= {r.person_b for r in self.relationships if r.person_a == sarah_id}
        connected_ids.add(sarah_id)
        remaining_pool = [p for p in self.people if p.id not in connected_ids]
        self.rng.shuffle(remaining_pool)
        rel_type_cycle = ["works_with", "met_together", "friend", "introduced_by", "co_founder"]
        current_rel = sum(1 for r in self.relationships if sarah_id in (r.person_a, r.person_b))
        for i, p in enumerate(remaining_pool):
            if current_rel >= target_rel_deg:
                break
            if self._add_relationship(sarah_id, p.id, rel_type_cycle[i % len(rel_type_cycle)]):
                current_rel += 1

        # --- Final correction pass: guarantee strict dominance -----------------
        # (Handles the rare edge case where a rival was already at/near the cap.)
        for _ in range(len(self.people)):
            event_deg = event_degrees()
            sarah_events = event_deg.get(sarah_id, 0)
            rivals = [(pid, d) for pid, d in event_deg.items() if pid != sarah_id]
            if not rivals or max(d for _, d in rivals) < sarah_events:
                break
            worst_pid, worst_deg = max(rivals, key=lambda x: x[1])
            attended = {ep.event_id for ep in self.event_people if ep.person_id == sarah_id}
            grown = False
            for e in self.events:
                if e.id not in attended and self._add_event_link(e.id, sarah_id):
                    grown = True
                    break
            if grown:
                continue
            rival_links = [ep for ep in self.event_people if ep.person_id == worst_pid]
            if len(rival_links) > 1:
                self.event_people.remove(self.rng.choice(rival_links))
            else:
                break

        for _ in range(len(self.people)):
            rel_deg = rel_degrees()
            sarah_rels = rel_deg.get(sarah_id, 0)
            rivals = [(pid, d) for pid, d in rel_deg.items() if pid != sarah_id]
            if not rivals or max(d for _, d in rivals) < sarah_rels:
                break
            worst_pid, worst_deg = max(rivals, key=lambda x: x[1])
            connected_ids = {r.person_a for r in self.relationships if r.person_b == sarah_id}
            connected_ids |= {r.person_b for r in self.relationships if r.person_a == sarah_id}
            connected_ids.add(sarah_id)
            candidates = [p for p in self.people if p.id not in connected_ids]
            grown = False
            if candidates:
                p = self.rng.choice(candidates)
                rt = self.rng.choice(["works_with", "met_together", "friend", "introduced_by", "co_founder"])
                if self._add_relationship(sarah_id, p.id, rt):
                    grown = True
            if grown:
                continue
            rival_rels = [
                r for r in self.relationships
                if worst_pid in (r.person_a, r.person_b) and sarah_id not in (r.person_a, r.person_b)
            ]
            if rival_rels:
                self.relationships.remove(self.rng.choice(rival_rels))
            else:
                break
