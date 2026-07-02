// Runtime constants shared across server actions and client components.
// Keep this file free of 'use server' so it can be safely imported anywhere.

export const SERVICE_CATEGORIES = [
  'Camp Services',
  'Catering',
  'Cleaning & Housekeeping',
  'Equipment Maintenance',
  'HSE Services',
  'IT Services',
  'Logistics & Transport',
  'Medical Services',
  'Security',
  'Waste Management',
  'Other',
] as const

export const DOCUMENT_CATEGORIES = [
  'Policy',
  'Standard',
  'Procedure',
  'Guideline',
  'Form / Template',
  'Report',
  'HSE Plan',
  'Legal / Regulatory',
  'Training Material',
  'Other',
] as const
