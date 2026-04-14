# Revision Semantics Design

## Goal

Add a manifest-first revision semantics layer that can interpret free-text change requests, map them to semantic slots, and apply adds/removes/replacements to an existing blueprint without template dependencies.

## Scope

In scope:
- Parse free-text revision input into actions (add/remove/replace/adjust)
- Map Chinese/English/alias module names to semantic slots
- Apply changes to `blueprint.sections`
- Enforce deletion rules and auto-recovery defaults
- Emit a `revisionReport` describing applied actions and conflicts

Out of scope:
- Pixel-accurate layout changes
- Detailed positioning/size changes beyond section membership
- Automated rebalancing of layout grids (deferred)

## Semantic Slots

Canonical slots:
- `metric-summary`
- `geo-focus`
- `data-table`
- `trend-chart`
- `composition-chart`
- `ranking-list`
- `alert-stream`

Mapping rules:
- Chinese and English keywords map to the canonical slots.
- Business labels are interpreted by keyword proximity/context; if mapping fails, the token is placed into `unmapped`.
- Mapping is non-destructive: unknown tokens do not change the blueprint.

## Intent Parsing

Supported actions:
- Add: `加/新增/增加/添加`
- Remove: `去掉/删除/移除/不要/不需要`
- Replace: `改成/替换为/换成`
- Adjust (record only for now): `调高/降低/变大/变小/靠左/靠右/置顶`

Conflict resolution:
- **Last occurrence wins** when the same slot is both added and removed.

Deletion priority rules:
1. Explicit delete beats general “keep main visual”.
2. If the deleted slot was the main visual, promote the next highest priority slot.
3. If remaining slots drop below 2, auto-add a fallback slot in order:
   - `trend-chart`
   - `composition-chart`
   - `ranking-list`

## Blueprint Application

Input:
- Existing blueprint
- Revision text

Output:
- Updated blueprint
- `revisionReport` summary

Rules:
- Add: insert a new section with `semanticSlot` and derived defaults.
- Remove: drop matching sections by `semanticSlot`.
- Replace: remove then add.
- Adjust: record in `revisionReport.adjustments` (layout changes not executed yet).

## Revision Report

`revisionReport` structure:
- `added`: list of slots added
- `removed`: list of slots removed
- `replaced`: list of `{ from, to }`
- `adjustments`: list of textual adjustments not applied to layout
- `conflicts`: list of conflicts and how they were resolved
- `unmapped`: tokens that could not be mapped

## Testing Strategy

Contract tests:
- Verify add/remove/replace actions modify `blueprint.sections` correctly
- Verify last-occurrence wins for conflicts
- Verify deletion of main visual triggers promotion
- Verify fallback slot insertion when sections < 2
- Verify unmapped tokens do not mutate blueprint

Integration tests:
- Run `scripts/revise-screen.mjs` with mixed add/remove directives
- Confirm output blueprint and manifest reflect expected slot changes

