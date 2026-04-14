# Vue 3 + ECharts Conventions

## Stack

- Vue 3
- `<script setup lang="ts">`
- Composition API
- Vite
- SCSS + CSS variables
- ECharts

## File boundaries

- `views/`: page orchestration only
- `components/bigscreen/`: section-level presentation
- `components/bigscreen/charts/`: chart wrappers and option builders
- `composables/`: assemble page-facing view models
- `mock/`: demo fixtures
- `api/`: adapter stubs
- `theme/`: reusable tokens and theme helpers

## Rules

- Keep page files slim. They should compose sections, not implement every detail.
- Pass data into chart components via typed props.
- Keep ECharts option creation inside chart components or dedicated helpers.
- Use CSS variables or exported tokens instead of repeating literal colors.
- Prefer semantic prop names such as `statusItems`, `metricItems`, `alarmItems`.
- If a section differs only by content, reuse a catalog component.
- Enable chart autoresize by default and ensure each chart sits inside a container with a stable readable height.
- Prefer viewport-relative layout tracks and panel-level minimum heights over page-level hardcoded pixel heights.
- Keep large-screen typography readable. Axis labels, panel titles, KPI values, and table text should all have explicit lower bounds suitable for distant viewing.
- Hide native scrollbars in dashboard list and table regions. Use internal auto-loop behavior for long ranking, alarm, and table sections.
- For tables, separate sticky or fixed headers from scrolling bodies when the content region loops or scrolls.
- Size columns semantically. Do not default every table column to equal width.
- If browser window size changes, charts and their surrounding layout should resize together without overlap, clipping, or blank chart canvases.

## Anti-patterns

- One page file with all layout, mock data, and chart config inline.
- Copying chart option objects across multiple sections.
- Hardcoding many `#00f6ff`-style values directly in view files.
- Hiding business semantics behind generic names such as `box1`, `list2`, `data3`.
- Page-level `overflow-y: auto` used as the first solution for layout fit.
- Medium panels containing multiple independent chart systems when a single hero chart would be more readable.
- Summary widgets consuming more area than the main chart or map.
- Charts rendered inside heightless flex children and then expected to resize correctly.
