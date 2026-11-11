import {
  AlertTriangle,
  ChevronRight,
  FileWarning,
  FilterX,
  Flag,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { ReportPriorityBadge, ReportStatusBadge } from '../../resident/reportView'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Skeleton } from '../../ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'

export function ReportsTable({
  isLoading,
  loadError,
  reports,
  visibleReports,
  staffNames,
  teamNames = {},
  hasActiveFilters,
  access,
  detectedClusters = [],
  onReload,
  onClearFilters,
  onOpenReview,
}) {
  return (
    <Table>
      <TableHeader className="[&_tr]:border-brand-line">
        <TableRow className="border-brand-line bg-brand-paper/80 hover:bg-brand-paper/80">
          <TableHead className="h-11 pl-5 pr-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Report ID
          </TableHead>
          <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Report
          </TableHead>
          <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Priority
          </TableHead>
          <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Resident
          </TableHead>
          <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Barangay
          </TableHead>
          <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Noticed
          </TableHead>
          <TableHead className="h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Status
          </TableHead>
          <TableHead className="hidden h-11 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted md:table-cell">
            Assigned Staff
          </TableHead>
          <TableHead className="h-11 pl-3 pr-5 text-right text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Action
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
              <TableCell colSpan={9} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-28 bg-slate-200" />
                  <Skeleton className="h-4 w-36 bg-slate-100" />
                  <Skeleton className="h-5 w-16 rounded-full bg-slate-200" />
                  <Skeleton className="h-4 w-24 bg-slate-100" />
                  <Skeleton className="h-4 w-24 bg-slate-100" />
                  <Skeleton className="h-6 w-20 rounded-full bg-slate-200" />
                  <Skeleton className="h-8 w-20 rounded-lg bg-slate-100" />
                </div>
              </TableCell>
            </TableRow>
          ))}

        {!isLoading && loadError && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={9} className="py-12 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center">
                <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-red-50 text-[#b42318]">
                  <AlertTriangle className="size-6" aria-hidden="true" />
                </div>
                <p className="text-sm font-bold text-[#b42318]">{loadError}</p>
                <Button
                  type="button"
                  onClick={onReload}
                  className="mt-3 h-9 gap-1.5 rounded-lg bg-brand-blue px-4 text-xs font-bold text-white hover:bg-brand-navy cursor-pointer"
                >
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  Try again
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}

        {!isLoading && !loadError && visibleReports.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={9} className="px-5 py-14 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center">
                <div className="mb-3.5 grid size-14 place-items-center rounded-2xl bg-[#e5e9f6] text-brand-blue">
                  <FileWarning className="size-7" aria-hidden="true" />
                </div>
                <p className="text-base font-bold text-brand-navy">
                  {reports.length === 0
                    ? 'No resident reports are visible to this account'
                    : 'No resident reports match your filters'}
                </p>
                <p className="mt-1 text-xs leading-5 text-brand-muted">
                  {reports.length === 0
                    ? 'Once residents submit power interruption reports, they will appear here for verification and dispatch.'
                    : 'Try adjusting your search keywords, barangay filter, or selected status tab.'}
                </p>

                {hasActiveFilters && reports.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClearFilters}
                    className="mt-4 h-9 gap-1.5 rounded-lg border-brand-line bg-white px-4 text-xs font-bold text-brand-navy hover:bg-brand-paper cursor-pointer"
                  >
                    <FilterX className="size-3.5 text-brand-blue" aria-hidden="true" />
                    Clear all filters
                  </Button>
                )}

                {reports.length === 0 && access && (
                  <p className="mx-auto mt-3 max-w-md rounded-xl border border-brand-line bg-brand-paper/60 p-3 text-xs leading-5 text-brand-muted">
                    {!access.signedIn ? (
                      <>
                        You are not signed in, so Supabase hides every report.{' '}
                        <a
                          className="font-bold text-brand-blue underline underline-offset-4"
                          href="/admin/login"
                        >
                          Sign in as an administrator
                        </a>
                        .
                      </>
                    ) : access.role !== 'admin' ? (
                      <>
                        Signed in as <strong>{access.email}</strong>, but this account&apos;s
                        role is <strong>{access.role || 'missing'}</strong>. Promote it in the
                        Supabase SQL Editor, then reload:{' '}
                        <code className="rounded bg-[#e5e9f6] px-1 break-all">
                          update public.users set role = &apos;admin&apos; where email = &apos;
                          {access.email}&apos;;
                        </code>
                      </>
                    ) : (
                      <>
                        Signed in as <strong>{access.email}</strong> with the admin role,
                        but the reports table returned no rows. Re-run{' '}
                        <code className="rounded bg-[#e5e9f6] px-1 break-all">
                          supabase/report.sql
                        </code>{' '}
                        so the “Admins can view all reports” policy exists.
                      </>
                    )}
                  </p>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}

        {!isLoading &&
          !loadError &&
          visibleReports.map((report) => {
            const assignedName = staffNames[report.assignedStaffId]
            const rowStatusKey = String(report.status ?? '').toLowerCase()

            return (
              <TableRow
                key={report.id}
                onClick={() => onOpenReview(report)}
                className="group border-brand-line transition-colors hover:bg-brand-paper/70 cursor-pointer"
              >
                <TableCell className="py-3.5 pl-5 pr-3 font-mono text-xs font-bold text-brand-navy">
                  {report.id}
                </TableCell>

                <TableCell className="px-3 py-3.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-bold text-brand-navy transition-colors group-hover:text-brand-blue">
                      {report.outageType}
                    </p>
                    {report.isDuplicate ? (
                      <Badge
                        variant="outline"
                        className="h-auto gap-1 rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800"
                      >
                        <Flag className="size-2.5" aria-hidden="true" />
                        Duplicate
                      </Badge>
                    ) : detectedClusters.some((c) => c.duplicateIds?.includes(report.id)) ? (
                      <Badge
                        variant="outline"
                        className="h-auto gap-1 rounded-full border-amber-300 bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-amber-900 animate-in fade-in"
                        title="AI detected this report as a potential duplicate"
                      >
                        <Sparkles className="size-2.5 text-amber-700" aria-hidden="true" />
                        AI Duplicate
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell className="px-3">
                  <ReportPriorityBadge priority={report.priority} />
                </TableCell>

                <TableCell className="px-3 text-sm font-medium text-brand-ink">
                  <span
                    className="block max-w-[18ch] truncate"
                    title={report.residentName || undefined}
                  >
                    {report.residentName || 'Unknown'}
                  </span>
                </TableCell>

                <TableCell className="px-3 text-sm font-semibold text-brand-ink">
                  {report.barangay ? `Brgy. ${report.barangay}` : '—'}
                </TableCell>

                <TableCell className="px-3 text-xs font-medium tabular-nums text-brand-muted">
                  {report.startedTime || report.date || '—'}
                </TableCell>

                <TableCell className="px-3">
                  <ReportStatusBadge tone={report.tone} status={report.status} />
                </TableCell>

                <TableCell className="hidden px-3 md:table-cell">
                  {report.assignedTeamId && teamNames[report.assignedTeamId] ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-brand-blue"
                      title={teamNames[report.assignedTeamId]}
                    >
                      {teamNames[report.assignedTeamId]}
                    </span>
                  ) : assignedName ? (
                    <span className="block max-w-[18ch] truncate text-sm font-semibold text-brand-ink" title={assignedName}>
                      {assignedName}
                    </span>
                  ) : rowStatusKey === 'verified' ? (
                    <Badge
                      variant="outline"
                      className="h-auto rounded-full border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800"
                    >
                      Needs dispatch
                    </Badge>
                  ) : (
                    <span className="text-xs font-medium text-brand-muted">
                      Unassigned
                    </span>
                  )}
                </TableCell>

                <TableCell
                  className="pl-3 pr-5 text-right"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenReview(report)}
                    className="h-8 gap-1 rounded-lg border-brand-line bg-white px-3 text-xs font-bold text-brand-navy shadow-2xs hover:border-brand-blue hover:bg-[#e5e9f6] hover:text-brand-blue cursor-pointer"
                  >
                    <span>Review</span>
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
      </TableBody>
    </Table>
  )
}
