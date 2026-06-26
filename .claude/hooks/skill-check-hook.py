#!/usr/bin/env python3
"""
UserPromptSubmit hook — injects a mandatory skill-check reminder on every turn.

Fires unconditionally for every user prompt in every session. Injects
additionalContext telling Claude to scan installed skills before responding.
"""

import json
import sys

REMINDER = """MANDATORY SKILL CHECK — runs before every response, no exceptions.

Installed skills: skill-creator, mcp-builder, webapp-testing, frontend-design,
brand-guidelines, theme-factory, internal-comms, slack-gif-creator,
algorithmic-art, canvas-design, doc-coauthoring, web-artifacts-builder.

Step 1 — Does any installed skill match this request, even partially?
Step 2 — If YES: invoke it via the Skill tool FIRST, then build your response.
Step 3 — If multiple skills match: invoke all of them in logical order.
Step 4 — Only if ZERO skills match: respond inline.

When in doubt, invoke the skill. Never skip this check."""


def main():
    # Consume stdin (required by hook protocol) but we don't need the payload.
    try:
        sys.stdin.read()
    except Exception:
        pass

    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": REMINDER,
            }
        },
        sys.stdout,
    )
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Never block the turn on a hook failure.
        sys.exit(0)
