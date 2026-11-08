import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function normalizeBarangayName(value) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function toBarangay(row) {
  const hasCoordinates = row.latitude !== null && row.longitude !== null
  return {
    code: row.code,
    name: row.name,
    affectedHouseholds: row.affected_households,
    totalHouseholds: row.total_households,
    captain: row.captain,
    contactNumber: row.contact_number,
    pinnedLocation: row.pinned_location ?? '',
    // pin_x/pin_y mirror the legacy report columns; the real map position is in `coordinates`.
    pin: { x: row.pin_x ?? 50, y: row.pin_y ?? 50 },
    pinSource: row.pin_source ?? 'manual',
    coordinates: hasCoordinates
      ? { latitude: row.latitude, longitude: row.longitude, accuracy: row.accuracy ?? null }
      : null,
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
  const name = input.name.trim()
  const coordinates = input.coordinates ?? null
  if (!Number.isFinite(coordinates?.latitude) || !Number.isFinite(coordinates?.longitude)) {
    throw new Error('Pin the barangay location on the map before registering.')
  }

  const { data: existing, error: lookupError } = await client
    .from('barangays')
    .select('code,name')
    .ilike('name', name)
    .limit(5)
  if (lookupError) throw lookupError
  if ((existing ?? []).some((row) => normalizeBarangayName(row.name) === normalizeBarangayName(name))) {
    const error = new Error('A barangay with that name already exists.')
    error.code = '23505'
    throw error
  }

  const { data, error } = await client
    .from('barangays')
    .insert({
      name,
      captain: input.captain.trim() || 'Barangay Council',
      contact_number: input.contactNumber.trim() || '+63 917 000 0000',
      total_households: Number(input.totalHouseholds) || 0,
      pinned_location:
        input.pinnedLocation?.trim() ||
        `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`,
      pin_x: 50,
      pin_y: 50,
      pin_source: input.pinSource ?? 'manual',
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      accuracy: coordinates.accuracy ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return toBarangay(data)
}

function barangayUpdateRow(input) {
  const coordinates = input.coordinates ?? null
  const payload = {
    captain: (input.captain || '').trim() || 'Barangay Council',
    contact_number: (input.contactNumber || '').trim() || '+63 917 000 0000',
    total_households: Number(input.totalHouseholds) || 0,
    affected_households: Number(input.affectedHouseholds) || 0,
    pinned_location:
      (input.pinnedLocation || '').trim() ||
      (coordinates ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}` : ''),
    pin_x: 50,
    pin_y: 50,
    pin_source: input.pinSource ?? 'manual',
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    accuracy: coordinates?.accuracy ?? null,
    updated_at: new Date().toISOString(),
  }
  return payload
}

export async function updateBarangay(code, input) {
  const client = requireClient()
  const { data, error } = await client
    .from('barangays')
    .update(barangayUpdateRow(input))
    .eq('code', code)
    .select('*')
    .single()

  if (error) throw error
  return toBarangay(data)
}

export async function deleteBarangay(code) {
  const client = requireClient()
  const { error } = await client.from('barangays').delete().eq('code', code)
  if (error) throw error
}
