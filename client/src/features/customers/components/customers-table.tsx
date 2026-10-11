import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { PaginationState, Updater } from '@tanstack/react-table'
import { customersColumns } from './customers-column'
import TableToolbar from './table-toolbar'
import Pagination from '#/components/pagination'
import { fetchCustomers } from '../slice/customers-action'

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
      //   rowSelection,
      //   globalFilter,
      //   sorting,
      //   columnVisibility,
      //   columnFilters,
    },
    enableRowSelection: true,
    // onRowSelectionChange: setRowSelection,
    defaultColumn: {
      minSize: 0,
      size: 0,
    },
    // search
    // onGlobalFilterChange: setGlobalFilter,
    // globalFilterFn: (row, _columnId, filterValue) => {
    //   const search = String(filterValue).toLowerCase()
    //   return Object.keys(row.original as object).some((key) => {
    //     const value = row.getValue(key)
    //     return value != null && String(value).toLowerCase().includes(search)
    //   })
    // },
    // getFilteredRowModel: getFilteredRowModel(),

    // // sorting
    // onSortingChange: setSorting,
    // getSortedRowModel: getSortedRowModel(),

    // //visible
    // onColumnVisibilityChange: setColumnVisibility,
    // onColumnFiltersChange: setColumnFilters,
  })

  return (
    <div>
      <TableToolbar />
      <div className="table-wrapper">
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
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllColumns().length}>
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
