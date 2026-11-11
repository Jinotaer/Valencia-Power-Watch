import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function toTeam(row, members = [], activeJobCount = 0) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    leaderId: row.leader_id || null,
    leaderName: row.leader?.full_name || row.leader?.email || '',
    contactNumber: row.contact_number || '',
    vehiclePlate: row.vehicle_plate || '',
    status: row.status || 'available',
    lastKnownLocation: row.last_known_location || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    members: members,
    memberCount: members.length,
    activeJobCount: activeJobCount,
  }
}

// Admin: Load all teams with their staff members & active report counts
export async function loadTeams() {
  if (!supabase) return []

  const client = requireClient()

  // 1. Fetch teams with leader info
  const { data: teamsData, error: teamsError } = await client
    .from('teams')
    .select(`
      id,
      name,
      description,
      leader_id,
      contact_number,
      vehicle_plate,
      status,
      last_known_location,
      created_at,
      updated_at
    `)
    .order('name', { ascending: true })

  if (teamsError) throw teamsError

  // 2. Fetch staff members grouped by team
  const { data: staffData } = await client
    .from('users')
    .select('id, full_name, email, role, position, contact_number, team_id')
    .neq('role', 'resident')

  const staffByTeam = (staffData || []).reduce((acc, user) => {
    if (user.team_id) {
      if (!acc[user.team_id]) acc[user.team_id] = []
      acc[user.team_id].push({
        id: user.id,
        name: user.full_name || user.email?.split('@')[0] || 'Staff',
        email: user.email,
        position: user.position || 'Technician',
        contactNumber: user.contact_number || '',
      })
    }
    return acc
  }, {})

  // 3. Fetch active reports count per team (pending or verified)
  const { data: reportsData } = await client
    .from('reports')
    .select('assigned_team_id')
    .in('status', ['pending', 'verified'])
    .not('assigned_team_id', 'is', null)

  const activeReportsByTeam = (reportsData || []).reduce((acc, report) => {
    if (report.assigned_team_id) {
      acc[report.assigned_team_id] = (acc[report.assigned_team_id] || 0) + 1
    }
    return acc
  }, {})

  // 4. Map leaders and combine
  const userMap = Object.fromEntries(
    (staffData || []).map((u) => [u.id, u.full_name || u.email || '']),
  )

  return (teamsData || []).map((team) => {
    const leaderName = team.leader_id ? userMap[team.leader_id] || '' : ''
    const members = staffByTeam[team.id] || []
    const activeJobs = activeReportsByTeam[team.id] || 0
    return toTeam({ ...team, leader: { full_name: leaderName } }, members, activeJobs)
  })
}

// Create a new field team
export async function createTeam({
  name,
  description = '',
  leaderId = null,
  contactNumber = '',
  vehiclePlate = '',
}) {
  const client = requireClient()
  const { data, error } = await client
    .from('teams')
    .insert({
      name: name.trim(),
      description: description.trim(),
      leader_id: leaderId || null,
      contact_number: contactNumber.trim(),
      vehicle_plate: vehiclePlate.trim(),
      status: 'available',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update team details
export async function updateTeam(id, fields) {
  const client = requireClient()
  const updatePayload = {
    updated_at: new Date().toISOString(),
  }

  if (fields.name !== undefined) updatePayload.name = fields.name.trim()
  if (fields.description !== undefined) updatePayload.description = fields.description.trim()
  if (fields.leaderId !== undefined) updatePayload.leader_id = fields.leaderId || null
  if (fields.contactNumber !== undefined) updatePayload.contact_number = fields.contactNumber.trim()
  if (fields.vehiclePlate !== undefined) updatePayload.vehicle_plate = fields.vehiclePlate.trim()
  if (fields.status !== undefined) updatePayload.status = fields.status

  const { data, error } = await client
    .from('teams')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete a team (unassigns members automatically via on delete set null)
export async function deleteTeam(id) {
  const client = requireClient()
  const { error } = await client.from('teams').delete().eq('id', id)
  if (error) throw error
}

// Assign a staff member to a team
export async function assignStaffToTeam(userId, teamId) {
  const client = requireClient()
  const { data, error } = await client
    .from('users')
    .update({ team_id: teamId || null })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    const rpc = await client.rpc('assign_staff_team', {
      p_user_id: userId,
      p_team_id: teamId || null,
    })
    if (!rpc.error) return { id: userId, team_id: teamId || null }
    throw error
  }
  return data
}

// Update a team's real-time GPS location ("Aha na sila")
export async function updateTeamLocation(teamId, { latitude, longitude, heading = null }) {
  if (!supabase || !teamId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const client = requireClient()
  const payload = {
    latitude,
    longitude,
    heading,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await client
    .from('teams')
    .update({
      last_known_location: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teamId)
    .select('id, last_known_location')
    .single()

  if (error) {
    console.warn('Could not update team location:', error)
    return null
  }
  return data
}
