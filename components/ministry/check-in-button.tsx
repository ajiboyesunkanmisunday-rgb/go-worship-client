'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Search, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { getTenantMembers } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

const DEFAULT_ATTENDEES = [
  'John Christain',
  'Mary Johnson',
  'Isaiah Christian',
  'Michael Thompson',
  'Grace Adeyemi',
  'Daniel Okoro',
];

/**
 * Per-event "Check-in" action + attendee dialog.
 *
 * NOTE: node 458:40388 is the Church Admin *Events page* (the All Events table
 * whose Action column holds this Check-in button) — NOT a design for the
 * dialog itself. The attendee-search + checkbox modal below is built by
 * inference; no dialog frame has been located. Flagged in docs/design-audit.md.
 */
export function CheckInButton({
  eventName,
  highlighted,
}: {
  eventName: string;
  highlighted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [attendees, setAttendees] = useState<string[]>(USE_LIVE_API ? [] : DEFAULT_ATTENDEES);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantMembers().then((members) => {
      const names = members.map((m) => m.name).filter(Boolean);
      if (names.length > 0) setAttendees(names);
    }).catch(() => {});
  }, []);

  const visible = useMemo(
    () =>
      attendees.filter((a) =>
        a.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [query, attendees]
  );

  const toggle = (name: string) =>
    setChecked((c) =>
      c.includes(name) ? c.filter((n) => n !== name) : [...c, name]
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'h-8 w-[70px] rounded-[6px] text-[11px] text-white transition-opacity hover:opacity-90',
          highlighted ? 'bg-brand-blue' : 'bg-brand-gray-300'
        )}
      >
        Check-in
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[90%] max-w-[460px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[16px] bg-white px-7 py-7 data-[state=open]:animate-in data-[state=open]:zoom-in-95">
            <Dialog.Close className="absolute top-5 right-5 text-black transition-opacity hover:opacity-70">
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </Dialog.Close>

            <div>
              <Dialog.Title className="text-[20px] font-bold">
                Check-in
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] text-brand-gray-500">
                {eventName} — mark attendees as present.
              </Dialog.Description>
            </div>

            <div className="flex h-10 items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-3">
              <Search className="size-4 shrink-0 text-brand-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search attendee"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-brand-gray-500"
              />
            </div>

            <ul className="flex max-h-[260px] flex-col gap-1 overflow-y-auto">
              {visible.map((a) => {
                const on = checked.includes(a);
                return (
                  <li key={a}>
                    <button
                      type="button"
                      onClick={() => toggle(a)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2.5 text-left text-[13px] transition-colors',
                        on ? 'bg-[#e7f7ee]' : 'hover:bg-[#f4f7ff]'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="size-7 rounded-full bg-brand-gray-200" />
                        {a}
                      </span>
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border',
                          on
                            ? 'border-[#34a853] bg-[#34a853] text-white'
                            : 'border-[#cdcdcd]'
                        )}
                      >
                        {on && <Check className="size-3" />}
                      </span>
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="py-6 text-center text-[13px] text-brand-gray-500">
                  No attendee found
                </li>
              )}
            </ul>

            <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-4">
              <span className="text-[13px] text-brand-gray-500">
                {checked.length} checked in
              </span>
              <Button size="lg" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
