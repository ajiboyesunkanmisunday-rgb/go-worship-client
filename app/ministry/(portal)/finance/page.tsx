'use client';

import {
  ActionCard,
  StatCard,
  TransactionsTable,
  type Transaction,
} from '@/components/ministry/shared';
import { getUnifiedDashboard, type DashboardSection } from '@/lib/api/dashboard';
import { SectionBlock } from '@/components/shared/section-block';
import { DollarSign, Plus, MoreHorizontal, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  getDonationFunds,
  createDonationFund,
  updateDonationFund,
  deactivateDonationFund,
  deleteDonationFund,
  exportTenantPaymentsDocument,
  type DonationFund,
  type CreateDonationFundPayload,
} from '@/lib/api/tenant';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

const GIVING_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function FundStatusBadge({ status }: { status?: string }) {
  const s = (status ?? '').toUpperCase();
  const cls = s === 'ACTIVE' || s === 'ENABLED'
    ? 'bg-[#eafaf0] text-[#22a45d]'
    : s === 'INACTIVE' || s === 'DISABLED' || s === 'DEACTIVATED'
    ? 'bg-[#fde8e8] text-[#eb0000]'
    : 'bg-[#eef1f6] text-brand-gray-600';
  const label = s === 'ACTIVE' || s === 'ENABLED' ? 'Active'
    : s === 'INACTIVE' || s === 'DISABLED' || s === 'DEACTIVATED' ? 'Inactive'
    : (status ?? '');
  return <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', cls)}>{label}</span>;
}

function FundRowMenu({ fund, onDeactivate, onDelete, onEdit }: {
  fund: DonationFund;
  onDeactivate: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-7 items-center justify-center rounded-full hover:bg-[#eef1f6]"
        aria-label="Fund actions"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-[160px] overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-white shadow-lg">
          <button type="button" onClick={() => { setOpen(false); onEdit(); }} className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-[#f5f5f5]">Edit</button>
          {(fund.status?.toUpperCase() === 'ACTIVE' || fund.status?.toUpperCase() === 'ENABLED') && (
            <button type="button" onClick={() => { setOpen(false); onDeactivate(); }} className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-[#f5f5f5]">Deactivate</button>
          )}
          <button type="button" onClick={() => { setOpen(false); onDelete(); }} className="w-full px-4 py-2.5 text-left text-[13px] text-[#eb0000] hover:bg-[#f5f5f5]">Delete</button>
        </div>
      )}
    </div>
  );
}

type FundFormState = {
  name: string;
  code: string;
  fundType: string;
  description: string;
  defaultForOnline: boolean;
};

const EMPTY_FUND_FORM: FundFormState = { name: '', code: '', fundType: '', description: '', defaultForOnline: false };

export default function MinistryFinancePage() {
  const [totalGiving, setTotalGiving] = useState('$0');
  const [offlineGiving, setOfflineGiving] = useState('$0');
  const [recurringGivers, setRecurringGivers] = useState('0');
  const [failedTransactions, setFailedTransactions] = useState('0');
  const [txns, setTxns] = useState<Transaction[] | undefined>(undefined);
  const [rawSections, setRawSections] = useState<DashboardSection[]>([]);
  const [givingTrend, setGivingTrend] = useState<{ name: string; value: number }[]>([]);
  const [funds, setFunds] = useState<DonationFund[]>([]);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<DonationFund | null>(null);
  const [fundForm, setFundForm] = useState<FundFormState>(EMPTY_FUND_FORM);
  const [savingFund, setSavingFund] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getUnifiedDashboard('LAST_30_DAYS', 'USD', 'FINANCE')
      .then((s) => {
        if (!s) return;
        setTotalGiving(s.totalGiving);
        if (s.rawSections.length > 0) setRawSections(s.rawSections);
        const financeSection = s.rawSections.find((sec) =>
          sec.type?.toLowerCase().includes('financ') || sec.type?.toLowerCase().includes('giving')
        );
        if (financeSection?.series?.[0]?.points?.length) {
          const pts = financeSection.series[0].points;
          setGivingTrend(pts.map((p, i) => ({
            name: p.label ?? GIVING_MONTHS[i % 12],
            value: typeof p.value === 'number' ? p.value : 0,
          })));
        }
      })
      .catch(() => { toast.error('Could not load dashboard stats.'); });

    getDonationFunds()
      .then((arr) => { if (arr.length > 0) setFunds(arr); })
      .catch(() => {});
  }, []);

  const totalRaw = parseFloat(totalGiving.replace(/[^0-9.]/g, '')) || 0;
  const sparkTrend = givingTrend.length > 1
    ? givingTrend
    : [0.4, 0.5, 0.6, 0.55, 0.7, 0.8, 0.75, 0.9, 1].map((f, i) => ({
        name: GIVING_MONTHS[i],
        value: Math.round(totalRaw * f) || (i + 1) * 10,
      }));

  function openCreateFund() {
    setEditingFund(null);
    setFundForm(EMPTY_FUND_FORM);
    setFundModalOpen(true);
  }

  function openEditFund(fund: DonationFund) {
    setEditingFund(fund);
    setFundForm({
      name: fund.name ?? '',
      code: fund.code ?? '',
      fundType: fund.fundType ?? '',
      description: fund.description ?? '',
      defaultForOnline: fund.defaultForOnline ?? false,
    });
    setFundModalOpen(true);
  }

  function saveFund() {
    setSavingFund(true);
    const payload: CreateDonationFundPayload = {
      name: fundForm.name,
      code: fundForm.code || undefined,
      fundType: fundForm.fundType || undefined,
      description: fundForm.description || undefined,
      defaultForOnline: fundForm.defaultForOnline,
    };
    const promise = editingFund?.id
      ? updateDonationFund(editingFund.id, payload)
      : createDonationFund(payload);
    promise
      .then((saved) => {
        setFundModalOpen(false);
        if (editingFund?.id) {
          setFunds((prev) => prev.map((f) => f.id === editingFund.id ? { ...f, ...saved } : f));
          toast.success('Fund updated.');
        } else {
          setFunds((prev) => [...prev, saved as DonationFund]);
          toast.success('Fund created.');
        }
      })
      .catch((e: unknown) => { toast.error(e instanceof Error ? e.message : 'Could not save fund.'); })
      .finally(() => setSavingFund(false));
  }

  function handleDeactivate(fund: DonationFund) {
    if (!fund.id) return;
    deactivateDonationFund(fund.id)
      .then(() => {
        setFunds((prev) => prev.map((f) => f.id === fund.id ? { ...f, status: 'INACTIVE' } : f));
        toast.success('Fund deactivated.');
      })
      .catch((e: unknown) => { toast.error(e instanceof Error ? e.message : 'Could not deactivate fund.'); });
  }

  function handleDelete(fund: DonationFund) {
    if (!fund.id) return;
    deleteDonationFund(fund.id)
      .then(() => {
        setFunds((prev) => prev.filter((f) => f.id !== fund.id));
        toast.success('Fund deleted.');
      })
      .catch((e: unknown) => { toast.error(e instanceof Error ? e.message : 'Could not delete fund.'); });
  }

  function handleExport() {
    setExporting(true);
    exportTenantPaymentsDocument()
      .then(() => { toast.success('Export started. Check your downloads.'); })
      .catch((e: unknown) => { toast.error(e instanceof Error ? e.message : 'Export failed.'); })
      .finally(() => setExporting(false));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-[26px] font-bold lg:text-[32px]">Finance</h1>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex h-[40px] items-center gap-2 rounded-[8px] border border-[#ddd] px-4 text-[13px] text-[#333] transition-colors hover:bg-[#f5f5f5] disabled:opacity-50"
        >
          <Download className="size-4" />
          {exporting ? 'Exporting…' : 'Export Payments'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard title="Total Giving" value={totalGiving} variant="blue" trend={sparkTrend.map((d) => d.value)} />
        <StatCard title="Offline Giving" value={offlineGiving} variant="white" />
        <StatCard title="Recurring Givers" value={recurringGivers} variant="green" />
        <StatCard title="Failed Transactions" value={failedTransactions} variant="white" />
        <ActionCard
          title="Giving List"
          subtitle="Click here to view"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-[#eb0000]">
              <DollarSign className="size-5 text-white" />
            </span>
          }
        />
      </div>

      <div className="rounded-[14px] bg-white p-6">
        <p className="text-[16px] font-bold">Giving Trend</p>
        <p className="mt-0.5 text-[13px] text-brand-gray-500">Monthly giving overview</p>
        <div className="mt-4 h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sparkTrend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={40} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => [`$${v}`, 'Giving']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={false}>
                {sparkTrend.map((_, i) => (
                  <Cell key={i} fill={i === sparkTrend.length - 1 ? '#243f84' : '#c8d4f5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donation Funds */}
      <div className="rounded-[14px] bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[16px] font-bold">Donation Funds</p>
            <p className="mt-0.5 text-[13px] text-brand-gray-500">Manage giving categories</p>
          </div>
          <button
            type="button"
            onClick={openCreateFund}
            className="flex h-[36px] items-center gap-1.5 rounded-[8px] bg-brand-blue px-4 text-[13px] font-medium text-white hover:bg-brand-blue/90"
          >
            <Plus className="size-4" />
            Add Fund
          </button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-brand-blue text-left text-[13px] text-white">
                {['Name', 'Code', 'Type', 'Default Online', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium first:rounded-l-[8px] last:rounded-r-[8px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {funds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[13px] text-brand-gray-500">No donation funds yet</td>
                </tr>
              ) : funds.map((fund, i) => (
                <tr key={fund.id ?? i} className="border-b border-[#f2f2f2] text-[12px]">
                  <td className="px-4 py-3 font-medium">{fund.name}</td>
                  <td className="px-4 py-3 font-mono text-brand-gray-500">{fund.code ?? '—'}</td>
                  <td className="px-4 py-3">{fund.fundType ?? '—'}</td>
                  <td className="px-4 py-3">{fund.defaultForOnline ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3"><FundStatusBadge status={fund.status} /></td>
                  <td className="px-4 py-3">
                    <FundRowMenu
                      fund={fund}
                      onEdit={() => openEditFund(fund)}
                      onDeactivate={() => handleDeactivate(fund)}
                      onDelete={() => handleDelete(fund)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rawSections.length > 0 && (
        <div className="flex flex-col gap-6">
          {rawSections.map((section) => (
            <SectionBlock key={section.type} section={section} accentColor="#243f84" />
          ))}
        </div>
      )}

      <TransactionsTable rows={txns} />

      {/* Create / Edit Fund Modal */}
      <Dialog.Root open={fundModalOpen} onOpenChange={(v) => { if (!v) setFundModalOpen(false); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92%] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7 data-[state=open]:animate-in data-[state=open]:zoom-in-95">
            <div className="flex items-start justify-between">
              <Dialog.Title className="text-[18px] font-bold">
                {editingFund ? 'Edit Fund' : 'Add Donation Fund'}
              </Dialog.Title>
              <Dialog.Close aria-label="Close">
                <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                  <X className="size-4" />
                </span>
              </Dialog.Close>
            </div>
            <div className="mt-5 flex flex-col gap-4">
              {([
                { key: 'name', label: 'Fund Name *', placeholder: 'e.g. General Tithe' },
                { key: 'code', label: 'Fund Code', placeholder: 'e.g. TITHE' },
                { key: 'fundType', label: 'Fund Type', placeholder: 'e.g. TITHE, OFFERING' },
                { key: 'description', label: 'Description', placeholder: 'Optional description' },
              ] as const).map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#333]">{label}</label>
                  <input
                    className="rounded-[6px] border border-[#e5e5e5] px-3 py-2.5 text-[13px] outline-none focus:border-brand-blue"
                    placeholder={placeholder}
                    value={fundForm[key]}
                    onChange={(e) => setFundForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={fundForm.defaultForOnline}
                  onChange={(e) => setFundForm((f) => ({ ...f, defaultForOnline: e.target.checked }))}
                  className="size-4"
                />
                Default for online giving
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={saveFund}
                disabled={!fundForm.name || savingFund}
                className="flex h-[44px] flex-1 items-center justify-center rounded-[8px] bg-brand-blue text-[14px] font-medium text-white disabled:opacity-50 hover:bg-brand-blue/90"
              >
                {savingFund ? 'Saving…' : editingFund ? 'Save Changes' : 'Create Fund'}
              </button>
              <Dialog.Close asChild>
                <button type="button" className="flex h-[44px] flex-1 items-center justify-center rounded-[8px] border border-[#ddd] text-[14px] text-[#333] hover:bg-[#f5f5f5]">
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
