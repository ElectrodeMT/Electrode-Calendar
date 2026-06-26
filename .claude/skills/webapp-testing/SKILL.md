---
name: webapp-testing
description: "Runs Playwright browser tests against a live URL or local dev server, navigates user flows, captures screenshots at each step, and returns structured pass/fail output. Use when asked to 'test the UI', 'smoke test staging', 'check that X flow works', 'run webapp tests', 'verify the UI with Playwright', or 'screenshot the app'. Wire into a Routine for nightly smoke tests."
---

# Webapp Testing — Playwright, but Claude Drives

You run end-to-end UI tests using Playwright with Chromium. You navigate flows, capture screenshots, assert on DOM state, and return a structured test report. No CI YAML required — Claude drives the browser directly.

## Context

Chromium is pre-installed at `/opt/pw-browsers/chromium`. Do NOT run `playwright install`. If Playwright is not installed in the project, install it first.

**Security note:** Always sandbox the browser. Never run tests against production systems with real credentials unless the user explicitly instructs it.

## Inputs

Gather before starting:
1. **Target URL** — local dev server (`http://localhost:3000`) or staging URL
2. **Flows to test** — what user journeys to exercise (login, checkout, form submit, navigation)
3. **Assertions** — what "pass" looks like (text present, URL changed, element visible, no console errors)
4. **Screenshot cadence** — at each step, on failure only, or at the end
5. Is the dev server already running, or should you start it?

## Workflow

### 1. Check Playwright installation

```bash
npx playwright --version 2>/dev/null || npm install --save-dev @playwright/test
```

If the project has no `package.json`, create a minimal one:
```bash
npm init -y && npm install --save-dev @playwright/test
```

### 2. Start the dev server (if needed)

If the target is localhost, start the dev server in the background and wait for it to be ready:

```bash
npm run dev &
DEV_PID=$!
# Wait for port to open
timeout 30 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 1; done'
echo "Dev server ready at PID $DEV_PID"
```

### 3. Write the test script

Create `.claude/playwright-test.ts` (ephemeral, not committed unless user asks):

```typescript
import { chromium } from "@playwright/test";
import * as fs from "fs";

const BROWSER_EXEC = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium/chrome`
  : "/opt/pw-browsers/chromium";

const results: Array<{
  flow: string;
  step: string;
  status: "pass" | "fail";
  screenshot?: string;
  error?: string;
}> = [];

const browser = await chromium.launch({
  executablePath: BROWSER_EXEC,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: undefined, // enable if needed
});

const page = await context.newPage();

// Capture console errors
const consoleErrors: string[] = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

async function screenshot(name: string): Promise<string> {
  const path = `/tmp/screenshots/${name}.png`;
  fs.mkdirSync("/tmp/screenshots", { recursive: true });
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function step(flow: string, stepName: string, fn: () => Promise<void>) {
  try {
    await fn();
    const shot = await screenshot(`${flow}-${stepName}`);
    results.push({ flow, step: stepName, status: "pass", screenshot: shot });
  } catch (e: any) {
    const shot = await screenshot(`${flow}-${stepName}-FAIL`);
    results.push({
      flow,
      step: stepName,
      status: "fail",
      screenshot: shot,
      error: e.message,
    });
  }
}

// ── FLOWS START HERE ──────────────────────────────────────────────────────────

await step("homepage", "load", async () => {
  await page.goto("TARGET_URL");
  await page.waitForLoadState("networkidle");
});

await step("homepage", "title-visible", async () => {
  await page.waitForSelector("h1", { timeout: 5000 });
});

// Add more flows here based on user requirements

// ── FLOWS END HERE ────────────────────────────────────────────────────────────

await browser.close();

// Output structured report
const passed = results.filter((r) => r.status === "pass").length;
const failed = results.filter((r) => r.status === "fail").length;

console.log(
  JSON.stringify(
    {
      summary: { total: results.length, passed, failed },
      consoleErrors,
      steps: results,
    },
    null,
    2
  )
);

if (failed > 0) process.exit(1);
```

### 4. Customize the test for the requested flows

Replace the placeholder steps with the actual user journeys requested. For each flow:
- `page.goto(url)` → navigate
- `page.click("selector")` → click elements (prefer `role`, `text`, `data-testid` selectors)
- `page.fill("selector", "value")` → fill inputs
- `page.waitForSelector("selector")` → assert element appears
- `expect(await page.textContent("selector")).toContain("text")` → assert content

Use accessible selectors in priority order:
1. `page.getByRole("button", { name: "Submit" })`
2. `page.getByText("Submit")`
3. `page.locator("[data-testid='submit']")`
4. CSS selector (last resort)

### 5. Run the test

```bash
npx tsx .claude/playwright-test.ts 2>&1
```

Or with plain node if tsx isn't available:
```bash
node --loader ts-node/esm .claude/playwright-test.ts
```

### 6. Parse results and display screenshots

Read the JSON output. For each failed step:
1. Show the screenshot using the Read tool (images are displayed inline)
2. Show the error message
3. Suggest a fix if the cause is identifiable

### 7. Cleanup

```bash
# Kill dev server if we started it
[ -n "$DEV_PID" ] && kill $DEV_PID 2>/dev/null || true
rm -f .claude/playwright-test.ts
```

## Output Format

```
Webapp Test Report
==================
Target: <URL>
Total: <N>  Passed: <N>  Failed: <N>

Flows:
  ✅ homepage / load            [screenshot: /tmp/screenshots/homepage-load.png]
  ✅ homepage / title-visible
  ❌ login / submit             ERROR: Selector "button[type=submit]" not found
                                [screenshot: /tmp/screenshots/login-submit-FAIL.png]

Console Errors: <N>
  - <error text if any>

Exit code: 0 (all passed) | 1 (failures found)
```

After the report, show inline screenshots for any failed steps.

## Wrap Up

Summarize what passed and failed. If failures were found:
1. Show the failure screenshot
2. Diagnose the root cause (wrong selector, timing issue, missing element, JS error)
3. Offer to fix the underlying code or update the test

Do NOT push or commit test files unless explicitly asked. The test script is ephemeral by default.
