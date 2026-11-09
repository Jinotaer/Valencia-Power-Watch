import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
  currentPage,
  page = 1,
  totalItems,
  total = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100, 200],
  className = '',
}) {
  const resolvedPage = currentPage ?? page
  const resolvedTotal = totalItems ?? total

  const totalPages = Math.max(1, Math.ceil(resolvedTotal / pageSize))
  const safePage = Math.min(Math.max(1, resolvedPage), totalPages)

  const startItem = resolvedTotal === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endItem = Math.min(resolvedTotal, safePage * pageSize)

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (safePage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (safePage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }
    return [1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages]
  }

  const pages = getPageNumbers()

  return (
    <div
      className={`flex flex-col gap-3 border-t border-slate-200/80 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
      aria-label="Table pagination"
    >
      {/* Result summary and page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>
          Showing{' '}
          <span className="font-semibold tabular-nums text-brand-ink">{startItem}</span> to{' '}
          <span className="font-semibold tabular-nums text-brand-ink">{endItem}</span> of{' '}
          <span className="font-semibold tabular-nums text-brand-ink">{resolvedTotal}</span>{' '}
          results
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
            <span className="text-slate-500">Show</span>
            <select
              aria-label="Items per page"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPageChange(1)
              }}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-slate-500">per page</span>
          </div>
        )}
      </div>

      {/* Page navigation buttons */}
      <div className="flex items-center gap-1 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            typeof p === 'number' ? (
              <button
                key={i}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === safePage ? 'page' : undefined}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                  p === safePage
                    ? 'bg-brand-navy text-white'
                    : 'border border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ) : (
              <span
                key={i}
                className="px-1 text-xs text-slate-500 select-none"
              >
                …
              </span>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
