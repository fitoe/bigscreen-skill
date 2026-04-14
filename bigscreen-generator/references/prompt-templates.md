# Prompt Templates

## Requirement Parse

```text
Extract the dashboard request into domain, page_type, audience, must_have_sections, key_metrics, preferred_style, data_density, map_required, and refresh_expectation. If any required field is missing, list only the minimum follow-up questions.
```

## Blueprint Prompt

```text
Produce a page blueprint for a Vue 3 + ECharts big-screen page. Use 3 to 5 reference templates as style and structure cues only. Return page_name, goal, layout_pattern, theme_direction, reference_templates, and a section list containing id, area, purpose, component, and data_contract.
```

## Reference Summary Prompt

```text
Summarize each selected reference template by layout type, suitable page type, color direction, strong sections, chart families, and what to borrow without copying source code.
```

## Code Generation Prompt

```text
Generate a maintainable Vue 3 + TypeScript + Tailwind CSS + ECharts page from the approved blueprint. Reuse standard components first, keep layout, charts, and data assembly separated, and produce mock data, Tailwind theme helpers, and a page spec document.
```

## Image To Prompt Prompt

```text
Analyze the provided dashboard screenshot and convert it into a generator-ready prompt. Extract page type, layout narrative, required modules, key metrics, panel chrome, module notes, and first-screen constraints. Preserve reusable panel shell traits but do not copy page markup.
```

## Image Direct Generation Prompt

```text
The user has uploaded a dashboard design image and wants a runnable Vue 3 + ECharts project. First output an imageAnalysisSummary, then convert the image into a normalized prompt and a short blueprint summary, then generate the project. Preserve layout rhythm, dominant modules, and reusable panel chrome from the image, but rebuild the page with maintainable components instead of copying markup.
```
