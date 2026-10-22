'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { api } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';
import { toast } from 'sonner';

/**
 * System → Audit Logs (778:38441). Matches the design: heading + "Track all
 * platform activities and changes", a table with Action / Resource / User /
 * Details / IP Address / Timestamp, coloured Action badges, and a per-row
 * "Log Details" modal. (Was previously pattern-built with the wrong columns —
 * Actor/Action/Target/Severity — and a "Recent Events" title.)
 */

type Log = {
  action: string;
  resource: string;
  user: string;
  details: string;
  ip: string;
  time: string;
  category?: string;
};

type AuditTab = 'All activity' | 'Sensitive actions' | 'Roles & permissions' | 'Payment gateways';

const AUDIT_TABS: AuditTab[] = [
  'All activity',
  'Sensitive actions',
  'Roles & permissions',
  'Payment gateways',
];

const TAB_CATEGORY: Record<AuditTab, string | null> = {
  'All activity':        null,
  'Sensitive actions':   'SENSITIVE',
  'Roles & permissions': 'ROLES_PERMISSIONS',
  'Payment gateways':    'PAYMENT_GATEWAY',
};

function matchesTab(log: Log, tab: AuditTab): boolean {
  if (tab === 'All activity') return true;
  const action   = (log.action ?? '').toUpperCase();
  const resource = (log.resource ?? '').toUpperCase();
  const cat      = (log.category ?? '').toUpperCase();
  if (tab === 'Sensitive actions') {
    if (cat === 'SENSITIVE') return true;
    return (
      action.includes('DELETE') || action.includes('SUSPEND') ||
      action.includes('DISABLE') || action.includes('REVOKE') ||
      action.includes('REMOVE') || log.action === 'Deleted' ||
      log.action === 'Suspended'
    );
  }
  if (tab === 'Roles & permissions') {
    if (cat === 'ROLES_PERMISSIONS') return true;
    return (
      resource.includes('ROLE') || resource.includes('PERMISSION') ||
      resource.includes('MFA') || resource.includes('POLICY') ||
      resource.includes('ACCESS')
    );
  }
  if (tab === 'Payment gateways') {
    if (cat === 'PAYMENT_GATEWAY') return true;
    return (
      resource.includes('PAYMENT') || resource.includes('BILLING') ||
      resource.includes('GATEWAY') || resource.includes('TRANSACTION') ||
      resource.includes('INVOICE') || resource.includes('SUBSCRIPTION')
    );
  }
  return true;
}

const ACTION_BADGE: Record<string, string> = {
  Created: 'bg-[#eafaf0] text-[#22a45d]',
  Updated: 'bg-[#fff4e5] text-[#ff8d28]',
  Suspended: 'bg-[#fff4e5] text-[#ff8d28]',
  Deleted: 'bg-[#fde8e8] text-[#eb0000]',
};

const LOGS: Log[] = [
  { action: 'Created', resource: 'Tenant', user: 'John Administrator', details: 'Created new tenant: Faith Bible Church', ip: '192.168.1.100', time: 'Jan 14, 2024 2:30 PM' },
  { action: 'Updated', resource: 'Tenant', user: 'John Administrator', details: 'Updated plan: Grace Community Church', ip: '192.168.1.100', time: 'Jan 14, 2024 2:30 PM' },
  { action: 'Suspended', resource: 'Tenant', user: 'John Administrator', details: 'Suspended tenant: Hope Assembly', ip: '192.168.1.100', time: 'Jan 14, 2024 2:30 PM' },
  { action: 'Created', resource: 'Tenant', user: 'John Administrator', details: 'Created new tenant: Faith Bible Church', ip: '192.168.1.100', time: 'Jan 14, 2024 2:30 PM' },
  { action: 'Deleted', resource: 'Role', user: 'John Administrator', details: 'Deleted role: Finance Manager', ip: '192.168.1.100', time: 'Jan 14, 2024 2:30 PM' },
];

function ActionBadge({ action }: { action: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-medium',
        ACTION_BADGE[action] ?? 'bg-[#eef1f6] text-brand-gray-600'
      )}
    >
      {action}
    </span>
  );
}

function normalizeAction(raw: string): string {
  const u = raw.toUpperCase();
  if (u.includes('CREATE')) return 'Created';
  if (u.includes('UPDATE') || u.includes('MODIFY') || u.includes('EDIT')) return 'Updated';
  if (u.includes('SUSPEND') || u.includes('DISABLE') || u.includes('DEACTIVATE')) return 'Suspended';
  if (u.includes('DELETE') || u.includes('REMOVE')) return 'Deleted';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function fmtLogDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
}

function mapLogRow(e: Record<string, unknown>): Log {
  return {
    action:   normalizeAction(String(e['action'] ?? e['eventType'] ?? e['type'] ?? '')),
    resource: String(e['resource'] ?? e['resourceType'] ?? e['entityType'] ?? e['target'] ?? ''),
    user:     String(e['performedBy'] ?? e['actor'] ?? e['username'] ?? e['user'] ?? e['userId'] ?? 'Administrator'),
    details:  String(e['description'] ?? e['details'] ?? e['message'] ?? ''),
    ip:       String(e['ipAddress'] ?? e['ip'] ?? ''),
    time:     fmtLogDate(String(e['createdAt'] ?? e['timestamp'] ?? e['eventTime'] ?? '')),
    category: String(e['category'] ?? e['auditCategory'] ?? ''),
  };
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

export default function SystemAuditLogsPage() {
  const [selected, setSelected] = useState<Log | null>(null);
  const [logs, setLogs] = useState<Log[]>(USE_LIVE_API ? [] : LOGS);
  const [activeTab, setActiveTab] = useState<AuditTab>('All activity');

  const loadLogs = (tab: AuditTab) => {
    if (!USE_LIVE_API) return;
    // Only /system/audit/events/recent confirmed in spec — other tab-specific paths
    // are absent; load the full list once and filter client-side via matchesTab.
    if (tab !== 'All activity') return;
    (api.get<unknown>('/system/audit/events/recent') as Promise<unknown>)
      .then((data) => {
        const rows = parseArr(data).map(mapLogRow).filter((l) => l.action || l.resource);
        if (rows.length > 0) setLogs(rows);
      })
      .catch(() => { toast.error('Could not load audit logs.'); });
  };

  useEffect(() => {
    loadLogs('All activity');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTab = (tab: AuditTab) => {
    setActiveTab(tab);
  };

  const visibleLogs = logs.filter((l) => matchesTab(l, activeTab));

  const rows: SmartRow[] = visibleLogs.map((l) => ({
    group: l.action,
    text: [l.action, l.resource, l.user, l.details, l.ip, l.time],
    cells: [
      <ActionBadge key="a" action={l.action} />,
      l.resource,
      <span key="u" className="font-medium">{l.user}</span>,
      <span key="d" className="text-brand-gray-500">{l.details}</span>,
      <span key="ip" className="text-brand-gray-500">{l.ip}</span>,
      <span key="t" className="text-brand-gray-500">{l.time}</span>,
      <button
        key="m"
        type="button"
        onClick={() => { setSelected(l); }}
        aria-label="Log details"
        className="flex size-7 items-center justify-center rounded-full hover:bg-[#eef1f6]"
      >
        <MoreHorizontal className="size-4" />
      </button>,
    ],
  }));

  const filterOptions = [...new Set(visibleLogs.map((l) => l.action))].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">Audit Logs</h1>
        <p className="text-[14px] text-brand-gray-500">
          Track all platform activities and changes
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        {AUDIT_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTab(t)}
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
        headers={[
          'Action',
          'Resource',
          'User',
          'Details',
          'IP Address',
          'Timestamp',
          '',
        ]}
        rows={rows}
        filterOptions={filterOptions.length > 0 ? filterOptions : ['Created', 'Updated', 'Suspended', 'Deleted']}
        filterAll="All actions"
      />

      <Dialog.Root
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[92%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-[16px] bg-white p-7 data-[state=open]:animate-in data-[state=open]:zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <Dialog.Title className="text-[20px] font-bold">
                  Log Details
                </Dialog.Title>
                <p className="text-[12px] text-brand-gray-500">
                  Track all platform activities and changes
                </p>
              </div>
              <Dialog.Close aria-label="Close">
                <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                  <X className="size-4" />
                </span>
              </Dialog.Close>
            </div>

            {selected && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <LogField label="Action">
                  <ActionBadge action={selected.action} />
                </LogField>
                <LogField label="Resources">{selected.resource}</LogField>
                <LogField label="User">{selected.user}</LogField>
                <LogField label="IP Address">{selected.ip}</LogField>
                <LogField label="Timestamp">{selected.time}</LogField>
                <LogField label="Details">{selected.details}</LogField>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function LogField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[12px] text-brand-gray-500">{label}</p>
      <div className="mt-1 text-[14px] font-medium text-[#333]">{children}</div>
    </div>
  );
}
