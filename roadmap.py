#!/usr/bin/env python3
"""Hacker Roadmap progress tracker.

Parses this repository's README.md (the "Tools by category" section) into
categories and tools, and tracks which ones you have learned in a small
JSON state file.

Usage:
  roadmap.py categories
  roadmap.py list [--category NAME] [--language LANG]
  roadmap.py done TOOL_NAME
  roadmap.py undone TOOL_NAME
  roadmap.py progress [--category NAME]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path

SECTION_START = "Tools by category"
SECTION_END = "Additional resources"
DEFAULT_README = Path(__file__).resolve().parent / "README.md"
DEFAULT_STATE = Path(os.environ.get("HOME", ".")) / ".hacker-roadmap" / "state.json"

CATEGORY_RE = re.compile(r"^#{4,6}\s+(?::\w+:\s*)?(.+?)\s*$")
TABLE_ROW_RE = re.compile(
    r"^\|\s*\[(?P<name>[^\]]+)\]\((?P<url>[^)]+)\)\s*\|"
    r"\s*(?P<language>[^|]*?)\s*\|"
    r"\s*(?P<platforms>[^|]*?)\s*\|"
    r"\s*(?P<description>[^|]*?)\s*\|\s*$"
)
SHORT_ROW_RE = re.compile(
    r"^\|\s*\[(?P<name>[^\]]+)\]\((?P<url>[^)]+)\)\s*\|"
    r"\s*(?P<description>[^|]*?)\s*\|\s*$"
)
SKIP_ROWS = {"Tool", "-"}


@dataclass(frozen=True)
class Tool:
    name: str
    url: str
    language: str
    platforms: str
    description: str
    category: str

    @property
    def key(self) -> str:
        return self.name.strip().lower()


def parse_readme(text: str) -> list[Tool]:
    """Extract tool table rows under the "Tools by category" section."""
    lines = text.splitlines()
    tools: list[Tool] = []
    category: str | None = None
    in_section = False

    for line in lines:
        heading = line.lstrip()
        if heading.startswith("# "):
            title = heading[2:].strip()
            if title == SECTION_START:
                in_section = True
            elif in_section and title == SECTION_END:
                break
            continue
        if not in_section:
            continue

        cat_match = CATEGORY_RE.match(heading)
        if cat_match:
            category = cat_match.group(1)
            continue

        row = TABLE_ROW_RE.match(line.strip())
        if row:
            name = row.group("name").strip()
            url = row.group("url")
            language = _clean(row.group("language"))
            platforms = _clean(row.group("platforms"))
            description = _clean(row.group("description"))
        else:
            short = SHORT_ROW_RE.match(line.strip())
            if not short:
                continue
            name = short.group("name").strip()
            url = short.group("url")
            language = ""
            platforms = ""
            description = _clean(short.group("description"))
        if name in SKIP_ROWS or category is None:
            continue
        tools.append(
            Tool(
                name=name,
                url=url.strip(),
                language=language,
                platforms=platforms,
                description=description,
                category=category,
            )
        )
    return tools


def _clean(value: str) -> str:
    value = re.sub(r"\*\*(.+?)\*\*", r"\1", value)
    value = value.replace("`", "")
    return value.strip()


def load_state(path: Path) -> dict:
    if not path.exists():
        return {"learned": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"learned": []}
    if isinstance(data, list):
        return {"learned": [str(x) for x in data]}
    if not isinstance(data, dict) or not isinstance(data.get("learned"), list):
        return {"learned": []}
    return {"learned": [str(x) for x in data["learned"]]}


def save_state(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")


def _match_category(tool: Tool, wanted: str | None) -> bool:
    if wanted is None:
        return True
    return wanted.strip().lower() in tool.category.lower()


def _match_language(tool: Tool, wanted: str | None) -> bool:
    if wanted is None:
        return True
    return wanted.strip().lower() in tool.language.lower()


def _find_tool(tools: list[Tool], name: str) -> Tool | None:
    wanted = name.strip().lower()
    exact = [t for t in tools if t.key == wanted]
    if exact:
        return exact[0]
    partial = [t for t in tools if wanted in t.key]
    if len(partial) == 1:
        return partial[0]
    return None


def cmd_categories(tools: list[Tool], state: dict) -> int:
    learned = set(state["learned"])
    seen: dict[str, list[int]] = {}
    for tool in tools:
        total, done = seen.setdefault(tool.category, [0, 0])
        seen[tool.category] = [total + 1, done + (1 if tool.key in learned else 0)]
    width = max((len(c) for c in seen), default=0)
    for category, (total, done) in seen.items():
        print(f"{category:<{width}}  {done:>3}/{total:<3} learned")
    print(f"{'TOTAL':<{width}}  {sum(d for _, d in seen.values()):>3}/{sum(t for t, _ in seen.values()):<3} learned")
    return 0


def cmd_list(tools: list[Tool], state: dict, category: str | None, language: str | None) -> int:
    learned = set(state["learned"])
    shown = 0
    current = None
    for tool in tools:
        if not _match_category(tool, category) or not _match_language(tool, language):
            continue
        if tool.category != current:
            current = tool.category
            print(f"\n{current}")
            print("-" * len(current))
        mark = "x" if tool.key in learned else " "
        lang = f" ({tool.language})" if tool.language else ""
        print(f"  [{mark}] {tool.name}{lang} — {tool.description}")
        shown += 1
    if shown == 0:
        print("No tools matched.")
        return 1
    print(f"\n{shown} tool(s)")
    return 0


def cmd_done(tools: list[Tool], state: dict, name: str, path: Path) -> int:
    tool = _find_tool(tools, name)
    if tool is None:
        print(f"error: no tool named {name!r} (try 'roadmap.py list')", file=sys.stderr)
        return 1
    if tool.key in state["learned"]:
        print(f"{tool.name} is already marked as learned.")
        return 0
    state["learned"].append(tool.key)
    save_state(path, state)
    print(f"Marked {tool.name} as learned.")
    return 0


def cmd_undone(state: dict, name: str, path: Path) -> int:
    wanted = name.strip().lower()
    before = len(state["learned"])
    state["learned"] = [k for k in state["learned"] if k != wanted and wanted not in k]
    if len(state["learned"]) == before:
        print(f"error: {name!r} is not marked as learned", file=sys.stderr)
        return 1
    save_state(path, state)
    print(f"Unmarked {name}.")
    return 0


def cmd_progress(tools: list[Tool], state: dict, category: str | None) -> int:
    learned = set(state["learned"])
    subset = [t for t in tools if _match_category(t, category)]
    if not subset:
        print("No tools matched.")
        return 1
    buckets: dict[str, list[int]] = {}
    for tool in subset:
        total, done = buckets.setdefault(tool.category, [0, 0])
        buckets[tool.category] = [total + 1, done + (1 if tool.key in learned else 0)]
    for cat, (total, done) in buckets.items():
        pct = (done * 100) // total if total else 0
        filled = pct // 5
        bar = "#" * filled + "." * (20 - filled)
        print(f"{cat:<40} [{bar}] {pct:>3}%  ({done}/{total})")
    total = len(subset)
    done = sum(1 for t in subset if t.key in learned)
    pct = (done * 100) // total if total else 0
    print(f"\nOverall: {pct}% ({done}/{total} tools learned)")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="roadmap.py", description=__doc__.splitlines()[0])
    parser.add_argument("--readme", type=Path, default=DEFAULT_README, help="path to README.md")
    parser.add_argument("--state", type=Path, default=DEFAULT_STATE, help="path to state JSON file")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("categories", help="list categories with progress")
    p_list = sub.add_parser("list", help="list tools")
    p_list.add_argument("--category", help="filter by category substring")
    p_list.add_argument("--language", help="filter by language substring")
    p_done = sub.add_parser("done", help="mark a tool as learned")
    p_done.add_argument("name")
    p_undone = sub.add_parser("undone", help="unmark a tool")
    p_undone.add_argument("name")
    p_progress = sub.add_parser("progress", help="show progress bars")
    p_progress.add_argument("--category", help="filter by category substring")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        text = args.readme.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"error: cannot read {args.readme}: {exc}", file=sys.stderr)
        return 2
    tools = parse_readme(text)
    if not tools:
        print(f"error: no tools found in {args.readme}", file=sys.stderr)
        return 2
    state = load_state(args.state)

    if args.command == "categories":
        return cmd_categories(tools, state)
    if args.command == "list":
        return cmd_list(tools, state, args.category, args.language)
    if args.command == "done":
        return cmd_done(tools, state, args.name, args.state)
    if args.command == "undone":
        return cmd_undone(state, args.name, args.state)
    if args.command == "progress":
        return cmd_progress(tools, state, args.category)
    return 2


if __name__ == "__main__":
    sys.exit(main())
