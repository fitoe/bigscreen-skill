# Prompt Interface

Use this interface when the user wants prompt-only generation without executing scripts.

The same prompt can also be saved as a plain text request file and passed into the Node scripts.

## Image-first workflow

If the user uploads a dashboard design image in the current session, use the image as the primary requirement source.

Standard sequence:

1. Output `imageAnalysisSummary`
2. Output `normalizedPrompt`
3. Output `blueprintSummary`
4. Output the runnable project

This keeps image-driven generation aligned with the same prompt and blueprint contracts as text-only generation.

## 中文简化输入格式

```
生成一个可运行的大屏首页（Vue3 + ECharts）。
主题：<行业/场景>
关键指标：<逗号分隔>
风格：<科技蓝/工业风/指挥中心/极简等>
必须模块：<kpi、趋势、地图、排行、告警、表格等>
数据密度：高/中/低
```

## Output format

必须输出：
- Project tree
- `src/views/<PageName>.vue`
- `src/composables/use<PageName>.ts`
- `src/mock/<page-name>.ts`
- `src/router/index.ts`
- `docs/screen-specs/<page-name>.blueprint.md`
- `docs/screen-specs/<page-name>.blueprint.json`
- Blueprint metadata including `blockPriority`, `heightStrategy`, `layoutSizing`, and per-section size policies
- Semantic profile metadata so labels, events, tables, and mock rows follow the prompt instead of fixed industry placeholders
- Panel chrome metadata so module borders and title-bar backgrounds can inherit the chosen template shell
- Validation summary or warnings when the generated layout violates big-screen quality rules
- Optional Playwright validation artifacts when browser validation is enabled: screenshot and `playwright-validation.json`

When the request starts from an uploaded image, prepend:
- `imageAnalysisSummary`
- `normalizedPrompt`
- `blueprintSummary`

## 约束

- Use the component catalog before inventing new components.
- Keep page layout orchestration in the page view.
- Keep chart configuration in chart components.
- Keep data assembly in `composables/`.
- Use mock data in `mock/`.
- Prefer full above-the-fold visibility with no page-level vertical scroll by default.
- Prioritize layout by title / primary content / auxiliary content, not equal slicing.
- Use full-screen constrained layout by default: root fills the viewport, rows and columns use fixed/flex mixes, and section overflow stays inside the owning panel.
- Enforce big-screen readability floors for KPI, titles, axes, and tables.
- Auto-resize charts with stable container heights.
- Default-enable list auto-rotate and fixed table headers with hidden native scrollbars.

## Revision flow

Use a short follow-up prompt to revise the existing screen instead of rebuilding from scratch.

Example:

```
保留首页，不要切专题页。
右侧摘要区改成排行和构成，不要太复杂。
底部表格加高一点。
```

## 中文简化示例

```
生成一个可运行的大屏首页（Vue3 + ECharts）。
主题：智慧园区
关键指标：在线设备、告警数量、能耗负载
风格：深蓝指挥中心
必须模块：kpi、趋势、地图、排行、告警、表格
数据密度：高
```

## 图片驱动示例

```text
请直接参考我上传的大屏设计图，生成一个可运行的大屏首页（Vue3 + ECharts）。
要求尽量保留图片里的模块边框、标题栏背景、左右分栏节奏和主视觉布局，但不要复制原模板源码。
可以使用模拟数据，生成结果要可继续编辑。
```
