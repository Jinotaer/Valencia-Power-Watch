import {
  Check,
  Copy,
  Download,
  Eye,
  FileSearch,
  Filter,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import Pagination from '../../components/common/pagination'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { downloadCsv } from '../../lib/adminUsers'
import { loadAuditLogs } from '../../lib/auditLogs'

const entityOptions = [
  { value: 'All entities', label: 'All Entities' },
  { value: 'reports', label: 'Incident Reports' },
  { value: 'schedules', label: 'Outage Schedules' },
  { value: 'announcements', label: 'Public Announcements' },
  { value: 'barangays', label: 'Barangays' },
  { value: 'users', label: 'Users & Personnel' },
  { value: 'feedback', label: 'Citizen Feedback' },
  { value: 'system_settings', label: 'System Settings' },
  { value: 'role_permissions', label: 'Role Permissions' },
  { value: 'report_categories', label: 'Report Categories' },
]

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatFullDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatValue(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function computeFieldDiff(metadata, action) {
  if (!metadata || typeof metadata !== 'object') return []
  const oldObj = metadata.old && typeof metadata.old === 'object' ? metadata.old : {}
  const newObj = metadata.new && typeof metadata.new === 'object' ? metadata.new : {}

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)])).filter(
    (k) => k !== 'updated_at',
  )

  const diffs = []

  for (const key of allKeys) {
    const hasOld = key in oldObj
    const hasNew = key in newObj
    const oldVal = oldObj[key]
    const newVal = newObj[key]
    const isDifferent = JSON.stringify(oldVal) !== JSON.stringify(newVal)

    const normalizedAction = String(action || '').toLowerCase()
    if (normalizedAction === 'insert') {
      if (hasNew && newVal !== null && newVal !== '') {
        diffs.push({ key, oldVal: null, newVal, type: 'added' })
      }
    } else if (normalizedAction === 'delete') {
      if (hasOld) {
        diffs.push({ key, oldVal, newVal: null, type: 'removed' })
      }
    } else {
      if (isDifferent) {
        diffs.push({
          key,
          oldVal: hasOld ? oldVal : null,
          newVal: hasNew ? newVal : null,
          type: 'modified',
        })
      }
    }
  }

  return diffs
}

function summarizeDiff(metadata, action) {
  if (!metadata || typeof metadata !== 'object') return 'Record processed.'
  const diffs = computeFieldDiff(metadata, action)

  if (diffs.length === 0) {
    const act = String(action || '').toLowerCase()
    if (act === 'insert') return 'New record created.'
    if (act === 'delete') return 'Record deleted.'
    return 'Record updated.'
  }

  const priorityKeys = [
    'status',
    'title',
    'role',
    'full_name',
    'email',
    'captain',
    'priority',
    'barangay',
    'date',
    'is_duplicate',
    'is_active',
  ]

  diffs.sort((a, b) => {
    const aPrio = priorityKeys.indexOf(a.key)
    const bPrio = priorityKeys.indexOf(b.key)
    if (aPrio !== -1 && bPrio !== -1) return aPrio - bPrio
    if (aPrio !== -1) return -1
    if (bPrio !== -1) return 1
    return a.key.localeCompare(b.key)
  })

  const topChanges = diffs.slice(0, 2).map((d) => {
    if (d.type === 'modified') {
      return `${d.key}: ${formatValue(d.oldVal)} → ${formatValue(d.newVal)}`
    }
    if (d.type === 'added') {
      return `${d.key}: ${formatValue(d.newVal)}`
    }
    return `${d.key}: deleted`
  })

  const remaining = diffs.length - 2
  if (remaining > 0) {
    topChanges.push(`+${remaining} more`)
  }

  return topChanges.join(' · ')
}

function ActionBadge({ action }) {
  const act = String(action || '').toLowerCase()
  if (act === 'insert') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        <PlusCircle className="size-3" />
        INSERT
      </span>
    )
  }
  if (act === 'delete') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
        <Trash2 className="size-3" />
        DELETE
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-brand-blue">
      <RefreshCw className="size-3" />
      UPDATE
    </span>
  )
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [entityFilter, setEntityFilter] = useState('All entities')
  const [actionFilter, setActionFilter] = useState('all') // 'all' | 'insert' | 'update' | 'delete'
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Inspector modal state
  const [selectedLog, setSelectedLog] = useState(null)
  const [modalTab, setModalTab] = useState('diff') // 'diff' | 'raw'
  const [hasCopiedJson, setHasCopiedJson] = useState(false)

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  useEffect(() => {
    let active = true

    loadAuditLogs({
      limit: 300,
      entityType: entityFilter === 'All entities' ? '' : entityFilter,
      search,
    })
      .then((rows) => {
        if (active) setLogs(rows)
      })
      .catch(() => {
        if (active) {
          setLogs([])
          setLoadError('We could not load audit logs. Run supabase/audit_log.sql once, then try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey, entityFilter, search])

  // Filter logs by action client-side
  const visibleLogs = useMemo(() => {
    if (actionFilter === 'all') return logs
    return logs.filter((log) => String(log.action || '').toLowerCase() === actionFilter.toLowerCase())
  }, [logs, actionFilter])

  const totalPages = Math.max(1, Math.ceil(visibleLogs.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return visibleLogs.slice(start, start + pageSize)
  }, [visibleLogs, safePage, pageSize])

  const handleCopyJson = (payload) => {
    if (!payload) return
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setHasCopiedJson(true)
    setTimeout(() => setHasCopiedJson(false), 2000)
  }

  // Enhanced forensic CSV export
  const exportCsv = () => {
    if (visibleLogs.length === 0) return

    const headers = [
      'Log ID',
      'Timestamp (ISO 8601)',
      'Timestamp (Local PH)',
      'Actor Email',
      'Actor ID',
      'Action Type',
      'Entity Module',
      'Entity ID',
      'Changed Fields',
      'Change Summary',
      'Previous State (JSON)',
      'New State (JSON)',
    ]

    const rows = visibleLogs.map((log) => {
      const diffs = computeFieldDiff(log.metadata, log.action)
      const changedKeys = diffs.map((d) => d.key).join('; ')
      const summaryText = summarizeDiff(log.metadata, log.action)
      const oldJson = log.metadata?.old ? JSON.stringify(log.metadata.old) : ''
      const newJson = log.metadata?.new ? JSON.stringify(log.metadata.new) : ''

      return [
        log.id,
        log.createdAt || '',
        formatFullDate(log.createdAt),
        log.actorEmail || 'System',
        log.actorId || '',
        String(log.action || '').toUpperCase(),
        log.entityType,
        log.entityId || '',
        changedKeys,
        summaryText,
        oldJson,
        newJson,
      ]
    })

    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`valencia-powerwatch-audit-log-${stamp}.csv`, [headers, ...rows])
  }

  const hasActiveFilters = entityFilter !== 'All entities' || actionFilter !== 'all' || search.trim() !== ''

  const clearFilters = () => {
    setEntityFilter('All entities')
    setActionFilter('all')
    setSearch('')
    setPage(1)
  }

  const selectedDiffs = useMemo(() => {
    if (!selectedLog) return []
    return computeFieldDiff(selectedLog.metadata, selectedLog.action)
  }, [selectedLog])

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/audit-logs" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Administration" section="Audit logs" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* Header with Exact Buttons matching barangay.jsx */}
            <PageHeader
              title="System Audit Logs"
              description="Forensic trail of administrative actions, user role elevations, status overrides, and system configuration updates across Valencia City."
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reload}
                    disabled={isLoading}
                    className="h-10 gap-2 rounded-lg border border-brand-line bg-white px-3.5 text-xs font-semibold text-brand-navy hover:bg-brand-paper transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`size-4 text-brand-muted ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={exportCsv}
                    disabled={isLoading || visibleLogs.length === 0}
                    className="h-10 gap-2 rounded-lg bg-brand-blue hover:bg-brand-navy px-4 font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Download className="size-4" />
                    <span>Export CSV ({visibleLogs.length})</span>
                  </Button>
                </div>
              }
            />

            {/* Main Forensic Table Card matching barangay.jsx */}
            <section className="overflow-hidden rounded-2xl border border-brand-line/80 bg-white shadow-xs">
              {/* Filter Toolbar matching reports.jsx & barangay.jsx */}
              <div className="border-b border-brand-line p-4 space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Search Input */}
                  <div className="relative min-w-0 flex-1 lg:max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                    <Input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setPage(1)
                      }}
                      placeholder="Search actor email, action, entity ID, or change..."
                      className="h-10 rounded-lg border-brand-line bg-white pl-9 pr-8 text-xs sm:text-sm text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                      aria-label="Search audit records"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('')
                          setPage(1)
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-navy cursor-pointer p-0.5 rounded"
                        aria-label="Clear search"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  {/* Entity Dropdown Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                      <Filter className="size-3.5" />
                      <span>Entity:</span>
                    </div>
                    <select
                      value={entityFilter}
                      onChange={(event) => {
                        setEntityFilter(event.target.value)
                        setPage(1)
                      }}
                      aria-label="Filter by entity"
                      className="h-10 rounded-lg border border-brand-line bg-white px-3 text-xs sm:text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue cursor-pointer"
                    >
                      {entityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="h-10 px-3 text-xs font-semibold text-brand-blue hover:text-brand-navy underline underline-offset-4 cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Filter Tabs (All, INSERT, UPDATE, DELETE) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-medium text-brand-muted mr-1">Action:</span>
                  {[
                    { id: 'all', label: 'All Actions' },
                    { id: 'insert', label: 'INSERT (New)' },
                    { id: 'update', label: 'UPDATE (Modified)' },
                    { id: 'delete', label: 'DELETE (Removed)' },
                  ].map((tab) => {
                    const isActive = actionFilter === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActionFilter(tab.id)
                          setPage(1)
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-brand-navy text-white shadow-xs'
                            : 'border border-brand-line bg-brand-paper/50 text-brand-muted hover:bg-white hover:text-brand-navy'
                        }`}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Table Data States */}
              {isLoading ? (
                <div className="p-12 text-center text-sm font-semibold text-brand-muted animate-pulse">
                  Loading system audit records…
                </div>
              ) : loadError ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                  <button
                    type="button"
                    onClick={reload}
                    className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4 cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : visibleLogs.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#e5e9f6] text-brand-blue">
                    <FileSearch className="size-7" />
                  </div>
                  <h2 className="font-bold text-brand-navy">No audit activity found</h2>
                  <p className="mt-1 max-w-sm text-sm text-brand-muted">
                    {hasActiveFilters
                      ? 'No records match your current filter parameters. Try clearing filters.'
                      : 'Changes to users, reports, schedules, announcements, barangays, and settings will appear here.'}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-4 rounded-lg cursor-pointer"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-brand-paper/60">
                      <TableRow className="border-b border-brand-line hover:bg-transparent">
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          TIMESTAMP
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          ACTOR
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          ACTION
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          TARGET ENTITY
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                          CHANGE SUMMARY
                        </TableHead>
                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-brand-muted text-right">
                          INSPECT
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedLogs.map((log) => {
                        const summary = summarizeDiff(log.metadata, log.action)
                        const relativeTime = formatRelativeTime(log.createdAt)
                        const fullTime = formatFullDate(log.createdAt)

                        return (
                          <TableRow
                            key={log.id}
                            className="border-b border-brand-line hover:bg-brand-paper/60 transition-colors"
                          >
                            {/* Timestamp */}
                            <TableCell className="px-5 py-3.5">
                              <div className="font-semibold text-xs text-brand-navy">{relativeTime}</div>
                              <div className="text-[11px] text-brand-muted truncate max-w-[140px]">{fullTime}</div>
                            </TableCell>

                            {/* Actor */}
                            <TableCell className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="grid size-6 place-items-center rounded-full bg-[#e5e9f6] text-[10px] font-bold text-brand-blue uppercase">
                                  {log.actorEmail ? log.actorEmail.charAt(0) : 'S'}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs text-brand-ink truncate max-w-[200px]">
                                    {log.actorEmail || 'System Trigger'}
                                  </div>
                                  {log.actorId && (
                                    <div className="font-mono text-[10px] text-brand-muted truncate max-w-[120px]">
                                      {log.actorId.slice(0, 8)}…
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Action Badge */}
                            <TableCell className="px-5 py-3.5">
                              <ActionBadge action={log.action} />
                            </TableCell>

                            {/* Target Entity & ID */}
                            <TableCell className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="rounded-md bg-[#e5e9f6] px-2 py-0.5 text-[11px] font-bold text-brand-blue">
                                  {log.entityType}
                                </span>
                                {log.entityId && (
                                  <span className="font-mono text-xs text-brand-muted">
                                    #{log.entityId.slice(0, 10)}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Change Summary */}
                            <TableCell className="px-5 py-3.5">
                              <p className="max-w-[380px] text-xs text-brand-ink line-clamp-2 leading-relaxed">
                                {summary}
                              </p>
                            </TableCell>

                            {/* Inspect Details Button */}
                            <TableCell className="px-5 py-3.5 text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLog(log)
                                  setModalTab('diff')
                                  setHasCopiedJson(false)
                                }}
                                className="h-8 gap-1 rounded-lg border-brand-line px-2.5 text-xs font-semibold text-brand-navy hover:bg-brand-paper hover:text-brand-blue cursor-pointer"
                                aria-label={`Inspect audit log for ${log.entityType} ${log.entityId}`}
                              >
                                <Eye className="size-3.5" />
                                <span>Inspect</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Reusable Pagination matching reports.jsx & barangay.jsx */}
              {!isLoading && !loadError && visibleLogs.length > 0 && (
                <Pagination
                  page={safePage}
                  pageSize={pageSize}
                  total={visibleLogs.length}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                  }}
                />
              )}
            </section>
          </div>
        </main>
      </SidebarInset>

      {/* Forensic Inspection Modal */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
          {selectedLog && (
            <>
              {/* Modal Header */}
              <DialogHeader className="border-b border-brand-line p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                  <div className="flex items-center gap-2">
                    <ActionBadge action={selectedLog.action} />
                    <span className="rounded-md bg-[#e5e9f6] px-2 py-0.5 text-xs font-bold text-brand-blue">
                      {selectedLog.entityType}
                    </span>
                    {selectedLog.entityId && (
                      <span className="font-mono text-xs font-semibold text-brand-muted">
                        ID: #{selectedLog.entityId}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-brand-muted">
                    {formatFullDate(selectedLog.createdAt)}
                  </div>
                </div>
                <DialogTitle className="mt-2 text-base font-bold text-brand-navy">
                  Forensic Activity Record
                </DialogTitle>
                <DialogDescription className="text-xs text-brand-muted">
                  Executed by{' '}
                  <strong className="text-brand-ink">{selectedLog.actorEmail || 'System Trigger'}</strong>
                  {selectedLog.actorId ? ` (${selectedLog.actorId})` : ''}
                </DialogDescription>

                {/* Modal Tab Switcher */}
                <div className="mt-4 flex items-center gap-2 border-b border-brand-line pt-2">
                  <button
                    type="button"
                    onClick={() => setModalTab('diff')}
                    className={`pb-2 text-xs font-bold transition-all cursor-pointer ${
                      modalTab === 'diff'
                        ? 'border-b-2 border-brand-blue text-brand-blue'
                        : 'text-brand-muted hover:text-brand-navy'
                    }`}
                  >
                    Field Changes ({selectedDiffs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('raw')}
                    className={`pb-2 text-xs font-bold transition-all cursor-pointer ${
                      modalTab === 'raw'
                        ? 'border-b-2 border-brand-blue text-brand-blue'
                        : 'text-brand-muted hover:text-brand-navy'
                    }`}
                  >
                    Raw Payload (JSON)
                  </button>
                </div>
              </DialogHeader>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {modalTab === 'diff' ? (
                  <div>
                    {selectedDiffs.length > 0 ? (
                      <div className="rounded-xl border border-brand-line overflow-hidden">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead className="bg-brand-paper border-b border-brand-line text-[11px] font-bold text-brand-muted uppercase">
                            <tr>
                              <th className="px-4 py-2.5">Field</th>
                              <th className="px-4 py-2.5">Previous Value</th>
                              <th className="px-4 py-2.5">New Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-line">
                            {selectedDiffs.map((diff) => (
                              <tr key={diff.key} className="hover:bg-brand-paper/40">
                                <td className="px-4 py-2.5 font-bold text-brand-navy font-mono">
                                  {diff.key}
                                </td>
                                <td className="px-4 py-2.5 max-w-[200px] break-all">
                                  {diff.type === 'added' ? (
                                    <span className="text-brand-muted italic">none</span>
                                  ) : (
                                    <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 font-mono text-[11px] text-rose-700">
                                      {formatValue(diff.oldVal)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 max-w-[200px] break-all">
                                  {diff.type === 'removed' ? (
                                    <span className="text-rose-600 italic">removed</span>
                                  ) : (
                                    <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 font-mono text-[11px] text-emerald-700">
                                      {formatValue(diff.newVal)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-brand-muted">
                        No individual field discrepancies recorded in this payload.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand-navy">Metadata Payload:</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleCopyJson(selectedLog.metadata)}
                        className="gap-1 text-xs cursor-pointer"
                      >
                        {hasCopiedJson ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                        <span>{hasCopiedJson ? 'Copied' : 'Copy JSON'}</span>
                      </Button>
                    </div>
                    <pre className="max-h-[360px] overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100 leading-relaxed">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-brand-line p-4 flex items-center justify-between bg-brand-paper/50">
                <span className="font-mono text-[11px] text-brand-muted">
                  Log ID: {selectedLog.id}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
