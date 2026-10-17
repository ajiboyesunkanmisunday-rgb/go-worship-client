'use client';

import { ConfirmModal } from '@/components/shared/confirm-modal';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ITEMS = [
  { key: 'view', label: 'View details' },
  { key: 'edit', label: 'Edit User' },
  { key: 'reset', label: 'Reset Password' },
  { key: 'deactivate', label: 'Deactivate', danger: true },
];

/** Row "⋯" menu on Platform Users (System board). */
export function UserRowMenu() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Row actions"
        onClick={() => setOpen((v) => !v)}
        className="flex size-7 items-center justify-center rounded-[6px] text-brand-gray-500 transition-colors hover:bg-[#f2f2f2]"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+4px)] z-40 w-[160px] rounded-[10px] border border-[#ededed] bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.14)]"
        >
          {ITEMS.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                if (it.key === 'deactivate') setConfirm(true);
              }}
              className={cn(
                'block w-full rounded-[6px] px-3 py-2 text-left text-[12px] transition-colors hover:bg-[#f4f7ff]',
                it.danger ? 'text-[#eb0000]' : 'text-[#333]'
              )}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirm}
        onOpenChange={setConfirm}
        onConfirm={() => setConfirm(false)}
      />
    </div>
  );
}
