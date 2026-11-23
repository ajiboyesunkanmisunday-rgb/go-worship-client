'use client';

import { useState, useEffect } from 'react';
import { Globe, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getTenantSiteTemplates,
  getResolvedSiteTemplate,
  getSiteTemplateContent,
  publishSiteTemplate,
  updateSiteTemplate,
  deleteSiteTemplate,
  type SiteTemplate,
} from '@/lib/api/tenant';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

function ContentModal({ template, onClose }: { template: SiteTemplate; onClose: () => void }) {
  const [content, setContent] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const id = template.id;
    if (!id) return;
    getSiteTemplateContent(id).then((c) => setContent(c as Record<string, unknown>)).catch(() => {});
  }, [template.id]);

  return (
    <Dialog.Root open onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[620px] max-h-[80vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[18px] font-bold">Template Content</Dialog.Title>
            <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
          </div>
          <p className="mb-3 text-[13px] text-brand-gray-500">{template.name ?? template.code ?? template.templateType}</p>
          {content ? (
            <pre className="rounded-[8px] bg-[#f6f8fc] p-4 text-[11px] overflow-x-auto whitespace-pre-wrap text-[#333]">
              {JSON.stringify(content, null, 2)}
            </pre>
          ) : (
            <p className="py-8 text-center text-[13px] text-brand-gray-500">No content data.</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EditModal({ template, onClose, onSaved }: { template: SiteTemplate; onClose: () => void; onSaved: (updated: SiteTemplate) => void }) {
  const [form, setForm] = useState({ name: template.name ?? '', description: template.description ?? '', defaultThemeMode: template.defaultThemeMode ?? '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template.id) return;
    setSaving(true);
    try {
      const updated = await updateSiteTemplate(template.id, form);
      onSaved({ ...template, ...updated });
      toast.success('Template updated.');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[18px] font-bold">Edit Template</Dialog.Title>
            <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
          </div>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Name</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="rounded-[8px] border border-[#ddd] px-3 py-2.5 text-[13px] outline-none focus:border-brand-blue resize-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Default Theme Mode</label>
              <select value={form.defaultThemeMode} onChange={(e) => setForm((p) => ({ ...p, defaultThemeMode: e.target.value }))} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue bg-white">
                <option value="">System default</option>
                <option value="LIGHT">Light</option>
                <option value="DARK">Dark</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="text-[13px] text-brand-gray-500 hover:opacity-70">Cancel</button>
              <button type="submit" disabled={saving} className="h-[40px] rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function MinistrySiteTemplatesPage() {
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [resolved, setResolved] = useState<SiteTemplate | null>(null);
  const [viewContent, setViewContent] = useState<SiteTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<SiteTemplate | null>(null);

  useEffect(() => {
    getTenantSiteTemplates()
      .then((data) => setTemplates(data))
      .catch(() => {});
    getResolvedSiteTemplate()
      .then((data) => setResolved(data))
      .catch(() => {});
  }, []);

  const handlePublish = async (t: SiteTemplate) => {
    if (!t.id) return;
    try {
      const updated = await publishSiteTemplate(t.id, { makeDefault: false });
      setTemplates((prev) => prev.map((x) => x.id === t.id ? { ...x, ...updated } : x));
      toast.success('Template published.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed.');
    }
  };

  const handleDelete = async (t: SiteTemplate) => {
    if (!t.id) return;
    try {
      await deleteSiteTemplate(t.id);
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
      toast.success('Template deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleSaved = (updated: SiteTemplate) => {
    setTemplates((prev) => prev.map((x) => x.id === updated.id ? updated : x));
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Site Templates</h1>

      {resolved && (
        <div className="rounded-[14px] bg-white p-5">
          <p className="text-[13px] font-semibold mb-1">Active Template</p>
          <div className="flex items-center gap-4 text-[13px]">
            <span className="font-medium">{resolved.name ?? resolved.code ?? 'Default'}</span>
            <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px]">{resolved.templateType}</span>
            {resolved.publishedAt && <span className="text-brand-gray-500 text-[11px]">Published {new Date(resolved.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
          </div>
        </div>
      )}

      <div className="rounded-[14px] bg-white p-6">
        {templates.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-brand-gray-500">No site templates available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#f2f2f2] text-left text-[13px] text-[#333]">
                  {['Name', 'Type', 'Version', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="pb-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const isPublished = /published/i.test(String(t.status ?? '')) || !!t.publishedAt;
                  return (
                    <tr key={t.id} className="border-t border-[#f2f2f2]">
                      <td className="py-4">
                        <span className="block font-medium">{t.name ?? t.code ?? '—'}</span>
                        {t.description && <span className="block text-[11px] text-brand-gray-500 mt-0.5">{t.description}</span>}
                      </td>
                      <td className="py-4">
                        <span className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px]">{t.templateType ?? '—'}</span>
                      </td>
                      <td className="py-4 text-brand-gray-500">{t.templateVersion ?? t.schemaVersion ?? '—'}</td>
                      <td className="py-4">
                        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', isPublished ? 'bg-[#e7f7ee] text-[#34a853]' : 'bg-[#fff4e5] text-[#ff8d28]')}>
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3 text-[12px] font-medium">
                          <button type="button" onClick={() => setViewContent(t)} className="text-brand-gray-500 hover:text-brand-blue">View</button>
                          {!t.system && t.id && (
                            <button type="button" onClick={() => setEditTemplate(t)} className="text-brand-blue hover:opacity-70">Edit</button>
                          )}
                          {!isPublished && t.id && (
                            <button type="button" onClick={() => void handlePublish(t)} className="flex items-center gap-1 text-[#34a853] hover:opacity-70">
                              <Globe className="size-3" /> Publish
                            </button>
                          )}
                          {!t.system && t.id && (
                            <button type="button" onClick={() => void handleDelete(t)} className="text-[#eb0000] hover:opacity-70">
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
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

      {viewContent && <ContentModal template={viewContent} onClose={() => setViewContent(null)} />}
      {editTemplate && <EditModal template={editTemplate} onClose={() => setEditTemplate(null)} onSaved={handleSaved} />}
    </div>
  );
}
