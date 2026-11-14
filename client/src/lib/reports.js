import { distanceMeters } from './routing'
import { supabase } from './supabase'

const EVIDENCE_BUCKET = 'report-evidence'
const SIGNED_URL_TTL = 60 * 60

const outageLabels = {
  'line-fault': 'Line Fault',
  'transformer-issue': 'Transformer Issue',
  'weather-disturbance': 'Weather Disturbance',
  'power-supply-interruption': 'Power Supply Interruption',
  'equipment-related': 'Equipment-related',
  'scheduled-maintenance': 'Scheduled Maintenance',
  unknown: 'Unknown',
  other: 'Other',
  // Legacy values kept for reports submitted before the type list changed.
  'no-power': 'No power',
  flickering: 'Flickering lights',
  'damaged-line': 'Damaged line or pole',
}

const videoExtensions = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/3gpp': '3gp',
}

export const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High' }

export const reportPriorities = ['low', 'medium', 'high']

const statusMeta = {
  pending: { label: 'Pending', tone: 'pending', progress: 1, summary: 'Waiting for verification.' },
  verified: { label: 'Verified', tone: 'verified', progress: 2, summary: 'The report was verified and is being coordinated.' },
  resolved: { label: 'Resolved', tone: 'resolved', progress: 4, summary: 'This report has been resolved.' },
  rejected: { label: 'Rejected', tone: 'rejected', progress: 0, summary: 'An administrator rejected this report.' },
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

async function currentUserId() {
  const client = requireClient()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session?.user?.id ?? null
}

async function signedUrls(paths) {
  if (!supabase || paths.length === 0) return {}

  const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
  if (error) return {}

  return Object.fromEntries(
    (data ?? [])
      .filter((item) => item.path && item.signedUrl)
      .map((item) => [item.path, item.signedUrl]),
  )
}

function photoPaths(rows) {
  return rows
    .flatMap((row) => (Array.isArray(row.photos) ? row.photos : []))
    .map((photo) => photo.path)
    .filter(Boolean)
}

function toReport(row, urls) {
  const createdAt = new Date(row.created_at)
  const meta = statusMeta[row.status] ?? statusMeta.pending
  const typeLabel = outageLabels[row.outage_type] ?? 'Power interruption'
  const hasCoordinates = row.latitude !== null && row.longitude !== null

  return {
    id: row.reference,
    title: `${typeLabel} in Brgy. ${row.barangay}`,
    location: `Brgy. ${row.barangay}`,
    date: createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    resolvedAt: row.resolved_at ?? (row.status === 'resolved' ? (row.updated_at ?? row.created_at) : null),
    staffRemarks: row.staff_remarks ?? '',
    restorationEta: row.restoration_eta ?? '',
    isDuplicate: Boolean(row.is_duplicate),
    status: meta.label,
    tone: meta.tone,
    progress: meta.progress,
    assignedStaffId: row.assigned_staff_id ?? null,
    assignedTeamId: row.assigned_team_id ?? null,
    resolvedByStaffId: row.resolved_by_staff_id ?? null,
    description: `Reported at ${createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. ${meta.summary}`,
    outageType: typeLabel,
    outageTypeId: row.outage_type ?? '',
    startedTime: row.started_time,
    notes: row.notes ?? '',
    barangay: row.barangay,
    landmark: row.landmark ?? '',
    pinnedLocation: row.pinned_location ?? '',
    pin: { x: row.pin_x, y: row.pin_y },
    pinSource: row.pin_source,
    coordinates: hasCoordinates
      ? { latitude: row.latitude, longitude: row.longitude, accuracy: row.accuracy }
      : null,
    photos: (Array.isArray(row.photos) ? row.photos : []).map((photo) => ({
      id: photo.path,
      label: photo.label,
      kind: photo.kind ?? 'image',
      dataUrl: urls[photo.path],
      uploadedBy: photo.uploadedBy,
      uploadedByName: photo.uploaded_by_name || photo.uploadedByName || null,
      teamName: photo.team_name || photo.teamName || null,
      uploadedAt: photo.uploaded_at || photo.uploadedAt || null,
      aiVerification: photo.ai_verification ?? null,
    })),
    priority: row.priority ?? 'medium',
    aiVerification: row.ai_metadata ?? (Array.isArray(row.photos) ? row.photos[0]?.ai_verification : null) ?? null,
  }
}

const ACTIVE_REPORT_TONES = new Set(['pending', 'verified'])
export const DUPLICATE_INCIDENT_RADIUS_METERS = 300

function normalizeBarangayName(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function isActiveResidentReport(report) {
  return Boolean(report && ACTIVE_REPORT_TONES.has(report.tone))
}

export function findMatchingResidentIncident(existingReports, candidate) {
  if (!Array.isArray(existingReports) || !candidate) return null

  const targetBarangay = normalizeBarangayName(candidate.barangay)
  const targetOutageTypeId = candidate.outageTypeId || ''
  const hasTargetCoords =
    Number.isFinite(candidate.coordinates?.latitude) &&
    Number.isFinite(candidate.coordinates?.longitude)
  const targetCoords = hasTargetCoords
    ? [candidate.coordinates.latitude, candidate.coordinates.longitude]
    : null

  for (const report of existingReports) {
    if (!isActiveResidentReport(report)) continue

    if (
      targetBarangay &&
      targetOutageTypeId &&
      normalizeBarangayName(report.barangay) === targetBarangay &&
      report.outageTypeId === targetOutageTypeId
    ) {
      return { report, reason: 'same-barangay-type', distanceMeters: null }
    }

    if (
      targetCoords &&
      Number.isFinite(report.coordinates?.latitude) &&
      Number.isFinite(report.coordinates?.longitude)
    ) {
      const distance = distanceMeters(targetCoords, [
        report.coordinates.latitude,
        report.coordinates.longitude,
      ])
      if (distance <= DUPLICATE_INCIDENT_RADIUS_METERS) {
        return { report, reason: 'nearby-pin', distanceMeters: Math.round(distance) }
      }
    }
  }

  return null
}

function createAlreadyReportedError(reference, existingReport = null) {
  const ref = reference || existingReport?.id || ''
  const error = new Error(ref ? `ALREADY_REPORTED:${ref}` : 'ALREADY_REPORTED')
  error.code = 'ALREADY_REPORTED'
  error.existingReference = ref
  error.existingReport = existingReport
  return error
}

export async function loadActiveResidentReports() {
  if (!supabase) return []
  const userId = await currentUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from('reports')
    .select('id, reference, outage_type, barangay, status, latitude, longitude, created_at')
    .eq('user_id', userId)
    .in('status', ['pending', 'verified'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => toReport(row, {}))
}

export async function loadReports() {
  if (!supabase) return []
  const userId = await currentUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = data ?? []
  const urls = await signedUrls(photoPaths(rows))
  return rows.map((row) => toReport(row, urls))
}

// Resident map + home hero: every non-rejected report, newest first, with
// only the fields a neighbor needs (no user_id, notes or evidence).
export async function loadPublicOutages() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('public_outage_map')
    .select('id, reference, barangay, outage_type, status, created_at, updated_at, latitude, longitude')
    .order('updated_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const meta = statusMeta[row.status] ?? statusMeta.pending
    const hasCoordinates = row.latitude !== null && row.longitude !== null
    return {
      id: row.reference,
      reference: row.reference,
      barangay: row.barangay,
      outageType: outageLabels[row.outage_type] ?? 'Power interruption',
      status: meta.label,
      tone: meta.tone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      coordinates: hasCoordinates
        ? { latitude: row.latitude, longitude: row.longitude }
        : null,
    }
  })
}

// Admin: every resident report, newest first.
export async function loadAllReports() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = data ?? []
  const urls = await signedUrls(photoPaths(rows))

  const names = await residentNames(rows)
  return rows.map((row) => ({ ...toReport(row, urls), residentName: names[row.user_id] ?? '' }))
}

// Collect display names for the report authors, keyed by auth user id.
async function residentNames(rows) {
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))]
  if (userIds.length === 0) return {}
  const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
  return Object.fromEntries((users ?? []).map((user) => [user.id, user.full_name || user.email || '']))
}

// Staff: reports assigned directly or to their team, newest first.
export async function loadAssignedReports() {
  if (!supabase) return []
  const userId = await currentUserId()
  if (!userId) return []

  // Check if staff belongs to a team
  const { data: userRow } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', userId)
    .maybeSingle()

  const teamId = userRow?.team_id

  let query = supabase.from('reports').select('*')
  if (teamId) {
    query = query.or(`assigned_staff_id.eq.${userId},assigned_team_id.eq.${teamId}`)
  } else {
    query = query.eq('assigned_staff_id', userId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error

  const rows = data ?? []
  // Rejected reports never reach the field crew.
  const assigned = rows.filter((row) => row.status !== 'rejected')
  const names = await residentNames(assigned)
  const urls = await signedUrls(photoPaths(assigned))
  return assigned.map((row) => ({ ...toReport(row, urls), residentName: names[row.user_id] ?? '' }))
}

export async function loadReport(reference) {
  if (!supabase) return null
  const userId = await currentUserId()
  if (!userId) return null

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .eq('reference', reference)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const urls = await signedUrls(photoPaths([data]))
  return toReport(data, urls)
}

async function uploadEvidence(userId, photos) {
  const uploaded = []

  try {
    for (const photo of photos) {
      const isVideo = photo.type?.startsWith('video/')
      const contentType = photo.type || 'image/jpeg'
      const extension = isVideo ? (videoExtensions[contentType] ?? 'mp4') : 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${extension}`
      const blob = photo.file ?? await (await fetch(photo.dataUrl)).blob()
      const { error } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .upload(path, blob, { contentType })

      if (error) throw error
      uploaded.push({ path, label: photo.label, kind: isVideo ? 'video' : 'image' })
    }

    return uploaded
  } catch (error) {
    if (uploaded.length > 0) {
      await supabase.storage.from(EVIDENCE_BUCKET).remove(uploaded.map((photo) => photo.path))
    }
    throw error
  }
}

export async function addReport(data) {
  const userId = await currentUserId()
  if (!userId) throw new Error('You need to sign in again.')

  const activeReports = await loadActiveResidentReports()
  const duplicateMatch = findMatchingResidentIncident(activeReports, data)
  if (duplicateMatch) {
    throw createAlreadyReportedError(duplicateMatch.report.id, duplicateMatch.report)
  }

  const uploadedPhotos = await uploadEvidence(userId, data.photos ?? [])
  if (uploadedPhotos.length > 0 && data.aiVerification) {
    uploadedPhotos[0].ai_verification = data.aiVerification
  }

  const payload = {
    user_id: userId,
    outage_type: data.outageTypeId,
    started_time: data.startedTime,
    notes: data.notes || null,
    barangay: data.barangay,
    landmark: data.landmark || null,
    pinned_location: data.pinnedLocation || null,
    priority: data.priority ?? 'medium',
    pin_x: data.pin.x,
    pin_y: data.pin.y,
    pin_source: data.pinSource,
    latitude: data.coordinates?.latitude ?? null,
    longitude: data.coordinates?.longitude ?? null,
    accuracy: data.coordinates?.accuracy ?? null,
    photos: uploadedPhotos,
  }

  try {
    // Attempt insert with optional ai_metadata column if available in schema
    let insertPayload = { ...payload }
    if (data.aiVerification) {
      insertPayload.ai_metadata = data.aiVerification
    }

    let { data: row, error } = await supabase
      .from('reports')
      .insert(insertPayload)
      .select('*')
      .single()

    // If ai_metadata column does not exist on table, fallback to baseline payload
    if (error && error.message?.includes('ai_metadata')) {
      const fallback = await supabase
        .from('reports')
        .insert(payload)
        .select('*')
        .single()
      row = fallback.data
      error = fallback.error
    }

    if (error) {
      const duplicateErrorMatch = error.message?.match(/ALREADY_REPORTED:([^\s]+)/i)
      if (duplicateErrorMatch || error.message?.includes('ALREADY_REPORTED')) {
        throw createAlreadyReportedError(duplicateErrorMatch?.[1] ?? '')
      }
      throw error
    }
    return toReport(row, {})
  } catch (error) {
    if (uploadedPhotos.length > 0) {
      await supabase.storage.from(EVIDENCE_BUCKET).remove(uploadedPhotos.map((photo) => photo.path))
    }
    throw error
  }
}

// Why an admin may see an empty report list: no session, or a role that is not 'admin'.
export async function getAdminAccess() {
  if (!supabase) return { configured: false, signedIn: false, email: '', role: '' }

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) return { configured: true, signedIn: false, email: '', role: '' }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
  return { configured: true, signedIn: true, email: user.email ?? '', role: profile?.role ?? '' }
}

export async function loadStaff() {
  if (!supabase) return []

  const client = requireClient()
  const { data, error } = await client.from('users').select('id, full_name, email, role, position, is_active').order('created_at', { ascending: false })
  if (error) return []

  return (data ?? []).filter((user) => (user.role || '').toLowerCase() === 'staff')
}

export async function updateReportStatus(reference, status, assignedStaffId, resolutionFiles = [], extra = {}) {
  const client = requireClient()
  const userId = await currentUserId()
  const uploaded = await uploadEvidence(userId, resolutionFiles)

  // Tag resolution evidence with uploader attribution
  if (uploaded.length > 0) {
    uploaded.forEach((u) => {
      u.uploadedBy = 'staff'
      u.uploaded_by_id = userId
      if (extra.staffName) u.uploaded_by_name = extra.staffName
      if (extra.teamName) u.team_name = extra.teamName
      u.uploaded_at = new Date().toISOString()
    })
  }

  let photos
  if (uploaded.length > 0) {
    const { data: current } = await client
      .from('reports')
      .select('photos')
      .eq('reference', reference)
      .single()
    photos = [...(Array.isArray(current?.photos) ? current.photos : []), ...uploaded]
  }

  const basePayload = {
    status,
    ...(assignedStaffId !== undefined ? { assigned_staff_id: assignedStaffId ?? null } : {}),
    ...(extra.assignedTeamId !== undefined ? { assigned_team_id: extra.assignedTeamId || null } : {}),
    ...(status === 'resolved' ? { resolved_by_staff_id: userId } : {}),
    ...(photos ? { photos } : {}),
  }

  const extendedPayload = {
    ...basePayload,
    ...(extra.staffRemarks !== undefined ? { staff_remarks: extra.staffRemarks || null } : {}),
    ...(extra.restorationEta !== undefined ? { restoration_eta: extra.restorationEta || null } : {}),
    ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
  }

  let { data, error } = await client
    .from('reports')
    .update(extendedPayload)
    .eq('reference', reference)
    .select('*')
    .single()

  // Graceful fallback if optional migration columns aren't in DB yet
  if (error && (extra.staffRemarks !== undefined || extra.restorationEta !== undefined || status === 'resolved' || extra.assignedTeamId !== undefined)) {
    const retry = await client
      .from('reports')
      .update(basePayload)
      .eq('reference', reference)
      .select('*')
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) {
    if (uploaded.length > 0) {
      await client.storage.from(EVIDENCE_BUCKET).remove(uploaded.map((photo) => photo.path))
    }
    throw error
  }

  const urls = await signedUrls(photoPaths([data]))
  return toReport(data, urls)
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(val) {
  return typeof val === 'string' && UUID_REGEX.test(val.trim())
}

// Dispatch a report directly to a field team
export async function dispatchReportToTeam(reference, teamId, staffId = null) {
  const client = requireClient()
  const payload = {
    status: 'verified',
    assigned_team_id: teamId || null,
    ...(staffId !== undefined ? { assigned_staff_id: staffId || null } : {}),
  }

  const query = client.from('reports').update(payload)
  const filterQuery = isUuid(reference)
    ? query.eq('id', reference)
    : query.eq('reference', reference)

  let { data, error } = await filterQuery.select('*').single()

  // Fallback to RPC if direct table update has column-level grant or RLS restriction
  if (error) {
    const { data: rpcData, error: rpcError } = await client.rpc('dispatch_report_to_team', {
      p_reference: reference,
      p_team_id: teamId || null,
      p_staff_id: staffId || null,
    })
    if (!rpcError && rpcData) {
      data = rpcData
      error = null
    } else {
      throw error
    }
  }

  const urls = await signedUrls(photoPaths([data]))
  return toReport(data, urls)
}

export async function setReportDuplicateFlag(reportId, flagged) {
  const client = requireClient()
  const { error } = await client.rpc('set_report_duplicate_flag', {
    p_report_id: reportId,
    p_flagged: Boolean(flagged),
  })
  if (error) throw error
}
