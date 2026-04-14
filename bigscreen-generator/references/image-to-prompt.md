# Image-Driven Generation

Use this when the user provides a screenshot, design image, or mockup and wants `bigscreen-generator` to recreate the dashboard as a maintainable project.

## Goal

Convert a visual dashboard reference into a stable prompt and generation brief that preserves:

- information architecture
- first-screen composition
- primary visual hierarchy
- panel chrome
- chart and table semantics
- readable big-screen constraints

Do not describe every pixel. Extract only what the generator can act on and turn into maintainable Vue components.

## Direct image workflow

When the current session supports image input, use this sequence:

1. Inspect the uploaded image.
2. Write a short `imageAnalysisSummary`.
3. Convert that analysis into a `naturalPrompt` and `structuredPrompt`.
4. Produce a concise blueprint summary.
5. Generate the runnable project when the user asks for direct image-to-project output.

If the image is incomplete or labels are unreadable, infer plausible semantics and say so briefly. Do not block unless the page intent is fundamentally ambiguous.

## What To Extract

### 1. Page framing

- page type: `overview-home`, `map-command-page`, `monitoring-analysis`, `alarm-center`, or `thematic-cockpit`
- overall title or topic
- tone and visual direction
- whether the page is leadership-oriented or operations-oriented

### 2. Layout narrative

Describe layout as information composition, for example:

- left data service / center map / right evaluation / bottom product analysis
- top KPI rail / center operational trend / right summary / bottom ledger

Avoid visual-only language such as "three columns with some boxes" unless it maps to content roles.

### 3. Primary modules

Extract the modules that visually dominate the screen:

- KPI group
- map
- trend
- compare
- composition
- ranking
- alerts
- table

For each module, identify:

- position
- narrative role
- likely chart family
- whether it needs auto-rotate or scroll

### 4. Panel chrome

Capture reusable panel shell traits:

- border shape: straight, angled, bracketed, double frame
- title-bar style: glow tab, split band, soft band
- corner treatment: light corners, bracket corners, none
- background effect: glow, gradient strip, inner frame

These should become `panelChrome` hints, not copied markup.

### 5. Visible semantic cues

Extract any readable or inferable labels that help generation:

- page title
- KPI labels
- table headers
- map regions
- ranking categories
- alert or event naming
- product or entity names

If labels are partially unreadable, prefer stable semantic replacements over placeholders such as `Item 01`.

### 6. Big-screen constraints

Always infer:

- first screen must fit without page-level vertical scroll
- map or primary chart should stay dominant
- right summary should stay lighter than the main view
- bottom table or ledger should remain readable
- preserve panel shell style
- preserve layout rhythm instead of evenly slicing all panels

## Output Format

Return these outputs:

### `imageAnalysisSummary`

A short bullet list that states what the image is telling the generator about layout, dominant modules, shell style, and likely semantics.

### `naturalPrompt`

A concise Chinese prompt ready for `bigscreen-generator`.

### `structuredPrompt`

```yaml
topic:
pageType:
style:
layoutNarrative:
mustModules: []
keyMetrics: []
panelChrome:
  variant:
  titleBar:
  borderStyle:
moduleNotes: []
constraints: []
```

### `blueprintHints`

Optional structured hints that make the next stage more stable:

```yaml
primaryView:
secondaryZones: []
preferredTableHeight:
avoid:
  - even panel slicing
  - overloading the right summary column
```

## Prompt Construction Rules

- Name modules by semantic role, not just by shape.
- Preserve panel shell language explicitly.
- If the screenshot shows tables, mention fixed header and scrolling body.
- If the screenshot shows rankings or alert lists, mention auto-rotate when appropriate.
- If exact labels are unreadable, infer generic but plausible labels.
- If the user says "directly reference this image" or "restore this screen", continue through project generation instead of stopping after prompt construction.
- Prefer stable phrases such as:
  - "保留模板式模块边框与标题栏背景"
  - "中间主视觉是地图"
  - "右侧为摘要与评价区"
  - "底部保留产品分析/台账区"

## Visual restoration boundaries

- Allowed:
  - preserve layout rhythm
  - preserve dominant module ordering
  - preserve panel borders, title bars, corners, glow shells
  - preserve map-centered or chart-centered visual hierarchy
- Not allowed:
  - copy full-page markup
  - claim pixel-perfect restoration from a single screenshot
  - reproduce hidden interactions or unreadable labels as facts
  - inherit fragile selectors from a reference implementation

## Example Pattern

```text
先根据上传图片提取布局与模块，再生成一个可运行的大屏首页（Vue3 + ECharts）。

主题：<从图片推断的主题>
页面类型：<推断类型>
风格：<深蓝科技大屏/冷蓝指挥中心/...>，保留模板式模块边框、标题栏背景、发光描边
数据密度：高

核心布局：
- <左列语义>
- <中列主视觉>
- <右列摘要>
- <底部分析>

必须模块：
- kpi
- map
- table
- ...

生成约束：
- 首屏完整展示
- 主视觉最大
- 保留 panel chrome
- ...
```
