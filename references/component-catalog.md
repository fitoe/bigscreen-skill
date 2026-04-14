# Component Catalog

Prefer these standard components before creating new ones.

## Layout

### `ScreenShell`
- Responsibility: Root viewport, background, grid framing, responsive scale container.
- Inputs: `variant`
- Use for: Every full-screen dashboard page.

### `HeaderBar`
- Responsibility: Title row, timestamp, status chips, page actions.
- Inputs: `title`, `subtitle`, `statusItems`
- Use for: Top header in overview and command pages.

### `SectionTitle`
- Responsibility: Compact visual title for each panel section.
- Inputs: `title`, `accent`, `panelChrome`
- Use for: Any section that needs internal framing.

### `PanelCard`
- Responsibility: Generic panel shell with border, glow, padding, and slot regions.
- Inputs: `title`, `height`, `tone`, `panelChrome`
- Use for: Standard chart and table containers.

## KPI and summary

### `StatCard`
- Responsibility: Display one primary metric with delta and sparkline.
- Inputs: `label`, `value`, `unit`, `delta`, `trend`
- Use for: KPI strips and top summaries.

## Charts

### `LineTrendChart`
- Responsibility: Trend line or area line chart.
- Inputs: `title`, `series`, `categories`, `unit`
- Use for: Time-series monitoring, throughput, load, alarms over time.

### `BarCompareChart`
- Responsibility: Vertical or horizontal comparison bars.
- Inputs: `title`, `series`, `categories`, `unit`
- Use for: Ranking, category comparison, completion progress.

### `PieRingChart`
- Responsibility: Pie, ring, and composition ratio charts.
- Inputs: `title`, `items`
- Use for: Share, occupancy, source composition.

### `MapPanel`
- Responsibility: Geographic overview with side overlays and region highlights.
- Inputs: `title`, `points`, `regions`, `metrics`
- Use for: City, park, campus, province, pipeline, fleet maps.

## Lists and alerts

### `RankingList`
- Responsibility: Ordered entities with badges and values.
- Inputs: `title`, `items`
- Use for: Device ranking, region ranking, anomaly ranking.

### `ScrollTable`
- Responsibility: Dense data table optimized for dashboard presentation.
- Inputs: `title`, `columns`, `rows`
- Use for: Device list, work order list, events, status records.

### `AlarmTicker`
- Responsibility: Continuous alert stream with severity tags and timestamps.
- Inputs: `title`, `items`
- Use for: Alarm center, command center, event flow.

## Extension rules

- Create a new component only when:
  - two or more required sections cannot be expressed by existing components, or
  - the section introduces a new interaction or chart family.
- If only styling differs, derive via props or Tailwind class helpers instead of creating a new file.
- Reuse template-like border, title-bar, corner, and glow treatments through `panelChrome` before creating custom wrappers.
- Page files should compose these components, not absorb their logic.
