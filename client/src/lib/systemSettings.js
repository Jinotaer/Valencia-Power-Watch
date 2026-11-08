import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function toSetting(row) {
  return {
    key: row.key,
    value: row.value ?? '',
    description: row.description ?? '',
    updatedAt: row.updated_at ?? '',
  }
}

function toPermission(row) {
  return {
    id: row.id,
    role: row.role,
    permission: row.permission,
    enabled: Boolean(row.enabled),
    updatedAt: row.updated_at ?? '',
  }
}

function toCategory(row) {
  return {
    id: row.id,
    value: row.value,
    label: row.label,
    description: row.description ?? '',
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order ?? 0,
  }
}

export async function loadSystemSettings() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value, description, updated_at')
    .order('key')
  if (error) throw error
  return (data ?? []).map(toSetting)
}

export async function updateSystemSetting(key, value) {
  const client = requireClient()
  const { data, error } = await client
    .from('system_settings')
    .update({ value: String(value ?? ''), updated_at: new Date().toISOString() })
    .eq('key', key)
    .select('key, value, description, updated_at')
    .single()
  if (error) throw error
  return toSetting(data)
}

export async function loadRolePermissions() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('role_permissions')
    .select('id, role, permission, enabled, updated_at')
    .order('role')
    .order('permission')
  if (error) throw error
  return (data ?? []).map(toPermission)
}

export async function setRolePermission(id, enabled) {
  const client = requireClient()
  const { data, error } = await client
    .from('role_permissions')
    .update({ enabled: Boolean(enabled), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, role, permission, enabled, updated_at')
    .single()
  if (error) throw error
  return toPermission(data)
}

export async function loadReportCategories() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('report_categories')
    .select('id, value, label, description, is_active, sort_order, updated_at')
    .order('sort_order')
    .order('label')
  if (error) throw error
  return (data ?? []).map(toCategory)
}

export async function updateReportCategory(id, fields) {
  const client = requireClient()
  const payload = {}
  if ('label' in fields) payload.label = (fields.label || '').trim() || 'Untitled category'
  if ('description' in fields) payload.description = (fields.description || '').trim() || null
  if ('isActive' in fields) payload.is_active = Boolean(fields.isActive)
  if ('sortOrder' in fields) payload.sort_order = Number(fields.sortOrder) || 0
  payload.updated_at = new Date().toISOString()

  const { data, error } = await client
    .from('report_categories')
    .update(payload)
    .eq('id', id)
    .select('id, value, label, description, is_active, sort_order, updated_at')
    .single()
  if (error) throw error
  return toCategory(data)
}
