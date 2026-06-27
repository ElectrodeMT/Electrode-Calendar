---
name: plan-driven-dev
description: "Agentic coding workflow with 5 strict phases: isolated planning to PLAN.md, PROJECT.md context injection, actor code generation per plan, automated test loop with failure feedback, and critic approval gate. Invoke for any non-trivial feature, refactor, or bug that spans multiple files. Trigger phrases: 'build this feature', 'implement this', 'agentic coding', 'plan-driven', 'plan before coding', 'architect then implement'."
---

# Plan-Driven Development — The 5-Phase Agentic Coding Workflow

Every non-trivial coding task runs through five locked phases in sequence. No phase can be skipped. No code is written before Phase 3. No task is marked complete before Phase 5 passes.

---

## Phase Overview

```
Phase 1 — PLAN      → Isolated planning to PLAN.md. Zero code output.
Phase 2 — CONTEXT   → PROJECT.md created or refreshed. Injected into every subsequent call.
Phase 3 — ACT       → Actor generates code, strictly per plan. One file at a time.
Phase 4 — TEST      → Automated test loop. Failures feed back to the Actor until green.
Phase 5 — CRITIC    → Reviewer pass: security, correctness, performance. Must approve to close.
```

---

## Inputs (Gather Before Phase 1)

1. **Task description** — What must be built or fixed? Include acceptance criteria.
2. **Scope** — Which files, modules, or services are in play?
3. **Test command** — How is the project tested? (`npm test`, `pytest`, `go test ./...`, etc.)
4. **Constraints** — Any non-negotiable patterns, forbidden libraries, or architectural rules?

If PROJECT.md already exists, read it before gathering inputs. It may answer (2)–(4) already.

---

## Phase 0 — DEPENDENCY ANALYSIS (Pre-Planning Context Tool)

Before writing the plan, build a static dependency graph to understand which files are actually coupled. This prevents plans that touch the wrong modules.

Use this tool (`DependencyGraphBuilder`) for Python projects:

```python
import os
import ast
from typing import Dict, List, Set

class DependencyGraphBuilder:
    def __init__(self, root_dir: str):
        self.root_dir = os.path.abspath(root_dir)
        self.module_to_file: Dict[str, str] = {}
        self.graph: Dict[str, Set[str]] = {}

    def _file_to_module_name(self, file_path: str) -> str:
        rel_path = os.path.relpath(file_path, self.root_dir)
        if rel_path.endswith('.py'):
            rel_path = rel_path[:-3]
        return rel_path.replace(os.path.sep, '.')

    def _index_project_files(self) -> None:
        for root, dirs, files in os.walk(self.root_dir):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('venv', '__pycache__', 'node_modules')]
            for file in files:
                if file.endswith('.py'):
                    full_path = os.path.join(root, file)
                    mod_name = self._file_to_module_name(full_path)
                    self.module_to_file[mod_name] = full_path
                    self.graph[full_path] = set()

    def _extract_imports(self, file_path: str) -> List[str]:
        imported_modules = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                tree = ast.parse(f.read(), filename=file_path)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imported_modules.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imported_modules.append(node.module)
        except Exception:
            pass
        return imported_modules

    def build(self) -> Dict[str, List[str]]:
        self._index_project_files()
        for file_path in self.graph.keys():
            raw_imports = self._extract_imports(file_path)
            for imp in raw_imports:
                for local_mod, local_path in self.module_to_file.items():
                    if imp == local_mod or imp.startswith(local_mod + '.'):
                        if local_path != file_path:
                            self.graph[file_path].add(local_path)
        return {os.path.relpath(k, self.root_dir): [os.path.relpath(v, self.root_dir) for v in val]
                for k, val in self.graph.items()}
```

Write this to a temp script, run it via Bash, and inject the resulting graph into Phase 1's planning call. For TypeScript/JS projects, use `grep -r "import.*from"` patterns instead.

---

## Phase 1 — PLAN (Isolation Gate)

**Rule: No code is written in this phase. Output is PLAN.md only.**

### Actor Prompting Template — Planning Call

```
You are an expert software architect. Your ONLY output in this response is a structured plan.
Do NOT write any code. Do NOT output diffs or file contents.

Task: {TASK_DESCRIPTION}

Dependency context:
{DEPENDENCY_GRAPH from Phase 0}

Produce PLAN.md with these exact sections:

## Goal
One sentence stating the end state.

## Constraints
Bullets: forbidden patterns, required libraries, naming conventions, performance envelopes.

## Files to Touch
| File | Change type (create/modify/delete) | Reason |
|------|-------------------------------------|--------|

## Implementation Steps
Numbered list. Each step is a single atomic action (one function, one route, one schema change).
Steps must be ordered: data layer → business logic → API → UI → tests.

## Edge Cases and Failure Modes
- [Case]: [Why it matters] [How the plan handles it]

## Test Plan
- [ ] Unit test: {what}
- [ ] Integration test: {what}
- [ ] Edge case: {what}

## Definition of Done
Checklist. Every item is objectively verifiable.
```

### Search Patterns Before Planning

```
Grep(pattern="function handleSubmit", type="ts")
Grep(pattern="class UserService", glob="**/*.py")
Grep(pattern="CREATE TABLE users", glob="**/*.sql")
Glob(pattern="src/**/*.tsx")
Glob(pattern="**/*.test.ts")
Read(file_path, limit=50)
Read(file_path, offset=N, limit=50)
```

**Never plan against assumed file content. Always read first.**

### Output

```
Write(file_path="PLAN.md", content=<plan output>)
```

Announce: **"Phase 1 complete. PLAN.md written. Review before I proceed to Phase 2."**
Wait for explicit user approval before continuing.

---

## Phase 2 — CONTEXT (PROJECT.md Injection)

**Rule: Every subsequent call in Phases 3–5 reads PROJECT.md and PLAN.md before acting.**

### PROJECT.md Structure

```markdown
# PROJECT.md — Engineering Compass

## Stack
- Language: {e.g. TypeScript 5.3}
- Runtime: {e.g. Node 20}
- Framework: {e.g. Next.js 14 App Router}
- Database: {e.g. PostgreSQL 16 via Prisma}
- Test runner: {e.g. Vitest}
- Package manager: {e.g. pnpm}

## Build & Run
```bash
pnpm dev
pnpm build
pnpm test
pnpm test --watch
```

## Directory Layout
src/
  app/          ← Next.js App Router pages
  components/   ← Shared UI components
  lib/          ← Business logic, utilities
  db/           ← Prisma schema and migrations
tests/          ← Integration and E2E tests

## Code Conventions
- Naming: PascalCase for components, camelCase for functions, SCREAMING_SNAKE for constants
- Imports: absolute paths via @/ alias, never relative from root
- Error handling: always typed, always logged before re-throwing
- No: default exports, barrel index files, console.log in production paths
- Async: prefer async/await; never mix with raw .then() chains

## Anti-Patterns (Never Do)
- No raw SQL outside db/ directory
- No business logic in UI components
- No unchecked `as` casts
- No `eslint-disable` without a linked issue comment

## Active Test Patterns
Unit: tests co-located at src/**/*.test.ts
Integration: tests/ directory, uses test database via DATABASE_URL_TEST
Mocks: vitest.mock() only for external I/O; never for internal modules
```

---

## Phase 3 — ACT (Actor Code Generation)

**Rule: Generate code strictly per plan. One step at a time. No improvisation.**

### Actor Prompting Template — Code Generation

```
Context:
{PROJECT.md contents}

Plan:
{PLAN.md contents}

Current step: Step {N} of {M} — {step description}

Rules:
- Implement ONLY this step. Nothing else.
- Follow all conventions in PROJECT.md exactly.
- If you realize the plan is wrong for this step, STOP and report the conflict.
- Output: the complete file contents for every file you touch.
- After the code, output: "Step N complete: {what changed}."
```

### Surgical File Patching Tool

Use `patch_file` for precise edits to existing files. This mirrors the Edit tool's exact-match discipline:

```python
import os
from typing import Dict, Any

def patch_file(path: str, old_block: str, new_block: str) -> Dict[str, Any]:
    """
    Surgically replaces a block of text in a file.
    Fails explicitly if the target doesn't exist or is ambiguous.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        if old_block not in content:
            return {
                "success": False,
                "error": "Patch target not found. 'old_block' must match a section of the file exactly."
            }

        if content.count(old_block) > 1:
            return {
                "success": False,
                "error": "The 'old_block' is ambiguous and matches multiple places. Provide more surrounding context."
            }

        new_content = content.replace(old_block, new_block)

        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)

        return {"success": True, "message": f"Successfully patched {path}."}

    except Exception as e:
        return {"success": False, "error": str(e)}
```

**Rules for using patch_file / Edit:**
1. Always Read the file first — never patch from memory.
2. `old_block` must be long enough to be unique in the file.
3. On `"ambiguous"` error: extend `old_block` to include more surrounding lines.
4. On `"not found"` error: re-read the file; the content may have changed.

### Step Tracking

After each step, mark it complete in PLAN.md:

```markdown
## Implementation Steps
1. ~~Create UserService class~~ ✓
2. Add rate limiting middleware ← CURRENT
3. Wire routes to UserService
```

---

## Phase 4 — TEST LOOP (Automated Feedback)

**Rule: Run tests after every step. Feed failures back to Actor. Loop until green.**

### Agent Loop Implementation

This is the authoritative loop pattern for Phase 4:

```python
import subprocess
import time

def run_agent_loop(task_description: str, plan: str, test_command: list, max_attempts: int = 3) -> bool:
    attempt = 1
    error_feedback = ""

    while attempt <= max_attempts:
        print(f"\n⚙️  Execution Attempt {attempt}/{max_attempts}...")

        # Actor call: generate/fix code based on plan + prior error
        execution_prompt = f"""
Task: {task_description}
Architectural Plan to follow:
{plan}
{f'Previous Error Feedback:{chr(10)}{error_feedback}' if error_feedback else ''}

Fix the failing code. Output ONLY the corrected file contents.
"""
        # [Actor generates and writes files here]

        # Automated test execution
        print("🧪 Running test suite...")
        test_result = subprocess.run(test_command, capture_output=True, text=True)

        if test_result.returncode == 0:
            print("✅ Tests passed. Proceeding to Critic review.")
            return True
        else:
            print(f"❌ Test failed on attempt {attempt}.")
            error_feedback = f"STDOUT:\n{test_result.stdout}\nSTDERR:\n{test_result.stderr}"
            attempt += 1
            if attempt <= max_attempts:
                time.sleep(2 ** (attempt - 1))  # exponential backoff: 1s, 2s, 4s

    print("\n🚨 Agent loop failed to self-correct within maximum attempts.")
    return False
```

### Feedback Loop Template — Actor Correction Call

```
The following tests failed after Step {N}:

--- FAILING OUTPUT ---
{exact terminal output, including file:line references}
--- END OUTPUT ---

Files changed in Step {N}:
{list of files written or edited}

Rules:
- Read each failing file before proposing a fix.
- Fix ONLY what the error describes. No scope creep.
- If the fix requires changing the plan, output "PLAN CONFLICT: {description}" and stop.
- After your fix, output the complete corrected file(s).
```

### Loop Exit Conditions

- **Green:** All tests pass → proceed to Phase 5
- **Stuck after 3 attempts:** Surface to user with full diagnosis
- **Plan conflict:** Return to Phase 1 for targeted re-plan

---

## Phase 5 — CRITIC (Review Gate)

**Rule: No task is complete until Critic outputs "DECISION: APPROVED".**

### Critic System Prompt (Verbatim — Use Exactly As Written)

```
You are an ultra-pedantic Senior Staff Software Engineer and Security Auditor.
Your sole job is to review the code generated by an AI Agent and find reasons to REJECT it.
Do not be polite. Prioritize code health, safety, and longevity.

Analyze the provided code against these strict operational criteria:

1. EDGE CASES: Did the author handle null pointers, empty collections, division by zero,
   network timeouts, and extreme inputs?

2. SECURITY: Are there SQL injections, hardcoded secrets, unsafe string interpolations,
   or broad try-except blocks that swallow crashes?

3. PERFORMANCE: Are there hidden O(N^2) loops, unnecessary database queries inside loops,
   or unclosed file/network streams?

4. ARCHITECTURE: Does the code adhere to clean naming conventions and separation of concerns,
   or is it a monolithic "spaghetti" patch?

CRITICAL OUTPUT FORMAT:
You must begin your response with exactly one of these two phrases:
- "DECISION: APPROVED" (Only if the code is completely flawless and production-ready)
- "DECISION: REJECTED" (If there is even a minor bug, structural flaw, or missing test case)

If REJECTED, provide a numbered list detailing the exact files, lines, and reasons for failure.
Provide structural feedback on how to fix it.
Do not rewrite the code yourself. Instruct the author agent on how to correct their errors.
```

### Critic User Call Format

```
Context:
{PROJECT.md contents}

Original plan:
{PLAN.md contents}

Changes implemented:
{list of every file written or edited, with full contents}

Test results:
{passing test output}

Review the above. Output DECISION: APPROVED or DECISION: REJECTED per your instructions.
```

### Handling Critic Findings

- **DECISION: REJECTED with BLOCKER findings** → return to Phase 3, treat each finding as a new Actor task. Re-run Phase 4. Re-run Critic.
- **DECISION: REJECTED with MINOR findings only** → surface to user. User decides fix-now vs. follow-up.
- **DECISION: APPROVED** → task closed.

---

## Full Workflow Checklist

```
Phase 0 — DEPENDENCY ANALYSIS
  [ ] Run DependencyGraphBuilder (Python) or grep-based scan (JS/TS)
  [ ] Inject graph into Phase 1 planning context

Phase 1 — PLAN
  [ ] Read all files in scope before planning
  [ ] Run Actor planning call with planning template
  [ ] Write PLAN.md
  [ ] User approves PLAN.md

Phase 2 — CONTEXT
  [ ] PROJECT.md exists and is current
  [ ] Read PROJECT.md + PLAN.md at start of every Phase 3–5 call

Phase 3 — ACT (repeat per step)
  [ ] Read target files before editing
  [ ] Implement exactly one plan step
  [ ] Use patch_file / Edit with exact-match old_block
  [ ] Mark step complete in PLAN.md
  [ ] Verify writes landed

Phase 4 — TEST LOOP (repeat until green)
  [ ] Run test suite via subprocess / Bash
  [ ] If failing: format as feedback template → Actor correction call
  [ ] Exponential backoff between attempts (2^n seconds)
  [ ] If stuck after 3 attempts: surface to user
  [ ] If plan conflict: flag → return to Phase 1
  [ ] If green: proceed to Phase 5

Phase 5 — CRITIC
  [ ] Read PROJECT.md, PLAN.md, all changed files
  [ ] Run Critic call with verbatim system prompt
  [ ] Parse response for "DECISION: APPROVED" or "DECISION: REJECTED"
  [ ] REJECTED with BLOCKER → back to Phase 3
  [ ] REJECTED with MINOR → user decision
  [ ] APPROVED → task closed
```

---

## Wrap Up

When Phase 5 returns DECISION: APPROVED:

```
Task complete.

Plan: PLAN.md
Tests: all green ({N} passing)
Critic: DECISION: APPROVED

Files changed:
  {list}
```

Do NOT commit unless asked. Do NOT push unless asked. Critic approval is not deployment approval.
