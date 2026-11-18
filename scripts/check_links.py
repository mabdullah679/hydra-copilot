#!/usr/bin/env python3
"""Fail if a relative markdown link in any tracked .md file does not resolve."""
import re, subprocess, sys, pathlib

files = subprocess.check_output(["git", "ls-files", "*.md"], text=True).split()
bad = []
for f in files:
    text = pathlib.Path(f).read_text(encoding="utf-8")
    for m in re.finditer(r"\[[^\]]*\]\(([^)\s]+)\)", text):
        t = m.group(1).split("#")[0]
        if not t or re.match(r"^[a-z]+:", t):
            continue
        if not (pathlib.Path(f).parent / t).exists():
            bad.append(f"{f}: {m.group(1)}")
print("\n".join(bad) or f"ok: {len(files)} files")
sys.exit(1 if bad else 0)
