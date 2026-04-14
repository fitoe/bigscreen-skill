# Prompt Interface

Use this interface when the user wants prompt-only generation without executing scripts.

The same prompt can also be saved as a plain text request file and passed into the Node scripts.

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
- Blueprint metadata including `blockPriority`, `heightStrategy`, and per-section height policies
- Validation summary or warnings when the generated layout violates big-screen quality rules

## 约束

- Use the component catalog before inventing new components.
- Keep page layout orchestration in the page view.
- Keep chart configuration in chart components.
- Keep data assembly in `composables/`.
- Use mock data in `mock/`.
- Prefer full above-the-fold visibility with no page-level vertical scroll by default.
- Prioritize layout by title / primary content / auxiliary content, not equal slicing.
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
