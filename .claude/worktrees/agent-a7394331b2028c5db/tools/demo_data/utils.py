"""
Utility helpers: deterministic UUID generation, timestamp helpers.
"""
import random
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional


def make_uuid(rng: random.Random) -> str:
    """Generate a UUID4 using a seeded RNG so output is reproducible."""
    return str(uuid.UUID(int=rng.getrandbits(128), version=4))


def _reference_date() -> date:
    """Return today's date as the timeline anchor."""
    return date.today()


def random_past_ts(rng: random.Random, max_days: int = 5 * 365) -> str:
    """
    Return an ISO-8601 UTC timestamp biased toward recent dates.
    Uses exponential distribution with mean ~400 days, capped at max_days.
    """
    days_ago = min(int(rng.expovariate(1 / 400)), max_days)
    seconds_ago = days_ago * 86400 + rng.randint(0, 86399)
    dt = datetime.now(tz=timezone.utc) - timedelta(seconds=seconds_ago)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{rng.randint(0, 999):03d}Z"


def random_past_ts_uniform(rng: random.Random, max_days: int) -> str:
    """
    Return an ISO-8601 UTC timestamp uniformly distributed over the last
    `max_days` days. Unlike random_past_ts (exponential, which piles many
    draws up against the cap for small max_days), this spreads evenly —
    used by the "demo" showcase preset so created_at values look varied
    across a several-month window instead of clustering on one day.
    """
    days_ago = rng.uniform(0, max_days)
    seconds_ago = int(days_ago * 86400) + rng.randint(0, 86399)
    dt = datetime.now(tz=timezone.utc) - timedelta(seconds=seconds_ago)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{rng.randint(0, 999):03d}Z"


def slightly_after_ts(rng: random.Random, ts: str, max_extra_days: int = 60) -> str:
    """Return a timestamp that is the same as or slightly after `ts`."""
    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    extra = timedelta(days=rng.randint(0, max_extra_days), seconds=rng.randint(0, 86399))
    result = dt + extra
    return result.strftime("%Y-%m-%dT%H:%M:%S.") + f"{rng.randint(0, 999):03d}Z"


def ts_near_date(rng: random.Random, event_date_str: Optional[str]) -> str:
    """
    Return a timestamp within ±3 days of an event date (or a recent past ts
    if no date is given).
    """
    if not event_date_str:
        return random_past_ts(rng, max_days=5 * 365)
    event_dt = date.fromisoformat(event_date_str)
    offset_days = rng.randint(0, 3)
    result_date = event_dt + timedelta(days=offset_days)
    # Clamp to today
    today = _reference_date()
    if result_date > today:
        result_date = today
    result_dt = datetime(
        result_date.year, result_date.month, result_date.day,
        rng.randint(8, 20), rng.randint(0, 59), rng.randint(0, 59),
        tzinfo=timezone.utc,
    )
    return result_dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{rng.randint(0, 999):03d}Z"


def random_past_date(rng: random.Random, max_days: int = 5 * 365) -> str:
    """Return a YYYY-MM-DD date biased toward recent dates."""
    days_ago = min(int(rng.expovariate(1 / 400)), max_days)
    d = _reference_date() - timedelta(days=days_ago)
    return d.strftime("%Y-%m-%d")


def random_future_date(rng: random.Random, max_days: int = 180) -> str:
    """Return a YYYY-MM-DD date in the future."""
    days_ahead = rng.randint(1, max_days)
    d = _reference_date() + timedelta(days=days_ahead)
    return d.strftime("%Y-%m-%d")


def weighted_sample_no_replace(
    rng: random.Random, population: list, weights: list, k: int
) -> list:
    """
    Sample `k` items from `population` without replacement, weighted.
    Falls back to full population if k >= len(population).
    """
    if k >= len(population):
        result = list(population)
        rng.shuffle(result)
        return result

    remaining = list(zip(population, weights))
    selected = []
    for _ in range(k):
        if not remaining:
            break
        total = sum(w for _, w in remaining)
        r = rng.random() * total
        cumsum = 0.0
        chosen_idx = len(remaining) - 1
        for i, (_, w) in enumerate(remaining):
            cumsum += w
            if r <= cumsum:
                chosen_idx = i
                break
        selected.append(remaining[chosen_idx][0])
        remaining.pop(chosen_idx)
    return selected


def slug(name: str) -> str:
    """Convert a name to a simple URL-safe slug."""
    return (
        name.lower()
        .replace(" ", "-")
        .replace("'", "")
        .replace("&", "and")
        .replace(".", "")
        .replace(",", "")
        .replace("(", "")
        .replace(")", "")
    )
