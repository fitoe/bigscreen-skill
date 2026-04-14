# Page Patterns

## Overview Home

Use for executive overview, operational health, and broad situational awareness.

Recommended structure:
- Top: `HeaderBar` + 4 to 6 `StatCard`
- Left: trend and ranking panels
- Center: `MapPanel` or flagship trend panel
- Right: composition and alert panels
- Bottom: `ScrollTable` or `AlarmTicker`

Recommended components:
- `ScreenShell`
- `HeaderBar`
- `StatCard`
- `LineTrendChart`
- `BarCompareChart`
- `PieRingChart`
- `MapPanel`
- `AlarmTicker`

## Monitoring Analysis

Use for device, energy, or production monitoring where users compare signals and diagnose anomalies.

Recommended structure:
- Top: KPI strip with status context
- Main: 2 to 4 medium chart panels
- Side: ranking or anomaly list
- Bottom: detailed device table

Recommended components:
- `ScreenShell`
- `HeaderBar`
- `StatCard`
- `LineTrendChart`
- `BarCompareChart`
- `RankingList`
- `ScrollTable`

## Alarm Center

Use when event visibility and severity triage are primary.

Recommended structure:
- Top: critical KPI strip
- Left: alert trend and category distribution
- Center: `AlarmTicker`
- Right: ranking and status summary
- Bottom: event table

Recommended components:
- `ScreenShell`
- `HeaderBar`
- `StatCard`
- `LineTrendChart`
- `PieRingChart`
- `AlarmTicker`
- `RankingList`
- `ScrollTable`

## Thematic Cockpit

Use for one business objective such as carbon reduction, supply dispatch, or campus safety.

Recommended structure:
- Top: page narrative and summary
- Main: 1 hero panel plus 4 to 6 support panels
- Bottom: supporting ledger or event rail

Recommended components:
- `ScreenShell`
- `HeaderBar`
- `PanelCard`
- `StatCard`
- chart components selected by theme
- `ScrollTable`

## Map Command Page

Use when geography drives decisions and the operator needs region-level command context.

Recommended structure:
- Top: command summary and current status
- Left and right: panels flanking the center map
- Center: `MapPanel`
- Bottom: event table or command timeline

Recommended components:
- `ScreenShell`
- `HeaderBar`
- `MapPanel`
- `StatCard`
- `RankingList`
- `ScrollTable`
- `AlarmTicker`
