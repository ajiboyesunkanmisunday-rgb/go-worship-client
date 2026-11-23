'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSystemPaymentGateways,
  createSystemPaymentGateway,
  updateSystemPaymentGateway,
  setSystemPaymentGatewayActive,
  setSystemPlatformDefaultGateway,
  type SystemPaymentGateway,
  type CreatePaymentGatewayPayload,
} from '@/lib/api/system';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

const GATEWAY_TYPES = ['PAYSTACK', 'STRIPE', 'FLUTTERWAVE', 'LEADREMIT', 'OTHER'];
const ENVIRONMENTS = ['live', 'sandbox', 'test'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium">{label}</label>
      {children}
    </div>
  );
}

type GatewayFormProps = {
  initial?: SystemPaymentGateway;
  onSave: (payload: CreatePaymentGatewayPayload) => Promise<void>;
  onClose: () => void;
};

function GatewayForm({ initial, onSave, onClose }: GatewayFormProps) {
  const [form, setForm] = useState<CreatePaymentGatewayPayload>({
    gatewayType: initial?.gatewayType ?? '',
    environment: initial?.environment ?? 'live',
    displayName: initial?.displayName ?? '',
    publicKey: initial?.publicKey ?? '',
    secretKey: initial?.secretKey ?? '',
    webhookSecret: initial?.webhookSecret ?? '',
    active: initial?.active ?? true,
    platformDefault: initial?.platformDefault ?? false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof CreatePaymentGatewayPayload, v: unknown) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 flex flex-col gap-4">
      <Field label="Gateway Type *">
        <select value={form.gatewayType} onChange={(e) => set('gatewayType', e.target.value)} required className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue bg-white">
          <option value="">Select type</option>
          {GATEWAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Display Name">
        <input value={form.displayName ?? ''} onChange={(e) => set('displayName', e.target.value)} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. Paystack Live" />
      </Field>
      <Field label="Environment">
        <select value={form.environment ?? 'live'} onChange={(e) => set('environment', e.target.value)} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue bg-white">
          {ENVIRONMENTS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </Field>
      <Field label="Public Key">
        <input value={form.publicKey ?? ''} onChange={(e) => set('publicKey', e.target.value)} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" placeholder="pk_..." />
      </Field>
      <Field label="Secret Key">
        <input type="password" value={form.secretKey ?? ''} onChange={(e) => set('secretKey', e.target.value)} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" placeholder="sk_..." />
      </Field>
      <Field label="Webhook Secret">
        <input type="password" value={form.webhookSecret ?? ''} onChange={(e) => set('webhookSecret', e.target.value)} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" placeholder="whsec_..." />
      </Field>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={!!form.active} onChange={(e) => set('active', e.target.checked)} className="size-4 accent-brand-blue" />
        Active
      </label>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={!!form.platformDefault} onChange={(e) => set('platformDefault', e.target.checked)} className="size-4 accent-brand-blue" />
        Platform default
      </label>
      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={onClose} className="text-[13px] text-brand-gray-500 hover:opacity-70">Cancel</button>
        <button type="submit" disabled={saving || !form.gatewayType} className="flex h-[42px] items-center gap-2 rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white disabled:opacity-50">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Gateway'}
        </button>
      </div>
    </form>
  );
}

export default function SystemPaymentGatewaysPage() {
  const [gateways, setGateways] = useState<SystemPaymentGateway[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editGateway, setEditGateway] = useState<SystemPaymentGateway | null>(null);

  const reload = () => {
    getSystemPaymentGateways().then(setGateways).catch(() => {});
  };

  useEffect(() => { reload(); }, []);

  const handleCreate = async (payload: CreatePaymentGatewayPayload) => {
    await createSystemPaymentGateway(payload);
    toast.success('Gateway created.');
    reload();
  };

  const handleUpdate = async (id: string, payload: CreatePaymentGatewayPayload) => {
    await updateSystemPaymentGateway(id, payload);
    toast.success('Gateway updated.');
    reload();
  };

  const handleToggleActive = async (gw: SystemPaymentGateway) => {
    const id = String(gw.id ?? '');
    try {
      await setSystemPaymentGatewayActive(id, !gw.active);
      setGateways((prev) => prev.map((g) => g.id === gw.id ? { ...g, active: !gw.active } : g));
      toast.success(`Gateway ${gw.active ? 'deactivated' : 'activated'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Toggle failed.');
    }
  };

  const handleSetDefault = async (gw: SystemPaymentGateway) => {
    const id = String(gw.id ?? '');
    try {
      await setSystemPlatformDefaultGateway(id, gw.environment);
      setGateways((prev) => prev.map((g) => ({ ...g, platformDefault: g.id === gw.id })));
      toast.success('Platform default gateway set.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed.');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold lg:text-[32px]">Payment Gateways</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-[8px] bg-brand-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" /> Add Gateway
        </button>
      </div>

      <div className="rounded-[14px] bg-white p-6">
        {gateways.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-brand-gray-500">No payment gateways configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#f2f2f2] text-left text-[13px] text-[#333]">
                  {['Gateway', 'Type', 'Environment', 'Status', 'Platform Default', 'Actions'].map((h) => (
                    <th key={h} className="pb-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gateways.map((gw) => (
                  <tr key={gw.id} className="border-t border-[#f2f2f2]">
                    <td className="py-4 font-medium">{gw.displayName || gw.gatewayType}</td>
                    <td className="py-4">{gw.gatewayType}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px]">{gw.environment}</span>
                    </td>
                    <td className="py-4">
                      <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', gw.active ? 'bg-[#e7f7ee] text-[#34a853]' : 'bg-[#fde8e8] text-[#eb0000]')}>
                        {gw.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4">{gw.platformDefault ? 'Yes' : 'No'}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3 text-[12px] font-medium">
                        <button type="button" onClick={() => setEditGateway(gw)} className="text-brand-blue hover:opacity-70">Edit</button>
                        <button type="button" onClick={() => void handleToggleActive(gw)} className={cn(gw.active ? 'text-[#ff8d28]' : 'text-[#34a853]', 'hover:opacity-70')}>
                          {gw.active ? 'Deactivate' : 'Activate'}
                        </button>
                        {!gw.platformDefault && (
                          <button type="button" onClick={() => void handleSetDefault(gw)} className="text-brand-gray-500 hover:opacity-70">Set Default</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Gateway Modal */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[520px] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-[18px] font-bold">Add Payment Gateway</Dialog.Title>
              <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
            </div>
            <GatewayForm onSave={handleCreate} onClose={() => setCreateOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Gateway Modal */}
      <Dialog.Root open={!!editGateway} onOpenChange={(v) => { if (!v) setEditGateway(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[520px] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-[18px] font-bold">Edit Gateway</Dialog.Title>
              <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
            </div>
            {editGateway && (
              <GatewayForm
                initial={editGateway}
                onSave={(payload) => handleUpdate(String(editGateway.id ?? ''), payload)}
                onClose={() => setEditGateway(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
