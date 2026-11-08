import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function toAnnouncement(row) {
  return {
    id: row.id,
    title: row.title ?? '',
    body: row.body ?? '',
    barangay: row.barangay ?? null,
    category: row.category ?? 'general',
    publishedAt: row.published_at,
    createdAt: row.created_at,
  }
}

function announcementRow(form) {
  const title = typeof form.title === 'string' ? form.title.trim() : ''
  const body = typeof form.body === 'string' ? form.body.trim() : ''
  if (!title) throw new Error('Enter a title.')
  if (!body) throw new Error('Enter the advisory message.')

  return {
    title,
    body,
    barangay: typeof form.barangay === 'string' && form.barangay.trim() ? form.barangay.trim() : null,
    category: ['advisory', 'maintenance', 'restoration', 'general'].includes(form.category)
      ? form.category
      : 'general',
  }
}

// Resident and admin: published advisories, newest first — readable by everyone.
export async function loadAnnouncements(limit = 20) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, barangay, category, published_at, created_at')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(toAnnouncement)
}

export async function createAnnouncement(form) {
  const client = requireClient()
  const payload = announcementRow(form)

  const { data, error } = await client
    .from('announcements')
    .insert(payload)
    .select('id, title, body, barangay, category, published_at, created_at')
    .single()

  if (error) throw error
  return toAnnouncement(data)
}

export async function updateAnnouncement(id, form) {
  const client = requireClient()
  const payload = announcementRow(form)

  const { data, error } = await client
    .from('announcements')
    .update(payload)
    .eq('id', id)
    .select('id, title, body, barangay, category, published_at, created_at')
    .single()

  if (error) throw error
  return toAnnouncement(data)
}

export async function deleteAnnouncement(id) {
  const client = requireClient()
  const { error } = await client.from('announcements').delete().eq('id', id)
  if (error) throw error
}
