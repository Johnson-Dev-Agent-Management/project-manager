# Graphite + teal foundations

The owner selected **C1: Graphite + Teal** on November 4, 2026. Use a dark,
compact workspace with restrained teal accents, readable type, and clear action
priority. The goal is a calm personal place to manage projects and collect ideas.

These foundations implement steps 1–2 of the design plan. Existing pages inherit
the theme and control styles. Steps 3–4 apply them to Projects: capture beneath
the heading, compact project links, on-demand creation, and explicit load/retry
states. Capture appears only on Projects, with its draft retained across in-app
navigation. Compact task summaries and other page refactors remain later work.
Do not infer new workflows from the concept mockups.

## Sources of truth

- [tokens.css](../../src/web/src/ui/tokens.css): semantic colors, typography,
  spacing, sizes, radii, focus, and motion preferences.
- [foundations.css](../../src/web/src/ui/foundations.css): native elements and
  reusable action/navigation states. It imports the tokens.
- [style.css](../../src/web/src/style.css): existing page-specific layouts,
  importing the foundations. Feature styles consume tokens instead of copying hex values.
- [Component reference](foundations.html): a small live specimen using the actual
  foundation stylesheet. It has no application data or persistence.

Preview the reference from the repository root in an authorized cloud workspace:

```bash
python3 -m http.server 5180 --bind 127.0.0.1
# http://127.0.0.1:5180/docs/design/foundations.html
```

## Visual language

| Role              | Token                    | Value / use                                                   |
| ----------------- | ------------------------ | ------------------------------------------------------------- |
| Page              | `--color-canvas`         | `#191c23` graphite                                            |
| Surface           | `--color-surface`        | `#22262f` forms and cards                                     |
| Raised surface    | `--color-surface-raised` | `#2b313c` optional elevated regions                           |
| Navigation        | `--color-navigation`     | `#14171e` dark shell regions                                  |
| Primary text      | `--color-text`           | `#ebedf4`                                                     |
| Supporting text   | `--color-text-muted`     | `#a8b1c3`; never lower opacity for ordinary text              |
| Dividers          | `--color-border`         | `#3b4351`; decorative grouping, not the only control boundary |
| Control boundary  | `--color-control-border` | `#8593a8`; distinct from subtle dividers                      |
| Brand/action      | `--color-accent`         | `#63cbb7` teal                                                |
| Selected surface  | `--color-accent-surface` | `#203c38`                                                     |
| Text on teal      | `--color-on-accent`      | `#102923`; do not put white small text on teal                |
| Error/destructive | `--color-danger`         | `#ffa399` coral; include explanatory text                     |
| Success           | `--color-success`        | `#a3d5a7`; reserve for confirmed success                      |
| Warning           | `--color-warning`        | `#e4b36f`; reserve for caution                                |

Keep most surfaces neutral. Use teal for the current destination, primary action,
progress, and focus. Status meanings remain distinct from the brand color. Avoid
purple accents, gradients, glow, decorative charts, and color-only state cues.
A loading message is not success; do not style every live region green.

Use the system sans-serif stack. Body and form text is 16 px at the default root
size, supporting text 14 px, page titles 32 px, sections 24 px, and subheadings
18 px. Body line height is 1.5; headings use 1.25. Use 400/600/700 weights. Keep
browser text scaling available; controls use rem units and text wraps.

The spacing scale is 4, 8, 12, 16, 24, 32, and 48 px. Use tokens for gaps and
padding. Controls have a 6 px radius; surfaces 8 px. Frequent controls are at least
44 px high. Dense content should use compact rows, not tiny text or cramped targets.
Current content containers are 48 rem including gutters; boards may use 78 rem.
Projects uses the content width for its heading, capture, and collection; other
page compositions retain their existing widths.
The existing board stacks below 52 rem; CSS custom properties do not work in media
query conditions, so that breakpoint remains a documented literal.

## Native control patterns

Use semantic HTML, existing handlers, and native `disabled` behavior. These CSS
patterns are the shared primitives; no component library or wrapper is required.
Use links for navigation and buttons for actions. State the button type explicitly
in new code: form commits use `submit`; other actions use `button`.

```tsx
<button type="submit">Save task</button>
<button type="button" data-variant="secondary">Edit task</button>
<button type="button" data-variant="quiet">Clear due date</button>
<button type="button" data-variant="danger">Confirm discard</button>
```

Default/`primary` is a filled teal commit action. Secondary is outlined for editing,
retry, or selection. Quiet is low-emphasis for optional controls and opening a
confirmation. Danger is a filled coral confirmation for a destructive action.
Cancel/Keep stays secondary. Limit strong emphasis to the current commit action;
existing forms retain their saves until the editing redesign.

Hover and active states preserve text contrast. `:disabled` covers both directly
disabled controls and descendants of a disabled fieldset; use the dedicated colors,
not opacity. A disabled control has a not-allowed cursor. Pending operations must
still show their existing saving text, prevent duplicate submissions, and retain
inputs on failure. Styling never supplies save behavior or replaces native semantics.

Inputs, textareas, and selects share borders, typography, padding, placeholder,
readonly, disabled, and focus styles. Use a visible associated label. Supporting
text can use `.form-hint`; link it with `aria-describedby`. For an established
validation error, use `aria-invalid="true"` plus explanatory text linked by
`aria-describedby` (or the appropriate live error region). `.field-error` and
`role="alert"` use the danger color. Keep checkbox/radio dimensions native.

```tsx
<label htmlFor="task-title">Task title</label>
<input id="task-title" aria-invalid="true" aria-describedby="title-error" />
<p id="title-error" className="field-error">Enter a task title.</p>
```

The `.button-row` utility wraps related actions with consistent gaps. Preserve a
logical DOM/tab order. Do not use CSS reordering to contradict that order.

## Navigation and focus

Use `.app-nav` on a labeled `nav` with ordinary anchors and `aria-current="page"`
on the active destination. The active state combines a tint, stronger text, and
an underline. Navigation wraps on narrow screens. The production app retains its
compact top navigation for its three destinations; a sidebar is not needed for
the Projects pilot.

List/Board buttons retain `aria-pressed`; the same foundation styles express their
selected/unselected states. Do not remove the accessible status selector from
draggable cards. Keep labels and status/error announcements intact.

Keyboard focus has a 3 px teal outline with a 3 px offset. Never remove outlines or
clip them inside containers. Native `details`/`summary` stays keyboard operable.
Color feedback transitions last 120 ms and become immediate with reduced motion.
Forced-colors mode uses system colors; control borders and the current-nav underline
remain visible. Native date/select popovers use the dark color scheme.

## Checks for future UI changes

Review at desktop and 390/320 px widths, with long names, keyboard navigation,
200% zoom/text growth, reduced motion, and forced colors. Normal text needs at
least 4.5:1 contrast; meaningful control boundaries and focus indicators need 3:1
against their adjacent backgrounds. The selected dark text on teal is intentional.
Check actual rendered combinations, including hover and selected states.

Keep empty, loading, error, saving, and success states distinguishable. Preserve
saved-state counts, draft retention, explicit confirmations, and retry behavior.
Use existing behavioral suites for changes to interactions; do not add tests that
merely assert a particular class name or copy the token values. Record browser
inspection and measured contrast with the PR. This guide is not a declaration of
complete accessibility conformance.
