---
name: mark-winners
description: Mark the winners on `index.html` and sort them to the top of their category. User provides a `Category: Winner` mapping (often copied from a Trello card / GitNation announcement). For each winner the skill adds class `winner` to its `<li>`, moves that `<li>` to first position in its category's list, and renumbers `data-aos-delay` (100, 200, 300, …). Descriptions, logos, and structure are left untouched. Works for `javascript/` and `react/` folders. Use when user says "mark winners", "проставь победителей", "пометь победителей", "update winners", or pastes a list of category → winner pairs.
---

# Mark winners

Mark announced winners on `<folder>/index.html` and sort each winner to the top of its category. This is **stage 4** of the annual update flow (`update-nominees` builds structure, this marks winners, `archive-winners` archives them at year end).

Marking a winner is **three edits per winner, not one**:

1. Add the `winner` class to the winning `<li>`.
2. **Move that `<li>` to the first position** in its category's `<ul class="nominees-list">`. Winners always render first in their category (matches the historical commit "move them to first position in their category"). Skipping this is the most common mistake.
3. **Renumber `data-aos-delay`** on every `<li>` in that category so the sequence stays `100, 200, 300, …` top-to-bottom after the move. The winner becomes `100`; everyone else shifts down one slot.

This skill does ONLY that. It does not touch descriptions, logos, the year heading, or any other file.

## Input format

The user gives a category → winner mapping, e.g. (often pasted from a Trello card or GitNation announcement):

```
Breakthrough of the Year: TanStack Start
Most Exciting Use of Technology: TypeGPU
Productivity Booster: Biome
Most Impactful Contribution to the Community: ZurichJS
AI Project of the Year: TanStack AI
Fun Side Project of the Year: Popcorn
React Highlights: React Doctor
```

Parsing is tolerant: `:` or ` - ` or `—` as the separator, extra whitespace, bullet markers all fine. A line is `Category: Winner`.

## Step 1 — Determine the folder

Default `javascript/`. If the user names `react/` or "both", honor it.

A single announcement can contain winners for categories that live in **different folders**. Apply each winner to whichever folder's `index.html` actually contains that category. If a category from the input isn't found in the target folder, report it (it may belong to the other folder or be stale) rather than forcing it in.

## Step 2 — Resolve each winner to exactly one `<li>`

For each `Category: Winner` pair:

1. Find the category: the `<section class="sec-nominees">` whose `<h4 class="section__sub-title">` matches the category name.
   - Match tolerantly — the site heading may have a leading "The" that the input omits (input "Most Exciting Use of Technology" ↔ heading "The Most Exciting Use of Technology"). Case-insensitive.
2. Find the winner inside that category's `<ul class="nominees-list …">` by its `<h5 class="nominees-list__title">`, case-insensitive.

If a category or winner name does NOT resolve to exactly one `<li>`, **stop and ask** — do not guess.

## Step 3 — Apply the three edits per winner

For each resolved winner:

1. **Add `winner` class**: `class="nominees-list__item"` → `class="nominees-list__item winner"`. Preserve any existing extra classes and trailing space.
2. **Move** the whole winning `<li>…</li>` block to be the first child of its `<ul>`, before the previously-first `<li>`. Move the entire element including its `data-aos*` attributes and inner markup.
3. **Renumber** `data-aos-delay`: walk the `<ul>`'s `<li>` children top-to-bottom and set `data-aos-delay` to `100, 200, 300, 400, …` in order. Delays are independent of the `winner` class — only the winner keeps `winner`, but every row gets its correct sequential delay.

Categories with no winner in the input are left completely untouched.

### Example (Breakthrough category, before → after)

Before — winner is third:

```html
<ul class="nominees-list breakthrough-slider">
  <li class="nominees-list__item" data-aos="fade-up" data-aos-delay="100"> … Valdi … </li>
  <li class="nominees-list__item" data-aos="fade-up" data-aos-delay="200"> … Ripple … </li>
  <li class="nominees-list__item" data-aos="fade-up" data-aos-delay="300"> … TanStack Start … </li>
</ul>
```

After — winner moved to top, `winner` class added, delays renumbered:

```html
<ul class="nominees-list breakthrough-slider">
  <li class="nominees-list__item winner" data-aos="fade-up" data-aos-delay="100"> … TanStack Start … </li>
  <li class="nominees-list__item" data-aos="fade-up" data-aos-delay="200"> … Valdi … </li>
  <li class="nominees-list__item" data-aos="fade-up" data-aos-delay="300"> … Ripple … </li>
</ul>
```

## Edge cases

- **Two winners named for one category**: stop and ask — the layout assumes one winner per category.
- **Winner `<li>` already has `winner`** (re-running the skill): idempotent — still verify it's first in the list and delays are sequential; fix if not.
- **A row uses a stagger attribute other than `data-aos-delay`**: renumber whatever that row already uses; don't add attributes that weren't there.
- **Winner already at position 1**: just ensure the class is present and delays are correct; no move needed.

## Step 4 — Report

- Per category: winner marked + moved (e.g. "Breakthrough of the Year → TanStack Start ✅ moved 3→1", or "→ ZurichJS ✅ already first").
- Categories in the input not found in this folder (listed).
- Categories present in the file with no winner supplied (left as-is).
- Reminder: run `archive-winners` at end of year to generate the `<year>.html` page.

## Files touched

- EDIT: `<folder>/index.html` — `class` + `data-aos-delay` attributes and `<li>` ordering inside `<section id="nominees">`. Nothing else.
- DO NOT TOUCH: descriptions, logos, year heading, css, archive pages, the other folder (unless its categories are part of the input).
