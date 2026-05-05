---
name: archive-winners
description: Archive a finished year of OS Awards. Reads winners (items with class `winner`) from the current `index.html`, generates `<year>.html` showing only winners, and adds the new year to the archive menu of all existing year pages. Works for `javascript/` and `react/` folders. Use when user says "archive winners", "create archive page for <year>", "вынести победителей на отдельную страницу", or after winners have been announced for a finished year.
---

# Archive winners

Archive a finished year by generating a `<year>.html` page from the winners marked in `index.html`, and update the archive menu on all existing year pages.

## Usage

Triggered by phrases like "archive winners for 2026", "create the 2026 archive page", "вынеси победителей на отдельную страницу".

If the user names a folder (`javascript`, `react`, both), use it. Otherwise default to `javascript/` and ask whether to also do `react/`.

## What it does NOT do

- Doesn't modify `index.html` (no nominee removal, no "Previous years" link change).
- Doesn't download or generate logos.
- Doesn't trigger build/deploy.

## Step 1 — Determine the year

Read the title in `<folder>/index.html`:

```
<h3 class="section__title" ...>2026 Nominees</h3>
```

That number is the **target year**.

Validate:
- Target year ≤ current calendar year. If future, stop and ask.
- `<folder>/<target_year>.html` does NOT exist. If it does, stop and ask whether to overwrite.
- The latest existing archive in the folder is `target_year - 1` (or earlier if a year was skipped). If unexpected gap, warn but proceed on confirmation.

If user passes a year explicitly, validate against the heading and ask if they differ.

## Step 2 — Collect winners from `index.html`

In `<section class="section nominees" id="nominees">`, walk each category. A category is a `<div class="section__desc slider-nav-wrap">` block (with `<h4 class="section__sub-title">` and `<p class="section__p">`) followed by a `<ul class="nominees-list ...">`.

For each category, find the `<li>` whose class list contains `winner` (whole-word match — note the trailing space in some markup like `class="nominees-list__item "`).

For that winning `<li>`, record:
- Category title (from `<h4 class="section__sub-title">`)
- Category description (from `<p class="section__p">`)
- The whole `<li>` markup — you'll reuse its inner data fields below

The fields inside a `<li>` are always: `<img>` (src + alt), `<h5 class="nominees-list__title">` (project name), `<a>` inside `<p class="nominees-list__link">` (href + text), `<p class="nominees-list__desc">` (description).

If a category has no winner, skip it and **report it at the end** ("Category X — no winner, not archived").
If a category has multiple winners, take the first and warn about the others.
If `index.html` has zero winners total, stop with an error.

## Step 3 — Build `<year>.html` from a template

Copy the most recent existing archive in the same folder (e.g. `2025.html`) to `<target_year>.html`, then make these targeted edits.

**The HTML structure of an archive page is already correct in the template — don't rewrite blocks, just replace data inside them.**

### 3a. `og:url` meta tag

Find the `<meta property="og:url" content="https://osawards.com/<folder>/YYYY">` and update only the `YYYY` segment to the target year. Keep folder slug as-is.

### 3b. Archive menu — desktop `<ul class="archive-list">` and mobile `<div class="archive-list" data-flickity=...>`

The currently-active item is the previous year (the year of the template file). Two changes:

1. Change the previously-active item to a normal link:
   - Remove the ` active` from the class list.
   - Change `href="#"` to `href="/<folder>/<previous_year>"`.
2. Insert a new active item at the top with the target year and `href="#"`.

The desktop list uses `<li>`, the mobile flickity uses `<div>` — same fields, same transformation.

### 3c. Replace winners in `<ul class="winners">`

Inside `<section class="section archive">`, the `<ul class="winners">` already exists in the template with the previous year's winners. Replace its inner content with one `<li class="winners__item">` per winner from Step 2, in the same category order as `index.html`.

To build each `<li class="winners__item">`, **reuse the existing template block** as-is and substitute these fields with values from Step 2:
- `<h3 class="section__sub-title">` → category title
- `<p class="section__p">` → category description
- `<img src=... alt=...>` → winner's image
- `<h3 class="winners__winner-title">` → winner's project name
- `<a href=...>...</a>` inside `<p class="winners__winner-link">` → winner's link
- `<p class="winners__winner-desc">` → winner's description

Do not invent new wrapper markup. Do not add inline styles like `style="margin-bottom: 40px;"` even if the template has them on a single item — strip those.

Image `src` in `index.html` looks like `pic/<target_year>/Foo.svg`. Use it verbatim — it stays valid in the archive page (same folder depth).

## Step 4 — Update older archive pages' menus

The archive menu is duplicated in every `<folder>/YYYY.html` (no shared template — yet). For every existing year page, insert the new target year into BOTH menus:
- Desktop: `<ul class="archive-list">` (uses `<li>` items)
- Mobile flickity: `<div class="archive-list" data-flickity=...>` (uses `<div>` items)

The new year goes **at the top** as a non-active link. Active item in each older page stays whatever it was — only the list grows.

### Concrete example

Suppose target year is `2026`, folder is `javascript`. Take `2024.html` — its archive menus look like:

```html
<ul class="archive-list">
  <li class="archive-list__item"><a class="archive-list__link" href="/javascript/2025">2025</a></li>
  <li class="archive-list__item active"><a class="archive-list__link" href="#">2024</a></li>
  <li class="archive-list__item"><a class="archive-list__link" href="/javascript/2023">2023</a></li>
  ...
</ul>
```

After update:

```html
<ul class="archive-list">
  <li class="archive-list__item"><a class="archive-list__link" href="/javascript/2026">2026</a></li>
  <li class="archive-list__item"><a class="archive-list__link" href="/javascript/2025">2025</a></li>
  <li class="archive-list__item active"><a class="archive-list__link" href="#">2024</a></li>
  <li class="archive-list__item"><a class="archive-list__link" href="/javascript/2023">2023</a></li>
  ...
</ul>
```

Same change for the mobile flickity block (just `<div>` instead of `<li>`).

The new line you insert always looks exactly like:

```html
<li class="archive-list__item"><a class="archive-list__link" href="/<folder>/<target_year>"><target_year></a></li>
```

(swap `<li>` for `<div>` in the mobile block).

Skip the `<target_year>.html` you just wrote in Step 3 — its menu was already built correctly there.

### Note about future templating

This duplication exists because the menu isn't templated yet. Future work might extract it into a shared partial (nunjucks/file-include) — when that happens, this step collapses to "edit one partial". For now, manually update each file.

## Step 5 — Report

- New file path written.
- Number of winners archived; categories skipped (no winner) listed by name.
- List of archive files updated.
- Reminder: `index.html` was not touched.

## Folder slugs

- `javascript/` → URLs use `/javascript/...`
- `react/` → URLs use `/react/...`

If user asks for both, do `javascript/` first then `react/`. Report each independently.
