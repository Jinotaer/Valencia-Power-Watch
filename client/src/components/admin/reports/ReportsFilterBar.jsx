import { FilterX, Search, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'

const statusFilters = [
  { value: 'All', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Flagged duplicates', label: 'Flagged duplicates' },
]

export function ReportsFilterBar({
  query,
  onQueryChange,
  barangayFilter,
  onBarangayChange,
  barangayOptions,
  priorityFilter,
  onPriorityChange,
  filter,
  onFilterChange,
  counts,
  hasActiveFilters,
  onClearFilters,
  visibleCount,
  totalCount,
}) {
  return (
    <div className="border-b border-brand-line p-4 space-y-2.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-muted"
            aria-hidden="true"
          />
          <label htmlFor="report-search" className="sr-only">
            Search reports
          </label>
          <Input
            id="report-search"
            type="text"
            placeholder="Search by ID, barangay, resident, type, or crew…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-10 w-full rounded-xl border-brand-line bg-white pl-9 pr-9 text-xs font-medium text-brand-ink placeholder:text-brand-muted focus-visible:border-brand-line focus-visible:ring-0 sm:text-sm"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onQueryChange('')}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full text-brand-muted hover:bg-brand-line/50 hover:text-brand-ink cursor-pointer"
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            aria-label="Filter by status"
            className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
          >
            {statusFilters.map((option) => {
              const count = counts?.[option.value]
              return (
                <option key={option.value} value={option.value}>
                  {typeof count === 'number' ? `${option.label} (${count})` : option.label}
                </option>
              )
            })}
          </select>

          <select
            value={barangayFilter}
            onChange={(event) => onBarangayChange(event.target.value)}
            aria-label="Filter by barangay"
            className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
          >
            {barangayOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All barangays' : `Brgy. ${option}`}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => onPriorityChange(event.target.value)}
            aria-label="Filter by priority"
            className="h-10 rounded-xl border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
          >
            <option value="All">All priorities</option>
            <option value="high">Urgent / High</option>
            <option value="medium">Moderate / Medium</option>
            <option value="low">Minor / Low</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs text-brand-muted">
          <span className="tabular-nums">
            Showing <strong className="text-brand-navy">{visibleCount ?? 0}</strong> of{' '}
            <strong className="text-brand-navy">{totalCount ?? 0}</strong> reports
          </span>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 font-semibold text-brand-blue hover:underline cursor-pointer"
            >
              <FilterX className="size-3.5" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
