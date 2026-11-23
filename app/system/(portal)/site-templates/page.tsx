'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Globe, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSystemSiteTemplates,
  getResolvedSystemSiteTemplate,
  createSystemSiteTemplate,
  updateSystemSiteTemplate,
  deleteSystemSiteTemplate,
  publishSystemSiteTemplate,
  getSystemSiteTemplateContent,
} from '@/lib/api/system';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

type SiteTemplate = Record<string, unknown> & {
  id?: string;
  templateId?: string;
  name?: string;
  templateType?: string;
  status?: string;
  published?: boolean;
};

function TemplateForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: SiteTemplate;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: String(initial?.name ?? ''),
    templateType: String(initial?.templateType ?? ''),
    description: String(initial?.description ?? ''),
  });
  const [saving, setSaving] = useState(false);

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
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium">Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
          className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue"
          placeholder="Template name"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium">Template Type</label>
        <input
          value={form.templateType}
          onChange={(e) => setForm((p) => ({ ...p, templateType: e.target.value }))}
          className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue"
          placeholder="e.g. CHECKOUT, GIVING, LANDING"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={3}
          className="rounded-[8px] border border-[#ddd] px-3 py-2.5 text-[13px] outline-none focus:border-brand-blue resize-none"
        />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={onClose} className="text-[13px] text-brand-gray-500 hover:opacity-70">Cancel</button>
        <button
          type="submit"
          disabled={saving || !form.name}
          className="flex h-[42px] items-center gap-2 rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Template'}
        </button>
      </div>
    </form>
  );
}

function ContentModal({ template, onClose }: { template: SiteTemplate; onClose: () => void }) {
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const tid = String(template.id ?? template.templateId ?? '');

  useEffect(() => {
    if (!tid) return;
    getSystemSiteTemplateContent(tid).then(setContent).catch(() => {});
  }, [tid]);

  return (
    <Dialog.Root open onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[600px] max-h-[80vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[18px] font-bold">Template Content</Dialog.Title>
            <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
          </div>
          <p className="mb-3 text-[13px] text-brand-gray-500">{String(template.name ?? template.templateType ?? '')}</p>
          {content ? (
            <pre className="rounded-[8px] bg-[#f6f8fc] p-4 text-[11px] overflow-x-auto whitespace-pre-wrap text-[#333]">
              {JSON.stringify(content, null, 2)}
            </pre>
          ) : (
            <p className="py-8 text-center text-[13px] text-brand-gray-500">No content found.</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function SystemSiteTemplatesPage() {
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [resolved, setResolved] = useState<Record<string, unknown> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<SiteTemplate | null>(null);
  const [viewContent, setViewContent] = useState<SiteTemplate | null>(null);

  const reload = () => {
    getSystemSiteTemplates()
      .then((data) => setTemplates(Array.isArray(data) ? (data as SiteTemplate[]) : []))
      .catch(() => {});
  };

  useEffect(() => {
    reload();
    getResolvedSystemSiteTemplate().then((r) => setResolved(r as Record<string, unknown>)).catch(() => {});
  }, []);

  const handleCreate = async (payload: Record<string, unknown>) => {
    await createSystemSiteTemplate(payload);
    toast.success('Template created.');
    reload();
  };

  const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
    await updateSystemSiteTemplate(id, payload);
    toast.success('Template updated.');
    reload();
  };

  const handleDelete = async (t: SiteTemplate) => {
    const id = String(t.id ?? t.templateId ?? '');
    if (!id) return;
    try {
      await deleteSystemSiteTemplate(id);
      setTemplates((prev) => prev.filter((x) => (x.id ?? x.templateId) !== (t.id ?? t.templateId)));
      toast.success('Template deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handlePublish = async (t: SiteTemplate) => {
    const id = String(t.id ?? t.templateId ?? '');
    if (!id) return;
    try {
      await publishSystemSiteTemplate(id);
      setTemplates((prev) => prev.map((x) => (x.id ?? x.templateId) === (t.id ?? t.templateId) ? { ...x, published: true, status: 'PUBLISHED' } : x));
      toast.success('Template published.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed.');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold lg:text-[32px]">Site Templates</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-[8px] bg-brand-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" /> New Template
        </button>
      </div>

      {resolved && (
        <div className="rounded-[14px] bg-white p-5">
          <p className="text-[13px] font-semibold mb-2">Resolved Active Template</p>
          <div className="flex flex-wrap gap-4 text-[12px]">
            {Object.entries(resolved)
              .filter(([, v]) => v != null && v !== '' && typeof v !== 'object')
              .slice(0, 6)
              .map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-brand-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-[14px] bg-white p-6">
        {templates.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-brand-gray-500">No site templates configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#f2f2f2] text-left text-[13px] text-[#333]">
                  {['Name', 'Type', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="pb-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => {
                  const id = String(t.id ?? t.templateId ?? i);
                  const isPublished = t.published || /published/i.test(String(t.status ?? ''));
                  return (
                    <tr key={id} className="border-t border-[#f2f2f2]">
                      <td className="py-4 font-medium">{String(t.name ?? '—')}</td>
                      <td className="py-4">
                        <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px]">{String(t.templateType ?? '—')}</span>
                      </td>
                      <td className="py-4">
                        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', isPublished ? 'bg-[#e7f7ee] text-[#34a853]' : 'bg-[#fff4e5] text-[#ff8d28]')}>
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3 text-[12px] font-medium">
                          <button type="button" onClick={() => setViewContent(t)} className="text-brand-gray-500 hover:text-brand-blue">View</button>
                          <button type="button" onClick={() => setEditTemplate(t)} className="text-brand-blue hover:opacity-70">Edit</button>
                          {!isPublished && (
                            <button type="button" onClick={() => void handlePublish(t)} className="flex items-center gap-1 text-[#34a853] hover:opacity-70">
                              <Globe className="size-3" /> Publish
                            </button>
                          )}
                          <button type="button" onClick={() => void handleDelete(t)} className="text-[#eb0000] hover:opacity-70">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[500px] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-[18px] font-bold">New Site Template</Dialog.Title>
              <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
            </div>
            <TemplateForm onSave={handleCreate} onClose={() => setCreateOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Modal */}
      <Dialog.Root open={!!editTemplate} onOpenChange={(v) => { if (!v) setEditTemplate(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[500px] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-[18px] font-bold">Edit Template</Dialog.Title>
              <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
            </div>
            {editTemplate && (
              <TemplateForm
                initial={editTemplate}
                onSave={(payload) => handleUpdate(String(editTemplate.id ?? editTemplate.templateId ?? ''), payload)}
                onClose={() => setEditTemplate(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {viewContent && <ContentModal template={viewContent} onClose={() => setViewContent(null)} />}
    </div>
  );
}
