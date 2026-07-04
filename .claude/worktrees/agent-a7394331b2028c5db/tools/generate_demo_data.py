#!/usr/bin/env python3
"""
Atlas Demo Data Generator
=========================

Generates realistic Atlas backup files importable via Atlas Restore.

Usage
-----
    python tools/generate_demo_data.py --size small
    python tools/generate_demo_data.py --size medium --seed 42
    python tools/generate_demo_data.py --size large --seed 42 --output demo-data/

The output file is a full Atlas backup JSON that can be imported using
the Atlas Restore feature without any modification.
"""
import argparse
import os
import sys
import time

# Allow running from the repo root without installing the package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.demo_data.config import DATASET_SIZES
from tools.demo_data.exporters import build_backup, write_json
from tools.demo_data.generator import AtlasGenerator


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate an Atlas demo data backup file.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--size",
        choices=list(DATASET_SIZES.keys()),
        required=True,
        help="Dataset size: small | medium | large",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducible output (e.g. --seed 42)",
    )
    parser.add_argument(
        "--output",
        default="demo-data",
        help="Output directory (default: demo-data/)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    seed = args.seed if args.seed is not None else int(time.time())
    config = DATASET_SIZES[args.size]

    print(f"Atlas Demo Data Generator")
    print(f"  size   : {args.size}")
    print(f"  seed   : {seed}")
    print(f"  output : {args.output}/")
    print()
    print(f"  target counts:")
    print(f"    people        {config.people}")
    print(f"    events        {config.events}")
    print(f"    event links   {config.event_links}")
    print(f"    tags          {config.tags}")
    print(f"    tag links     {config.tag_links}")
    print(f"    follow-ups    {config.follow_ups}")
    print(f"    relationships {config.relationships}")
    print()

    t0 = time.time()
    print("Generating data...", end=" ", flush=True)
    generator = AtlasGenerator(config=config, seed=seed)
    result = generator.generate()
    print(f"done ({time.time() - t0:.1f}s)")

    backup = build_backup(
        profile=result["profile"],
        people=result["people"],
        events=result["events"],
        tags=result["tags"],
        follow_ups=result["follow_ups"],
        event_people=result["event_people"],
        person_tags=result["person_tags"],
        relationships=result["relationships"],
        exported_at=result["exported_at"],
    )

    os.makedirs(args.output, exist_ok=True)
    filename = f"atlas-demo-{args.size}.json"
    path = os.path.join(args.output, filename)

    print(f"Writing {path}...", end=" ", flush=True)
    write_json(backup, path)
    size_kb = os.path.getsize(path) / 1024
    print(f"done ({size_kb:.0f} KB)")
    print()

    # Print actual counts
    print("Actual counts in output:")
    print(f"  people        {len(result['people'])}")
    print(f"  events        {len(result['events'])}")
    print(f"  event links   {len(result['event_people'])}")
    print(f"  tags          {len(result['tags'])}")
    print(f"  tag links     {len(result['person_tags'])}")
    print(f"  follow-ups    {len(result['follow_ups'])}")
    print(f"  relationships {len(result['relationships'])}")
    print()
    print(f"Ready to import: {path}")


if __name__ == "__main__":
    main()
