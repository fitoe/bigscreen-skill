# MapCommandPage Blueprint

## Goal

Support traffic dashboards for map-command-page.

## Layout Pattern

map-command-page

## Theme Direction

deep blue command center

## Block Priority

- map
- alerts
- table
- trend
- ranking

## Height Strategy

Keep the map and bottom operational table visible above the fold, with the map holding the largest elastic area.

- Use title / primary content / auxiliary content layering instead of equal slices.
- Allocate more height to tables and event streams for high-density data.

## Semantic Profile

- entity: Assets
- metrics: Active Assets, Alerts, Load, Completion Rate
- eventLabel: Asset Events
- tableLabel: Assets Ledger

## Panel Chrome

- variant: command-angled
- titleBar: glow-tab
- borderStyle: double-frame

## Reference Templates

- 034 晋城高速综合管控大数据: 晋城高速综合管控大数据 | scenes=traffic | charts=line, bar, pie, gauge, scatter
- 080 北斗车联网大数据平台: 北斗车联网大数据平台 | scenes=traffic | charts=line, bar, pie, gauge, scatter
- 044 车联网平台数据概览: 车联网平台数据概览 | scenes=traffic | charts=line, bar, pie, gauge, scatter
- 032 物流云数据看板平台: 物流云数据看板平台 | scenes=traffic | charts=line, bar, pie, gauge, scatter
- 041 智慧物流服务中心: 智慧物流服务中心 | scenes=traffic | charts=line, bar, pie, gauge, scatter

## Sections

- StatCard-1 | area=top | component=StatCard | purpose=kpi | priority=70 | min=120 | scroll=false | autoRotate=false | data=metric-list
- MapPanel-2 | area=center | component=MapPanel | purpose=map | priority=100 | min=360 | scroll=false | autoRotate=false | data=map-payload
- AlarmTicker-3 | area=bottom | component=AlarmTicker | purpose=alerts | priority=95 | min=220 | scroll=true | autoRotate=true | data=event-stream
- RankingList-4 | area=side | component=RankingList | purpose=ranking | priority=74 | min=220 | scroll=false | autoRotate=false | data=chart-series
- ScrollTable-5 | area=bottom | component=ScrollTable | purpose=table | priority=92 | min=260 | scroll=true | autoRotate=true | data=row-list
