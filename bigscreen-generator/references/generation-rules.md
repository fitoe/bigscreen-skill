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

## Blueprint generation

Always create the blueprint before writing code.

Blueprint fields:

```yaml
page_name:
goal:
layout_pattern:
reference_templates: []
theme_direction:
first_screen_priority:
height_strategy:
  viewport_policy:
  panels:
    - id:
      mode:
      min_height:
      overflow_behavior:
sections:
  - id:
    area:
    purpose:
    component:
    data_contract:
```

## Layout heuristics

- Use a three-column layout for dense overview pages with 6 to 12 sections.
- Use a center-map layout when geography is central to the page narrative.
- Use a KPI strip when the user emphasizes leadership summary or health status.
- Use a bottom event rail when alerts, work orders, or incidents must stay visible.
- Use fewer but larger panels for executive pages. Use more compact panels for operational monitoring.
- Default to a one-screen composition for standard command-center big screens. Treat page-level vertical scrolling as an exception, not the baseline.
- Allocate space by decision value, not by component count. Hero sections such as map, master trend, and bottom operations table should receive explicit priority.
- Avoid symmetric panel grids unless the content is genuinely symmetric. Most generated big screens should have one dominant section and two supporting columns.
- KPI cards do not need to own a full-width top band. If moving them into the center column improves usable height for the side columns, prefer that arrangement.
- Summary panels should be simplified aggressively. If a summary panel contains a hero chart plus four micro-cards, consider dropping or merging the micro-cards first.
- Long rankings, alerts, and tables should be generated as self-contained scrolling or auto-loop regions with fixed headers where applicable.
- If the viewport becomes short, compress spacing and secondary decoration first; do not immediately reduce text below readable large-screen baselines.

## Code generation rules

- Scaffold from `assets/starter/` first.
- Put orchestration in the page entry.
- Put section-specific presentation in `src/components/bigscreen/`.
- Put reusable chart wrappers in `src/components/bigscreen/charts/`.
- Put view-model assembly in `src/composables/`.
- Put mock fixtures in `src/mock/`.
- Put transport stubs in `src/api/`.
- Put tokens in `src/theme/`.
- Put generated page rationale in `docs/screen-specs/`.
- Prefer viewport-relative track sizing such as `auto / 1fr / 0.xfr` over hardcoded page pixel heights.
- Allow content sections to define their own minimum readable height. Only apply hard pixel heights to a panel when the panel itself needs a stable rendering box, not to the entire page.
- Keep the bottom operational table large enough to show multiple rows in the target viewport. Do not leave only one or two visible rows unless the user explicitly asks for a ticker-only table.
- Table columns should use semantic width allocation instead of equal-width defaults.

## Reference usage rules

- Use template references for:
  - section ordering
  - composition rhythm
  - color and decoration direction
  - chart family selection
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
- Does the first screen show the page's most important sections without clipping or browser-level vertical scroll?
- Are dominant sections visually dominant, or did the layout over-fragment into too many equal blocks?
- Are typography sizes still readable at big-screen viewing distance?
- Do long lists and tables use auto-loop or controlled internal scrolling instead of exposed native scrollbars?
- Do chart containers have stable minimum heights so resize events do not collapse them?
