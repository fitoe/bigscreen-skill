---
name: bigscreen-generator
description: Use when generating runnable Vue 3 big-screen dashboards from structured requirements, especially when you need a manifest-first pipeline instead of template copying.
---

# Bigscreen Generator (Harnessed)

Generate runnable `Vue 3 + TypeScript + Vite + ECharts` big-screen projects through a manifest-first harness.

This skill does **not** rely on a template scaffold. Every output file is generated from structured contracts and validated by the harness.

## Core Pipeline

`request spec -> blueprint -> project manifest -> file generation -> validation`

### Request Spec

Normalize user intent into a minimal, structured request with:

- `sourceMode`
- `pageIntent`
- `styleDirection`
- `requiredModules`

### Blueprint

Produce a design contract with:

- `pageName`
- `layoutPattern`
- `themeDirection`
- `sections` (semantic slots, priority, component mapping)

### Project Manifest

Describe the exact runnable project output:

- `files` (including `index.html`, `package.json`, `vite.config.ts`, `src/main.ts`, `src/router/index.ts`, `src/views/*.vue`)
- `routes`
- `projectName`

### File Generation

Use manifest-driven generators to write the project to disk. No template copying.

### Validation

- Contract checks (`evals/contract/*`)
- Build checks (`validators/build`)

## Usage

Build a blueprint from a request:

```bash
node scripts/build-blueprint.mjs --request-file request.json --format json --output docs/screen-specs/overview.blueprint.json
```

Build a manifest from a blueprint:

```bash
node scripts/build-project-manifest.mjs --blueprint-file docs/screen-specs/overview.blueprint.json --output docs/screen-specs/overview.manifest.json
```

Generate a runnable project:

```bash
node scripts/generate-screen.mjs --request-file request.json --target ./out/overview --name Overview
```

Optional build validation:

```bash
node scripts/generate-screen.mjs --request-file request.json --target ./out/overview --build
```

## Hard Rules

- Do not copy template source code or preserve template file trees.
- Do not generate a single giant page component when sections should be split.
- Do not mix layout orchestration, chart options, and business data assembly in one file.
- Do not hardcode fragile CSS naming from reference templates.

## Resource Map

- Layout patterns: `references/page-patterns.md`
- Component catalog: `references/component-catalog.md`
- Generation rules: `references/generation-rules.md`
- Vue/ECharts conventions: `references/vue3-echarts-conventions.md`
