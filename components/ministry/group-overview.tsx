'use client';

import { Button } from '@/components/ui/button';
import { SheetPage } from '@/components/ui/sheet-page';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTenantGroup, type TenantGroup } from '@/lib/api/tenant';
import { USE_LIVE_API } from '@/lib/api/config';

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[#333]">{label}</label>
      <div className="flex min-h-[48px] items-center rounded-[6px] border border-[#e5e5e5] px-3 py-2 text-[13px] text-brand-gray-500">
        {value}
      </div>
    </div>
  );
}

/** Deterministic decorative QR block (design shows a QR for group check-in). */
function QrCode() {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    // finder patterns in three corners
    const inFinder =
      (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (inFinder) {
      const fx = x < 7 ? x : x - 14;
      const fy = y < 7 ? y : y - 14;
      const ring = fx === 0 || fx === 6 || fy === 0 || fy === 6;
      const core = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
      return ring || core;
    }
    return (x * 7 + y * 13 + ((x * y) % 5)) % 3 === 0;
  });

  return (
    <div
      className="mx-auto grid w-[180px] gap-0 bg-white p-2"
      style={{ gridTemplateColumns: 'repeat(21, minmax(0, 1fr))' }}
    >
      {cells.map((on, i) => (
        <span
          key={i}
          className={cn('aspect-square', on ? 'bg-black' : 'bg-white')}
        />
      ))}
    </div>
  );
}

/** Church Admin "Group Overview" slide-over (Figma 418:23947). */
const MOCK_GROUP: TenantGroup = {
  id: '1',
  name: 'Faith Builders Fellowship',
  description: 'A complete breakdown of what happens when a user clicks View on the Group List.',
  memberCount: 22,
  leaderId: '',
  leaderName: 'Isaiah Christian',
  status: 'Active',
  createdAt: 'Jun 10, 2025',
};

export function GroupOverview({ id }: { id?: string }) {
  const router = useRouter();
  const back = '/ministry/groups';
  const [qr, setQr] = useState(true);
  const [group, setGroup] = useState<TenantGroup>(MOCK_GROUP);

  useEffect(() => {
    if (!USE_LIVE_API || !id) return;
    getTenantGroup(id).then((g: TenantGroup | null) => { if (g) setGroup(g); }).catch(() => {});
  }, [id]);

  return (
    <SheetPage
      className="w-full max-w-[665px]!"
      backLink={back}
      title="Group Overview"
    >
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-[64px] pb-10 md:px-[60px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(back)}
            aria-label="Go back"
            className="text-black transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="size-6" />
          </button>
          <h1 className="text-[20px] font-bold text-brand-blue">
            Group Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Image
            src="/auth/infinity-blue.svg"
            alt="Group"
            width={44}
            height={44}
            className="size-11 rounded-full"
          />
          <div>
            <p className="text-[10px] text-brand-gray-500">Group Name:</p>
            <p className="text-[20px] font-bold text-brand-blue">
              {group.name}
            </p>
            <p className="text-[12px] text-brand-gray-500">
              {group.description || 'Small Group'}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-brand-gray-500">
              {group.createdAt ? `Created on ${group.createdAt}` : ''}
              <span className="inline-flex items-center gap-1">
                <span className={cn(
                  'size-2 rounded-full',
                  group.status?.toLowerCase() === 'active' ? 'bg-[#34a853]' : 'bg-[#eb0000]'
                )} />
                {group.status || 'Active'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-[15px] font-bold">Group Information</h2>
          <ReadonlyField
            label="Group Description*"
            value={group.description || '—'}
          />
          <ReadonlyField label="Meeting Frequency*" value="Every Tuesdays" />
          <ReadonlyField label="Meeting Day*" value="Tuesdays" />
          <ReadonlyField label="Meeting Time*" value="6:00 PM" />
          <ReadonlyField label="Group Leader*" value={group.leaderName || '—'} />
          <ReadonlyField label="Members" value={String(group.memberCount)} />

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#333]">
              Generate QR Code
            </span>
            <button
              type="button"
              onClick={() => setQr((v) => !v)}
              aria-pressed={qr}
              className={cn(
                'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
                qr ? 'bg-brand-blue' : 'bg-[#d9d9d9]'
              )}
            >
              <span
                className={cn(
                  'size-5 rounded-full bg-white transition-transform',
                  qr && 'translate-x-5'
                )}
              />
            </button>
          </div>

          {qr && <QrCode />}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="h-[52px] w-full"
            onClick={() => router.push(`${back}/${id ?? group.id}/edit`)}
          >
            Edit Group
          </Button>
          <Button asChild size="lg" variant="outline" className="h-[52px] w-full">
            <button type="button" onClick={() => router.push(back)}>
              Close
            </button>
          </Button>
        </div>
      </div>
    </SheetPage>
  );
}
