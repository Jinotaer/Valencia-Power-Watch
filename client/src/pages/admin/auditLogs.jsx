import { Download, FileSearch, RefreshCw, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import PageHeader from '../../components/common/pageHeader'
import Pagination from '../../components/common/pagination'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import { loadAuditLogs } from '../../lib/auditLogs'
import { downloadCsv } from '../../lib/adminUsers'

const entityOptions = ['All entities', 'reports', 'schedules', 'announcements', 'barangays', 'users', 'feedback', 'system_settings', 'role_permissions', 'report_categories']

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function summarize(metadata) {
  if (!metadata || typeof metadata !== 'object') return ''
  const parts = []
  const next = metadata.new
  const prev = metadata.old
  if (next?.status && (prev?.status !== next.status)) parts.push(`status: ${prev?.status ?? '—'} → ${next.status}`)
  if (next?.title && (prev?.title !== next.title)) parts.push(`title: ${next.title}`)
  if (next?.full_name) parts.push(`name: ${next.full_name}`)
  if (next?.email) parts.push(`email: ${next.email}`)
  if (next?.role) parts.push(`role: ${next.role}`)
  return parts.join(' · ')
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [entityFilter, setEntityFilter] = useState('All entities')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const reload = () => {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((value) => value + 1)
  }

  useEffect(() => {
    let active = true

    loadAuditLogs({ limit: 200, entityType: entityFilter === 'All entities' ? '' : entityFilter, search })
      .then((rows) => {
        if (active) setLogs(rows)
      })
      .catch(() => {
        if (active) {
          setLogs([])
          setLoadError('We could not load audit logs. Run supabase/audit_log.sql and try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey, entityFilter, search])

  const visibleLogs = useMemo(() => logs, [logs])
  const totalPages = Math.max(1, Math.ceil(visibleLogs.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return visibleLogs.slice(start, start + pageSize)
  }, [visibleLogs, safePage, pageSize])

  const exportCsv = () => {
    downloadCsv('powerwatch-audit-logs.csv', [
      ['Date', 'Actor', 'Action', 'Entity', 'Entity ID', 'Summary'],
      ...logs.map((row) => [formatDate(row.createdAt), row.actorEmail || row.actorId || '', row.action, row.entityType, row.entityId, summarize(row.metadata)]),
    ])
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/audit-logs" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Administration" section="Audit logs" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <PageHeader
              className="mb-6"
              title="Audit logs"
              description="Inspect important system activity across users, reports, schedules, announcements, barangays, settings and feedback."
              actions={
                <>
                  <button type="button" onClick={exportCsv} disabled={logs.length === 0} className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-line bg-white px-4 text-sm font-semibold text-brand-navy hover:bg-brand-paper disabled:opacity-60">
                    <Download className="size-4" />
                    Export CSV
                  </button>
                  <button type="button" onClick={reload} aria-label="Refresh audit logs" className="grid size-10 place-items-center rounded-lg border border-brand-line bg-white text-brand-muted hover:bg-brand-paper hover:text-brand-navy">
                    <RefreshCw className="size-4" />
                  </button>
                </>
              }
            />

            <section className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xs">
              <div className="flex flex-col gap-3 border-b border-brand-line p-4 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search actor, action, ID, or change summary..."
                    className="h-10 w-full rounded-lg border border-brand-line bg-white pl-9 pr-3 text-sm text-brand-ink outline-none focus:border-brand-blue"
                  />
                </div>
                <select value={entityFilter} onChange={(event) => setEntityFilter(event.target.value)} aria-label="Filter by entity" className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue">
                  {entityOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>

              {isLoading ? (
                <p className="p-10 text-center text-sm font-semibold text-brand-muted">Loading audit logs…</p>
              ) : loadError ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                  <button type="button" onClick={reload} className="mt-2 text-xs font-bold text-brand-blue underline underline-offset-4">Try again</button>
                </div>
              ) : visibleLogs.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#e5e9f6] text-brand-blue">
                    <FileSearch className="size-7" />
                  </div>
                  <h2 className="font-bold text-brand-navy">No audit activity found</h2>
                  <p className="mt-1 max-w-sm text-sm text-brand-muted">Changes to users, reports, schedules, announcements, barangays, feedback, settings and permissions will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-[#f4f6fb] text-[11px] font-bold uppercase tracking-[.08em] text-brand-muted">
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Actor</th>
                        <th className="px-5 py-3">Action</th>
                        <th className="px-5 py-3">Entity</th>
                        <th className="px-5 py-3">Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {paginatedLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-brand-paper/60">
                          <td className="whitespace-nowrap px-5 py-3 text-brand-muted">{formatDate(log.createdAt)}</td>
                          <td className="max-w-[220px] px-5 py-3 font-semibold text-brand-ink truncate">{log.actorEmail || log.actorId || 'System'}</td>
                          <td className="px-5 py-3 font-semibold text-brand-ink capitalize">{log.action}</td>
                          <td className="px-5 py-3"><span className="rounded-full bg-[#e5e9f6] px-2 py-0.5 text-[11px] font-bold text-brand-blue">{log.entityType}</span><span className="ml-2 text-xs text-brand-muted">{log.entityId}</span></td>
                          <td className="max-w-[420px] px-5 py-3 text-xs text-brand-muted">{summarize(log.metadata) || 'Record changed.'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoading && !loadError && (
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
    </SidebarProvider>
  )
}
