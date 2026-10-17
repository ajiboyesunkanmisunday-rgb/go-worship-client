'use client';
import { cn } from '@/lib/utils';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { NoDataPlaceholder } from './no-data-placeholder';
import { Button } from './button';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import {
  Ref,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

type DataTableRef = {
  resetPagination(): void;
};

type Props<Data extends Record<string, unknown>, Value extends keyof Data> = {
  columns: ColumnDef<Data, Value>[];
  data: Data[];
  title?: string;
  noDataMessage?: string;

  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;

  pageCount: number;
  totalItems: number;
  handleRowClick?(data: Data): unknown;

  rowSelection?: Record<string, boolean>;
  setRowSelection?: OnChangeFn<RowSelectionState>;
  enableRowSelection?: boolean | ((row: Row<Data>) => boolean);

  debugTable?: boolean;

  pagination: PaginationState;
  setPagination: OnChangeFn<PaginationState>;

  refetch?(): void;

  /** Hide the search / export / date-range controls in the table header. */
  hideControls?: boolean;

  ref?: Ref<DataTableRef>;
};

const DATE_RANGES = ['Today', 'Last 7 days', '30 days', '1 year'];

export function DataTable<
  Data extends Record<string, unknown>,
  Value extends keyof Data
>({ ref, ...props }: Props<Data, Value>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [dateRange, setDateRange] = useState(DATE_RANGES[0]);

  const pagination = useMemo(
    () => ({
      pageIndex: props.pagination.pageIndex,
      pageSize: props.pagination.pageSize,
    }),
    [props.pagination.pageIndex, props.pagination.pageSize]
  );

  const exportCsv = () => {
    const rows = props.data;
    if (!rows.length) return;
    const keys = Object.keys(rows[0]).filter(
      (k) => typeof rows[0][k] !== 'object'
    );
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      keys.join(','),
      ...rows.map((r) => keys.map((k) => escape(r[k])).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(props.title || 'export').toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useImperativeHandle(
    ref,
    () => ({
      resetPagination() {
        props.setPagination((p) => ({ ...p, pageIndex: 0 }));
      },
    }),
    [props]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    pageCount: props.pageCount,
    state: { pagination, rowSelection: props.rowSelection, globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    enableRowSelection: props.enableRowSelection,
    onRowSelectionChange: props.setRowSelection,
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;
      props.setPagination(newPagination);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    debugTable: props.debugTable,
  });

  const tableRef = useRef(table);
  tableRef.current = table;

  return (
    <div
      className={cn(
        'w-full min-h-[400px] py-10 px-0 lg:px-10 bg-[#FBFBFB] rounded-[8.76px]',
        'overflow-hidden flex flex-col justify-start items-center gap-8'
      )}
    >
      <div className="w-full flex justify-between items-center gap-4 flex-wrap px-6 lg:px-0">
        <h2 className="font-bold leading-[100%] tracking-[0%] md:text-[21px]">
          {props.title || ''}
        </h2>

        {!props.hideControls && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex h-9 items-center gap-2 rounded-[6px] border-[0.5px] border-[#cdcdcd] bg-white px-3">
              <Search className="size-4 shrink-0 text-brand-gray-400" />
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search"
                className="w-[110px] bg-transparent text-[13px] outline-none placeholder:text-brand-gray-400"
              />
            </div>

            <button
              type="button"
              onClick={exportCsv}
              className="h-9 rounded-[6px] border-[0.5px] border-[#cdcdcd] bg-white px-3 text-[13px] font-medium text-[#333] transition-colors hover:bg-[#F4F7FF]"
            >
              Export CSV
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-[6px] border-[0.5px] border-brand-blue bg-white px-3 text-[13px] font-medium text-brand-blue transition-colors hover:bg-brand-blue/5"
                >
                  {dateRange}
                  <ChevronDown className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {DATE_RANGES.map((range) => (
                  <DropdownMenuItem
                    key={range}
                    onClick={() => setDateRange(range)}
                  >
                    {range}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {table.getRowModel().rows?.length === 0 && (
        <NoDataPlaceholder
          message={props.noDataMessage}
          className="max-w-[300px]"
        />
      )}

      {table.getRowModel().rows?.length > 0 && (
        <>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="bg-[#F2F2F2] text-[#232323] font-semibold"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    props.enableRowSelection && row.getIsSelected()
                      ? 'selected'
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="w-full flex justify-center items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="bg-brand-blue/10 rounded-[10px]"
              isDisabled={table.getState().pagination.pageIndex === 0}
              onClick={() => table.setPageIndex(0)}
            >
              <ChevronsLeft className="text-brand-blue" />
              <span className="sr-only">First Page</span>
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              className="bg-brand-blue/10 rounded-[10px]"
              isDisabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="text-brand-blue" />
              <span className="sr-only">Previous Page</span>
            </Button>

            <span className="size-[34px] shrink-0 rounded-[10px] bg-brand-blue text-white flex justify-center items-center">
              {table.getState().pagination.pageIndex + 1}
            </span>

            <Button
              variant="ghost"
              size="icon-sm"
              className="bg-brand-blue/10 rounded-[10px]"
              isDisabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="text-brand-blue" />
              <span className="sr-only">Next Page</span>
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              className="bg-brand-blue/10 rounded-[10px]"
              isDisabled={
                table.getState().pagination.pageIndex ===
                table.getPageCount() - 1
              }
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            >
              <ChevronsRight className="text-brand-blue" />
              <span className="sr-only">Last Page</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function DataTableRowActionDropdown({
  actions,
}: {
  actions: { label: string; onClick(): void; isHidden?: boolean }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-[14px]">Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action, idx) => (
          <DropdownMenuItem
            disabled={action.isHidden}
            key={idx}
            onClick={action.onClick}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
