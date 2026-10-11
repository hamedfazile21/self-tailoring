import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { PaginationState, Updater } from '@tanstack/react-table'
import { customersColumns } from './customers-column'
import TableToolbar from './table-toolbar'
import Pagination from '#/components/pagination'
import { fetchCustomers } from '../slice/customers-action'
import { BarLoader } from 'react-spinners'

const CustomersTable = () => {
  const dispatch = useAppDispatch()
  const { list } = useAppSelector((state) => state.customers)

  /**
   * The server owns paging, so the table's own pagination state is a mirror of
   * what came back on the last response — never a second source of truth.
   * TanStack counts from 0, the API from 1.
   */
  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: list.pagination.page - 1,
      pageSize: list.pagination.limit,
    }),
    [list.pagination.page, list.pagination.limit],
  )

  /**
   * Every page/size change lands here — from the pager below or from any
   * `table.setPageIndex()` elsewhere — and turns into one request. The reducer
   * writes `pagination` back from the response, which re-renders this.
   */
  const requestPage = (updater: Updater<PaginationState>) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater

    void dispatch(
      fetchCustomers({ page: next.pageIndex + 1, limit: next.pageSize }),
    )
  }

  const table = useReactTable({
    data: list.data,
    columns: customersColumns,
    getCoreRowModel: getCoreRowModel(),
    // Without this the table would slice the 10 rows it was handed as if they
    // were the whole set; `rowCount` is what makes `getPageCount()` honest.
    manualPagination: true,
    rowCount: list.pagination.total,
    onPaginationChange: requestPage,
    state: {
      pagination,
    },
    enableRowSelection: true,
    defaultColumn: {
      minSize: 0,
      size: 0,
    },
    getSortedRowModel: getSortedRowModel(),
  })

  const columnCount = table.getVisibleLeafColumns().length

  /**
   * Nothing to dim yet — the first load, or a search that cleared the rows.
   * Skeletons stand in for the page so the layout does not collapse and then
   * jump back when the rows arrive.
   */
  const showSkeleton =
    (list.status === 'loading' || list.status === 'idle') &&
    list.data.length === 0

  /** Paging or filtering with rows already on screen: those rows just dim. */
  const refetching = list.status === 'loading' && !showSkeleton

  return (
    <div>
      <TableToolbar table={table} />
      <div className="table-wrapper relative">
        {refetching && (
          <div
            role="status"
            aria-label="Loading customers"
            className="absolute inset-x-0 top-0 z-10"
          >
            <BarLoader color="var(--color-primary)" width="100%" height={2} />
          </div>
        )}
        <table className="w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className="table-header-row" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    style={{
                      width:
                        header.getSize() !== 0 ? header.getSize() : undefined,
                    }}
                    className="table-header-cell"
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* The rows for the page you are leaving stay mounted while the next
              page is in flight, so they dim instead of flashing empty. */}
          <tbody
            aria-busy={list.status === 'loading'}
            className={`transition-opacity ${
              list.status === 'loading' ? 'opacity-50' : 'opacity-100'
            }`}
          >
            {showSkeleton ? (
              // One skeleton per row the page will hold, so the table keeps its
              // height from the first paint to the real data.
              Array.from({ length: list.pagination.limit }, (_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="table-body-row">
                  {Array.from({ length: columnCount }, (_, cellIndex) => (
                    <td key={cellIndex} className="table-body-cell">
                      <div className="h-4 w-full animate-pulse rounded bg-surface-hover" />
                    </td>
                  ))}
                </tr>
              ))
            ) : list.status === 'failed' ? (
              <tr>
                <td colSpan={columnCount}>
                  <div className="table-empty-state">
                    <p>{list.error ?? 'Could not load the customers.'}</p>
                    <button
                      type="button"
                      className="btn btn-secondary-outline btn-sm"
                      onClick={() => void dispatch(fetchCustomers())}
                    >
                      Try again
                    </button>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount}>
                  <div className="table-empty-state">No results found.</div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className="table-body-row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      className="table-body-cell"
                      style={{
                        width:
                          cell.column.getSize() !== 0
                            ? cell.column.getSize()
                            : undefined,
                      }}
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between py-4 px-5 border-t border-borderColor">
          <Pagination
            currentPage={list.pagination.page}
            totalPages={list.pagination.totalPages}
            onPageChange={(page) => table.setPageIndex(page - 1)}
            perPage={list.pagination.limit}
            setPerPage={(limit) => table.setPageSize(limit)}
            siblingCount={0}
          />
        </div>
      </div>
    </div>
  )
}

export default CustomersTable
