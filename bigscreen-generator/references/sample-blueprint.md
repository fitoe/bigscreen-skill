# MapCommandPage Blueprint

## Goal

Support traffic dashboards for map-command-page.

## Layout Pattern

map-command-page

## Theme Direction

deep blue command center

## Reference Templates

- 034 晋城高速综合管控大数据: 晋城高速综合管控大数据 | scenes=traffic | charts=line, bar, pie, gauge, scatter
- 080 北斗车联网大数据平台: 北斗车联网大数据平台 | scenes=traffic | charts=line, bar, pie, gauge, scatter
- 044 车联网平台数据概览: 车联网平台数据概览 | scenes=traffic | charts=line, bar, pie, gauge, scatter
- 032 物流云数据看板平台: 物流云数据看板平台 | scenes=traffic | charts=line, bar, pie, gauge, scatter
- 041 智慧物流服务中心: 智慧物流服务中心 | scenes=traffic | charts=line, bar, pie, gauge, scatter

## Sections

- StatCard-1 | area=top | component=StatCard | purpose=kpi | data=metric-list
- MapPanel-2 | area=center | component=MapPanel | purpose=map | data=map-payload
- AlarmTicker-3 | area=bottom | component=AlarmTicker | purpose=alerts | data=event-stream
- RankingList-4 | area=side | component=RankingList | purpose=ranking | data=chart-series
- ScrollTable-5 | area=bottom | component=ScrollTable | purpose=table | data=row-list
