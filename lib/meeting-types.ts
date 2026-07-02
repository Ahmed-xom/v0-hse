export type MeetingStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'

export interface MeetingAttendee {
  id: string
  meeting_id: string
  name: string
  email: string | null
  role: string | null
  department: string | null
  attended: boolean
}

export interface Meeting {
  id: string
  ref_no: string | null
  meeting_type: string
  title: string
  date: string
  location: string | null
  business_unit: string | null
  chairperson: string | null
  chairperson_email: string | null
  agenda: string | null
  minutes: string | null
  action_items: string | null
  status: MeetingStatus
  created_by: string | null
  created_at: string
  updated_at: string
  attendees?: MeetingAttendee[]
}

export const MEETING_TYPES = [
  'HSE Committee Meeting',
  'Safety Stand-Down',
  'Toolbox Talk',
  'Management Review',
  'Incident Review',
  'Training Briefing',
  'Emergency Drill Debrief',
  'Contractor HSE Meeting',
  'Weekly Safety Meeting',
  'Monthly HSE Meeting',
  'Other',
]
