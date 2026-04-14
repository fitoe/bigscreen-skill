# Bigscreen Harness Rewrite Design

## Goal

Rewrite the repository into a harnessed generator that outputs complete runnable `Vue 3 + TypeScript + Vite + ECharts` big-screen projects from text or image requirements.

The new system must not depend on `assets/starter` or any static starter template. Every generated project file should be produced from structured intermediate artifacts and validated through explicit control loops.

## Scope

In scope:

- Replace the current starter-driven generation path with a contract-driven pipeline
- Preserve the ability to generate complete runnable projects
- Keep the current domain focus on large-screen dashboards
- Keep image-driven and text-driven generation as first-class inputs
- Promote current hard rules into executable policies and validators

Out of scope for the first rewrite:

- Backward compatibility with old script APIs
- Keeping `assets/starter` as a supported backend
- Multi-framework output targets
- Pixel-perfect screenshot reproduction guarantees

## Product Definition

The repository is no longer a starter-template skill. It is a compiler-like generation system:

`request spec -> blueprint -> project manifest -> file generation -> validation -> optional browser eval`

Primary success criterion:

- Given a valid requirement, the system emits a complete runnable Vue project that installs, builds, and renders a first screen matching the intended dashboard structure and priorities.

Secondary success criteria:

- Failures are classified by stage
- Revisions operate on structured artifacts instead of regenerating blindly
- Rules are enforced by code, not only by documentation

## Architecture

### 1. Request Spec

`request spec` is the normalized user intent layer.

It must unify:

- text-only requests
- image-derived requests
- follow-up revision requests

It contains:

- source mode
- domain and page intent
- required modules
- metric priorities
- style direction
- map targets
- density and readability preferences
- explicit constraints
- image extraction summary when applicable

This is the only layer allowed to depend on multimodal extraction details.

### 2. Blueprint

`blueprint` is the page design contract.

It captures:

- layout pattern
- section inventory
- semantic roles
- section priorities
- height and size policies
- chart families
- data contracts
- theme direction
- chrome hints
- semantic profile

The blueprint does not describe Vue file paths or implementation details. It describes what the page must be.

### 3. Project Manifest

`project manifest` is the implementation contract for a runnable Vue project.

It contains:

- full file inventory
- route definitions
- page entry definitions
- generated component instances
- component dependency graph
- data providers and mock files
- theme tokens
- map assets
- package dependencies
- build config requirements

This is the key abstraction that replaces the starter template. The generated project becomes a compilation target of the manifest.

## Semantic Slot Model

Blueprint sections should not bind directly to legacy implementation names like `StatCard` or `MapPanel`.

Each section first maps to a semantic slot such as:

- `metric-summary`
- `trend-chart`
- `geo-focus`
- `ranking-list`
- `alert-stream`
- `composition-chart`
- `data-table`

Then the generator registry selects an implementation strategy for that slot in Vue.

Benefits:

- removes template inheritance pressure
- allows implementation evolution without changing blueprint contracts
- keeps revision logic stable

## Policy Engine

Current hard rules should become executable policies under `core/policies`.

Required first-wave policies:

- no page-level scrolling
- first screen occupies viewport
- main visual priority is reflected in layout weight
- pie/ring legends remain data-bound legends by default
- tables meet minimum visible capacity rules
- map visuals remain centered and use resolved geo boundaries when possible
- outer margins remain readable
- chart, layout, and business data concerns stay separated

Policies should run at blueprint, manifest, and output-validation stages where appropriate.

## Validation Model

The harness should validate in three layers.

### Contract Validation

Validates schemas and structural invariants:

- request spec schema
- blueprint schema
- project manifest schema
- required file inventory

### Build Validation

Validates project executability:

- install dependencies
- type check
- build

### UX Validation

Validates rendered dashboard behavior:

- full-screen occupancy
- overflow violations
- minimum readability
- table row capacity
- legend placement and visibility
- map placement and centering
- major layout deviation from reference intent when image-based

## Failure Taxonomy

Every failure should be emitted with a stage and code.

Required categories:

- request-normalization failure
- blueprint validation failure
- manifest assembly failure
- file-generation failure
- build failure
- browser-eval failure

This enables repair flows and makes the harness debuggable.

## Revision Flow

Initial generation and revision should be separate control paths.

Initial generation:

`request spec -> blueprint -> project manifest -> project`

Revision:

`existing blueprint + revision request -> revised blueprint -> manifest diff -> regenerated project`

The revision path must preserve page intent unless the request explicitly changes it.

## Repository Layout

Target layout:

```text
.
├─ SKILL.md
├─ README.md
├─ schemas/
│  ├─ request.schema.json
│  ├─ blueprint.schema.json
│  ├─ project-manifest.schema.json
│  └─ screen-output.schema.json
├─ core/
│  ├─ request/
│  ├─ blueprint/
│  ├─ manifest/
│  └─ policies/
├─ generators/
│  ├─ registry/
│  ├─ files/
│  └─ project/
├─ validators/
│  ├─ contract/
│  ├─ build/
│  └─ ux/
├─ references/
├─ evals/
└─ scripts/
```

`assets/starter` should be removed from the main generation path and then deleted once the new path is stable.

## Migration Plan

### Phase 1: Core Contracts

- add schemas for request, blueprint, manifest, and output
- implement parsers and validators
- keep current references as source material only

### Phase 2: Manifest-Centric Generation

- implement semantic slot registry
- implement manifest builder
- implement file generators for complete Vue project output
- stop reading from `assets/starter`

### Phase 3: Validation Harness

- rebuild current validation scripts on top of manifest/output contracts
- add build validation
- preserve Playwright UX checks as a dedicated validation layer

### Phase 4: Revision and Image Paths

- separate image extraction into dedicated request-normalization path
- implement revision path using blueprint and manifest deltas

### Phase 5: Deletion of Legacy Path

- remove `assets/starter`
- remove starter-coupled tests
- rewrite `SKILL.md` to describe the new harness workflow

## Risks

### Over-design risk

Too many abstractions too early could slow down the rewrite.

Mitigation:

- keep only three primary artifacts
- use semantic slots sparingly
- ship a minimal slot registry first

### Reliability risk

Direct file generation may initially produce weaker runnable output than starter-copying.

Mitigation:

- enforce build validation early
- gate completion on full runnable output
- add evals around file inventory and buildability

### Scope risk

Trying to solve visual perfection in the first rewrite could stall delivery.

Mitigation:

- optimize first for runnable, structurally correct output
- keep visual quality checks as explicit UX validation, not as hidden generator complexity

## Recommended Implementation Order

1. Create schemas and validators
2. Implement request, blueprint, and manifest core modules
3. Implement semantic slot registry
4. Implement direct file generators for a runnable Vue project
5. Wire build validation
6. Wire UX validation
7. Rewrite scripts to use the new pipeline
8. Remove legacy starter path

## Decision Summary

- Complete rewrite on a dedicated branch
- No starter template dependency
- Fixed target stack: Vue 3 + TypeScript + Vite + ECharts
- Manifest-first harness architecture
- Policies and evals are part of the product, not auxiliary tooling
