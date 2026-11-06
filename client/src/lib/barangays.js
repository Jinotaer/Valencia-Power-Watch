import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function toBarangay(row) {
  return {
    code: row.code,
    name: row.name,
    zone: row.zone,
    status: row.status,
    activeReports: 0,
    affectedHouseholds: row.affected_households,
    totalHouseholds: row.total_households,
    assignedCrew: row.assigned_crew,
    restorationEta: row.restoration_eta,
    captain: row.captain,
    contactNumber: row.contact_number,
    lastUpdated: row.updated_at,
  }
}

export async function loadBarangays() {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase.from('barangays').select('*').order('name')
  if (error) throw error
  return (data ?? []).map(toBarangay)
}

// Active = a resident report that is still pending or verified.
export async function loadActiveReportCounts() {
  if (!supabase) return {}

  const { data, error } = await supabase
    .from('reports')
    .select('barangay')
    .in('status', ['pending', 'verified'])

  if (error) return {}

  return (data ?? []).reduce((counts, row) => {
    if (row.barangay) counts[row.barangay] = (counts[row.barangay] ?? 0) + 1
    return counts
  }, {})
}

export async function createBarangay(input) {
  const client = requireClient()
  const { data, error } = await client
    .from('barangays')
    .insert({
      name: input.name.trim(),
      zone: input.zone,
      captain: input.captain.trim() || 'Barangay Council',
      contact_number: input.contactNumber.trim() || '+63 917 000 0000',
      total_households: Number(input.totalHouseholds) || 0,
    })
    .select('*')
    .single()

  if (error) throw error
  return toBarangay(data)
}

export async function updateBarangayStatus(code, input) {
  const client = requireClient()
  const payload = {
    status: input.status,
    restoration_eta: input.status === 'Energized' ? 'Normal Grid Service' : input.restorationEta,
    affected_households: input.status === 'Energized' ? 0 : Number(input.affectedHouseholds) || 0,
  }
  if (input.assignedCrew.trim()) payload.assigned_crew = input.assignedCrew.trim()

  const { data, error } = await client
    .from('barangays')
    .update(payload)
    .eq('code', code)
    .select('*')
    .single()

  if (error) throw error
  return toBarangay(data)
}
