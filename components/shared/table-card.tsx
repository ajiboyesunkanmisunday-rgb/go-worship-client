'use client';

import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
 * Wraps an existing <table> and gives its toolbar real behaviour:
 * live search (row filtering), a working filter dropdown and a
 * CSV export generated from the rendered table.
 */
export function TableCard({
  title,
  filterOptions,
  filterAll = 'All',
  filterByRow = true,
  children,
}: {
  title: string;
  filterOptions?: string[];
  filterAll?: string;
  /**
   * When true (default) the dropdown filters rows by matching their text.
   * Set false for a decorative dropdown that only displays a selection — e.g.
   * the design's date-range picker or a "sort by" column selector, where the
   * options don't correspond to row content and Search is the real filter.
   */
  filterByRow?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(filterAll);

  // Filter rows by matching their text content.
  useEffect(() => {
    const table = ref.current?.querySelector('table');
    if (!table) return;
    const filterTerm =
      filterByRow && filter !== filterAll ? filter.toLowerCase() : '';
    const terms = [query.trim().toLowerCase(), filterTerm].filter(Boolean);
    let shown = 0;
    table.querySelectorAll('tbody tr').forEach((tr) => {
      const text = (tr.textContent ?? '').toLowerCase();
      const match = terms.every((t) => text.includes(t));
      (tr as HTMLElement).style.display = match ? '' : 'none';
      if (match) shown += 1;
    });
    const empty = ref.current?.querySelector<HTMLElement>('[data-empty]');
    if (empty) empty.style.display = shown === 0 ? '' : 'none';
  }, [query, filter, filterAll, filterByRow]);

  const exportCsv = () => {
    const table = ref.current?.querySelector('table');
    if (!table) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines: string[] = [];
    const head = [...table.querySelectorAll('thead th')].map((th) =>
      esc((th.textContent ?? '').trim())
    );
    lines.push(head.join(','));
    table.querySelectorAll('tbody tr').forEach((tr) => {
      if ((tr as HTMLElement).style.display === 'none') return;
      const cells = [...tr.querySelectorAll('td')].map((td) =>
        esc((td.textContent ?? '').trim())
      );
      lines.push(cells.join(','));
    });
    download(`${title.toLowerCase().replace(/\s+/g, '-')}.csv`, lines.join('\n'));
  };

  return (
    <div ref={ref} className="rounded-[14px] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[20px] font-bold text-brand-blue">{title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-9 items-center gap-2 rounded-[6px] border-[0.5px] border-[#cdcdcd] px-3">
            <Search className="size-3.5 shrink-0 text-brand-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-[100px] bg-transparent text-[12px] outline-none placeholder:text-brand-gray-500"
            />
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="h-9 rounded-[6px] border-[0.3px] border-brand-blue bg-[#e9f0ff] px-4 text-[12px] font-medium text-brand-blue transition-colors hover:bg-[#dbe7ff]"
          >
            Export CSV
          </button>
          {filterOptions && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
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

      <div className="mt-4 overflow-x-auto">{children}</div>

      <p
        data-empty
        style={{ display: 'none' }}
        className="py-10 text-center text-[13px] text-brand-gray-500"
      >
        No results found
      </p>

      <div className="mt-6 flex justify-center">
        <span className="flex size-8 items-center justify-center rounded-[8px] bg-brand-blue text-[14px] text-white">
          1
        </span>
      </div>
    </div>
  );
}
