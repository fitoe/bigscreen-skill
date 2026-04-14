# Template Index

Use this file as a curated reference map for `BigDataView`-style templates. Entries should describe structure and style only.

## Entry schema

```yaml
- id:
  source_path:
  scene_tags: []
  page_types: []
  layout_type:
  tone:
  data_density:
  chart_families: []
  strong_sections: []
  borrow_for: []
  avoid:
```

## Seed entries

These are starter examples that describe retrieval patterns and structure. They are illustrative, not compatibility targets.

```yaml
- id: seed-overview-blue
  source_path: examples/overview/seed-overview-blue
  scene_tags: [smart-city, operations]
  page_types: [overview-home, map-command-page]
  layout_type: center-map-three-column
  tone: deep-blue-glow
  data_density: high
  chart_families: [line, bar, ring, map]
  strong_sections: [header-summary, map-focus, side-rankings, alert-rail]
  borrow_for: [city-cockpit, campus-command, park-operations]
  avoid: [exact markup reuse, fixed-pixel cloning]

- id: seed-energy-monitoring
  source_path: examples/monitoring/seed-energy-monitoring
  scene_tags: [energy, industrial]
  page_types: [monitoring-analysis, thematic-cockpit]
  layout_type: bilateral-panels
  tone: cyan-industrial
  data_density: medium
  chart_families: [line, bar, gauge]
  strong_sections: [equipment-status, trend-panels, device-table]
  borrow_for: [energy-center, equipment-dashboard]
  avoid: [inline chart options in page]

- id: seed-alarm-center
  source_path: examples/alarm/seed-alarm-center
  scene_tags: [security, command]
  page_types: [alarm-center, map-command-page]
  layout_type: stacked-center-stream
  tone: dark-alert
  data_density: high
  chart_families: [line, ring, table]
  strong_sections: [critical-kpis, alarm-stream, severity-distribution]
  borrow_for: [event-center, safety-dashboard]
  avoid: [copying ticker markup, color literals in components]
```

## Curation target

Maintain 20 to 30 high-quality entries in this file for the first release. Each entry should be actionable enough for retrieval but small enough to read quickly.
