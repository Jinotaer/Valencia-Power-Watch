import { FilterX, Search, X } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'

const statusFilters = [
  'All',
  'Pending',
  'Verified',
  'Resolved',
  'Rejected',
  'Flagged duplicates',
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
    <div className="space-y-3 border-b border-brand-line p-4">
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
            placeholder="Search by ID, barangay, resident, type, or staff…"
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

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={onClearFilters}
              className="h-10 gap-1.5 rounded-xl border-brand-line bg-brand-paper px-3 text-xs font-bold text-brand-navy hover:bg-[#e5e9f6] cursor-pointer"
            >
              <FilterX className="size-3.5 text-brand-blue" aria-hidden="true" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div
          role="tablist"
          aria-label="Filter reports by status"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
        >
          {statusFilters.map((option) => {
            const active = filter === option
            const pillCount = counts[option] ?? 0
            return (
              <Button
                key={option}
                type="button"
                role="tab"
                aria-selected={active}
                variant={active ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange(option)}
                className={`h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-brand-navy text-white hover:bg-brand-navy/90 shadow-2xs'
                    : 'border-brand-line bg-white text-brand-muted hover:bg-brand-paper hover:text-brand-ink'
                }`}
              >
                <span>{option}</span>
                <Badge
                  variant="secondary"
                  className={`h-4 rounded-full px-1.5 py-0 text-[10px] font-bold tabular-nums ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-brand-paper text-brand-muted'
                  }`}
                >
                  {pillCount}
                </Badge>
              </Button>
            )
          })}
        </div>

        <p className="hidden shrink-0 text-xs font-semibold text-brand-muted md:block">
          Showing <span className="font-bold text-brand-navy">{visibleCount}</span> of{' '}
          <span className="font-bold text-brand-navy">{totalCount}</span>
        </p>
      </div>
    </div>
  )
}
