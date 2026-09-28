import json
from pathlib import Path

import roadmap

README = Path(__file__).resolve().parent.parent / "README.md"

FIXTURE = """# Table of Contents
- [Tools by category](#tools)

# Tools by category

#### :male_detective: Information Gathering

| Tool        | Language           | Support  | Description    |
| ----------- |--------------------|----------|----------------|
| [Nmap](https://example.com/nmap)      | **C** | `Linux/Windows/macOS` | Network scanner. |
| [theHarvester](https://example.com/th) | **Python** | `Linux` | Emails and subdomains. |

#### :lock: Password Attacks

Crack passwords.

| Tool        | Language           | Support  | Description    |
| ----------- |--------------------|----------|----------------|
| [hashcat](https://example.com/hashcat) | **C** | `Linux/Windows/macOS` | Password recovery. |
| Tool | Language | Support | Description |

###### :memo: Wordlists

| Tool | Description |
| ---- | ----------- |
| [Probable Wordlist](https://example.com/pw) | Sorted by probability. |

# Additional resources

| [Should Not Parse](https://example.com/x) | **C** | `Linux` | Outside the tools section. |
"""


def make_readme(tmp_path: Path, text: str = FIXTURE) -> Path:
    path = tmp_path / "README.md"
    path.write_text(text, encoding="utf-8")
    return path


def test_parse_fixture_counts_and_categories():
    tools = roadmap.parse_readme(FIXTURE)
    assert len(tools) == 4
    categories = [t.category for t in tools]
    assert categories == [
        "Information Gathering",
        "Information Gathering",
        "Password Attacks",
        "Wordlists",
    ]
    names = [t.name for t in tools]
    assert names == ["Nmap", "theHarvester", "hashcat", "Probable Wordlist"]


def test_parse_cleans_bold_language_and_backticks():
    tools = {t.name: t for t in roadmap.parse_readme(FIXTURE)}
    assert tools["Nmap"].language == "C"
    assert tools["Nmap"].platforms == "Linux/Windows/macOS"
    assert tools["Nmap"].description == "Network scanner."
    assert tools["Probable Wordlist"].language == ""
    assert tools["Probable Wordlist"].description == "Sorted by probability."


def test_parse_skips_header_rows_and_out_of_section_rows():
    tools = roadmap.parse_readme(FIXTURE)
    assert all(t.name != "Tool" for t in tools)
    assert all(t.name != "Should Not Parse" for t in tools)


def test_state_roundtrip_and_corrupt_file(tmp_path: Path):
    missing = tmp_path / "state.json"
    assert roadmap.load_state(missing) == {"learned": []}
    missing.write_text("{not json", encoding="utf-8")
    assert roadmap.load_state(missing) == {"learned": []}
    missing.write_text(json.dumps(["already"]), encoding="utf-8")
    assert roadmap.load_state(missing) == {"learned": ["already"]}
    state = {"learned": ["nmap"]}
    roadmap.save_state(missing, state)
    assert roadmap.load_state(missing) == {"learned": ["nmap"]}


def test_done_is_case_insensitive_idempotent_and_unknown_fails(tmp_path: Path, capsys):
    readme = make_readme(tmp_path)
    state_file = tmp_path / "state.json"
    tools = roadmap.parse_readme(FIXTURE)

    assert roadmap.cmd_done(tools, {"learned": []}, "nmap", state_file) == 0
    assert roadmap.load_state(state_file) == {"learned": ["nmap"]}
    assert roadmap.cmd_done(tools, roadmap.load_state(state_file), "Nmap", state_file) == 0
    assert roadmap.load_state(state_file) == {"learned": ["nmap"]}
    assert roadmap.cmd_done(tools, {"learned": []}, "Nope", state_file) == 1
    assert "error: no tool named" in capsys.readouterr().err
    assert readme.exists()


def test_undone_removes_and_unknown_fails(tmp_path: Path, capsys):
    state_file = tmp_path / "state.json"
    assert roadmap.cmd_undone({"learned": ["nmap"]}, "Nmap", state_file) == 0
    assert roadmap.load_state(state_file) == {"learned": []}
    assert roadmap.cmd_undone({"learned": []}, "nmap", state_file) == 1
    assert "not marked as learned" in capsys.readouterr().err


def test_progress_math_and_category_filter(tmp_path: Path, capsys):
    tools = roadmap.parse_readme(FIXTURE)
    state = {"learned": ["nmap"]}
    assert roadmap.cmd_progress(tools, state, None) == 0
    out = capsys.readouterr().out
    assert "Overall: 25% (1/4 tools learned)" in out

    capsys.readouterr()
    assert roadmap.cmd_progress(tools, state, "Password") == 0
    out = capsys.readouterr().out
    assert "Overall: 0% (0/1 tools learned)" in out


def test_progress_no_match_fails():
    tools = roadmap.parse_readme(FIXTURE)
    assert roadmap.cmd_progress(tools, {"learned": []}, "no-such-category") == 1


def test_list_filters_and_empty_result(tmp_path: Path, capsys):
    tools = roadmap.parse_readme(FIXTURE)
    assert roadmap.cmd_list(tools, {"learned": ["nmap"]}, None, None) == 0
    out = capsys.readouterr().out
    assert "[x] Nmap" in out
    assert "[ ] hashcat" in out

    assert roadmap.cmd_list(tools, {"learned": []}, None, "Python") == 0
    out = capsys.readouterr().out
    assert "theHarvester" in out and "Nmap" not in out.split("theHarvester")[0]

    assert roadmap.cmd_list(tools, {"learned": []}, "nope", None) == 1


def test_main_end_to_end(tmp_path: Path, capsys):
    readme = make_readme(tmp_path)
    state_file = tmp_path / "state.json"
    base = ["--readme", str(readme), "--state", str(state_file)]
    assert roadmap.main(base + ["done", "hashcat"]) == 0
    assert roadmap.main(base + ["categories"]) == 0
    out = capsys.readouterr().out
    assert "Password Attacks" in out
    assert roadmap.main(base + ["progress"]) == 0
    assert "Overall: 25%" in capsys.readouterr().out
    assert roadmap.main(base + ["list", "--category", "Wordlists"]) == 0
    assert "Probable Wordlist" in capsys.readouterr().out
    assert roadmap.main(base + ["undone", "hashcat"]) == 0
    assert roadmap.load_state(state_file) == {"learned": []}


def test_main_missing_readme_fails(tmp_path: Path, capsys):
    missing = tmp_path / "nope.md"
    assert roadmap.main(["--readme", str(missing), "categories"]) == 2
    assert "cannot read" in capsys.readouterr().err


def test_main_readme_without_tools_fails(tmp_path: Path, capsys):
    empty = tmp_path / "README.md"
    empty.write_text("# Nothing here\n", encoding="utf-8")
    assert roadmap.main(["--readme", str(empty), "categories"]) == 2
    assert "no tools found" in capsys.readouterr().err


def test_real_readme_parses_expected_shape():
    tools = roadmap.parse_readme(README.read_text(encoding="utf-8"))
    assert len(tools) >= 40
    categories = {t.category for t in tools}
    assert "Information Gathering" in categories
    assert "Web Hacking" in categories
    assert all(t.url.startswith("http") for t in tools)
