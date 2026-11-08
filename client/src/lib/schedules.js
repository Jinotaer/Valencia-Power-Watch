import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

// "14:30" -> "2:30 PM"
function formatTime(value) {
  const [hours, minutes] = String(value ?? '').split(':').map(Number)
  if (Number.isNaN(hours)) return value ?? ''
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour = hours % 12 || 12
  return `${hour}:${String(minutes ?? 0).padStart(2, '0')} ${suffix}`
}

// "2026-11-05" -> "Nov 5, 2026"
function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value ?? ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Local calendar date (UTC would be a day behind in UTC+8 before 8 AM).
function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function scheduleRow(form) {
  const title = typeof form.title === 'string' ? form.title.trim() : ''
  if (!title) throw new Error('Enter a title.')

  return {
    title,
    barangay: typeof form.barangay === 'string' && form.barangay.trim() ? form.barangay.trim() : null,
    date: form.date,
    start_time: form.startTime,
    end_time: form.endTime,
    type: typeof form.type === 'string' && form.type.trim() ? form.type.trim() : 'Maintenance',
    description: typeof form.description === 'string' && form.description.trim() ? form.description.trim() : null,
  }
}

function toSchedule(row) {
  return {
    id: row.id,
    title: row.title ?? '',
    barangay: row.barangay ?? null,
    date: row.date,
    dateLabel: formatDate(row.date),
    startTime: row.start_time,
    endTime: row.end_time,
    timeLabel: `${formatTime(row.start_time)} – ${formatTime(row.end_time)}`,
    type: row.type,
    description: row.description ?? '',
    status: row.status,
  }
}

// Admin: every schedule, soonest first.
export async function loadSchedules() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toSchedule)
}

// Resident: published notices dated today or later.
export async function loadActiveSchedules() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('status', 'published')
    .gte('date', today())
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toSchedule)
}

export async function createSchedule(form) {
  const client = requireClient()

  const { data, error } = await client
    .from('schedules')
    .insert({ ...scheduleRow(form), status: 'scheduled' })
    .select('*')
    .single()

  if (error) throw error
  return toSchedule(data)
}

export async function updateSchedule(id, form) {
  const client = requireClient()

  const { data, error } = await client
    .from('schedules')
    .update(scheduleRow(form))
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return toSchedule(data)
}

export async function deleteSchedule(id) {
  const { error } = await requireClient().from('schedules').delete().eq('id', id)
  if (error) throw error
}

export async function setScheduleStatus(id, status) {
  const client = requireClient()

  const { data, error } = await client
    .from('schedules')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return toSchedule(data)
}
