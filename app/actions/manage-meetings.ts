'use server'

import { Pool } from 'pg'
import { revalidatePath } from 'next/cache'
import type { Meeting, MeetingAttendee, MeetingStatus } from '@/lib/meeting-types'

// Re-export types so callers can import from one place (type-only, safe in use server files)
export type { Meeting, MeetingAttendee, MeetingStatus }

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function getMeetings(filter?: {
  type?: string
  status?: string
  search?: string
}): Promise<Meeting[]> {
  try {
    let query = `SELECT * FROM public.meeting WHERE 1=1`
    const params: any[] = []
    let idx = 1

    if (filter?.type && filter.type !== 'all') {
      query += ` AND meeting_type = $${idx++}`
      params.push(filter.type)
    }
    if (filter?.status && filter.status !== 'all') {
      query += ` AND status = $${idx++}`
      params.push(filter.status)
    }
    if (filter?.search) {
      query += ` AND (title ILIKE $${idx} OR chairperson ILIKE $${idx} OR location ILIKE $${idx})`
      params.push(`%${filter.search}%`)
      idx++
    }
    query += ` ORDER BY date DESC`

    const result = await pool.query(query, params)
    return result.rows.map((r) => ({
      ...r,
      date: r.date ? new Date(r.date).toISOString() : '',
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : '',
    }))
  } catch (e: any) {
    console.error('[v0] getMeetings error:', e.message)
    return []
  }
}

export async function getMeetingWithAttendees(id: string): Promise<Meeting | null> {
  try {
    const m = await pool.query('SELECT * FROM public.meeting WHERE id = $1', [id])
    if (!m.rows.length) return null
    const att = await pool.query(
      'SELECT * FROM public.meeting_attendee WHERE meeting_id = $1 ORDER BY name',
      [id]
    )
    const meeting = m.rows[0]
    return {
      ...meeting,
      date: new Date(meeting.date).toISOString(),
      created_at: new Date(meeting.created_at).toISOString(),
      updated_at: new Date(meeting.updated_at).toISOString(),
      attendees: att.rows,
    }
  } catch (e: any) {
    console.error('[v0] getMeetingWithAttendees error:', e.message)
    return null
  }
}

export async function createMeeting(
  data: {
    meeting_type: string
    title: string
    date: string
    location?: string
    business_unit?: string
    chairperson?: string
    chairperson_email?: string
    agenda?: string
    minutes?: string
    action_items?: string
    status?: MeetingStatus
    created_by?: string
  },
  attendees?: { name: string; email?: string; role?: string; department?: string }[]
): Promise<{ success: boolean; id?: string; error?: string }> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ref_no = `MTG-${Date.now().toString().slice(-6)}`
    const res = await client.query(
      `INSERT INTO public.meeting
        (ref_no, meeting_type, title, date, location, business_unit, chairperson, chairperson_email,
         agenda, minutes, action_items, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        ref_no,
        data.meeting_type,
        data.title,
        data.date,
        data.location ?? null,
        data.business_unit ?? null,
        data.chairperson ?? null,
        data.chairperson_email ?? null,
        data.agenda ?? null,
        data.minutes ?? null,
        data.action_items ?? null,
        data.status ?? 'Scheduled',
        data.created_by ?? null,
      ]
    )
    const meetingId = res.rows[0].id

    if (attendees?.length) {
      for (const a of attendees) {
        await client.query(
          `INSERT INTO public.meeting_attendee (meeting_id, name, email, role, department)
           VALUES ($1,$2,$3,$4,$5)`,
          [meetingId, a.name, a.email ?? null, a.role ?? null, a.department ?? null]
        )
      }
    }

    await client.query('COMMIT')
    revalidatePath('/')
    return { success: true, id: meetingId }
  } catch (e: any) {
    await client.query('ROLLBACK')
    console.error('[v0] createMeeting error:', e.message)
    return { success: false, error: e.message }
  } finally {
    client.release()
  }
}

export async function updateMeeting(
  id: string,
  data: Partial<Omit<Meeting, 'id' | 'ref_no' | 'created_at' | 'attendees'>>,
  attendees?: { name: string; email?: string; role?: string; department?: string }[]
): Promise<{ success: boolean; error?: string }> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { attendees: _att, ...fields } = data as any
    const keys = Object.keys(fields)
    if (keys.length) {
      const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
      await client.query(
        `UPDATE public.meeting SET ${setClause}, updated_at = NOW() WHERE id = $1`,
        [id, ...Object.values(fields)]
      )
    }

    if (attendees !== undefined) {
      await client.query('DELETE FROM public.meeting_attendee WHERE meeting_id = $1', [id])
      for (const a of attendees) {
        await client.query(
          `INSERT INTO public.meeting_attendee (meeting_id, name, email, role, department)
           VALUES ($1,$2,$3,$4,$5)`,
          [id, a.name, a.email ?? null, a.role ?? null, a.department ?? null]
        )
      }
    }

    await client.query('COMMIT')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    await client.query('ROLLBACK')
    return { success: false, error: e.message }
  } finally {
    client.release()
  }
}

export async function deleteMeeting(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await pool.query('DELETE FROM public.meeting WHERE id = $1', [id])
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function toggleAttendance(
  attendeeId: string,
  attended: boolean
): Promise<{ success: boolean }> {
  try {
    await pool.query(
      'UPDATE public.meeting_attendee SET attended = $2 WHERE id = $1',
      [attendeeId, attended]
    )
    return { success: true }
  } catch (e: any) {
    return { success: false }
  }
}
