'use client';

import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export type SmartRow = {
  /** Rendered cells. */
  cells: React.ReactNode[];
  /** Plain-text version of the row, used for search + CSV export. */
  text: string[];
  /** Optional value used by the filter dropdown. */
  group?: string;
};

function toCsv(headers: string[], rows: SmartRow[]) {
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  return [
    headers.map(esc).join(','),
    ...rows.map((r) => r.text.map(esc).join(',')),
  ].join('\n');
}

function download(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Table panel with WORKING controls: live search, filter dropdown,
 * Export CSV (real download), Newest/Oldest sort and pagination.
 */
export function SmartTable({
  title,
  headers,
  rows,
  filterOptions,
  filterAll = 'All',
  filterByGroup = true,
  showSearch = true,
  showExport = true,
  exportLabel = 'Export CSV',
  sortToggle = false,
  pageSize = 8,
  headerRowClassName,
  className,
  emptyNode,
}: {
  title?: string;
  headers: string[];
  rows: SmartRow[];
  filterOptions?: string[];
  filterAll?: string;
  emptyNode?: React.ReactNode;
  /**
   * When true (default) the dropdown filters rows by `group`. Set false for a
   * decorative dropdown that only displays a selection — e.g. the design's
   * date-range picker (Today / Last 7 days / …), where Search is the real
   * filter. Mirrors the behaviour of the DataTable date-range control.
   */
  filterByGroup?: boolean;
  showSearch?: boolean;
  /** Hide the Export CSV button — e.g. the dashboard's compact Transactions
   * panel, whose design shows only a Newest/Oldest toggle. */
  showExport?: boolean;
  exportLabel?: string;
  sortToggle?: boolean;
  pageSize?: number;
  headerRowClassName?: string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(filterAll);
  const [newest, setNewest] = useState(true);
  const [page, setPage] = useState(0);

  const visible = useMemo(() => {
    let out = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((r) => r.text.join(' ').toLowerCase().includes(q));
    }
    if (filterByGroup && filterOptions && filter !== filterAll) {
      out = out.filter((r) => r.group === filter);
    }
    if (sortToggle && !newest) out = [...out].reverse();
    return out;
  }, [rows, query, filter, newest, filterOptions, filterAll, filterByGroup, sortToggle]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div className={cn('rounded-[14px] bg-white p-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {title && (
          <h2 className="text-[20px] font-bold text-brand-blue">{title}</h2>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {sortToggle && (
            <div className="flex items-center gap-1 rounded-full bg-[#f2f2f2] p-1 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setNewest(true);
                  setPage(0);
                }}
                className={cn(
                  'rounded-full px-3 py-1',
                  newest ? 'bg-black text-white' : 'text-brand-gray-500'
                )}
              >
                Newest
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewest(false);
                  setPage(0);
                }}
                className={cn(
                  'rounded-full px-3 py-1',
                  !newest ? 'bg-black text-white' : 'text-brand-gray-500'
                )}
              >
                Oldest
              </button>
            </div>
          )}

          {showSearch && (
            <div className="flex h-9 items-center gap-2 rounded-[6px] border-[0.5px] border-[#cdcdcd] px-3">
              <Search className="size-3.5 shrink-0 text-brand-gray-500" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search"
                className="w-[110px] bg-transparent text-[12px] outline-none placeholder:text-brand-gray-500"
              />
            </div>
          )}

          {showExport && (
            <button
              type="button"
              onClick={() =>
                download(
                  `${(title ?? 'export').toLowerCase().replace(/\s+/g, '-')}.csv`,
                  toCsv(headers, visible)
                )
              }
              className="h-9 rounded-[6px] border-[0.3px] border-brand-blue bg-[#e9f0ff] px-4 text-[12px] font-medium text-brand-blue transition-colors hover:bg-[#dbe7ff]"
            >
              {exportLabel}
            </button>
          )}

          {filterOptions && (
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(0);
              }}
              className="h-9 rounded-[6px] border-[0.3px] border-brand-blue px-3 text-[12px] font-medium text-brand-blue outline-none"
            >
              <option value={filterAll}>{filterAll}</option>
              {filterOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr
              className={cn(
                'text-left text-[13px] text-[#333]',
                headerRowClassName
              )}
            >
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-3 py-3 font-medium first:rounded-l-[8px] last:rounded-r-[8px]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={i} className="border-t border-[#f2f2f2] text-[12px]">
                {r.cells.map((c, j) => (
                  <td key={j} className="px-3 py-4">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={headers.length}>
                  {emptyNode ?? (
                    <p className="py-10 text-center text-[13px] text-brand-gray-500">
                      No results found
                    </p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-[8px] bg-brand-blue text-[13px] text-white">
          {current + 1}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={current === 0}
          aria-label="Previous page"
          className="flex size-8 items-center justify-center rounded-[8px] bg-[#eef1f6] text-brand-gray-500 disabled:opacity-40"
        >
          &lsaquo;
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={current >= pageCount - 1}
          aria-label="Next page"
          className="flex size-8 items-center justify-center rounded-[8px] bg-[#eef1f6] text-brand-gray-500 disabled:opacity-40"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
}
