#!/usr/bin/env python3
"""
UserPromptSubmit hook — mandatory skill-check reminder on every turn.

Guaranteed delivery: the REMINDER constant is written to stdout in both
the happy path AND in every exception handler. There is no code path that
exits without emitting the reminder JSON.
"""

import json
import sys

REMINDER = """MANDATORY SKILL CHECK — runs before every response, no exceptions.

Installed skills: skill-creator, mcp-builder, webapp-testing, frontend-design,
brand-guidelines, theme-factory, internal-comms, slack-gif-creator,
algorithmic-art, canvas-design, doc-coauthoring, web-artifacts-builder,
ghost, OODA, L99.

Step 1 — Does any installed skill match this request, even partially?
Step 2 — If YES: invoke it via the Skill tool FIRST, then build your response.
Step 3 — If multiple skills match: invoke all of them in logical order.
Step 4 — Only if ZERO skills match: respond inline.

ghost  → humanize tone, strip AI boilerplate, write like a person
OODA   → strategic analysis, blind spot mapping, military decision loop
L99    → expert/PhD mode, no simplification, principal-engineer depth

When in doubt, invoke the skill. Never skip this check."""

OUTPUT = json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": REMINDER,
    }
})


def main():
    try:
        sys.stdin.read()
    except Exception:
        pass  # stdin failure cannot stop us
    sys.stdout.write(OUTPUT)
    sys.stdout.flush()
    sys.exit(0)


# Guarantee: even if main() itself raises, we still emit the reminder.
try:
    main()
except Exception:
    try:
        sys.stdout.write(OUTPUT)
        sys.stdout.flush()
    except Exception:
        pass
    sys.exit(0)
