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

const statusMeta = {
  pending: { label: 'Pending', tone: 'pending', progress: 1, summary: 'Waiting for verification.' },
  verified: { label: 'Verified', tone: 'verified', progress: 2, summary: 'The report was verified and is being coordinated.' },
  resolved: { label: 'Resolved', tone: 'resolved', progress: 4, summary: 'This report has been resolved.' },
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
    status: meta.label,
    tone: meta.tone,
    progress: meta.progress,
    assignedStaffId: row.assigned_staff_id ?? null,
    description: `Reported at ${createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. ${meta.summary}`,
    outageType: typeLabel,
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
    })),
  }
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

  // Resident names live in public.users; the report FK points at auth.users, so collect them separately.
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))]
  const residentNames = {}
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
    for (const user of users ?? []) {
      residentNames[user.id] = user.full_name || user.email || ''
    }
  }

  return rows.map((row) => ({ ...toReport(row, urls), residentName: residentNames[row.user_id] ?? '' }))
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

  const uploadedPhotos = await uploadEvidence(userId, data.photos ?? [])
  const payload = {
    user_id: userId,
    outage_type: data.outageTypeId,
    started_time: data.startedTime,
    notes: data.notes || null,
    barangay: data.barangay,
    landmark: data.landmark || null,
    pinned_location: data.pinnedLocation || null,
    pin_x: data.pin.x,
    pin_y: data.pin.y,
    pin_source: data.pinSource,
    latitude: data.coordinates?.latitude ?? null,
    longitude: data.coordinates?.longitude ?? null,
    accuracy: data.coordinates?.accuracy ?? null,
    photos: uploadedPhotos,
  }

  try {
    const { data: row, error } = await supabase
      .from('reports')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error
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
  const { data, error } = await client.from('users').select('id, full_name, email, role').order('created_at', { ascending: false })
  if (error) return []

  return (data ?? []).filter((user) => (user.role || '').toLowerCase() === 'staff')
}

export async function updateReportStatus(reference, status, assignedStaffId) {
  const client = requireClient()
  const { data, error } = await client
    .from('reports')
    .update({
      status,
      assigned_staff_id: assignedStaffId ?? null,
    })
    .eq('reference', reference)
    .select('*')
    .single()

  if (error) throw error
  const urls = await signedUrls(photoPaths([data]))
  return toReport(data, urls)
}
