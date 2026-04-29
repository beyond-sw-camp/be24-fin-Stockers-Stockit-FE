#!/usr/bin/env python3
"""
Convert the provided requirements-definition CSV format into the issue-import CSV
consumed by tools/create_github_issues_from_csv.py for the FE repository.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


OUTPUT_HEADERS = [
    "type",
    "title",
    "summary",
    "requirement",
    "todo",
    "labels",
    "assignees",
    "screenshot",
    "background",
    "expected_effect",
    "improvement_type",
    "bug",
    "scenario",
    "expected_result",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert Sheet3-style requirements CSV to issue-import CSV."
    )
    parser.add_argument("--input", required=True, help="Source CSV path.")
    parser.add_argument("--output", required=True, help="Converted CSV path.")
    return parser.parse_args()


def clean_bullet_line(line: str) -> str:
    return line.strip().strip('"').lstrip("·•・-").strip().strip('"')


def split_lines(value: str) -> list[str]:
    return [clean_bullet_line(line) for line in value.splitlines() if clean_bullet_line(line)]


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    with input_path.open("r", encoding="utf-8-sig", newline="") as source_file:
        rows = list(csv.reader(source_file))

    current_major = ""
    current_middle = ""
    converted_rows: list[dict[str, str]] = []

    for row in rows[8:]:
        if len(row) < 10:
            continue

        requirement_id = row[1].strip()
        if not requirement_id:
            continue

        if row[2].strip():
            current_major = row[2].strip()
        if row[3].strip():
            current_middle = row[3].strip()

        subcategory = row[4].strip()
        role = row[5].strip()
        requirement_text = row[6].strip()
        detail_text = row[7].strip()
        owner = row[8].strip()
        priority = row[9].strip()

        title = f"[{requirement_id}] {subcategory}" if subcategory else requirement_id

        summary_parts = []
        if requirement_text:
            summary_parts.append(clean_bullet_line(requirement_text.splitlines()[0]))
        if role:
            summary_parts.append(f"권한: {role}")
        if owner:
            summary_parts.append(f"담당자: {owner}")
        if priority:
            summary_parts.append(f"중요도: {priority}")
        summary = " / ".join(summary_parts)

        category_parts = [part for part in [current_major, current_middle, subcategory] if part]
        category_text = " > ".join(category_parts)
        requirement_label = requirement_id
        if category_text:
            requirement_label = f"{requirement_id} | {category_text}"

        todos = []
        if requirement_text:
            todos.extend(split_lines(requirement_text))
        if detail_text:
            todos.extend(split_lines(detail_text))

        converted_rows.append(
            {
                "type": "feat",
                "title": title,
                "summary": summary,
                "requirement": requirement_label,
                "todo": "\n".join(todos),
                "labels": "기능",
                "assignees": "",
                "screenshot": "",
                "background": "",
                "expected_effect": "",
                "improvement_type": "",
                "bug": "",
                "scenario": "",
                "expected_result": "",
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=OUTPUT_HEADERS)
        writer.writeheader()
        writer.writerows(converted_rows)

    print(f"Converted {len(converted_rows)} rows to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
