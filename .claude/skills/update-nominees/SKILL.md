---
name: update-nominees
description: Replace the nominees on `index.html` with a fresh year's list. User provides a plain-text list of categories with project names and GitHub links. Skill rewrites the `<section id="nominees">` block with new categories and projects, updates the year heading, sets all images to the placeholder `pic/project_dummy.jpg`, and leaves description fields and winner classes empty (those are filled in by separate later steps). Works for `javascript/` and `react/` folders. Use when user says "update nominees", "replace 2025 nominees with 2026", "обновить номинантов", or pastes a categorized list of projects.
---

# Update nominees

Replace the `<section id="nominees">` content in `index.html` with a new year's nominees list provided by the user as plain text.

This skill is **stage 1 of an annual update flow**:

1. **`update-nominees` (this skill)** — rebuild structure with new categories and projects. Logos = placeholder, descriptions = empty, no winners.
2. **(later) descriptions** — user pastes descriptions per project; we fill `<p class="nominees-list__desc">`.
3. **(later) logos** — user drops files into `pic/<year>/`; user (or another skill) updates `<img src>`.
4. **(later) winners** — separate command marks chosen projects with class `winner`.
5. **(end of year) `archive-winners`** — generates `<year>.html` from winners.

This skill does only step 1.

## Input format

User provides a plain-text list. The expected shape is:

```
Category Name

Project Name - https://github.com/owner/repo

Another Project - https://example.com/path

Next Category Name

Foo - https://github.com/foo/foo
...
```

Parsing rules:
- A line containing ` - http` (or ` — http`) is a **project line**: `Name - URL`.
- A line that is non-empty and is NOT a project line is a **category title**.
- Empty lines are separators only.
- Be tolerant: extra whitespace, en/em dashes, `https://` vs `http://`, URLs without trailing slashes — all fine.

If the input is ambiguous (e.g. a line that could be a category but appears between two projects of the same category), ask the user to clarify before proceeding.

## Step 1 — Determine the target folder and year

**Folder**: default `javascript/`. If the user names `react/` or "both", honor it. If "both", run twice with the same input — but warn the user that the same project list rarely makes sense for both ecosystems and ask to confirm.

**Year**: read the current heading in `index.html`:

```html
<h3 class="section__title" data-aos="fade-left">2025 Nominees</h3>
```

The new year is `current_heading_year + 1` by default. If the user says a specific year, use that.

Sanity: target year should not be more than 1 year ahead of current calendar year. If it is, ask.

## Step 2 — Validate

- Confirm `<section class="section nominees" id="nominees">` exists in `index.html`.
- Confirm the input has at least one category and at least one project total.
- If a project has no URL or no name, stop and ask.

### If the section is HTML-commented out

Sometimes the whole `<section class="section nominees" id="nominees">` is wrapped in `<!-- ... -->` (e.g. it was hidden between announcements). **Always uncomment it** as part of this skill — the new nominees should be visible. Strip the surrounding `<!--` before the `<section>` and the matching `-->` after `</section>`. Don't ask first; this is the default behavior.

## Step 3 — Update the year heading

Change the `<h3 class="section__title">` text from `<previous_year> Nominees` to `<target_year> Nominees`. Don't touch its attributes (`data-aos`, etc.).

## Step 4 — Rewrite the nominees section

Replace everything inside `<section class="section nominees" id="nominees"> <div class="container">` from the closing `</div>` of the title `slider-nav-wrap` block down to the end of the last category `</section>` (i.e. the last `<section class="sec-nominees">…</section>` block). The outer `<section id="nominees">` and its title `slider-nav-wrap` stay intact.

The existing structure to use as a template (per category). Each category is wrapped in its own `<section class="sec-nominees">`:

```html
          <section class="sec-nominees">
            <div class="section__desc slider-nav-wrap">
              <div class="slider-nav-wrap__left">
                <h4 class="section__sub-title" data-aos="fade-left">{{Category Name}}</h4>
                <p class="section__p" data-aos="fade-in">
                  {{Category description — leave EMPTY for now, we'll fill later. Just keep an empty <p>.}}
                </p>
              </div>
            </div>

            <ul class="nominees-list {{slider-class}}">
              {{one <li> per project}}
            </ul>
          </section>
```

The outer `<section class="section nominees" id="nominees">` holds the year heading and a `<div class="container">` that contains one `<section class="sec-nominees">` per category. Do NOT skip the per-category wrapper — it's used for layout styling.

Per project `<li>`:

```html
            <li class="nominees-list__item" data-aos="fade-up" data-aos-delay="{{delay}}">
              <div class="nominees-list__img-box">
                <img src="pic/project_dummy.jpg" alt="{{Project Name}}" />
              </div>

              <h5 class="nominees-list__title">{{Project Name}}</h5>
              <p class="nominees-list__link">
                <a href="{{URL}}" target="_blank">{{display URL}}</a>
              </p>
              <p class="nominees-list__desc">
              </p>
            </li>
```

Field rules:
- `data-aos-delay`: `100`, `200`, `300`, `400`, `500`, `600`, ... incremented by 100 per project within a category. Reset to `100` for the first project of each category.
- `<img src>`: always `pic/project_dummy.jpg` (the existing placeholder in the repo). Do not invent paths like `pic/<year>/Foo.svg` — that's a stage-3 task.
- `<img alt>`: project name.
- Link text inside `<a>`: strip protocol and trailing slash from URL for display. E.g. `https://github.com/Snapchat/Valdi` → `github.com/Snapchat/Valdi`. For non-GitHub URLs, do the same (strip protocol).
- `target="_blank"`: always include.
- `<p class="nominees-list__desc">`: empty body but tag preserved.
- No `winner` class on any `<li>` (cleared for new year).

Slider class per category position (preserve historical pattern):
1. First category: `technology-slider`
2. Second: `breakthrough-slider`
3. Third: `impactful-contributor-slider`
4. Fourth: `fun-project-slider`
5. Fifth and beyond: reuse `fun-project-slider` (or omit the slider class if there's no convention — check the existing file). If the previous year had 5 categories with specific classes, mirror those. If there are more categories than the convention covers, ask the user what class to use for the extra ones.

Categories appear in the order the user provided them.

## Step 5 — Report

- Folder updated.
- Year heading change (`2025 Nominees` → `2026 Nominees`).
- Categories and project counts: e.g. "Breakthrough of the Year (3), The Most Exciting Use of Technology (4), …".
- Reminder of next stages:
  - Descriptions are empty — user will provide them later.
  - Logos use `pic/project_dummy.jpg` placeholder — user will provide real ones later.
  - Winners not marked — separate step.

## Edge cases

- **User adds a category but no projects under it**: skip that category and warn.
- **User passes the same project twice (same name or same URL)**: warn and include both with separate delay values; user can prune.
- **Category with the same name as another already in the list**: warn, treat as separate category.
- **`react/` folder receives JS-ecosystem projects**: don't second-guess — apply as given. The user knows which folder they meant.
- **`index.html` has unusual structure (e.g. a category with its own custom layout)**: the rewrite replaces the whole block uniformly. If the user had something custom they want kept, tell them upfront before overwriting.

## Files touched

- EDIT: `<folder>/index.html` (year heading + entire `<section id="nominees">` body)
- DO NOT TOUCH: anything else (no archive pages, no css, no logos, no winners).

## Stage 3 — Logos (separate operation, same skill file)

When the user later asks to "вставить логотипы", "добавить логотипы из папки logos", "проставить картинки по проектам", or similar — handle it here. This is a **separate operation** from stage 1, but lives in this skill because the data flow (current nominees → matching files) is the same.

### Source

Logos usually arrive in `~/Downloads/logos/` organized by category subfolders. Each category subfolder contains either:
- a single image file per project (e.g. `Valdi.png`), or
- a nested subfolder per project with multiple variants (e.g. `sparo/sparo-logo.svg`).

### Target

Copy chosen logos into `<folder>/pic/<year>/`. Default folder is `javascript/` unless user says otherwise. Match `<year>` to the current `<h3 class="section__title">` in `index.html`.

### Procedure

1. **Read the current nominees from `index.html`** — extract every `<h5 class="nominees-list__title">` value within `<section id="nominees">`. These are the projects that need logos. **Do not** infer projects from the Downloads folder names — the nominees list in `index.html` is authoritative.
2. **For each project, look in `~/Downloads/logos/<category>/`** for a matching file or subfolder. Match by name, case-insensitive, ignoring spaces, hyphens, and underscores (e.g. project "Es-toolkit" matches file `es-toolkit.png` or subfolder `es-toolkit/`).
3. **Picking a variant** when a project subfolder has multiple files: prefer in this order:
   1. `.svg` over `.png` over `.jpg`
   2. light/default variants over dark variants (skip files with `-dark`, `-bg`, `-transparent` in the name unless that's the only option)
   3. logo (full lockup) over icon-only, unless the icon is clearly the primary mark
   4. lower resolution / no `@2x`/`@3x`/`@4x` suffix (the site doesn't need huge files)
   When unclear, ask the user before copying.
4. **Copy** the chosen file into `<folder>/pic/<year>/` keeping a clean filename: `<ProjectName>.<ext>` with the project name as written in `index.html` (spaces → underscores). E.g. "TanStack Start" → `TanStack_Start.png`.
5. **Update `<img src>` and keep `alt`** in the matching `<li>` from `pic/project_dummy.jpg` to `pic/<year>/<ProjectName>.<ext>`.
6. **If no logo is found for a project**, leave `pic/project_dummy.jpg` as-is. **Do not invent a path or pull a logo from the web.** Report which projects are still missing logos at the end.
7. **Empty category folders or extra logos** for projects not in the current nominees list — skip them silently. Don't copy files the site won't reference.

### Report

- For each project: ✅ logo set (filename) / ⏭ kept dummy (no logo found).
- Files copied into `<folder>/pic/<year>/`.
- List of projects still on `pic/project_dummy.jpg`.

### Files touched (stage 3)

- COPY into: `<folder>/pic/<year>/<ProjectName>.<ext>`
- EDIT: `<folder>/index.html` — only the `<img src>` attributes inside `<section id="nominees">`.
