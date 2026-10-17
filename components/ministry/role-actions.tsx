'use client';

import { ConfirmModal } from '@/components/shared/confirm-modal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Edit / Delete / View actions for the Admin Management roles table. */
export function RoleActions({ id = '', onDelete }: { id?: number | string; onDelete?: () => void }) {
  const router = useRouter();
  const [del, setDel] = useState(false);

  return (
    <>
      <Link
        href={`/ministry/admin-management/${id}`}
        className="font-medium text-brand-blue no-underline"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={() => setDel(true)}
        className="font-medium text-[#eb0000]"
      >
        Delete
      </button>
      <Link
        href={`/ministry/admin-management/${id}`}
        className="font-medium text-brand-gray-500 no-underline"
      >
        View
      </Link>

      <ConfirmModal
        open={del}
        onOpenChange={setDel}
        onConfirm={() => {
          setDel(false);
          if (onDelete) {
            onDelete();
          } else {
            router.refresh();
          }
        }}
      />
    </>
  );
}
