# Bigscreen Generator (Harnessed)

Harness-first generator for runnable `Vue 3 + TypeScript + Vite + ECharts` big-screen dashboards.

This repository no longer depends on a template scaffold. All output files are generated from structured contracts.

## Pipeline

`request spec -> blueprint -> project manifest -> file generation -> validation`

## Repository Layout

```text
.
├─ SKILL.md
├─ schemas/
├─ core/
├─ generators/
├─ validators/
├─ references/
├─ evals/
└─ scripts/
```

## Quick Start

1. Build a blueprint from a request:

```bash
node scripts/build-blueprint.mjs --request-file request.json --format json --output docs/screen-specs/overview.blueprint.json
```

2. Build a manifest from the blueprint:

```bash
node scripts/build-project-manifest.mjs --blueprint-file docs/screen-specs/overview.blueprint.json --output docs/screen-specs/overview.manifest.json
```

3. Generate the runnable project:

```bash
node scripts/generate-screen.mjs --request-file request.json --target ./out/overview --name Overview
```

## Tests

```bash
node --test evals/contract/*.test.mjs evals/generation/*.test.mjs evals/integration/*.test.mjs
```

## Notes

- The harness enforces contract validation before generation.
- Output is manifest-driven, not template-copied.
- Build validation is available via `validators/build`.
