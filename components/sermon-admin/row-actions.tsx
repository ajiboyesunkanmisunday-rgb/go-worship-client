'use client';

import { ConfirmModal } from '@/components/shared/confirm-modal';
import Link from 'next/link';
import { useState } from 'react';

/** Edit | Delete row actions with the 😉 confirm on delete (Figma 154:13998). */
export function EditDeleteActions({ editHref }: { editHref: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="flex items-center gap-4 text-[12px]">
      <Link href={editHref} className="font-medium text-[#333] no-underline">
        Edit
      </Link>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-medium text-[#eb0000]"
      >
        Delete
      </button>
      <ConfirmModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => setOpen(false)}
      />
    </span>
  );
}
