# project-manager

Project management app built with React, strict TypeScript, Vite, ASP.NET Core,
EF Core, and SQLite. Create a project, open its page, edit its name/description,
and track tasks with titles, optional notes, and To do / In progress / Done statuses.
Tasks also have a priority (None, Low, Medium, High), an optional calendar due date,
and a daily focus selection across projects. Only Done tasks count as complete. Names and task titles are trimmed; blank values
are rejected with useful validation errors. Data is synthetic.
Authentication, shared access, deployments, and production migrations are future work.

## Design foundation

The selected direction is **Graphite**: dark surfaces, readable system type, and
restrained accents. **Blue** is the default; **Teal** is also available. Shared tokens and native control patterns
are documented in the [design foundations](docs/design/foundations.md), with a
[live component reference](docs/design/foundations.html). The Projects pilot uses
compact project rows, creation on demand, and Quick capture beneath its heading.
Capture appears only on Projects; its draft survives in-app navigation.

Choose **Appearance → Accent color** in the app navigation to switch between Blue
and Teal. The choice applies throughout the app and is remembered in this browser
across reloads. If browser storage is unavailable, switching still works for the
current session. Keyboard users can open Appearance, Tab to the select, and use
Escape to close the panel and return focus to Appearance.

## Setup and development

Use Node **26.13.0 LTS**, npm **12.2.1**, and .NET SDK **10.0.402**, pinned in `.nvmrc`,
`.npm-version`, and `global.json`. Dependencies and hashes are locked in npm and
NuGet lockfiles. Core versions remain React 19.3.0, TypeScript 6.0.3, Vite 8.3.3,
EF Core 10.0.9, SQLitePCLRaw 3.0.5, and Playwright 1.64.0.

From any authorized cloud checkout with Bash, Python 3, curl, and bootstrap npm:

```bash
bash scripts/setup.sh
bash scripts/check.sh
bash scripts/policy.sh
bash scripts/security.sh
bash scripts/dev.sh
```

Setup selects exact tools, runs `npm --prefix src/web ci` and
`dotnet restore tests/ProjectManager.Api.Tests --locked-mode`. Setup installs
Node/npm in a versioned directory under ignored `.tools` when host versions differ,
including on Windows Git Bash. This also works with newer bootstrap host tools.
The bootstrap selects the platform's prebuilt binary package with install scripts
disabled, avoiding npm's Windows node-wrapper launcher issue.
Versioned directories avoid replacing a running Windows executable during upgrades.
Cache overrides and prepared
cloud reuse are documented in [CI operation](docs/ci.md). No personal credentials
are required. Do not modify lockfiles except for intentional reviewed updates.

Git enforces LF text checkouts (including scripts and version pins), even with
Windows `core.autocrlf=true`.

Development starts the API on **http://127.0.0.1:5000** and Vite on
**http://127.0.0.1:5173**, with `/api` proxying. SQLite persists in ignored
`.data/projects.db`. Set `PROJECT_DEV_DATA_DIR` to use a different directory,
including a Windows path with spaces. Occupied ports fail before startup; Ctrl+C
stops owned processes with bounded cleanup. `bash scripts/dev-smoke.sh` verifies
startup, the API proxy, synthetic create/list, and shutdown using temporary storage.
Services retain their five-second shutdown grace. The smoke supervisor allows ten
seconds for `dev.sh` to finish child cleanup and requires its acknowledgment before
deleting temporary storage; missing acknowledgment fails the run and preserves it.
Both development scripts accept `PROJECT_DEV_API_PORT` and `PROJECT_DEV_WEB_PORT`
to override the default ports; values must be distinct integers from 1 to 65535.
The selected API port also configures Vite's proxy. Occupied selected ports still
fail before startup. Cleanup regression tests allocate their own ports, so
`check.sh` (including `check.sh frontend`) can run while the normal app is running.
To check readiness with the defaults:

```bash
curl -fsS http://127.0.0.1:5000/api/health
curl -fsS http://127.0.0.1:5173/api/projects
```

### Development database upgrades

Stage 4B automatically preserves and upgrades **Stage 1 through Stage 4A** SQLite
databases at API startup. The additive transaction creates Milestones and a nullable
task assignment with a foreign key that clears membership on milestone removal,
alongside any missing earlier planning and Inbox fields. Existing projects, tasks,
Today selections and Inbox items retain their IDs and all data. Repeated starts
are safe; no database is deleted or reset. Tests upgrade temporary copies of the
earlier synthetic schemas and verify new behavior, failed-removal rollback and
retained data across repeated restarts.

Stop development services before changing versions. Keep using the same
`PROJECT_DEV_DATA_DIR` as the previous stage (the default is `.data/projects.db`; if you used
`.data/stage-1`, keep that override). Back up synthetic data before upgrading if
you need to roll back to an earlier app version. This bounded development upgrade
is not a production migration platform.

Pre-Stage-1 project-only databases remain unsupported. To leave one untouched,
select a fresh task-owned directory rather than resetting it:

```bash
PROJECT_DEV_DATA_DIR="$PWD/.data/stage-4b" bash scripts/dev.sh
```

Use that same override on later starts to retain data in `.data/stage-4b/projects.db`.
Tests always use isolated temporary databases. See the
[database guidance](docs/engineering.md#development-database-schema-changes).

### Using project pages

Click a project name to open its bookmarkable `/#/projects/{id}` page. Use
**Back to projects** to return to the list. Edit the project name and optional
description, then choose **Save project**. Add tasks using **New task**; new tasks
start in **To do**. Edit a task's title, notes, status, priority or due date and choose **Save task**.
Choose **None** to clear a priority, or **Clear due date** and save to clear a date.
New tasks default to None and no due date. Dates display as YYYY-MM-DD with text
labels for incomplete tasks that are overdue or due today.
Changes and completion counts update after a successful save. Failed saves retain
your inputs so you can correct them or retry. Reloading or leaving a page discards
unsaved edits. A missing project provides a message and navigation back to the list.

### Project milestones

Use **Create milestone** within a project to add a required title, optional
description and optional target date. Titles are trimmed; blank titles are rejected.
Milestones appear in creation order (ascending ID). **Edit milestone** changes
those fields; **Clear target date** removes the date when saved. Target dates are
calendar dates and never change task due dates.

Choose a **Milestone (optional)** when adding or editing a project task, then save.
Each task can have one milestone in its own project; **No milestone** clears it.
List rows and board cards show saved membership. **View tasks** filters the existing
task controls to that milestone; the filter also offers all tasks and unassigned
tasks. Switching filters preserves drafts. Project completion always includes all
project tasks; board column counts describe the currently filtered tasks.

Progress counts only saved **Done** tasks. A milestone is complete when it has at
least one task and all assigned tasks are Done. Empty milestones show **No tasks
assigned**. Reopening work or adding an incomplete task updates progress. List and
Board share the saved task state; returning from Today or reloading reads current
tasks and milestones again.

**Remove milestone** asks for confirmation and preserves its tasks in the same
project, with their status, notes, priority, due date and Today selections intact.
Removal and clearing assignments are atomic; a failed operation leaves both intact
and can be retried. Quick capture remains available during milestone saves and
removal. Inbox capture stays title-only; assign milestones after filing items into
a project. Reloading the page refreshes choices if another session removed one.

### Project board

Choose **Board** on a project page to see **To do**, **In progress**, and **Done**
with counts, including empty columns. **List** returns to the existing task forms;
switching views preserves unsaved task and new-task drafts. Each card shows its
saved title, milestone membership, priority and optional due date, with the same due-today/overdue labels
for incomplete tasks. **Edit task** opens and focuses its form in List view.
**New task** remains available in either view. Quick capture lives on the main Projects page.

Drag a card into another column or choose its labeled **Status** control to save
immediately, including reopening Done tasks. The native selector supports keyboard
and touch; on narrow screens columns stack vertically. A drop into the current
column does nothing. Cards sort by task ID within each column; manual ordering is
not supported. List is the default when opening or reloading a project.

Placement and completion counts change only after a successful save. A pending
save disables conflicting controls for that task and the view switch. Failures
leave the last confirmed placement visible with an error so you can retry. Move
results are announced, and keyboard focus follows a moved task unless you have
focused another control. Moves change only status and retain Today selection;
selected Done tasks appear in **Completed today** when Today is visited.
Stage 4A adds no schema, API contract, dependency or database reset.

### Projects home

Projects leads with Quick capture and a compact collection of project links. Choose
**New project** to reveal the labeled creation form; focus moves to Project name.
**Hide form** or Escape closes it without clearing the name while you stay on the
page. Escape returns focus to New project. Creation uses an explicit **Create
project** action, retains text on failure, and appends the saved project on success.
Loading, a failed load with **Retry projects**, and a genuinely empty collection
are distinct. Creation stays disabled until the collection has loaded successfully.
Capture remains usable while projects load or a project operation fails.

### Quick capture and Inbox

**Quick capture** is available only on the main **Projects** page, beneath its heading.
Enter just a title and press Enter or **Capture**. Titles are trimmed; blank titles are
rejected. Successful capture clears and focuses the field for another item. A
failed save keeps the text, and saving disables repeated submissions.

An unfinished capture stays in memory when navigating to another page and returning
to Projects. A pending capture continues while you navigate; failure retains the
text for retry. Unsaved text does not survive a browser reload. Capture is omitted
from individual projects (List and Board), Today, Inbox, and unknown routes.

Open **Inbox** to review unassigned tasks and ideas, newest capture first (higher
ID first when capture timestamps tie). Capture dates display in your local time.
Use **Edit item** to change its title and optional plain-text notes, then **Save
item**. Cancel leaves the saved content unchanged. Save or cancel edits before
moving. **Discard item** asks for confirmation; **Keep item** cancels it.

Choose an existing destination and **Move to project**. The title and notes become
one project task, starting as **To do**, priority **None**, and no due date. A
successful move removes the Inbox item and offers **Open destination project**.
The move is atomic: a rejected destination or database failure leaves the item in
Inbox, and concurrent/repeated moves cannot create duplicate tasks. If a response
is lost after the server commits, refresh Inbox and check Projects before retrying.
When no projects exist, **Create a project** opens Projects; return to Inbox to
organize your saved captures. Today accepts project tasks only, so file an Inbox
item first to set priority, due date, status, or select it for Today.

Captured items, saved edits, discards and moves persist across reloads and API
restarts. Unsaved Inbox edits are lost when leaving or reloading the page; failed
saves and captures that finish while editing do not clear those drafts.

### Planning Today

Use **Projects** and **Today** in the navigation. Choose **Add to today** beside
an incomplete task in a project, or in Today's **Due now** section. Today shows
selected tasks across projects, with their project link, saved status, priority
and optional due date. Change status and choose **Save status** to complete or
reopen a task; project completion counts reflect that saved status. Selected Done
tasks stay in **Completed today**. **Remove from today** only removes that day's
selection; it does not change the task, priority, due date or completion count.

**Due now** contains unselected, incomplete tasks due today or earlier. Selected
and completed rows are excluded so each task appears once. Selected/completed
sections sort by High, Medium, Low, None, then earliest due date (undated last),
then task ID. Due now sorts by earliest due date, priority, then task ID.

Today means the **browser's local calendar date**, sent explicitly to the API;
the API host's timezone is never used. Due dates and selection days are strict
YYYY-MM-DD calendar strings, not timestamps, so they do not shift with timezones.
At local midnight, an open Today page loads the new day's selections. Project
selection controls also refresh. A sleeping tab refreshes on focus/visibility;
a clock/timezone change is also detected within a minute. A stale selection
control cannot write to yesterday after the clock changes. An operation already
sent before midnight belongs to its original day.

Yesterday's selections remain stored for that date but **do not carry forward**.
Unfinished tasks remain in their projects and surface again when due or overdue.
Selection does not reschedule tasks. There is no history UI or automatic carryover.
This is a personal, single-user workflow; accounts and shared access remain future
work. Same-day Today refreshes retain each task's unsaved status, pending save and
failure message even when it moves between sections. Confirmed Today changes remain
visible if the follow-up refresh fails. Project and task drafts,
including the new-task form, remain in place if the midnight refresh fails; use
**Try again** to refresh without losing them. Selection controls stay disabled
until the current day's selections are available. Delayed refreshes cannot undo
successful project/task saves. Navigation or a full reload discards unsaved edits.

Native Windows uses **Git Bash**, bootstrap Node/npm, the pinned native .NET SDK
on PATH, Python 3, and curl. Use the same setup/check/dev commands; setup selects
the project Node/npm tools automatically. It reports missing .NET SDKs instead of
running a Unix SDK installer. Native cache paths and `cygpath -am` SQLite paths
(including spaces) are preserved. Hosted Windows tests a fresh workspace Node/npm
bootstrap in a path with spaces, repeated setup, `bash scripts/build.sh`, and the full
`bash scripts/check.sh` suite, including Python setup regressions. It also runs
development-server smoke checks and `bash scripts/e2e.sh`, covering production
builds and both browser persistence phases with matched Chromium.
`PROJECT_BOOTSTRAP_NODE=true bash scripts/setup.sh` explicitly installs workspace
tools even when host versions match. `PROJECT_NODE_DIR` can select an isolated
tool directory; use the same override for subsequent project commands.
`policy.sh` and `security.sh` require Linux x64 and report that requirement before
downloading tools on Windows. Use their required hosted CI jobs for those checks.
Linux retains ten-run browser qualification; Windows runs one full browser scenario.
Agent execution remains in the cloud, never on the owner's personal computer.

Underlying development commands, in separate terminals from the repository root:

```bash
database_path=$(node -p 'require("node:path").resolve(".data/projects.db")')
ConnectionStrings__Projects="Data Source=$database_path" \
  dotnet run --project src/api/ProjectManager.Api --no-launch-profile \
  --urls http://127.0.0.1:5000
```

```bash
npm --prefix src/web run dev -- --port 5173 --strictPort
```

## Validation and engineering standards

Read [AGENTS.md](AGENTS.md), [engineering standards](docs/engineering.md),
[CI commands and validation matrix](docs/ci.md#local-and-hosted-validation), and the
[PR template](.github/pull_request_template.md) for routine work. The completed
[Milestone 0 plan](docs/milestones/milestone-0.md) provides historical context.
`check.sh` runs lint, complete authored TypeScript/config checking, frontend build,
Vitest V8 coverage, .NET build, xUnit/SQLite/Coverlet, report integrity checks, and
Python attribution/policy regression tests. Its shell cleanup regressions require
Perl (included in Git for Windows and the hosted Linux runners) to exercise
services that ignore SIGTERM on both platforms. `policy.sh` runs Prettier, .NET format,
ShellCheck, actionlint, and policy tests. `security.sh` runs fresh npm/NuGet advisory
checks and redacted Gitleaks scans. Unavailable advisory data is a failing result.

Each production codebase independently enforces **80% lines / 70% branches** after
baseline review and behavioral test improvements. Untested production files remain
included. Standards, tests, thresholds, workflows, and exceptions require
independent human review. Milestone 0 is complete for supervised development; its implementation is approved and merged;
all seven required jobs pass on the resulting main commit. CODEOWNERS names
Joshbomb75 for all files. Ten exact historical artifact-hash exclusions are active,
with review due **November 9, 2026 at 4 p.m. Pacific**, tracked in
[issue #17](https://github.com/Johnson-Dev-Agent-Management/project-manager/issues/17).
The owner-provided protection export confirms required reviews and up-to-date
checks; full credential isolation remains deferred. See the [current closeout report](docs/milestones/milestone-0-closeout-report.md)
for verified controls, remaining evidence and the exception register.

```bash
# Build frontend production output and publish Release API, then test both phases:
bash scripts/e2e.sh
# CI always qualifies ten runs; also use locally for harness/reliability changes:
bash scripts/e2e-qualify.sh
```

E2E owns loopback ports 5001/5174, rejects occupied ports, verifies the build/proxy,
and tests project/task validation, trimming, edits, status transitions, completion
counts, cross-project isolation, daily selection across projects, due-date display,
completion/reopening in Today, direct-page reload, and API restart persistence.
It cleans up its processes/database and retains each run's diagnostics/screenshots
under ignored `.artifacts`. CI uses matched Chromium; restricted cloud runs report
any system Chromium fallback explicitly. There are no browser retries.

Record each task's commands/results, current CI links, and handoff state in its PR.
Update this README for durable setup/usage changes rather than per-task test logs.
Historical M0 commands, counts, coverage, tested commits, security results,
screenshots, CI links, and risks are in the
[M0 closeout report](docs/milestones/milestone-0-closeout-report.md).
[Phase A](docs/milestones/milestone-0-phase-a-report.md) and
[Phase B](docs/milestones/milestone-0-phase-b-report.md) reports are historical snapshots.
See [cloud setup](docs/cloud-setup.md) for historical environment context.

## Pull request attribution

Use the [PR template](.github/pull_request_template.md) and distinguish Passed,
Failed, and Not run checks. AI implementations include exactly one standalone
`Implementation type: AI` field and `Implementation author: Codex Cloud` (or the
actual agent), plus the `AI-authored` label. See [attribution](docs/pr-attribution.md)
for metadata-only labeling and its limits. Attribution does not establish
independent approval. Owner merging remains separate; the Apache license is unchanged.
