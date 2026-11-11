import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function toAdminUser(row) {
  return {
    id: row.id,
    rowId: row.id,
    email: row.email,
    fullName: row.full_name ?? '',
    idNumber: row.id_number ?? '',
    role: row.role ?? '',
    contactNumber: row.contact_number ?? '',
    address: row.address ?? '',
    position: row.position ?? '',
    teamId: row.team_id ?? null,
    isActive: row.is_active !== false,
    raw: row,
  }
}

// Admin: staff + admin accounts, newest first.
export async function loadAdminUsers() {
  if (!supabase) return []
  const client = requireClient()

  const { data, error } = await client
    .from('users')
    .select('id, email, full_name, role, id_number, contact_number, address, position, team_id, is_active, created_at')
    .neq('role', 'resident')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toAdminUser)
}

export async function loadAllAdminUsers() {
  if (!supabase) return []
  const client = requireClient()

  const { data, error } = await client
    .from('users')
    .select('id, email, full_name, role, id_number, contact_number, address, position, team_id, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(toAdminUser)
}

export async function updateAdminUser(id, fields) {
  const client = requireClient()
  const payload = {}
  if ('fullName' in fields) payload.full_name = (fields.fullName || '').trim() || null
  if ('contactNumber' in fields) payload.contact_number = (fields.contactNumber || '').trim() || null
  if ('address' in fields) payload.address = (fields.address || '').trim() || null
  if ('idNumber' in fields) payload.id_number = (fields.idNumber || '').trim() || null
  if ('position' in fields) payload.position = (fields.position || '').trim() || null
  if ('teamId' in fields) payload.team_id = fields.teamId || null

  if (Object.keys(payload).length === 0) throw new Error('Nothing to update.')

  let { data, error } = await client
    .from('users')
    .update(payload)
    .eq('id', id)
    .select('id, email, full_name, role, id_number, contact_number, address, position, team_id, is_active, created_at')
    .single()

  // If column update privilege on team_id fails, update the other profile fields and try assign_staff_team RPC
  if (error && 'team_id' in payload) {
    const fallbackPayload = { ...payload }
    delete fallbackPayload.team_id

    if (Object.keys(fallbackPayload).length > 0) {
      const retry = await client
        .from('users')
        .update(fallbackPayload)
        .eq('id', id)
        .select('id, email, full_name, role, id_number, contact_number, address, position, team_id, is_active, created_at')
        .single()
      if (!retry.error) {
        data = retry.data
        error = null
      }
    }

    try {
      const rpc = await client.rpc('assign_staff_team', {
        p_user_id: id,
        p_team_id: payload.team_id || null,
      })
      if (!rpc.error) {
        if (data) data.team_id = payload.team_id || null
        error = null
      }
    } catch {
      // RPC fallback failed, keep error
    }
  }

  if (error) throw error
  return toAdminUser(data)
}

export async function setUserActive(id, isActive) {
  const client = requireClient()
  const { error } = await client.rpc('set_user_active', {
    p_user_id: id,
    p_is_active: Boolean(isActive),
  })
  if (error) throw error
}

export async function sendStaffPasswordReset(email) {
  const client = requireClient()
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/staff/reset-password`,
  })
  if (error) throw error
}

export function downloadCsv(filename, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  const content = rows.map((row) => row.map(escape).join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
