
BEFORE WRITING ANY CSS OR CLASS:
1. Is it in tabler_added_combined.css? → use it
2. Is it a Tabler core class? → use it
3. Is it a Tabler marketing class? → use it
4. None of the above? → STOP. Ask before inventing.

# Exponanta — CSS & Markup Prompt for AI

Use this document at the start of every design or coding session.
It defines what is allowed, what is forbidden, and how to build correctly.

---

## Stack

```
tabler.min.css                  (Tabler core — Bootstrap 5 base)
tabler-marketing.min.css        (Marketing sections — homepage/landing only)
tabler_added_combined.css       (Exponanta custom — the ONLY place for custom CSS)
```

Load order in every `<head>`:

```html
<link rel="preconnect" href="https://rsms.me">
<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/core@latest/dist/css/tabler.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
<!-- marketing pages only: -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/core@latest/dist/css/tabler-marketing.min.css">
<link rel="stylesheet" href="/brandbook/tabler_added_combined.css">
```

Inter MUST load before Tabler. Never use `@import` for Inter — use `<link>`.

---

## Font

- Family: `Inter var` (variable font from rsms.me)
- Brand name uses: `font-feature-settings: "cv01" 1` for double-story `a`
- Never load Inter from Google Fonts — use rsms.me only
- Never declare a custom `--font-*` token — Tabler's `--tblr-font-sans-serif` already uses Inter

---

## Typography — Three Contexts

| Page type | Rule | Result |
|---|---|---|
| Dashboard (community, events, scheduling) | Tabler default — do nothing | 14px |
| Marketing pages (`body-marketing`) | Already in combined CSS | 16px |
| Blog/article pages | `article` element — already in combined CSS | 20px / line-height 1.75 |

Never set `font-size` globally or on `body` directly. Never use `html { font-size: 125% }` — it breaks dashboard pages. Scope font size changes to the correct context.

---

## Colors

### Primary
- `var(--tblr-primary)` → `#2446C8` — Exponanta brand blue
- `var(--tblr-primary-lt)` — light tint for backgrounds
- `var(--tblr-primary-rgb)` — for rgba usage

### Accent colors — use Tabler tokens, never custom hex
| Purpose | Token | Hex |
|---|---|---|
| Teal accents | `var(--tblr-teal)` | `#0ca678` |
| Orange/coral accents | `var(--tblr-orange)` | `#f76707` |
| Green accents | `var(--tblr-green)` | `#2fb344` |
| Warning | `var(--tblr-warning)` | `#f59f00` |
| Success | `var(--tblr-success)` | `#2fb344` |
| Danger | `var(--tblr-danger)` | `#d63939` |

### Light variants for backgrounds
`var(--tblr-teal-lt)`, `var(--tblr-orange-lt)`, `var(--tblr-green-lt)` etc.

### Forbidden hex values — replace with tokens
| Forbidden | Use instead |
|---|---|
| `#4FD1C5` | `var(--tblr-teal)` |
| `#FF6F61` | `var(--tblr-orange)` |
| `#1D9E75` | `var(--tblr-green)` |
| `#D85A30` | `var(--tblr-orange)` |
| `#neutral-900` / `var(--neutral-900)` | `var(--tblr-body-color)` |
| `#neutral-600` / `var(--neutral-600)` | `var(--tblr-secondary)` |
| `var(--text-sm)` | `var(--tblr-body-font-size)` or `.small` |
| `var(--text-xl)` | `var(--tblr-font-size-h2)` |
| `var(--text-2xl)` | `var(--tblr-font-size-h1)` |

The old `exponanta.css` Bootstrap tokens (`--text-*`, `--neutral-*`, `--blue-*`) are DEAD. Never use them.

---

## What Tabler Already Owns — Never Redefine

### From tabler.min.css
- Layout: `.page-wrapper`, `.page-body`, `.page-header`, `.page-title`, `.container-xl`
- Cards: `.card`, `.card-body`, `.card-sm`, `.card-header`, `.card-link`, `.h-100`
- Avatars: `.avatar`, `.avatar-sm/md/lg/xl/xs`, `.avatar-list`, `.avatar-list-stacked`, `rounded-circle`
- Badges: `.badge`, `.bg-*-lt`, `.text-*`
- Buttons: `.btn`, `.btn-sm/lg`, `.btn-primary`, `.btn-outline-*`, `.btn-ghost-*`, `.btn-icon`
- Forms: `.form-control`, `.input-group`, `.input-group-text`
- Empty states: `.empty`, `.empty-icon`, `.empty-title`, `.empty-subtitle`, `.empty-action`
- Data: `.datagrid`, `.datagrid-item`, `.datagrid-title`, `.datagrid-content`, `.divide-y`
- Accordion: `.accordion`, `.accordion-item`, `.accordion-header`, `.accordion-button`, `.accordion-body`
- Utilities: `fw-bold/semibold/medium`, `text-primary/secondary/muted`, `d-flex`, `gap-*`, `align-items-*`, `justify-content-*`, `small`, `fs-*`, `lh-*`

### From tabler-marketing.min.css (marketing/homepage only)
- `.section`, `.section-light`, `.section-sm`, `.section-white`, `.section-primary`
- `.section-header`, `.section-title`, `.section-description`
- `.hero`, `.hero-title`, `.hero-description`, `.hero-img`
- `.shape`, `.shape-sm/md/lg/xl`, `.shape-*` (color variants) — **icon container, not a blob**
- `.pricing-card`, `.pricing-title`, `.pricing-price`, `.pricing-features`
- `.body-gradient`, `.body-marketing`
- `.container-narrow`
- Extended spacing: `.py-7` through `.py-12`, `.mt-7` through `.mt-12` etc.
- `.tracking-tight`, `.tracking-wide`, `.filter-grayscale`

---

## What Lives in tabler_added_combined.css

Only these — nothing else:

| Section | Classes |
|---|---|
| Brand | `.navbar-brand-text` |
| Typography | `.body-marketing` font-size, `article` font-size |
| Global fix | `html { overflow-x: hidden }` |
| Layout | `.sidebar-sticky` |
| Avatar override | `.avatar-list .avatar` round override |
| Missing utility | `.bg-surface-secondary` |
| Sidebar cards | `.bottom-cta`, `.cta-sidebar`, `.stats-card`, `.industry-sidebar`, `.request-card-*` |
| Hero | `.kicker-pill`, `.kicker-dot`, `.feature-list`, `.collage-main`, `.collage-small`, `.hero-stats-card`, `.hero-stat-val`, `.hero-stat-label`, `.step-number`, `.hero-stack`, `.stack-card-1`, `.stack-card-2` |
| View toggle | `.view-toggle`, `.view-toggle-btn` |
| Filter pills | `.tag-filter-wrap`, `.tag-pill`, `.tag-dot`, `.filter-divider`, `.filter-group-label` |
| Event card H | `.evh`, `.evh-img`, `.evh-date`, `.evh-date-day`, `.evh-date-mon` |
| Past card | `.past-card`, `.past-card__*` |
| Calendar | `.cal-month-nav`, `.cal-month-title`, `.cal-nav-btn`, `.cal-today-btn`, `.cal-legend`, `.cal-legend-item`, `.cal-legend-dot`, `.cal-grid-wrap`, `.cal-dow-row`, `.cal-dow`, `.cal-body-grid`, `.cal-cell`, `.cal-cell--*`, `.cal-day-num`, `.cal-pill`, `.cal-pill--*`, `.cal-pill-more`, `.cal-popup`, `.cal-popup-close` |
| Scheduling | `.slot`, `.slot-*`, `.sched-table`, `.request-card-*`, `#slot-popover`, `.flash-toast` |
| Misc | `.empty-state`, `.space-y`, `.footer-link` |
| Print | `@media print` |

---

## Card Patterns

### Three types — use the right one

**1. Plain Tabler card — for most things**
```html
<div class="card h-100">
  <div class="card-body d-flex flex-column">
    ...
  </div>
</div>
```

**2. Modifier card — sidebar components**
Add a single modifier class to `.card`. The modifier class has no CSS of its own — all styling is Tabler utilities in markup.
```html
<div class="card mb-4 stats-card">
  <div class="card-body p-4">...</div>
</div>
```

**3. Horizontal event card (.evh) — events list**
Extends `.card` with the `.evh` modifier for the image panel layout.
```html
<div class="card evh d-flex flex-row g-0 overflow-hidden mb-3">
  <div class="evh-img">
    <img src="..." alt="...">
    <div class="evh-date">
      <span class="evh-date-day">30</span>
      <span class="evh-date-mon">APR</span>
    </div>
  </div>
  <div class="card-body d-flex flex-column">
    <h3 class="fw-bold mb-1 fs-4"><a href="#" class="text-reset text-decoration-none">Title</a></h3>
    <div class="d-flex flex-wrap gap-1 mb-2">
      <span class="badge bg-blue-lt text-blue">Community</span>
    </div>
    <p class="text-muted small mb-3">Description</p>
    <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
      <div class="avatar-list avatar-list-stacked">
        <span class="avatar avatar-sm rounded-circle" style="background-image:url(...)"></span>
      </div>
      <div class="d-flex gap-2">
        <a href="#" class="btn btn-sm btn-outline-primary">Register</a>
        <a href="#" class="btn btn-sm btn-primary">Connect</a>
      </div>
    </div>
  </div>
</div>
```

---

## Avatar Pattern

Always use Tabler's native avatar. Image goes as `background-image` on the `<span>`, not as an `<img>` child.

```html
<!-- Correct -->
<span class="avatar avatar-sm rounded-circle" style="background-image: url(/images/photo.jpg)"></span>

<!-- Correct — initials fallback -->
<span class="avatar avatar-sm rounded-circle bg-blue-lt text-blue">JR</span>

<!-- Stacked list -->
<div class="avatar-list avatar-list-stacked">
  <span class="avatar avatar-sm rounded-circle" style="background-image: url(...)"></span>
  <span class="avatar avatar-sm rounded-circle bg-blue-lt text-blue">+8</span>
</div>

<!-- WRONG — never put <img> inside avatar span -->
<span class="avatar"><img src="..."></span>
```

---

## Icon Pattern

Always use Tabler icons webfont. Never use inline SVG for UI icons.

```html
<!-- Correct -->
<i class="ti ti-calendar-event"></i>
<i class="ti ti-send text-primary fs-4"></i>

<!-- Wrong — inline SVG for UI icons -->
<svg xmlns="http://www.w3.org/2000/svg" ...>...</svg>
```

Exception: inline SVG is acceptable only inside JS template strings where class-based icons can't render.

---

## Shape (Icon Container) Pattern

`.shape` from tabler-marketing IS an icon container — use it directly.

```html
<!-- Correct -->
<span class="shape shape-md shape-blue">
  <i class="ti ti-calendar-event"></i>
</span>

<!-- Wrong — wrapping shape in custom div, or using .shape as decoration -->
<div class="icon-box"><span class="shape shape-md">...</span></div>
```

---

## Page Structure Patterns

**Marketing/homepage pages:**
```html
<body class="body-marketing body-gradient">
  <section class="section">
    <div class="container">...</div>
  </section>
  <section class="section section-light">
    <div class="container">...</div>
  </section>
</body>
```

**Dashboard/app pages:**
```html
<body>
  <div class="page-wrapper">
    <div class="page-body">
      <div class="container-xl py-4">
        <div class="page-header mb-4">...</div>
        ...
      </div>
    </div>
  </div>
</body>
```

**Blog/article pages:**
```html
<body>
  <div class="page-wrapper">
    <div class="page-body">
      <div class="container-xl py-4">
        <div class="row g-4">
          <div class="col-lg-8">
            <article>...</article>  <!-- font-size: 1.25rem auto-applied -->
          </div>
          <div class="col-lg-4 sidebar-sticky">...</div>
        </div>
      </div>
    </div>
  </div>
</body>
```

---

## The 10 Most Common Mistakes — Never Repeat

1. **Inline `<style>` blocks in HTML** — all custom CSS goes in `tabler_added_combined.css`. Zero exceptions except the `.ev-card` temporary block on calendar.html.

2. **Redefining Tabler classes** — never write `.avatar { ... }`, `.card { ... }`, `.badge { ... }` etc. Check the ownership list above first.

3. **Using `.shape` as a blob** — it's an icon container. Use it as intended.

4. **`<img>` inside `.avatar` span** — always use `background-image` on the span.

5. **Inline SVG for UI icons** — use `<i class="ti ti-*">` always.

6. **Custom hex values for accent colors** — use `var(--tblr-teal)`, `var(--tblr-orange)` etc.

7. **Dead tokens from exponanta.css Bootstrap era** — `--text-sm`, `--neutral-900`, `--blue-300` etc. are undefined. Replace with Tabler tokens.

8. **`html { font-size: 125% }` or global body font-size** — breaks dashboard pages. Scope to `.body-marketing` or `article` only.

9. **BEM component systems in JS template strings** — output Tabler class strings instead: `"card"`, `"badge bg-blue-lt text-blue"`, `"btn btn-sm btn-primary"` etc.

10. **Two names for one concept** — `.view-btn` and `.view-toggle-btn` are the same thing. `.stats-card` as hero overlay and sidebar component is a collision. Pick one name, use it everywhere.

---

## Sidebar Components Pattern

The sidebar appears on events, community, blog, and scheduling pages. It always contains:

```html
<div class="col-lg-4 sidebar-sticky">
  <!-- CTA card -->
  <div class="card mb-4 cta-sidebar">
    <div class="card-body text-center p-4">...</div>
  </div>
  <!-- Stats card -->
  <div class="card mb-4 stats-card">
    <div class="card-body p-4">...</div>
  </div>
  <!-- Industry links -->
  <div class="card industry-sidebar">
    <div class="card-body p-4">...</div>
  </div>
</div>
```

These are fetched as components: `fetch('../components/cta-sidebar.html')` etc. Never hardcode sidebar content inline on a page.

---

## Footer Pattern

Footer is always a fetched component: `fetch('../components/footer.html')`.
The gradient is defined once in `components/footer.html`:

```css
background: linear-gradient(135deg, #1a3596 0%, #2446C8 50%, #0d1f5c 100%);
```

Never redefine the footer gradient inline on a page.

---

## Tabler CSS Variables Reference (most used)

```css
var(--tblr-primary)           /* #2446C8 */
var(--tblr-primary-lt)        /* primary light tint */
var(--tblr-primary-rgb)       /* for rgba() */
var(--tblr-secondary)         /* #6b7280 */
var(--tblr-muted)             /* #6b7280 */
var(--tblr-body-color)        /* dark body text */
var(--tblr-border-color)      /* light border */
var(--tblr-border-radius)     /* default radius */
var(--tblr-border-radius-lg)  /* large radius */
var(--tblr-bg-surface)        /* white/card bg */
var(--tblr-bg-surface-secondary) /* light bg */
var(--tblr-light)             /* #f9fafb */
var(--tblr-shadow-sm)         /* small shadow */
var(--tblr-shadow-lg)         /* large shadow */
var(--tblr-teal)              /* #0ca678 */
var(--tblr-orange)            /* #f76707 */
var(--tblr-green)             /* #2fb344 */
var(--tblr-warning)           /* #f59f00 */
var(--tblr-success)           /* #2fb344 */
var(--tblr-danger)            /* #d63939 */
var(--tblr-teal-lt)           /* teal light tint */
var(--tblr-orange-lt)         /* orange light tint */
```
