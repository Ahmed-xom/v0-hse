// Plain constants — no 'use server', safe to import in both client and server files.

export const ALL_TABS = [
  { key: 'observations',    label: 'Observations' },
  { key: 'incidents',       label: 'Incidents' },
  { key: 'inspections',     label: 'Inspections' },
  { key: 'meetings',        label: 'Meetings' },
  { key: 'service-quality', label: 'Service Quality' },
  { key: 'ptw',             label: 'Permit to Work' },
  { key: 'moc',             label: 'MOC / Exemptions' },
  { key: 'documents',       label: 'Documents' },
  { key: 'reports',         label: 'Reports' },
  { key: 'journey',         label: 'Journey Tracker' },
] as const

export type TabKey = typeof ALL_TABS[number]['key']

export const DEFAULT_TABS: TabKey[] = ALL_TABS.map(t => t.key)
