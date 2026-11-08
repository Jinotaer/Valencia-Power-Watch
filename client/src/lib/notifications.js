import { supabase } from './supabase'
import { loadAnnouncements } from './announcements'

// When the resident last opened the notifications page — new advisories
// published after this count as unread.
const LAST_SEEN_KEY = 'pw:lastSeenAnnouncements'

export const defaultNotificationPreferences = {
  outageAlerts: true,
  reportStatusUpdates: true,
  scheduledReminders: false,
}

async function currentUserId() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

function toNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body ?? '',
    reportReference: row.report_reference ?? null,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  }
}

export async function loadNotifications(limit = 50) {
  if (!supabase) return []
  const userId = await currentUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, report_reference, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(toNotification)
}

export async function markAllNotificationsRead() {
  if (!supabase) return
  const userId = await currentUserId()
  if (!userId) return

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  markAnnouncementsSeen()
}

export function getLastSeenAnnouncements() {
  const value = Number(localStorage.getItem(LAST_SEEN_KEY))
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function markAnnouncementsSeen() {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()))
  } catch {
    // Private mode: the badge simply stays until localStorage works again.
  }
}

export async function countUnreadNotifications() {
  let count = 0

  if (supabase) {
    const userId = await currentUserId()
    if (userId) {
      const { count: stored } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null)
      count += stored ?? 0
    }
  }

  const lastSeen = getLastSeenAnnouncements()
  if (lastSeen > 0) {
    const announcements = await loadAnnouncements(50).catch(() => [])
    count += announcements.filter(
      (row) => new Date(row.publishedAt).getTime() > lastSeen,
    ).length
  }

  return count
}

export async function loadNotificationPreferences() {
  if (!supabase) return defaultNotificationPreferences
  const userId = await currentUserId()
  if (!userId) return defaultNotificationPreferences

  const { data } = await supabase
    .from('users')
    .select('notification_preferences')
    .eq('id', userId)
    .maybeSingle()

  const saved = data?.notification_preferences ?? {}
  return { ...defaultNotificationPreferences, ...saved }
}

export async function saveNotificationPreferences(preferences) {
  if (!supabase) return
  const userId = await currentUserId()
  if (!userId) return

  const { error } = await supabase
    .from('users')
    .update({ notification_preferences: preferences })
    .eq('id', userId)

  if (error) throw error
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function toAdminNotification(row, usersById = {}) {
  const user = usersById[row.user_id]
  return {
    ...toNotification(row),
    userId: row.user_id,
    recipientName: user?.fullName || user?.email || row.user_id,
    recipientRole: user?.role || '',
  }
}

// Admin: every delivery record, newest first.
export async function loadAdminNotifications(limit = 200) {
  const client = requireClient()
  const { data, error } = await client
    .from('notifications')
    .select('id, user_id, type, title, body, report_reference, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const userIds = [...new Set((data ?? []).map((row) => row.user_id).filter(Boolean))]
  const usersById = {}
  if (userIds.length > 0) {
    const { data: users } = await client
      .from('users')
      .select('id, email, full_name, role')
      .in('id', userIds)
    users?.forEach((user) => {
      usersById[user.id] = {
        fullName: user.full_name || '',
        email: user.email || '',
        role: user.role || '',
      }
    })
  }

  return (data ?? []).map((row) => toAdminNotification(row, usersById))
}

export async function loadNotificationRecipients() {
  const client = requireClient()
  const { data, error } = await client
    .from('users')
    .select('id, email, full_name, role, is_active')
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name || row.email?.split('@')[0] || '',
    role: row.role || '',
    isActive: row.is_active !== false,
  }))
}

export async function createAdminNotification({ recipientIds, title, body }) {
  const client = requireClient()
  const cleanTitle = (title || '').trim()
  const cleanBody = (body || '').trim()
  if (!cleanTitle || !cleanBody) throw new Error('Enter a title and message.')
  if (!recipientIds?.length) throw new Error('Select at least one recipient.')

  const payload = [...new Set(recipientIds)].map((user_id) => ({
    user_id,
    type: 'manual',
    title: cleanTitle,
    body: cleanBody,
  }))

  const { data, error } = await client
    .from('notifications')
    .insert(payload)
    .select('id, user_id, type, title, body, report_reference, read_at, created_at')

  if (error) throw error
  return data?.length ?? 0
}

export async function markAdminNotificationRead(id) {
  const client = requireClient()
  const { error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAdminNotification(id) {
  const client = requireClient()
  const { error } = await client.from('notifications').delete().eq('id', id)
  if (error) throw error
}
