---
name: bigscreen-generator
description: Use when generating Vue 3 plus ECharts big-screen dashboard projects from business requirements, especially when the result should be custom-built instead of copied from template libraries, while using existing big-screen templates only as structure and style references.
---

# Bigscreen Generator

Generate componentized `Vue 3 + TypeScript + Vite + ECharts` big-screen projects from requirements.

Treat template libraries such as `BigDataView` as reference corpora only. Do not copy full-page source code, preserve original template structure, or optimize for visual imitation over maintainability.

Treat business requests through a generic semantic profile layer. Infer entities, metrics, events, ledgers, and narrative roles from the prompt instead of hardcoding industry-specific page presets.

Preserve reusable template panel chrome when it improves the result. Border shapes, title-bar backgrounds, corners, and glow shells may be inherited as reusable visual metadata, but full-page markup and fragile selectors must still be rejected.

## Workflow

1. Parse the request into:
   - business domain
   - page type
   - required sections
   - priority metrics
   - style direction
2. If inputs are incomplete, ask at most 3 focused clarification rounds.
3. Read [references/page-patterns.md](references/page-patterns.md) and choose the closest page pattern.
4. Read [references/template-index.curated.md](references/template-index.curated.md) first, then fall back to [references/template-index.generated.md](references/template-index.generated.md) when the curated list is insufficient.
5. Read [references/component-catalog.md](references/component-catalog.md) and map each required section to standard components before inventing new ones.
6. Read [references/vue3-echarts-conventions.md](references/vue3-echarts-conventions.md) and follow its code boundaries.
7. Produce a page blueprint first:
   - page goal
   - section list
   - component tree
   - chart types
   - data contracts
   - theme direction
   - block priority
   - height strategy
   - per-section height policy
   - semantic profile
   - panel chrome
8. Stop and ask the user to confirm the blueprint before generating code.
9. After approval, generate the screen directly from the prompt response:
   - If scripts are available, you may use them, but prompt-only generation is valid and expected.
   - Output a full project structure and key files in the response.
10. Generate or update:
    - page entry
    - section components
    - chart components
    - composables
    - mock data
    - API adapter stub
    - theme tokens
    - page spec doc
    - blueprint json and markdown artifacts
11. For follow-up change requests, revise the existing blueprint instead of regenerating blindly:
    - apply the new prompt as a blueprint revision
    - preserve page intent unless the user explicitly requests a different page type
    - re-run project generation from the revised blueprint
12. Run `scripts/validate-screen-output.mjs` on the generated result before claiming completion.

## Prompt Interface (Direct Use)

Use this when the user wants a prompt-only flow, without running scripts.

### 中文简化输入格式

```
生成一个可运行的大屏首页（Vue3 + ECharts）。
主题：<行业/场景>
关键指标：<逗号分隔>
风格：<科技蓝/工业风/指挥中心/极简等>
必须模块：<kpi、趋势、地图、排行、告警、表格等>
数据密度：高/中/低
```

### 输出格式要求

必须输出“可运行项目”，包含：
- 项目树（含 `package.json`、`vite.config.ts`、`src/main.ts`）
- `src/views/<PageName>.vue`
- `src/components/bigscreen/*` 及必要的派生区块组件
- `src/composables/use<PageName>.ts`
- `src/mock/<page-name>.ts`
- `src/router/index.ts`
- `docs/screen-specs/<page-name>.blueprint.md`
- `docs/screen-specs/<page-name>.blueprint.json`
- Blueprint metadata with `blockPriority`, `heightStrategy`, and per-section height policies
- Semantic profile metadata describing entities, metric labels, event labels, and ledger columns

### 中文简化示例

```
生成一个可运行的大屏首页（Vue3 + ECharts）。
主题：智慧园区
关键指标：在线设备、告警数量、能耗负载
风格：深蓝指挥中心
必须模块：kpi、趋势、地图、排行、告警、表格
数据密度：高
```

### 追加改版示例

```
保留首页，不要切专题页。
右侧摘要区改成排行和构成，不要太复杂。
底部表格加高一点。
```

## Hard Rules

- Do not copy a reference template page wholesale.
- Do not preserve the original template's file tree or CSS naming as a compatibility target.
- Do not generate a single giant page component when sections should be split.
- Do not mix layout orchestration, chart options, and business data assembly in one file.
- Do not hardcode large numbers of colors, borders, or shadows directly in page files.
- Do not skip the blueprint confirmation gate.
- Do not favor visual similarity over maintainability, composition, and data replaceability.

## Resource Map

- Layout and IA choices: [references/page-patterns.md](references/page-patterns.md)
- Template retrieval and style references: [references/template-index.md](references/template-index.md)
- Curated first-pass template retrieval: [references/template-index.curated.md](references/template-index.curated.md)
- Full generated template retrieval corpus: [references/template-index.generated.md](references/template-index.generated.md)
- Reusable building blocks: [references/component-catalog.md](references/component-catalog.md)
- Generation decision rules: [references/generation-rules.md](references/generation-rules.md)
- Vue/ECharts code boundaries: [references/vue3-echarts-conventions.md](references/vue3-echarts-conventions.md)
- Prompt scaffolds for requirement parsing and blueprinting: [references/prompt-templates.md](references/prompt-templates.md)

## Scripts

- `node scripts/build-template-index.mjs --source <BigDataView-path>`
- `node scripts/extract-template-features.mjs --source <BigDataView-path> --output references/template-index.generated.md`
- `node scripts/build-curated-catalog.mjs --input references/template-features.json --output references/template-index.curated.md`
- `node scripts/build-blueprint.mjs --request-file <request.json|txt> --format json --output docs/screen-specs/<name>.blueprint.json`
- `node scripts/scaffold-screen.mjs --name SmartParkOverview --target <project-path>`
- `node scripts/generate-screen.mjs --request-file <request.json|txt> --target <project-path> --name <ScreenName>`
- `node scripts/revise-blueprint.mjs --blueprint-file <existing.blueprint.json> --revision-file <revision.txt> --format json --output docs/screen-specs/<name>.blueprint.json`
- `node scripts/revise-screen.mjs --blueprint-file <existing.blueprint.json> --revision-file <revision.txt> --target <project-path> --name <ScreenName>`
- `node scripts/validate-screen-output.mjs --target <project-path>`

Use the scripts for deterministic setup and validation. Prefer updating the generated output rather than rewriting the same boilerplate by hand.
