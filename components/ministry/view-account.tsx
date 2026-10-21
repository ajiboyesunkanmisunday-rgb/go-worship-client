'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetPage } from '@/components/ui/sheet-page';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { cn } from '@/lib/utils';
import { ArrowLeft, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { USE_LIVE_API } from '@/lib/api/config';

const PERMS = ['View', 'Create', 'Edit', 'Delete', 'Export'];

const DEFAULT_MATRIX: [string, boolean[]][] = [
  ['Members', [true, false, false, false, false]],
  ['Finance', [true, true, true, true, true]],
  ['Events', [false, true, false, true, false]],
  ['Groups', [true, false, true, false, false]],
  ['Check in', [true, true, false, false, false]],
  ['Transactions', [true, false, true, false, false]],
  ['Analytics', [true, true, false, false, false]],
  ['Settings', [false, true, false, true, false]],
  ['Billing', [true, false, false, false, false]],
  ['Support', [true, false, false, false, false]],
];

type AccountData = {
  name: string; email: string; status: string;
  lastUpdated: string; createdBy: string; createdOn: string;
  lastEdited: string; assignedUsers: string;
  matrix: [string, boolean[]][];
};

const DEFAULT_ACCOUNT: AccountData = {
  name: 'Mayowa Ola', email: 'mayowa@sellyt.ai', status: 'Active',
  lastUpdated: '2025-09-01', createdBy: 'Super Admin',
  createdOn: '10.08.25 | 10:30pm', lastEdited: '10.08.25 | 10:30pm',
  assignedUsers: '45', matrix: DEFAULT_MATRIX,
};

function SectionBar({ label }: { label: string }) {
  return (
    <div className="rounded-[6px] bg-[#eef3ff] px-3 py-2 text-[13px] font-semibold text-brand-blue">
      {label}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      <Input readOnly value={value} className="h-[46px] text-brand-gray-500" />
    </div>
  );
}

/** Admin Management → View Account (Figma 640:34210). */
export function ViewAccount({ id }: { id?: string } = {}) {
  const router = useRouter();
  const back = '/ministry/admin-management';
  const [del, setDel] = useState(false);
  const [account, setAccount] = useState<AccountData>(USE_LIVE_API ? { name: '', email: '', status: '', lastUpdated: '', createdBy: '', createdOn: '', lastEdited: '', assignedUsers: '0', matrix: [] } : DEFAULT_ACCOUNT);

  useEffect(() => {
    if (!USE_LIVE_API || !id) return;
    // /tenant/admin/sub-admins/:id not in backend API — no per-user GET endpoint for tenant admin users.
  }, [id]);

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="Sub Admin account"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <button
          type="button"
          onClick={() => router.push(back)}
          aria-label="Go back"
          className="w-fit text-black transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold">Sub Admin</h1>
            <div className="mt-2 flex flex-col gap-1 text-[12px] text-brand-gray-500">
              <p>Last Updated: <span className="text-[#333]">{account.lastUpdated}</span></p>
              <p>Status: <span className="font-medium text-[#22a45d]">{account.status}</span></p>
              <p>Created by: <span className="text-[#333]">{account.createdBy}</span></p>
              <p>Created on: <span className="text-[#333]">{account.createdOn}</span></p>
              <p>Last Edited: <span className="text-[#333]">{account.lastEdited}</span></p>
              <p>Assigned users: <span className="text-[#333]">{account.assignedUsers}</span></p>
            </div>
          </div>
          <span className="flex size-[64px] shrink-0 items-center justify-center rounded-full bg-[#ff8d28]">
            <UserRound className="size-8 text-white" />
          </span>
        </div>

        <SectionBar label="Account Info:" />
        <div className="flex flex-col gap-4">
          <Field label="Sub Admin name" value={account.name} />
          <Field label="Password" value={USE_LIVE_API ? '••••••••' : 'Admin@sellyt001'} />
          <Field label="Email" value={account.email} />
        </div>

        <SectionBar label="Permissions Matrix:" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr className="text-left text-[12px] text-[#333]">
                <th className="py-2 font-medium">Module</th>
                {PERMS.map((p) => (
                  <th key={p} className="py-2 text-center font-medium">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {account.matrix.map(([mod, flags]) => (
                <tr key={mod} className="border-t border-[#f2f2f2]">
                  <td className="py-2.5 text-[12px] text-[#333]">{mod}</td>
                  {flags.map((on, i) => (
                    <td key={i} className="py-2.5 text-center">
                      <span
                        className={cn(
                          'inline-block size-4 rounded-[3px]',
                          on ? 'bg-[#ff8d28]' : 'bg-[#e2e2e2]'
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[52px] w-full"
            onClick={() => setDel(true)}
          >
            Delete account
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(back)}>
              Edit account
            </button>
          </Button>
        </div>

        <ConfirmModal
          open={del}
          onOpenChange={setDel}
          onConfirm={() => {
            setDel(false);
            router.push(back);
          }}
        />
      </div>
    </SheetPage>
  );
}
