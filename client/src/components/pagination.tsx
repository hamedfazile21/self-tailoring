import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Popover from './popover'
import { useTranslation } from 'react-i18next'

type PaginationVariant = 'primary' | 'outline'
type PaginationRounded = 'md' | 'full'
type PaginationSize = 'sm' | 'md' | 'lg'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** How many page numbers to show on each side of the current page */
  siblingCount?: number
  className?: string
  perPage?: number
  setPerPage?: (page: number) => void
  /** 'primary' (default) = active page is a solid fill. 'outline' = every
   * button gets a border; the active page gets a colored border + soft fill
   * instead of going solid. */
  variant?: PaginationVariant
  /** 'md' (default) = rounded-md corners. 'full' = fully rounded/pill buttons. */
  rounded?: PaginationRounded
  /** Button, label and icon scale. 'md' (default) keeps the original sizing;
   * 'sm' is for tight spots like a dashboard card. */
  size?: PaginationSize
  /** Joins Prev/page numbers/Next into one connected strip (collapsed
   * borders, rounding only on the outer edges) instead of separately
   * spaced buttons. The "..." ellipsis breaks the join, since it isn't
   * a real button — grouping only applies between genuinely adjacent
   * buttons on either side of it. */
  grouped?: boolean
}

const DOTS = '...'

/** One row per size so the button box, type scale and icons stay in step. */
const SIZES = {
  sm: {
    box: 'size-7',
    text: 'text-xs',
    gap: 'gap-x-0.5',
    pad: 'px-2 py-1',
    icon: 14,
    chevron: 14,
  },
  md: {
    box: 'size-8',
    text: 'text-sm',
    gap: 'gap-x-1',
    pad: 'px-3 py-2',
    icon: 16,
    chevron: 18,
  },
  lg: {
    box: 'size-10',
    text: 'text-base',
    gap: 'gap-x-1.5',
    pad: 'px-4 py-2.5',
    icon: 18,
    chevron: 20,
  },
} as const

function getPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
) {
  const totalVisible = siblingCount * 2 + 5

  if (totalPages <= totalVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages)

  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < totalPages - 1

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => i + 1,
    )
    return [...leftRange, DOTS, totalPages]
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => totalPages - (3 + siblingCount * 2) + i + 1,
    )
    return [1, DOTS, ...rightRange]
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i,
  )
  return [1, DOTS, ...middleRange, DOTS, totalPages]
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  perPage,
  setPerPage,
  className = '',
  variant = 'primary',
  rounded = 'md',
  size = 'md',
  grouped = false,
}: PaginationProps) {
  const { t } = useTranslation()
  const pages = getPageRange(currentPage, totalPages, siblingCount)
  const scale = SIZES[size]

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange(page)
  }

  const cornerClass = rounded === 'full' ? 'rounded-full' : 'rounded-md'
  const roundLeft = rounded === 'full' ? 'rounded-l-full' : 'rounded-l-md'
  const roundRight = rounded === 'full' ? 'rounded-r-full' : 'rounded-r-md'

  /** Whether this button should collapse its border against the item
   * immediately before it in the actual rendered order. False right
   * after a DOTS span, since there's no bordered neighbor to merge with. */
  const shouldCollapseLeft = (index: number) => {
    if (!grouped) return false
    if (index === 0) return true // collapse against the Prev button
    return pages[index - 1] !== DOTS
  }

  const groupedButtonClasses = (index: number, isActive: boolean) => {
    if (!grouped) return ''

    const collapse = shouldCollapseLeft(index) ? '-ml-px' : ''
    // Page-number buttons are never the outermost element — Prev/Next
    // always occupy those slots and round themselves separately (see
    // their own className below) — so every page button stays square.
    const corner = 'rounded-none'

    return `${collapse} ${corner} ${isActive ? 'z-10' : 'hover:z-10 focus-visible:z-10'}`.trim()
  }

  const pageButtonBase = grouped
    ? `flex ${scale.box} items-center justify-center border ${scale.text} transition-colors duration-150`
    : `flex ${scale.box} items-center justify-center ${cornerClass} ${scale.text} transition-colors duration-150`

  const activeClasses =
    variant === 'outline'
      ? 'border-primary bg-primary/10 text-primary'
      : grouped
        ? 'border-primary bg-primary text-primary-foreground'
        : 'bg-primary text-primary-foreground'

  const inactiveClasses =
    variant === 'outline' || grouped
      ? 'border-borderColor text-foreground hover:bg-surface-hover'
      : 'text-foreground hover:bg-surface-hover'

  const arrowBase = `flex ${scale.box} items-center justify-center border border-borderColor text-muted
    transition-colors duration-150
    hover:bg-surface-hover hover:text-foreground
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
    disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`

  return (
    <div className="flex w-full items-center justify-between">
      {perPage && setPerPage && (
        <div className="flex w-fit items-center gap-x-2">
          <Popover
            className="w-25 p-1!"
            closeOn="outside"
            trigger={
              <button
                type="button"
                aria-label="Toggle columns"
                className={`flex items-center gap-x-1.5 rounded-md border border-borderColor ${scale.pad} ${scale.text} font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground`}
              >
                {perPage}
                <ChevronDown size={scale.chevron} />
              </button>
            }
            placement="bottom-start"
          >
            <div className="flex flex-col gap-y-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const pageSize = (index + 1) * 10
                return (
                  <button
                    key={index}
                    onClick={() => setPerPage(pageSize)}
                    className={`flex w-full items-center justify-between rounded-md p-2 text-start ${scale.text} text-foreground hover:bg-surface-hover`}
                  >
                    {pageSize}
                    {perPage === pageSize && (
                      <span>
                        <Check size={scale.chevron} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </Popover>
          <span className={`${scale.text} font-medium text-foreground`}>
            {t('Rows per page')}
          </span>
        </div>
      )}

      <nav
        aria-label="Pagination"
        className={`flex items-center ${grouped ? '' : scale.gap} ${className}`}
      >
        <span className={`${scale.text} font-medium text-foreground me-2`}>
          {t('Page')} {currentPage} {t('of')} {totalPages}
        </span>

        <button
          type="button"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className={`${arrowBase} rtl:rotate-180 ${grouped ? roundLeft : cornerClass}`}
        >
          <ChevronLeft size={scale.icon} />
        </button>

        {pages.map((page, index) =>
          page === DOTS ? (
            <span
              key={`dots-${index}`}
              className={`flex ${scale.box} items-center justify-center ${scale.text} text-muted`}
            >
              {DOTS}
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => goTo(page as number)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`${pageButtonBase} ${
                page === currentPage ? activeClasses : inactiveClasses
              } ${groupedButtonClasses(index, page === currentPage)}`}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className={`${arrowBase} rtl:rotate-180 ${
            grouped ? `${roundRight} -ml-px` : cornerClass
          }`}
        >
          <ChevronRight size={scale.icon} />
        </button>
      </nav>
    </div>
  )
}

export default Pagination
