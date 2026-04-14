# Generation Rules

## Requirement parsing

Extract these fields from each request:

```yaml
domain:
page_type:
audience:
must_have_sections: []
key_metrics: []
preferred_style:
data_density:
map_required:
refresh_expectation:
```

If three or more of `page_type`, `must_have_sections`, `key_metrics`, `preferred_style` are missing, ask clarifying questions before drafting a blueprint.

When the request starts from an uploaded dashboard image, treat the image as an upstream requirement source and normalize it into the same fields before clarification.

## Blueprint generation

Always create the blueprint before writing code.

Blueprint fields:

```yaml
page_name:
goal:
layout_pattern:
reference_templates: []
theme_direction:
block_priority: []
height_strategy:
  overall:
  notes:
layout_sizing:
  root_layout:
    viewport_mode:
    width_policy:
    height_policy:
    page_overflow:
  column_strategy:
    mode:
    pattern: []
    allow_fixed_and_flex_mix:
  row_strategy:
    top:
    main:
    bottom:
  internal_section_rule:
    section_must_fill_parent:
    allow_nested_flex:
    require_min_width_zero:
    require_min_height_zero:
    overflow_owner:
semantic_profile:
  entity:
    singular:
    plural:
  metrics: []
  event_label:
  table_label:
  table_columns: []
panel_chrome:
  variant:
  title_bar:
  border_style:
sections:
  - id:
    area:
    purpose:
    component:
    data_contract:
    priority:
    height_policy:
      fixed:
      min:
      flex:
      scroll:
      auto_rotate:
    size_policy:
      width_mode:
      height_mode:
      min_width:
      min_height:
      max_width:
      max_height:
      overflow_mode:
      shrinkable:
```

## Layout heuristics

- Full-screen occupancy is mandatory: the dashboard root should fit the viewport before child layout is resolved.
- Root layout should distribute size top-down through constrained containers instead of content-driven expansion.
- Use a three-column layout for dense overview pages with 6 to 12 sections.
- Use a center-map layout when geography is central to the page narrative.
- Use a KPI strip when the user emphasizes leadership summary or health status.
- Use a bottom event rail when alerts, work orders, or incidents must stay visible.
- Use fewer but larger panels for executive pages. Use more compact panels for operational monitoring.
- Prefer above-the-fold completeness by default: avoid page-level vertical scrolling.
- Do not hardcode the full-page pixel height first; allocate space by section weights and only pin minimum readable heights for critical blocks.
- Separate layout into title / primary content / auxiliary content layers instead of evenly slicing columns.
- KPI blocks should not automatically consume a full top row; place them in the main column or above the primary view to preserve side-column height.
- Keep section count restrained and merge weakly related micro-panels to prevent unreadable tiles.
- At every level, prefer mixed sizing strategies: fixed + flex, flex + fixed, fixed + flex + fixed, or all flex where appropriate.
- Inside each panel, use a fixed-or-compact header plus a flexible content area.
- All shrinkable layout children must preserve `min-width: 0` and `min-height: 0` behavior so nested content cannot overflow by default.
- Overflow should be owned by the section content, not by the page root.

## Content composition rules

- Give large real estate to narrative-heavy modules: map, primary trend, primary alerts, primary table.
- Reduce summary panels; avoid stacking multiple sub-blocks inside one panel.
- If a panel contains two charts, prefer splitting or keep only one primary chart to avoid tiny visuals.
- Right-side summary zones should favor one dominant visual plus a minimal legend, not multiple small cards.

## Typography and readability

- Enforce a higher default font-size floor than standard admin dashboards.
- KPI numbers, panel titles, axis labels, and table text must meet big-screen readability minimums.
- Reduce information density before shrinking fonts below readable thresholds.

## Chart rules

- Charts must auto-resize with the browser window.
- Chart containers must have stable usable heights; do not rely on parent auto-stretching that can collapse.
- In narrow/tall panels where complex ECharts configs become unstable, prefer simpler SVG/CSS visualizations.
- Legends, labels, radii, and centers must be constrained by container size, never default values.

## Lists and tables

- Long lists default to auto-rotating scroll with hidden native scrollbars.
- Auto-rotate areas must support hover pause.
- Tables should use fixed headers with independently scrolling bodies.
- Column widths should follow field semantics, not equal widths.
- Bottom tables typically deserve more height; avoid showing only one or two visible rows.

## Responsive strategy

- Avoid triggering narrow breakpoints too early; do not misclassify desktop widths as mobile.
- Optimize for readability and above-the-fold completeness, not just switching to single-column.
- Provide a short-height strategy: compress spacing/decoration and increase bottom-block weight instead of scaling everything down.

## Code generation rules

- Scaffold from `assets/starter/` first.
- Put orchestration in the page entry.
- Put section-specific presentation in `src/components/bigscreen/`.
- Put reusable chart wrappers in `src/components/bigscreen/charts/`.
- Put view-model assembly in `src/composables/`.
- Put mock fixtures in `src/mock/`.
- Put transport stubs in `src/api/`.
- Put the Tailwind entry and chrome class helpers in `src/theme/`.
- Put generated page rationale in `docs/screen-specs/`.
- Default-enable: chart auto resize, long list auto-rotate, fixed table header, hidden native scrollbars, font-size floor.
- When Playwright is available, support browser-level validation after generation: full-screen fit, page overflow, bounded panels, minimum font size, visible table rows, and primary-view dominance.
- If a reference image or image-derived spec exists, compare the generated page against reference layout intent in addition to generic dashboard quality checks.
- When the request names a province, city, district, or adcode for a map page, resolve and download the corresponding Datav GeoJSON boundary and wire the map component to that real boundary by default.
- For each section, record: priority, height strategy, and whether it is fixed/min/flex/scroll/auto-rotate.
- Record page-level full-screen sizing metadata and per-section width/height sizing metadata so generation can mix fixed and flexible tracks explicitly.
- Generate mock data from a domain-agnostic semantic profile instead of industry-specific hardcoded labels.
- Explicitly block: even area splitting, multiple charts in tiny panels, summary panels more complex than primary visuals, and admin-style dense typography.
- For revision prompts, update the existing blueprint first, then regenerate from the revised blueprint.
- Preserve page type and first-screen narrative unless the revision explicitly requests a different page intent.
- For image-driven requests, output a short image analysis summary and normalized prompt before code generation.
- In image-driven mode, preserve layout rhythm, dominant module ordering, and panel chrome, but rebuild with maintainable components.
- If labels are unreadable in the image, infer stable semantic replacements and avoid placeholder names.

## Reference usage rules

- Use template references for:
  - section ordering
  - composition rhythm
  - color and decoration direction
  - chart family selection
  - panel border, title-bar, corner, and glow treatments
- Do not use template references for:
  - copying exact markup
  - preserving file structure
  - inheriting fragile CSS selectors
  - embedding unreviewed third-party scripts

## Review checklist

- Does each section map to a catalog component or justified extension?
- Is any page file becoming a dumping ground?
- Are chart options isolated from layout?
- Are tokens used instead of repeated literal colors?
- Is there enough mock data to render the page without backend wiring?
- Does the validation output flag missing blueprint metadata or weak first-screen composition?
