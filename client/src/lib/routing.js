// Driving routes and turn instructions from the public OSRM server. The demo
// server is fine for a small field crew; self-host OSRM if usage grows.
const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving'
const EARTH_RADIUS_M = 6371000

const toRadians = (degrees) => (degrees * Math.PI) / 180

export function distanceMeters([lat1, lng1], [lat2, lng2]) {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

// Nearest point on the route line, used to measure progress and detect a
// driver who left the route.
export function nearestRouteIndex(geometry, position) {
  let index = 0
  let distance = Infinity

  geometry.forEach((point, pointIndex) => {
    const nextDistance = distanceMeters(point, position)
    if (nextDistance < distance) {
      distance = nextDistance
      index = pointIndex
    }
  })

  return { index, distance }
}

const TURN_TEXT = {
  left: 'Turn left',
  right: 'Turn right',
  'slight left': 'Keep left',
  'slight right': 'Keep right',
  'sharp left': 'Turn sharp left',
  'sharp right': 'Turn sharp right',
  straight: 'Continue straight',
  uturn: 'Make a U-turn',
}

function instructionFor({ maneuver, name }) {
  const road = name ? ` onto ${name}` : ''
  const turn = TURN_TEXT[maneuver.modifier] ?? 'Continue'

  switch (maneuver.type) {
    case 'depart':
      return name ? `Head out on ${name}` : 'Start driving'
    case 'arrive':
      return 'Arrive at your destination'
    case 'roundabout':
    case 'rotary':
      return maneuver.exit
        ? `Take exit ${maneuver.exit} at the roundabout${road}`
        : `Enter the roundabout${road}`
    case 'merge':
      return `Merge ${maneuver.modifier ?? 'ahead'}${road}`
    case 'fork':
      return `Keep ${maneuver.modifier ?? 'straight'}${road}`
    case 'end of road':
      return `${turn} at the end of the road${road}`
    case 'new name':
    case 'continue':
      return `Continue${road}`
    default:
      return `${turn}${road}`
  }
}

export async function fetchDrivingRoute(from, to) {
  if (!from || !to) throw new Error('Missing route coordinates.')

  const url = `${OSRM_ROUTE_URL}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Routing request failed (${response.status}).`)

  const data = await response.json()
  const route = data.routes?.[0]
  if (data.code !== 'Ok' || !route) throw new Error('No driving route found.')

  const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  const steps = route.legs
    .flatMap((leg) => leg.steps)
    .map((step) => ({
      instruction: instructionFor(step),
      distance: step.distance,
      type: step.maneuver.type,
      modifier: step.maneuver.modifier ?? '',
      routeIndex: nearestRouteIndex(geometry, [
        step.maneuver.location[1],
        step.maneuver.location[0],
      ]).index,
    }))

  return { geometry, distance: route.distance, duration: route.duration, steps }
}

// Remaining distance, next maneuver and whether the crew has arrived.
export function routeProgress(route, position) {
  const { index } = nearestRouteIndex(route.geometry, position)
  let remaining = 0
  for (let point = index; point < route.geometry.length - 1; point += 1) {
    remaining += distanceMeters(route.geometry[point], route.geometry[point + 1])
  }

  const step = route.steps.find((candidate) => candidate.routeIndex > index + 1) ?? null
  let toNext = null
  if (step) {
    toNext = 0
    for (let point = index; point < Math.min(step.routeIndex, route.geometry.length - 1); point += 1) {
      toNext += distanceMeters(route.geometry[point], route.geometry[point + 1])
    }
  }

  const destination = route.geometry[route.geometry.length - 1]
  return {
    remaining,
    toNext,
    step,
    arrived: remaining <= 30 || (destination ? distanceMeters(position, destination) <= 25 : false),
    etaSeconds: route.distance > 0 ? (route.duration * remaining) / route.distance : 0,
  }
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return ''
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.max(10, Math.round(meters / 10) * 10)} m`
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return ''
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}
