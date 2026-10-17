'use client';

import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Portal top-bar search. Filters the rows of whatever table is on the current
 * page (and hides cards that don't match), so the control actually does
 * something rather than just accepting text.
 */
export function TopbarSearch({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const touched = useRef(false);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q) touched.current = true;
    if (!touched.current) return;

    const rows = document.querySelectorAll<HTMLElement>('tbody tr');
    rows.forEach((tr) => {
      const text = (tr.textContent ?? '').toLowerCase();
      tr.style.display = !q || text.includes(q) ? '' : 'none';
    });

    return () => {
      rows.forEach((tr) => {
        tr.style.display = '';
      });
    };
  }, [query]);

  const dark = tone === 'dark';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4',
        dark
          ? 'h-[40px] w-full max-w-[320px] rounded-full bg-white/10'
          : 'h-[42px] w-full max-w-[300px] rounded-[8px] bg-[#f4f7ff]',
        className
      )}
    >
      <Search
        className={cn(
          'size-[17px] shrink-0',
          dark ? 'text-white/60' : 'text-brand-gray-500'
        )}
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        className={cn(
          'w-full bg-transparent text-[13px] outline-none',
          dark
            ? 'text-white placeholder:text-white/60'
            : 'placeholder:text-brand-gray-500'
        )}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          aria-label="Clear search"
          className={cn(
            'shrink-0 transition-opacity hover:opacity-70',
            dark ? 'text-white/70' : 'text-brand-gray-500'
          )}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
