# Vue 3 + ECharts Conventions

## Stack

- Vue 3
- `<script setup lang="ts">`
- Composition API
- Vite
- Tailwind CSS utilities
- ECharts

## File boundaries

- `views/`: page orchestration only
- `components/bigscreen/`: section-level presentation
- `components/bigscreen/charts/`: chart wrappers and option builders
- `composables/`: assemble page-facing view models
- `mock/`: demo fixtures
- `api/`: adapter stubs
- `theme/`: Tailwind entry and reusable chrome class helpers

## Rules

- Keep page files slim. They should compose sections, not implement every detail.
- Pass data into chart components via typed props.
- Keep ECharts option creation inside chart components or dedicated helpers.
- Use Tailwind utilities and exported class maps instead of page-local style blocks.
- Prefer semantic prop names such as `statusItems`, `metricItems`, `alarmItems`.
- If a section differs only by content, reuse a catalog component.

## Anti-patterns

- One page file with all layout, mock data, and chart config inline.
- Copying chart option objects across multiple sections.
- Hardcoding many `#00f6ff`-style values directly in view files.
- Hiding business semantics behind generic names such as `box1`, `list2`, `data3`.
