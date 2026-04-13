export const generatedOverviewMock = {
  title: 'Generated Overview',
  subtitle: 'Bigscreen Starter',
  statusItems: [
    { label: 'Updated', value: 'Realtime' },
    { label: 'Mode', value: 'Mock' },
  ],
  stats: [
    { label: 'Online Devices', value: 1284, unit: '', delta: 3.2 },
    { label: 'Energy Load', value: 76.3, unit: 'MW', delta: -1.4 },
    { label: 'Alarm Count', value: 18, unit: '', delta: 5.8 },
    { label: 'Tasks Closed', value: 94.6, unit: '%', delta: 2.1 },
  ],
  trend: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [120, 132, 141, 158, 149, 167, 173],
  },
  compare: {
    categories: ['North', 'South', 'East', 'West', 'Central'],
    series: [88, 121, 96, 104, 137],
  },
  composition: [
    { name: 'Normal', value: 72 },
    { name: 'Warning', value: 18 },
    { name: 'Critical', value: 10 },
  ],
  ranking: [
    { name: 'Area A', value: 98 },
    { name: 'Area B', value: 91 },
    { name: 'Area C', value: 84 },
    { name: 'Area D', value: 78 },
  ],
  alarms: [
    { time: '09:12', message: 'Cooling station temperature spike', level: 'major' as const },
    { time: '09:18', message: 'Gate access anomaly', level: 'minor' as const },
    { time: '09:24', message: 'Power fluctuation in zone 3', level: 'critical' as const },
  ],
  table: {
    columns: [
      { key: 'name', label: 'Device' },
      { key: 'status', label: 'Status' },
      { key: 'value', label: 'Value' },
    ],
    rows: [
      { id: 1, name: 'Transformer 01', status: 'Normal', value: '56.2' },
      { id: 2, name: 'Pump 04', status: 'Warning', value: '83.4' },
      { id: 3, name: 'Camera 17', status: 'Normal', value: 'Online' },
    ],
  },
};
