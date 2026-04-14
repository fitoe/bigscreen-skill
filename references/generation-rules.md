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

For image-driven requests, prefer a single default-forward pass: infer sensible values from the screenshot and only ask follow-up questions when the missing information would materially change the page type or dominant composition.

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
- Use real viewport-height allocation: subtract the real header height before allocating the main body area.
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
- Prefer `fr` and `minmax(0, 1fr)` tracks over percentage grids when gaps are present.
- Inside each panel, use a fixed-or-compact header plus a flexible content area.
- All shrinkable layout children must preserve `min-width: 0` and `min-height: 0` behavior so nested content cannot overflow by default.
- Overflow should be owned by the section content, not by the page root.
- Main panels must fill their assigned grid or flex cell; child content must not size the parent beyond its layout box.
- Keep moderate outer whitespace; the dashboard should not visually glue primary content to the viewport edge.
- Use panel emphasis hierarchically: avoid drawing a full equal-weight border around every nested sub-block.

## Content composition rules

- Give large real estate to narrative-heavy modules: map, primary trend, primary alerts, primary table.
- Reduce summary panels; avoid stacking multiple sub-blocks inside one panel.
- If a panel contains two charts, prefer splitting or keep only one primary chart to avoid tiny visuals.
- Right-side summary zones should favor one dominant visual plus a minimal legend, not multiple small cards.
- When a reference image is visually dense, restore hierarchy, whitespace rhythm, and dominant-vs-secondary relationships before copying decorative detail.

## Typography and readability

- Enforce a higher default font-size floor than standard admin dashboards.
- KPI numbers, panel titles, axis labels, and table text must meet big-screen readability minimums.
- Reduce information density before shrinking fonts below readable thresholds.

## Chart rules

- Charts must auto-resize with the browser window.
- Chart containers must have stable usable heights; do not rely on parent auto-stretching that can collapse.
- In narrow/tall panels where complex ECharts configs become unstable, prefer simpler SVG/CSS visualizations.
- Legends, labels, radii, and centers must be constrained by container size, never default values.
- For ring, pie, and composition charts, text beside the chart should default to being treated as a legend rather than fixed explanatory copy.
- Legend items must bind directly to chart data items so color, name, and order remain consistent with the rendered slices.
- Pie, ring, and other chart-plus-legend compositions should switch legend direction from the container aspect ratio.
- Narrow-tall containers may stack chart and legend vertically; wide-flat containers should prefer side-by-side placement.
- Wide containers should prefer left-right chart-and-legend composition; tall containers may switch to top-bottom composition.
- Do not replace legends with static explanatory text unless the requirement explicitly asks for explanatory prose.
- Legends should preserve minimum readability with color markers, names, and when useful the value or ratio.
- Reflow legend and chart before compressing them into overlap.

## Lists and tables

- Long lists default to auto-rotating scroll with hidden native scrollbars.
- Auto-rotate areas must support hover pause.
- Tables should use fixed headers with independently scrolling bodies.
- Column widths should follow field semantics, not equal widths.
- Bottom tables typically deserve more height; avoid showing only one or two visible rows.
- Choose static or scrollable table mode from visible capacity: when row count exceeds visible capacity, enable scroll or rotation by default.
- In constrained widths, redistribute semantic column widths before compressing every column equally.
- Fixed-count KPI or service-card groups should distribute evenly before decorative treatment; shrink padding, icon size, and font size before clipping content.

## Map rules

- Map primary visuals must remain visually centered inside their container.
- Fixed-count metric stacks beside the map should distribute evenly in height to avoid bottom voids or overflow.
- Map tooltips are interaction layers only; they should appear on hover, focus, or active state instead of being pinned by default.
- Keep map fill and label contrast readable; do not place light text directly on light geographic fills without stroke, shadow, or darker backing.
- Prefer complete visible geography over aggressive zoom; do not crop administrative boundaries just to enlarge the map.

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
- When Playwright is available, support browser-level validation after generation: full-screen fit, page overflow, bounded panels, minimum font size, visible table rows, primary-view dominance, map centering, fixed-card visibility, and chart-legend separation.
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
- Do not stop image-driven requests for blueprint confirmation unless the user explicitly asks to inspect the blueprint first.
- Keep Playwright screenshots and validation JSON out of the generated project by default; use a temporary artifacts directory unless the user explicitly asks to preserve them.
- Check every main block for hidden overflow using `scrollHeight/clientHeight` and `scrollWidth/clientWidth` before relying on clipping styles.
- Verify that the real header height has been accounted for in body sizing, that main content is not cropped, that maps remain centered, that fixed-count card groups stay fully visible, that tables enable scroll when needed, and that legends do not overlap charts.

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
