'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetPage } from '@/components/ui/sheet-page';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { cn } from '@/lib/utils';
import { ArrowLeft, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const META = [
  ['Last Updated', '2025-09-01'],
  ['Created by', 'Super Admin'],
  ['Created on', '10.08.25 | 10:30pm'],
  ['Last Edited', '10.08.25 | 10:30pm'],
  ['Assigned users', '45'],
];

const PERMS = ['View', 'Create', 'Edit', 'Delete', 'Export'];

/** [module, [view, create, edit, delete, export]] */
// Sample permission pattern transcribed from the design (640:34210), read
// column by column. NOTE: the design lists "Settings" TWICE (once here with
// [Create, Delete] and again lower down with [View] only) — that's a design
// duplication, so this keeps a single Settings row rather than copying the bug.
const MATRIX: [string, boolean[]][] = [
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
export function ViewAccount() {
  const router = useRouter();
  const back = '/ministry/admin-management';
  const [del, setDel] = useState(false);

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
              <p>
                Last Updated: <span className="text-[#333]">2025-09-01</span>
              </p>
              <p>
                Status:{' '}
                <span className="font-medium text-[#22a45d]">Active</span>
              </p>
              {META.slice(1).map(([k, v]) => (
                <p key={k}>
                  {k}: <span className="text-[#333]">{v}</span>
                </p>
              ))}
            </div>
          </div>
          <span className="flex size-[64px] shrink-0 items-center justify-center rounded-full bg-[#ff8d28]">
            <UserRound className="size-8 text-white" />
          </span>
        </div>

        <SectionBar label="Account Info:" />
        <div className="flex flex-col gap-4">
          <Field label="Sub Admin name" value="Mayowa Ola" />
          <Field label="Password" value="Admin@sellyt001" />
          <Field label="Email" value="mayowa@sellyt.ai" />
        </div>

        <SectionBar label="Permissions Matrix:" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr className="text-left text-[12px] text-[#333]">
                <th className="py-2 font-medium">Module</th>
                {PERMS.map((p) => (
                  <th key={p} className="py-2 text-center font-medium">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map(([mod, flags]) => (
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
