import { Focus, MapPin, Navigation, RefreshCw, Truck, X } from 'lucide-react'
import { formatDistance, formatDuration } from '../../lib/routing'

/**
 * Compact live tracking overlay shown on the admin map when locating a field team.
 */
export default function TeamTrackingCard({
  team,
  activeJobs = [],
  selectedJob = null,
  isTargetApproximate = false,
  progress = null,
  route = null,
  isFetchingRoute = false,
  routeError = '',
  lastPingLabel = 'Just now',
  onSelectJob,
  onReframe,
  onRetryRoute,
  onStop,
}) {
  if (!team) return null

  const remainingDistance = progress?.remaining ?? route?.distance
  const etaSeconds = progress?.etaSeconds ?? route?.duration
  const isDispatched = team.status === 'dispatched'

  return (
    <div
      role="region"
      aria-label={`Live tracking for ${team.name}`}
      className="pointer-events-auto absolute bottom-4 left-3 right-3 z-[1050] rounded-2xl border border-brand-line bg-white/95 p-3.5 shadow-lg backdrop-blur-md sm:left-auto sm:right-4 sm:bottom-6 sm:w-[355px]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-[#24449a]" />
            </span>
            <h3 className="truncate text-xs font-extrabold text-brand-navy">
              Tracking {team.name}
            </h3>
            {team.vehiclePlate && (
              <span className="rounded bg-[#e5e9f6] px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-blue">
                {team.vehiclePlate}
              </span>
            )}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isDispatched
                  ? 'bg-blue-100 text-blue-800'
                  : team.status === 'available'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isDispatched ? 'Dispatched' : team.status === 'available' ? 'Available' : 'Offline'}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] font-medium text-brand-muted">
            GPS ping: <span className="font-semibold text-brand-blue">{lastPingLabel}</span>
            {team.leaderName ? ` · Leader: ${team.leaderName}` : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onReframe}
            title={selectedJob ? 'Fit route on map' : 'Center on team'}
            className="grid size-7 place-items-center rounded-lg border border-brand-line bg-white text-brand-blue transition-colors hover:bg-[#e5e9f6] cursor-pointer"
          >
            <Focus className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onStop}
            title="Stop tracking"
            aria-label="Stop tracking"
            className="grid size-7 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted transition-colors hover:bg-red-50 hover:text-[#b42318] cursor-pointer"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {activeJobs.length === 0 ? (
        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-brand-line bg-brand-paper/70 px-2.5 py-2 text-[11px] text-brand-muted">
          <Truck className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>Standby — no active assignment to route to.</span>
        </div>
      ) : (
        <div className="mt-2.5 space-y-2 border-t border-brand-line/80 pt-2.5">
          {activeJobs.length > 1 && (
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                Active assignment ({activeJobs.length})
              </span>
              <select
                value={selectedJob?.id ?? ''}
                onChange={(event) => onSelectJob?.(event.target.value)}
                className="w-full rounded-lg border border-brand-line bg-white px-2.5 py-1.5 text-[11px] font-bold text-brand-navy focus:border-brand-blue focus:outline-none cursor-pointer"
              >
                {activeJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.id} · {job.outageType} ({job.barangay ? `Brgy. ${job.barangay}` : 'No barangay'})
                  </option>
                ))}
              </select>
            </label>
          )}

          {selectedJob && (
            <div className="rounded-xl border border-[#24449a]/20 bg-[#f4f7ff] p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[11px] font-extrabold text-brand-navy truncate">
                    <Navigation className="size-3 shrink-0 text-[#24449a]" aria-hidden="true" />
                    <span className="truncate">
                      {selectedJob.id} · {selectedJob.outageType}
                    </span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-brand-muted truncate">
                    <MapPin className="size-3 shrink-0 text-brand-blue" aria-hidden="true" />
                    <span>
                      {selectedJob.barangay ? `Brgy. ${selectedJob.barangay}` : 'Location'}
                      {selectedJob.pinnedLocation ? ` — ${selectedJob.pinnedLocation}` : ''}
                    </span>
                  </p>
                  {isTargetApproximate && (
                    <p className="mt-0.5 text-[10px] font-semibold text-[#9a6500]">
                      Routed to barangay center (no exact pin captured)
                    </p>
                  )}
                </div>
                <a
                  href="/admin/reports"
                  className="shrink-0 text-[10px] font-bold text-brand-blue hover:underline"
                >
                  Open
                </a>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 border-t border-brand-line/70 pt-1.5 text-[11px]">
                {progress?.arrived ? (
                  <span className="rounded-full bg-[#d9f9e8] px-2 py-0.5 text-[10px] font-bold text-[#137a48]">
                    On site / Arrived
                  </span>
                ) : route ? (
                  <div className="flex items-center gap-2 font-bold text-[#24449a]">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1 w-3 rounded-full bg-[#24449a]" />
                      {formatDistance(remainingDistance)}
                    </span>
                    <span className="text-brand-muted">·</span>
                    <span>~{formatDuration(etaSeconds)}</span>
                  </div>
                ) : isFetchingRoute ? (
                  <span className="font-semibold text-brand-blue">Calculating blue route…</span>
                ) : routeError ? (
                  <div className="flex items-center gap-2 text-[#b42318]">
                    <span className="font-semibold">{routeError}</span>
                    <button
                      type="button"
                      onClick={onRetryRoute}
                      className="inline-flex items-center gap-1 font-bold text-brand-blue hover:underline cursor-pointer"
                    >
                      <RefreshCw className="size-3" />
                      Retry
                    </button>
                  </div>
                ) : (
                  <span className="text-brand-muted">Preparing driving route…</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
