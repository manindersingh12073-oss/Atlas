# Atlas Demo Data Generator

Generates realistic Atlas backup files importable via Atlas Restore.
Produces community-structured professional networks that look like a genuine
CRM used by one person over several years.

---

## Installation

From the repo root, install Python dependencies:

```bash
pip install -r requirements-demo.txt
```

Python 3.9+ is required.

---

## Generating datasets

```bash
# Small (30 people, 8 events)
python tools/generate_demo_data.py --size small

# Medium (350 people, 75 events)
python tools/generate_demo_data.py --size medium

# Large (2500 people, 500 events)
python tools/generate_demo_data.py --size large
```

Output files are written to `demo-data/`:

| Command        | Output file                    |
|----------------|-------------------------------|
| `--size small` | `demo-data/atlas-demo-small.json` |
| `--size medium`| `demo-data/atlas-demo-medium.json`|
| `--size large` | `demo-data/atlas-demo-large.json` |

### Reproducible output

Pass `--seed` to get identical output on every run:

```bash
python tools/generate_demo_data.py --size medium --seed 42
```

Without `--seed`, a random seed is used each time.

### Custom output directory

```bash
python tools/generate_demo_data.py --size large --seed 42 --output /tmp/atlas-exports/
```

---

## Importing into Atlas

1. Open Atlas → Settings → Restore Backup
2. Upload the generated `.json` file
3. Atlas validates and imports all data

The generated files pass Atlas's full validation:
- All UUIDs are valid
- All foreign keys resolve within the backup
- No duplicate junction pairs
- Required fields are always populated

---

## Dataset sizes

Sizes are configured in [`config.py`](config.py):

| Size   | People | Events | Event links | Tags | Tag links | Follow-ups | Relationships |
|--------|--------|--------|-------------|------|-----------|------------|---------------|
| small  | 30     | 8      | 70          | 12   | 55        | 20         | 30            |
| medium | 350    | 75     | 900         | 45   | 800       | 280        | 400           |
| large  | 2500   | 500    | 7500        | 80   | 6500      | 2000       | 3500          |

To add a custom size, edit `DATASET_SIZES` in `config.py`:

```python
DATASET_SIZES["xlarge"] = DatasetConfig(
    people=10000,
    events=2000,
    event_links=30000,
    tags=100,
    tag_links=25000,
    follow_ups=8000,
    relationships=15000,
)
```

---

## Adding companies

Open [`templates.py`](templates.py) and add entries to the relevant
`COMMUNITY_COMPANIES` list:

```python
COMMUNITY_COMPANIES["tech"].append("New AI Startup")
COMMUNITY_COMPANIES["healthcare"].append("New NHS Trust")
```

If the company has a known email domain, add it to `COMPANY_EMAIL_DOMAINS`:

```python
COMPANY_EMAIL_DOMAINS["New AI Startup"] = "newai.io"
```

---

## Adding event templates

Add a dict to `EVENT_TEMPLATES` in [`templates.py`](templates.py):

```python
{
    "name": "Global Health Innovation Summit",
    "community": "healthcare",    # primary community of attendees
    "location": "Geneva",
    "description": "WHO-convened summit on global health innovation.",
},
```

The `community` field controls which people are most likely to attend.
Valid values: `tech`, `healthcare`, `academia`, `biotech`, `founders`, `vc`, `consulting`.

For large datasets the generator also creates year-suffixed variants
(`Healthcare AI Summit 2022`, `Healthcare AI Summit 2023`, etc.) to fill
the required event count.

---

## Adding tags

Add a `(name, hex_color)` tuple to `TAG_TEMPLATES` in [`templates.py`](templates.py):

```python
TAG_TEMPLATES.append(("Telemedicine", "#0EA5E9"))
```

---

## Adding relationship templates

Relationship types are fixed by the Atlas schema:

| Type            | Meaning                                |
|-----------------|----------------------------------------|
| `works_with`    | Colleagues                             |
| `met_together`  | Met at an event                        |
| `friend`        | Personal connection                    |
| `introduced_by` | One person introduced by the other     |
| `co_founder`    | Co-founded a company together          |

Community-to-relationship-type mapping lives in `_community_rel_type()` in
[`generator.py`](generator.py). Edit that method to change how communities
influence relationship types.

---

## Module structure

| File            | Responsibility                                          |
|-----------------|---------------------------------------------------------|
| `config.py`     | Dataset size definitions, profile constants             |
| `models.py`     | Dataclasses for every entity (Profile, Person, …)       |
| `templates.py`  | Companies, roles, events, tags, note templates          |
| `utils.py`      | UUID generation, timestamp helpers, weighted sampling   |
| `generator.py`  | Community-structured generation logic                   |
| `exporters.py`  | Serialise dataclasses → Atlas backup JSON               |

The entry point is `tools/generate_demo_data.py`.
