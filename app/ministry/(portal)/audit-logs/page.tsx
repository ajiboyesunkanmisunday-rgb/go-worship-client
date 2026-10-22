'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { toast } from 'sonner';

type AuditTab = 'All activity' | 'Security events';
const AUDIT_TABS: AuditTab[] = ['All activity', 'Security events'];

type LogRow = {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  user: string;
  outcome: string;
  summary: string;
  time: string;
};

const ACTION_BADGE: Record<string, string> = {
  Created:   'bg-[#eafaf0] text-[#22a45d]',
  Updated:   'bg-[#fff4e5] text-[#ff8d28]',
  Deleted:   'bg-[#fde8e8] text-[#eb0000]',
  Suspended: 'bg-[#fff4e5] text-[#ff8d28]',
};

const OUTCOME_BADGE: Record<string, string> = {
  Success: 'bg-[#eafaf0] text-[#22a45d]',
  Failure: 'bg-[#fde8e8] text-[#eb0000]',
};

const MOCK_ALL: LogRow[] = [
  { id: '1', action: 'Created',   resource: 'Member',  resourceId: '',   user: 'admin@church.org',   outcome: 'Success', summary: 'New member profile created', time: 'Oct 20, 2026 9:14 AM' },
  { id: '2', action: 'Updated',   resource: 'Event',   resourceId: '',   user: 'pastor@church.org',  outcome: 'Success', summary: 'Sunday service updated', time: 'Oct 20, 2026 10:00 AM' },
  { id: '3', action: 'Deleted',   resource: 'Group',   resourceId: '',   user: 'admin@church.org',   outcome: 'Success', summary: 'Youth group removed', time: 'Oct 19, 2026 3:45 PM' },
  { id: '4', action: 'Login',     resource: 'Auth',    resourceId: '',   user: 'finance@church.org', outcome: 'Failure', summary: 'Invalid credentials attempt', time: 'Oct 19, 2026 11:30 AM' },
];

const MOCK_SECURITY: LogRow[] = [
  { id: '5', action: 'Login',     resource: 'Auth',    resourceId: '',   user: 'admin@church.org',   outcome: 'Success', summary: 'Admin login from new device', time: 'Oct 20, 2026 8:00 AM' },
  { id: '6', action: 'Login',     resource: 'Auth',    resourceId: '',   user: 'unknown',             outcome: 'Failure', summary: 'Multiple failed login attempts', time: 'Oct 19, 2026 2:00 AM' },
];

function ActionBadge({ action }: { action: string }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', ACTION_BADGE[action] ?? 'bg-[#eef1f6] text-brand-gray-600')}>
      {action}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', OUTCOME_BADGE[outcome] ?? 'bg-[#eef1f6] text-brand-gray-600')}>
      {outcome}
    </span>
  );
}

function normalizeAction(raw: string): string {
  const u = raw.toUpperCase();
  if (u.includes('CREATE')) return 'Created';
  if (u.includes('UPDATE') || u.includes('MODIFY') || u.includes('EDIT')) return 'Updated';
  if (u.includes('DELETE') || u.includes('REMOVE')) return 'Deleted';
  if (u.includes('SUSPEND') || u.includes('DISABLE') || u.includes('DEACTIVATE')) return 'Suspended';
  if (u.includes('LOGIN') || u.includes('SIGN_IN') || u.includes('SIGNIN')) return 'Login';
  if (u.includes('LOGOUT') || u.includes('SIGN_OUT') || u.includes('SIGNOUT')) return 'Logout';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function normalizeOutcome(raw: string): string {
  const u = raw.toUpperCase();
  if (u === 'SUCCESS' || u === 'PASS' || u === 'PASSED' || u === 'OK') return 'Success';
  if (u === 'FAILURE' || u === 'FAIL' || u === 'FAILED' || u === 'ERROR') return 'Failure';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
}

function parseArr(data: unknown): Record<string, unknown>[] {
  type R = Record<string, unknown>;
  if (Array.isArray(data)) return data as R[];
  if (!data || typeof data !== 'object') return [];
  const d = data as R;
  for (const k of ['content', 'data', 'items', 'events', 'logs', 'results']) {
    if (Array.isArray(d[k])) return d[k] as R[];
  }
  return [];
}

function mapRow(e: Record<string, unknown>): LogRow {
  return {
    id:         String(e['id'] ?? ''),
    action:     normalizeAction(String(e['action'] ?? e['eventType'] ?? '')),
    resource:   String(e['resourceType'] ?? e['resource'] ?? e['entityType'] ?? ''),
    resourceId: String(e['resourceId'] ?? ''),
    user:       String(e['username'] ?? e['userId'] ?? e['actor'] ?? 'System'),
    outcome:    normalizeOutcome(String(e['outcome'] ?? '')),
    summary:    String(e['summary'] ?? e['description'] ?? e['message'] ?? ''),
    time:       fmtDate(String(e['createdAt'] ?? e['timestamp'] ?? '')),
  };
}

function LogField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-brand-gray-500">{label}</p>
      <div className="mt-1 text-[14px] font-medium text-[#333]">{children}</div>
    </div>
  );
}

export default function MinistryAuditLogsPage() {
  const [activeTab, setActiveTab] = useState<AuditTab>('All activity');
  const [allLogs, setAllLogs] = useState<LogRow[]>(USE_LIVE_API ? [] : MOCK_ALL);
  const [securityLogs, setSecurityLogs] = useState<LogRow[]>(USE_LIVE_API ? [] : MOCK_SECURITY);
  const [selected, setSelected] = useState<LogRow | null>(null);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    (api.get<unknown>('/tenant/audit/events/recent') as Promise<unknown>)
      .then((data) => {
        const rows = parseArr(data).map(mapRow).filter((r) => r.action);
        if (rows.length > 0) setAllLogs(rows);
      })
      .catch(() => { toast.error('Could not load audit logs.'); });
    (api.get<unknown>('/tenant/audit/security-events') as Promise<unknown>)
      .then((data) => {
        const rows = parseArr(data).map(mapRow).filter((r) => r.action);
        if (rows.length > 0) setSecurityLogs(rows);
      })
      .catch(() => { toast.error('Could not load security events.'); });
  }, []);

  const logs = activeTab === 'All activity' ? allLogs : securityLogs;

  const filterOptions = [...new Set(logs.map((l) => l.action))].filter(Boolean);

  const tableRows: SmartRow[] = logs.map((l) => ({
    group: l.action,
    text: [l.action, l.resource, l.user, l.outcome, l.summary, l.time],
    cells: [
      <ActionBadge key="a" action={l.action} />,
      l.resource,
      <span key="u" className="font-medium">{l.user}</span>,
      <OutcomeBadge key="o" outcome={l.outcome} />,
      <span key="s" className="max-w-[200px] truncate text-brand-gray-500">{l.summary}</span>,
      <span key="t" className="text-brand-gray-500">{l.time}</span>,
      <button
        key="m"
        type="button"
        onClick={() => setSelected(l)}
        aria-label="Log details"
        className="flex size-7 items-center justify-center rounded-full hover:bg-[#eef1f6]"
      >
        <MoreHorizontal className="size-4" />
      </button>,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">Audit Logs</h1>
          <p className="text-[14px] text-brand-gray-500">
            Track all organisation activities and changes
          </p>
        </div>
        {USE_LIVE_API && (
          <a
            href="/bff/gw/tenant/audit/export/recent.csv"
            download="audit-logs.csv"
            className="flex h-[40px] items-center gap-2 rounded-[8px] border border-[#ddd] px-4 text-[13px] text-[#333] transition-colors hover:bg-[#f5f5f5]"
          >
            <Download className="size-4" />
            Export CSV
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        {AUDIT_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={cn(
              'rounded-full px-4 py-1.5 transition-colors',
              t === activeTab
                ? 'bg-brand-blue text-white'
                : 'bg-[#f2f2f2] text-brand-gray-500 hover:bg-[#e6e6e6]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <SmartTable
        headers={['Action', 'Resource', 'User', 'Outcome', 'Summary', 'Timestamp', '']}
        rows={tableRows}
        filterOptions={filterOptions.length > 0 ? filterOptions : ['Created', 'Updated', 'Deleted', 'Login']}
        filterAll="All actions"
      />

      <Dialog.Root open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[92%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-[16px] bg-white p-7 data-[state=open]:animate-in data-[state=open]:zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <Dialog.Title className="text-[20px] font-bold">Log Details</Dialog.Title>
                <p className="text-[12px] text-brand-gray-500">Activity record details</p>
              </div>
              <Dialog.Close aria-label="Close">
                <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                  <X className="size-4" />
                </span>
              </Dialog.Close>
            </div>
            {selected && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <LogField label="Action"><ActionBadge action={selected.action} /></LogField>
                <LogField label="Resource">{selected.resource}{selected.resourceId ? ` #${selected.resourceId}` : ''}</LogField>
                <LogField label="User">{selected.user}</LogField>
                <LogField label="Outcome"><OutcomeBadge outcome={selected.outcome} /></LogField>
                <LogField label="Timestamp">{selected.time}</LogField>
                <LogField label="Summary">{selected.summary}</LogField>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
