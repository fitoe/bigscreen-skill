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
