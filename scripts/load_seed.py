import json
from pathlib import Path


SEED_FILE = Path("backend/data/architecture_seed.json")


def main() -> None:
    if not SEED_FILE.exists():
        raise FileNotFoundError(f"Seed file not found: {SEED_FILE}")

    with SEED_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)

    app_count = len(data.get("applications", []))
    rel_count = len(data.get("relationships", []))
    doc_count = len(data.get("documents", []))

    print("Seed data loaded successfully")
    print(f"Applications: {app_count}")
    print(f"Relationships: {rel_count}")
    print(f"Documents: {doc_count}")


if __name__ == "__main__":
    main()
