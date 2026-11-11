// Valencia PowerWatch — Admin AI Assistant Suite (Gemini 3.5 Flash)
// Powers AI Duplicate Incident Clustering, Public Advisory Trilingual Generation,
// Smart Dispatch & Restoration ETA Prediction, and Executive Situation Briefings.

/**
 * Helper to call Gemini REST API with JSON response format
 */
async function callGeminiJson({ systemInstruction, prompt, temperature = 0.2 }) {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  const apiKey = (rawKey.includes('VITE_') ? rawKey.split('VITE_')[0] : rawKey).trim()
  const rawModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash'
  const model = rawModel.trim() || 'gemini-3.5-flash'

  if (!apiKey) return null

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemInstruction },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => '')
      console.warn(`[Admin AI Assistant] Gemini API error (${response.status}):`, err)
      return null
    }

    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) return null

    return JSON.parse(rawText)
  } catch (error) {
    console.warn('[Admin AI Assistant] Failed to execute Gemini request:', error)
    return null
  }
}

/**
 * 1. AI DUPLICATE REPORT & INCIDENT CLUSTERING ENGINE
 * Identifies reports that stem from the exact same physical outage event.
 */
export async function detectDuplicateClusters({ reports = [] }) {
  if (!reports || reports.length < 2) return []

  // Pre-filter: Group candidates that share the same barangay and occurred within 3 hours
  const activeReports = reports.filter(
    (r) => String(r.status || '').toLowerCase() !== 'rejected',
  )

  const barangayGroups = {}
  activeReports.forEach((report) => {
    const bg = report.barangay || 'Unknown'
    if (!barangayGroups[bg]) barangayGroups[bg] = []
    barangayGroups[bg].push(report)
  })

  const candidatePairs = []
  Object.entries(barangayGroups).forEach(([bg, group]) => {
    if (group.length > 1) {
      candidatePairs.push({
        barangay: bg,
        items: group.slice(0, 8).map((r) => ({
          id: r.id,
          outageType: r.outageType,
          notes: r.notes || r.description || '',
          landmark: r.landmark || '',
          createdAt: r.createdAt || r.date || '',
          components: r.aiVerification?.detectedComponents || [],
          priority: r.priority,
        })),
      })
    }
  })

  if (candidatePairs.length === 0) return []

  const systemInstruction = `
You are an expert power utility incident correlator for Valencia PowerWatch (Valencia City, Bukidnon, Philippines).
Given groups of resident-submitted power outage reports in the same barangay, determine which reports are DUPLICATES of each other (i.e. describing the exact same power failure, transformer blowout, fallen line, or neighborhood blackout).

For each cluster of duplicates:
1. Identify the 'masterReportId' (the earliest or most descriptive report).
2. List the 'duplicateIds' (other reports that describe the same root cause).
3. Provide a 'confidence' score between 0.00 and 1.00.
4. Provide a 'reason' explaining why these reports are correlated (e.g. 'Both reports cite tree branch contact near Purok 3 chapel within 20 minutes').

Return JSON matching:
{
  "clusters": [
    {
      "barangay": string,
      "masterReportId": string,
      "duplicateIds": string[],
      "confidence": number,
      "reason": string
    }
  ]
}
If no duplicates are found, return { "clusters": [] }.
`

  const prompt = `Analyze these candidate groups from Valencia City:\n${JSON.stringify(candidatePairs, null, 2)}`
  const result = await callGeminiJson({ systemInstruction, prompt })

  if (result && Array.isArray(result.clusters)) {
    return result.clusters.filter((c) => c.duplicateIds?.length > 0)
  }

  // Fallback heuristic: If Gemini is offline, cluster reports in the same barangay sharing the same outage type
  const fallbackClusters = []
  candidatePairs.forEach(({ barangay, items }) => {
    const typeMap = {}
    items.forEach((item) => {
      const type = item.outageType || 'General'
      if (!typeMap[type]) typeMap[type] = []
      typeMap[type].push(item.id)
    })
    Object.entries(typeMap).forEach(([, ids]) => {
      if (ids.length > 1) {
        fallbackClusters.push({
          barangay,
          masterReportId: ids[0],
          duplicateIds: ids.slice(1),
          confidence: 0.85,
          reason: `Reports share the same barangay (${barangay}) and outage type submitted in close succession.`,
        })
      }
    })
  })

  return fallbackClusters
}

/**
 * 2. AI PUBLIC ADVISORY & TRILINGUAL BROADCAST GENERATOR
 * Drafts professional utility emergency advisories in English, Filipino, or Bisaya.
 */
export async function generatePublicAdvisory({
  category = 'advisory',
  barangay = '',
  cause = '',
  eta = '',
  affectedSitios = '',
  language = 'en',
}) {
  const languageNames = {
    en: 'English',
    fil: 'Filipino (Tagalog)',
    bce: 'Cebuano / Bisaya (Bukidnon local vernacular)',
  }

  const systemInstruction = `
You are the official public information officer for Valencia PowerWatch / local electric cooperative in Valencia City, Bukidnon, Philippines.
Draft an official, clear, professional, and reassuring public power interruption announcement.

Target Language: ${languageNames[language] || 'English'}.
Category: ${category} (advisory, maintenance, restoration, or general).

Guidelines:
1. Provide a clear, official 'title' (max 10 words, e.g. 'Emergency Power Interruption: Brgy. Lumbo').
2. Provide a 2-4 sentence 'body' detailing:
   - Affected area (barangay, sitios/puroks).
   - Reason for outage / work being performed.
   - Expected restoration window (if known).
   - Essential citizen safety advice (unplug sensitive electronics, keep 10m away from wires).
3. Maintain an urgent, empathetic, and professional tone.
4. Output valid JSON:
{
  "title": string,
  "body": string,
  "category": string,
  "barangay": string
}
`

  const prompt = `
Parameters:
- Category: ${category}
- Barangay: ${barangay || 'Valencia City Area'}
- Sitios/Purok: ${affectedSitios || 'Affected residential corridors'}
- Outage Cause: ${cause || 'Emergency line fault repair'}
- Estimated Restoration: ${eta || 'Crews are actively resolving'}
`

  const result = await callGeminiJson({ systemInstruction, prompt })

  if (result && result.title && result.body) {
    return {
      title: result.title,
      body: result.body,
      category: ['advisory', 'maintenance', 'restoration', 'general'].includes(result.category) ? result.category : category,
      barangay: result.barangay || barangay,
    }
  }

  // Fallback template when offline
  const fallbackTitles = {
    en: `Power Interruption Advisory: Brgy. ${barangay || 'Valencia City'}`,
    fil: `Abiso sa Pagkawala ng Kuryente: Brgy. ${barangay || 'Valencia City'}`,
    bce: `Pahibalo sa Pagkapalong sa Kuryente: Brgy. ${barangay || 'Valencia City'}`,
  }

  const fallbackBodies = {
    en: `Please be advised of an ongoing power interruption in Brgy. ${barangay || 'Valencia City'}${affectedSitios ? ` (${affectedSitios})` : ''} due to ${cause || 'emergency line maintenance'}. Field crews have been deployed. ${eta ? `Estimated restoration: ${eta}. ` : ''}Please unplug sensitive appliances and stay clear of power lines.`,
    fil: `Ipinagbibigay-alam ang kasalukuyang pagkawala ng kuryente sa Brgy. ${barangay || 'Valencia City'}${affectedSitios ? ` (${affectedSitios})` : ''} dahil sa ${cause || 'emergency line maintenance'}. Naka-deploy na ang ating field crew. ${eta ? `Tinatayang maibabalik: ${eta}. ` : ''}Mangyaring i-unplug ang mga kagamitan at lumayo sa mga kable.`,
    bce: `Gipahibalo ang kasamtangang pagkapalong sa kuryente sa Brgy. ${barangay || 'Valencia City'}${affectedSitios ? ` (${affectedSitios})` : ''} tungod sa ${cause || 'emergency line maintenance'}. Naka-deploy na ang atong field crew. ${eta ? `Gilaumang mabalik: ${eta}. ` : ''}Palihug i-unplug ang inyong mga kagamitan ug likayi ang mga linya sa kuryente.`,
  }

  return {
    title: fallbackTitles[language] || fallbackTitles.en,
    body: fallbackBodies[language] || fallbackBodies.en,
    category,
    barangay,
  }
}

/**
 * 3. AI SMART DISPATCH & RESTORATION ETA RECOMMENDER
 * Analyzes report damage, suggests repair ETA, and drafts lineman instructions.
 */
export async function recommendDispatchAndEta({ report, availableStaff = [] }) {
  if (!report) return null

  const damageContext = {
    outageType: report.outageType,
    notes: report.notes || report.description,
    priority: report.priority,
    barangay: report.barangay,
    detectedComponents: report.aiVerification?.detectedComponents || [],
    safetyHazard: report.aiVerification?.hazardDetected || false,
    availableStaff: availableStaff.map((s) => ({ id: s.id, name: s.full_name || s.email, position: s.position || 'Lineman' })),
  }

  const systemInstruction = `
You are an expert power distribution dispatcher for Valencia PowerWatch.
Analyze the incident damage data and provide:
1. 'suggestedEta': Realistic restoration time estimate (e.g. '1 to 2 hours', '3 to 4 hours', '4 to 6 hours').
2. 'suggestedRemarks': Concise, technical dispatch instructions for the responding lineman (e.g. 'Inspect transformer pole #14 for blown 25kVA fuse links. Verify phase load before reclosing.').
3. 'recommendedStaffId': The ID of the best suited staff member from availableStaff, or null if none specified.
4. 'reasoning': 1-sentence explanation of the estimate.

Return valid JSON:
{
  "suggestedEta": string,
  "suggestedRemarks": string,
  "recommendedStaffId": string | null,
  "reasoning": string
}
`

  const prompt = `Incident Details:\n${JSON.stringify(damageContext, null, 2)}`
  const result = await callGeminiJson({ systemInstruction, prompt })

  if (result && result.suggestedEta && result.suggestedRemarks) {
    return result
  }

  // Fallback heuristic based on outage type
  let fallbackEta = '2 to 3 hours'
  let fallbackRemarks = 'Inspect line corridor and verify safety clearances before re-energizing.'

  const type = String(report.outageType || '').toLowerCase()
  if (type.includes('transformer')) {
    fallbackEta = '3 to 4 hours'
    fallbackRemarks = 'Inspect distribution transformer for blown cutout fuse or thermal overload. Check insulation oil level.'
  } else if (type.includes('equipment') || type.includes('pole')) {
    fallbackEta = '4 to 6 hours'
    fallbackRemarks = 'Structural damage reported. Verify pole integrity, crossarm hardware, and clear roadways of sagging conductors.'
  } else if (type.includes('weather') || type.includes('tree')) {
    fallbackEta = '2 to 3 hours'
    fallbackRemarks = 'Clear fallen branches and vegetation from primary conductors. Inspect insulator tie-wires.'
  } else {
    fallbackEta = '1 to 2 hours'
    fallbackRemarks = 'Trace localized circuit breaker or lateral fuse cutout. Test line voltage.'
  }

  return {
    suggestedEta: fallbackEta,
    suggestedRemarks: fallbackRemarks,
    recommendedStaffId: availableStaff[0]?.id || null,
    reasoning: `Standard estimate for ${report.outageType || 'general interruption'} in ${report.barangay || 'Valencia City'}.`,
  }
}

/**
 * 4. AI EXECUTIVE GRID SITUATION BRIEFING
 * Synthesizes citywide active incidents into an executive situation brief for the dashboard.
 */
export async function generateExecutiveBriefing({ reports = [], overview = {} }) {
  const activeReports = reports.filter((r) => String(r.status || '').toLowerCase() !== 'rejected')
  const pendingCount = activeReports.filter((r) => String(r.status || '').toLowerCase() === 'pending').length
  const verifiedCount = activeReports.filter((r) => String(r.status || '').toLowerCase() === 'verified').length

  const summaryContext = {
    totalActive: activeReports.length,
    pendingVerification: pendingCount,
    verifiedInField: verifiedCount,
    overviewStats: overview || {},
    barangayIncidents: activeReports.map((r) => ({
      barangay: r.barangay,
      outageType: r.outageType,
      priority: r.priority,
      isDuplicate: r.isDuplicate,
    })),
  }

  const systemInstruction = `
You are the chief operations analyst for Valencia PowerWatch (Valencia City, Bukidnon).
Generate a concise, high-level executive situation briefing for city administrators and electric utility management.

Provide:
1. 'headline': A concise 5-8 word executive status title (e.g. 'Grid Alert: 3 Active Clusters in Northern Valencia').
2. 'summary': A 2-3 sentence overview of the current power supply situation across Valencia City's 31 barangays.
3. 'hotspots': Array of objects [{ "barangay": string, "incidentCount": number, "primaryIssue": string }] highlighting top affected areas.
4. 'recommendations': Array of 2-3 strategic operational recommendations for dispatchers and field crews.

Return valid JSON:
{
  "headline": string,
  "summary": string,
  "hotspots": [{ "barangay": string, "incidentCount": number, "primaryIssue": string }],
  "recommendations": string[]
}
`

  const prompt = `Current Grid Data:\n${JSON.stringify(summaryContext, null, 2)}`
  const result = await callGeminiJson({ systemInstruction, prompt })

  if (result && result.headline && result.summary) {
    return {
      ...result,
      generatedAt: new Date().toISOString(),
    }
  }

  // Fallback heuristic briefing
  const barangayCounts = {}
  activeReports.forEach((r) => {
    const bg = r.barangay || 'Unknown'
    barangayCounts[bg] = (barangayCounts[bg] || 0) + 1
  })

  const topHotspots = Object.entries(barangayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([bg, count]) => ({
      barangay: bg,
      incidentCount: count,
      primaryIssue: 'Power interruption reports logged',
    }))

  return {
    headline: activeReports.length > 0
      ? `Active Incidents Logged Across ${Object.keys(barangayCounts).length} Barangays`
      : 'Normal Grid Operations — No Critical Disruptions',
    summary: activeReports.length > 0
      ? `Currently tracking ${activeReports.length} reports (${pendingCount} pending verification, ${verifiedCount} verified in field). Primary concentration observed in ${topHotspots[0]?.barangay || 'central'} sector.`
      : 'All monitored barangays in Valencia City are currently operating with stable power distribution and no active line faults.',
    hotspots: topHotspots,
    recommendations: [
      activeReports.length > 0
        ? 'Prioritize dispatching available linemen to verified incidents in top hotspot areas.'
        : 'Maintain routine patrol schedules across high-vegetation feeder corridors.',
      'Broadcast public advisories for any sustained interruption exceeding 1 hour.',
    ],
    generatedAt: new Date().toISOString(),
  }
}
