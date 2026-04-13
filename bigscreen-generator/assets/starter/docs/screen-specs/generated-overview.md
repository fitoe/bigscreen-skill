# Generated Overview

## Goal

Provide a baseline big-screen page that demonstrates the recommended project structure:
- page orchestration in `views/`
- reusable sections in `components/bigscreen/`
- chart wrappers in `components/bigscreen/charts/`
- mock data in `mock/`
- view-model assembly in `composables/`

## Sections

- Header summary
- KPI strip
- Hero map
- Trend analysis
- Comparison chart
- Status composition
- Alarm stream
- Device status table

## Replacement guidance

- Replace the mock fixture first.
- Keep chart option logic inside chart components.
- Add new sections through the component catalog before creating page-local markup.
