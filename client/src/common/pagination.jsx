import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

export function Pagination({
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = '',
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const firstIndex = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastIndex = Math.min(page * pageSize, total)

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    }
    if (page <= 3) {
      return [1, 2, 3, '...', pageCount]
    }
    if (page >= pageCount - 2) {
      return [1, '...', pageCount - 2, pageCount - 1, pageCount]
    }
    return [1, '...', page, '...', pageCount]
  }

  return (
    <div
      className={`flex flex-col gap-4 px-5 py-4 text-xs text-brand-muted sm:flex-row sm:items-center sm:justify-between border-t border-brand-line ${className}`}
    >
      {/* Results Counter: "Showing 1 to 1 of 1 results" */}
      <p className="text-xs text-brand-muted">
        Showing <strong className="font-semibold text-brand-ink">{firstIndex}</strong> to{' '}
        <strong className="font-semibold text-brand-ink">{lastIndex}</strong> of{' '}
        <strong className="font-semibold text-brand-ink">{total}</strong> results
      </p>

      {/* Controls Container */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Page Size Selector: "Show [ 10 v ] per page" */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <span>Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger
                size="sm"
                className="h-8 min-w-[70px] rounded-lg border-brand-line bg-white text-xs font-semibold text-brand-ink shadow-xs focus:ring-brand-navy/20"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        )}

        {/* Page Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="h-8 w-8 rounded-lg border-brand-line text-brand-muted disabled:opacity-40 hover:bg-brand-paper hover:text-brand-ink cursor-pointer"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {getPageNumbers().map((item, index) =>
            item === '...' ? (
              <span key={`dots-${index}`} className="px-2 text-xs text-brand-muted">
                ...
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? 'default' : 'ghost'}
                size="icon-sm"
                className={`h-8 w-8 rounded-lg text-xs font-semibold cursor-pointer ${
                  item === page
                    ? 'bg-brand-navy text-white hover:bg-brand-navy'
                    : 'text-brand-muted hover:bg-[#e5e9f6]'
                }`}
                onClick={() => onPageChange(Number(item))}
                aria-label={`Go to page ${item}`}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon-sm"
            className="h-8 w-8 rounded-lg border-brand-line text-brand-muted disabled:opacity-40 hover:bg-brand-paper hover:text-brand-ink cursor-pointer"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Pagination
