import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function toAuditLog(row) {
  return {
    id: row.id,
    actorId: row.actor_id ?? null,
    actorEmail: row.actor_email ?? '',
    action: row.action ?? '',
    entityType: row.entity_type ?? '',
    entityId: row.entity_id ?? '',
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }
}

// Admin: newest audit activity first.
export async function loadAuditLogs({ limit = 100, entityType = '', search = '' } = {}) {
  const client = requireClient()
  let query = client
    .from('audit_logs')
    .select('id, actor_id, actor_email, action, entity_type, entity_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entityType) query = query.eq('entity_type', entityType)

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []).map(toAuditLog)
  if (!search) return rows

  const term = search.trim().toLowerCase()
  if (!term) return rows
  return rows.filter((row) => [row.actorEmail, row.action, row.entityType, row.entityId, JSON.stringify(row.metadata)]
    .some((value) => String(value || '').toLowerCase().includes(term)))
}
