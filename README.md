# Bigscreen Generator

一个面向中文需求的大屏生成 skill，用于从业务描述或参考图片生成可运行的 `Vue 3 + TypeScript + Vite + Tailwind CSS + ECharts` 大屏项目。

它不是模板拷贝器。`BigDataView` 这类模板库只作为结构、风格和装饰参考，生成结果会尽量保持可维护、可编辑、可替换数据源。

## 能力概览

- 根据中文 prompt 生成大屏首页或专题页
- 先产出 blueprint，再生成项目代码
- 支持图片驱动：上传设计图后先提炼结构化 prompt，再生成项目
- 支持改版：基于已有 blueprint 做 revision，而不是盲目重建
- 支持真实地图边界：识别省/市/区县或 adcode，自动下载 Datav GeoJSON
- 支持浏览器级验收：生成后可选调用 Playwright 做满屏、溢出、可读性和参考图对照检查
- 默认输出 Tailwind CSS 风格的大屏项目，不再以手写 `scss` 为主

## 适用场景

- 政务、园区、交通、金融、制造等大屏首页
- 指挥中心、监控分析、告警中心、地图指挥页
- 希望“参考模板风格，但不要直接抄模板代码”的项目
- 希望生成结果能继续手工维护、接 API、换 mock 数据的项目

## 项目结构

```text
.
├─ SKILL.md
├─ agents/
├─ assets/
│  └─ starter/
├─ references/
├─ scripts/
└─ tests/
```

关键目录说明：

- `SKILL.md`：skill 主说明，面向新会话调用
- `assets/starter/`：生成项目的 starter 模板
- `references/`：布局规则、组件目录、prompt 接口、模板索引
- `scripts/`：blueprint、生成、改版、校验、地图和图片相关脚本
- `tests/`：核心能力测试

## 核心工作流

### 1. 文本需求生成

先根据需求生成 blueprint，再生成项目：

```bash
node scripts/build-blueprint.mjs --request-file request.txt --format json --output docs/screen-specs/demo.blueprint.json
node scripts/generate-screen.mjs --request-file request.txt --target ./out/demo --name DemoScreen
```

### 2. 图片驱动生成

先把图片分析结果整理成 `image-spec`，再生成：

```bash
node scripts/build-prompt-from-image-spec.mjs --input-file tests/fixtures/inclusive-finance-image-spec.json
node scripts/generate-screen-from-image-spec.mjs --input-file tests/fixtures/inclusive-finance-image-spec.json --target ./out/image-demo --name InclusiveFinanceOverview
```

### 3. 基于已有 blueprint 改版

```bash
node scripts/revise-screen.mjs --blueprint-file ./out/demo/docs/screen-specs/demo-screen.blueprint.json --revision-file revision.txt --target ./out/demo --name DemoScreen
```

## 中文需求示例

```text
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

## 地图能力

当需求里出现明确的省、市、区县或 adcode 时，生成器会尝试解析 Datav 地图边界并下载真实 GeoJSON。

例如：

- 临沂市：`https://geo.datav.aliyun.com/areas_v3/bound/371300_full.json`
- 临沂市兰山区：`https://geo.datav.aliyun.com/areas_v3/bound/371302.json`

你可以在 prompt 里直接写：

```text
请使用临沂市兰山区地图
```

如果地图边界下载失败，生成流程不会中断，会自动回退到 mock 地图表现。

## Playwright 浏览器核验

如果环境里已经安装 Playwright，可以在生成后自动做浏览器级核验。

### 直接生成后核验

```bash
node scripts/generate-screen.mjs --request-file request.txt --target ./out/demo --name DemoScreen --playwright
```

### 图片驱动生成后核验

```bash
node scripts/generate-screen-from-image-spec.mjs --input-file image-spec.json --target ./out/image-demo --name ImageScreen --playwright
```

### 单独执行核验

```bash
node scripts/playwright-validate-screen.mjs --target ./out/demo
```

带参考图意图时：

```bash
node scripts/playwright-validate-screen.mjs --target ./out/demo --reference-spec-file image-spec.json --reference-image design.png
```

当前核验内容包括：

- 页面是否满屏
- 是否出现页面级滚动条
- panel 是否超出视口
- 最小字体是否过小
- 表格可见行数是否过少
- 主视觉区块是否和 blueprint 主优先级明显冲突
- 有参考图时，是否和参考布局意图明显偏离

## 布局约束

这个 skill 的大屏布局规则不是“平均切块”，而是：

- 默认满屏展示，不依赖页面级滚动
- 页面先锁定视口，再做内部布局
- 支持固定宽度 + 弹性宽度混合分栏
- 支持固定高度 + 弹性高度混合分区
- 每个 panel 内部默认 `header + content` 两段式
- 所有内容溢出优先在所属 panel 内解决
- 图表、表格、列表都必须拿到稳定可用尺寸

对应的 blueprint 会输出：

- `blockPriority`
- `heightStrategy`
- `layoutSizing`
- 每个 section 的 `heightPolicy`
- 每个 section 的 `sizePolicy`

## 生成结果包含什么

默认会生成：

- `src/views/<PageName>.vue`
- `src/components/bigscreen/*`
- `src/composables/use<PageName>.ts`
- `src/mock/<page-name>.ts`
- `src/router/index.ts`
- `docs/screen-specs/<page-name>.blueprint.md`
- `docs/screen-specs/<page-name>.blueprint.json`

## 重要原则

- 不整页复制模板源码
- 不保留原模板脆弱的 DOM 和 CSS 命名
- 不把布局、图表配置和业务数据拼在一个大文件里
- 不用普通后台页面的紧凑信息密度去做大屏
- 不为了“像模板”牺牲可维护性

## 参考文档

- [SKILL.md](./SKILL.md)
- [references/prompt-interface.md](./references/prompt-interface.md)
- [references/generation-rules.md](./references/generation-rules.md)
- [references/image-to-prompt.md](./references/image-to-prompt.md)
- [references/component-catalog.md](./references/component-catalog.md)

## 测试

示例：

```bash
node --test tests/build-blueprint.test.mjs tests/generate-screen.test.mjs tests/generate-from-blueprint.test.mjs
```

## 当前限制

- 图片直转能力在 skill / 多模态会话里最好用；本地脚本本身不直接做视觉识别，而是消费 `image-spec`
- Playwright 校验是可选能力，不内置安装
- 参考图对照目前是“布局和结构意图对比”，不是像素级还原比对
