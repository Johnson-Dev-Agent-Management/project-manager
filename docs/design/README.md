# Design audit and direction brief

Status: focused audit and provisional concepts, November 4, 2026.
The owner has not selected a visual direction. This brief informs future UI work;
it does not change the running application or supersede engineering standards.

## Product intent and settled preferences

This is a personal workspace for managing projects and collecting thoughts and
ideas. The owner wants a polished, modern experience and values quick capture.

- Keep capture fast: a title is enough; organizing can happen later.
- **Show Quick capture on the main Projects page only.** Its presence on individual
  projects, Today, and Inbox adds unwanted clutter. This is the owner's requested
  direction; the current app still renders it globally.
- Make projects easy to return to, ideas easy to find, and daily work easy to scan.
- Keep Projects, Today, and Inbox as understandable destinations.
- Decide the visual direction through examples before standardizing a theme.

A useful definition of polished here: consistent alignment, readable hierarchy,
clear action priority, predictable interactions, and visible save/failure states.
Modern can mean restrained surfaces, responsive layouts, and controls revealed at
useful moments. A dark palette, rounded cards, or a particular font is a preference,
not a prerequisite.

## Audit basis

Screenshot evidence is retained in the local audit artifacts; it is excluded from
the published brief pending authorization to publish application imagery. The
source references below are reviewable without those screenshots.

Reviewed baseline `a1b1ccb799b30b838e7b9495dd0253b1d69993b7` (merged Stage 4B):
Projects, a project in List and Board, Today, Inbox, and project-list empty/error
states. Used three synthetic projects, six tasks, one milestone, and three Inbox
ideas in an isolated development database. Screenshots use a controlled browser
calendar day of November 4, 2026 in America/Los_Angeles; captured timestamps come
from the development API. These are synthetic examples, not the owner's data.

Inspected the actual React app through Playwright with system Chromium 151.0.7922.173
(the cloud fallback, not Playwright's matched browser). Desktop viewport:
1440 × 1000; mobile Projects/project: 390 × 844; narrow Projects: 320 × 800.
Read the shared CSS, route composition, page components, and interaction code.
This is an expert review with selected rendered-state checks, not a user study,
a complete accessibility audit, or a production-browser certification.

## What works well

- The three main destinations and List/Board view names are plain and understandable.
- Quick capture already supports title-only input, Enter submission, clear success
  feedback, refocusing after success, and retained text after failures.
- Saved state drives completion counts. Pending operations and failures have
  explicit feedback; useful draft-preservation behavior already exists.
- Labels, native controls, focus outlines, alert/status announcements, and a
  non-dragging status control establish useful accessibility foundations.
- Milestone creation and Inbox editing already demonstrate selective disclosure.
  Extend that pattern to the rest of the application.

## Findings and priorities

High means a direct obstacle to the main personal workflow. Medium means a
consistency or scaling problem worth addressing with the design foundations.
These are design priorities, not security or release severities.

| Priority | Finding and evidence                                                                                                                                                                                                                                                                                                                                                                                                                              | Recommended direction                                                                                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| High     | Quick capture is part of the shared navigation fragment in [App.tsx](../../src/web/src/App.tsx), above every destination and even unknown routes. It occupies about 155 px before page spacing on desktop.                                                                                                                                                                                                                                        | Place one compact, labeled capture composer beneath the Projects heading. Show a clear Inbox destination and success feedback. Omit capture from all other routes.                                                                         |
| High     | A project opens in editing mode: project name/description, milestone controls, then a complete form for every task. With just six tasks and one milestone, the Tasks heading starts at about y=1111 and the document is about 6836 px tall at 1440 px wide. Sources: [ProjectPage](../../src/web/src/projects/ProjectPage.tsx), [ProjectTasks](../../src/web/src/projects/ProjectTasks.tsx), [TaskForm](../../src/web/src/projects/TaskForm.tsx). | Show a readable project summary, compact milestone summary, and task rows first. Open an editor for the chosen item. Preserve explicit saves and drafts; keep New task and Board discoverable.                                             |
| High     | Inbox repeats a full destination form and prominent Edit/Discard buttons for every idea. [InboxRow](../../src/web/src/inbox/InboxRow.tsx).                                                                                                                                                                                                                                                                                                        | Lead with the idea title and a short notes preview. Reveal organization controls for the selected item. Give discard lower visual emphasis while retaining confirmation.                                                                   |
| High     | A captured idea becomes a task when moved into a project. The app has no project-level home for a thought that should remain a thought. [Inbox API](../../src/web/src/inbox/api.ts).                                                                                                                                                                                                                                                              | Treat this as an open product decision: would project notes or a later Ideas collection help? Preserve today's model during visual work; do not silently introduce a new content type.                                                     |
| Medium   | Almost every button uses the same filled blue style, including Save, Clear date, Remove, and Keep. [Shared CSS](../../src/web/src/style.css).                                                                                                                                                                                                                                                                                                     | Establish primary, secondary, quiet, and destructive action treatments. Keep primary emphasis for the current commit action. Use text as well as color to explain consequences.                                                            |
| Medium   | The Projects page gives the create form more space than the projects themselves, which are bare bullet links. [ProjectList](../../src/web/src/projects/ProjectList.tsx).                                                                                                                                                                                                                                                                          | Lead with capture and a readable project collection. Open project creation on demand. Cards or rows can work; choose based on density and preference.                                                                                      |
| Medium   | Today repeats status text, a status label, a select, and a save action for each item. Several introductory paragraphs precede the work. [TodayPage](../../src/web/src/today/TodayPage.tsx).                                                                                                                                                                                                                                                       | Give selected tasks the strongest hierarchy; make due and completed work quieter. Keep a short explanation of the midnight reset. Put detailed sorting rules in optional help. Standardize save semantics explicitly before changing them. |
| Medium   | List uses a 46 rem content width; Board changes the whole main area to 76 rem while navigation and capture stay narrow. Header alignment shifts by 240 px at the inspected desktop width. [CSS](../../src/web/src/style.css).                                                                                                                                                                                                                     | Keep the app shell and page header stable while granting the board more working space. Define a small set of layout widths and shared tokens.                                                                                              |
| Medium   | A failed Projects load displays both “Could not load projects.” and “No projects yet.”, with no list retry control. The same error state also serves create failures. [ProjectList](../../src/web/src/projects/ProjectList.tsx).                                                                                                                                                                                                                  | Distinguish loading, load failure, empty, and populated states. Provide an explicit retry for load failure and keep create errors local to creation. This is a separate behavior fix.                                                      |

At 390 px wide, the project Tasks heading was about y=1219. The inspected Projects
and project layouts did not horizontally overflow at 390 px; Projects also fit
at 320 px. The main mobile concern observed is the long sequence of forms, not
an established general reflow failure.

## Three visual directions

Open the [interactive comparison](directions.html?compare=1) to view the three
concepts side by side. The HTML also supports exploring each direction at full size.

Explore [directions.html](directions.html) in a browser. It is a self-contained
concept preview with no external fonts, assets, dependencies, or network data calls.
It supports theme switching, navigation among Projects/project/Today/Inbox,
opening task notes, and sample capture/project creation. Sample changes live only
in memory and reset on reload. It is outside the production app.

If a browser blocks local HTML files, use the authorized cloud workspace:

```bash
python3 -m http.server 5180 --bind 127.0.0.1 --directory docs/design
# Preview: http://127.0.0.1:5180/directions.html
# Comparison: http://127.0.0.1:5180/directions.html?compare=1
```

| Direction          | Feel and ingredients                                                                     | Best fit                                              | Tradeoff                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| A · Calm workspace | Soft white, restrained blue, system sans-serif, moderate spacing, distinct project cards | A balanced home for projects, daily work, and capture | Cards take more space as the project count grows; a list may eventually be better           |
| B · Warm notebook  | Warm paper, forest green, serif page headings, sans-serif controls, simple project rows  | A personal thinking space with a reflective tone      | More generous spacing; serif headings need care with long names                             |
| C · Dark studio    | Graphite, lavender, sans-serif, compact rows, subtle separators                          | Frequent scanning and a tool-like feel                | Dark appearance and tighter density are preferences, not universal readability improvements |

**Recommendation to discuss:** start with A's structure and restraint. Borrow B's
warmer surfaces if the cool white feels too administrative. Keep comfortable task
rows even if C's colors appeal. Palette, density, typography, and navigation can
be selected independently; these concepts are starting points, not fixed bundles.

All three use the same information architecture so comparison stays useful.
The sample desktop sidebar is a proposal, not a requirement; a compact top bar
could be enough for the current three destinations. Mobile uses a visible top nav.

The [calm project example](directions.html?theme=calm&view=project) shows how compact
summaries bring tasks forward. The preview intentionally omits full task editing,
Board, milestone management, server requests, and their failure states. Production
must retain those capabilities. Project descriptions and Inbox counts shown on
Projects would require deliberate data-loading/API work: the current project-list
endpoint returns only IDs and names. Do not copy preview data assumptions into
production or add an unbounded request per project.

## References and what to borrow

These are primary product/design references, reviewed November 4, 2026.
They inform the concepts; they are not a request to clone a product or buy it.

- [Things: design and task details](https://culturedcode.com/things/features/):
  concise task summaries and optional detail fields. Useful for reducing the
  current always-open forms without making editing hard to discover.
- [Linear: redesigning the application UI](https://linear.app/now/how-we-redesigned-the-linear-ui):
  consistent navigation, aligned headers, and reduced visual noise. Useful for
  the app shell and List/Board transitions; team-management features are not needed.
- [Bear: writing and organization](https://bear.app/): a reference for a calm,
  personal writing environment. Useful when thinking about longer notes and ideas.
- [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html):
  normal text needs 4.5:1 contrast; qualifying large text needs 3:1. Muted text must
  remain readable in every theme.
- [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html):
  WCAG 2.2 AA specifies 24 × 24 CSS px targets, with defined exceptions including
  spacing. Prefer roughly 40–44 px high frequent controls for this app's comfort;
  that preference is not a restatement of the AA minimum.

## Refactoring sequence after choosing a direction

1. **Capture placement and page states.** Limit capture to Projects; keep its
   validation, retained text, feedback, and refocus behavior. Update the Inbox
   empty state to link back to Projects. Revisit navigation with an unsaved
   capture draft. Update README and affected unit/browser tests, which currently
   expect capture on other pages. Separately fix the misleading load/empty state.
2. **Design foundations and Projects pilot.** Define semantic color, spacing,
   typography, radius, focus, and layout tokens. Build shared page headers and
   action variants. Apply them to Projects and its loading/empty/error states.
3. **Project/task readability.** Replace permanently expanded forms with task
   summaries and explicit editors. Keep New task, List/Board, milestone actions,
   status, priority, due date, and Today selection available. Preserve drafts on
   view/filter changes and the current saved-state/race protections.
4. **Today and Inbox.** Reuse those patterns for focused daily work and idea
   organization. Keep confirmations and failure recovery close to each action.
5. **Document the proven standards.** Promote chosen tokens and demonstrated
   component/state examples into a short design guide, linked from AGENTS.md.
   A guide is more reliable once tested on a representative feature.

For each implementation, review real screens at desktop and narrow widths,
keyboard focus/order, long content, empty/loading/error/saving states, and content
contrast. Keep board keyboard/touch alternatives. Verify the existing meaningful
behavior tests and add targeted coverage when interactions change. Screenshots
support review; they do not establish accessibility compliance or persistence.

## Decisions for the next discussion

1. Which feels most natural to open every day: A, B, C, or a combination?
2. Would you prefer roomy project cards or a more compact project list?
3. Should thoughts remain in Inbox until actionable, or eventually have a home
   inside a project without becoming tasks?

Only the first decision is needed to begin a small visual pilot. The third can
remain open while the existing capture and project workflows are improved.
