#!/usr/bin/env python3
"""Fetch one exercise's full record from exercises.json by its id.

Usage:
    python3 scripts/get_exercise.py <id>
    python3 scripts/get_exercise.py ai-clinical-psychology__jibunshi

Prints the full JSON record (steps, reflection, safetyNotes, etc.) so the
caller doesn't need to load the whole 88-entry file into context.
Exits with a clear error and the list of close-name candidates if the id
isn't found (helps recover from a typo without re-reading the whole file).
"""
import json
import sys
import os
import difflib

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 get_exercise.py <id>", file=sys.stderr)
        sys.exit(1)

    target_id = sys.argv[1]
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "exercises.json")

    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    for exercise in data:
        if exercise["id"] == target_id:
            print(json.dumps(exercise, ensure_ascii=False, indent=2))
            return

    # Not found: help recover instead of failing silently.
    # Use difflib for genuinely close matches (typos), falling back to the
    # book prefix only if nothing scores close enough to be useful.
    all_ids = [e["id"] for e in data]
    close = difflib.get_close_matches(target_id, all_ids, n=5, cutoff=0.5)
    if not close:
        prefix = target_id.split("__")[0]
        close = [i for i in all_ids if i.split("__")[0] == prefix][:5]

    print(f"Error: no exercise with id '{target_id}' found.", file=sys.stderr)
    if close:
        print("Did you mean one of these?", file=sys.stderr)
        for c in close:
            print(f"  - {c}", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    main()
