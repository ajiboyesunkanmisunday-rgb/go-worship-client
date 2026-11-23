'use client';

import { useState, useEffect, useCallback } from 'react';
import { SmartTable, type SmartRow } from '@/components/shared/smart-table';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ClipboardList, Loader2, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  getSystemRoles,
  getSystemPermissions,
  getSystemRole,
  getSystemRolePermissions,
  updateSystemRole,
  updateSystemRolePermissions,
  deleteSystemRole,
  getSystemPermissionById,
  createSystemRole,
  createSystemPermission,
  updateSystemPermission,
  deleteSystemPermission,
  type SystemRole,
  type SystemPermission,
  type SystemRolePayload,
} from '@/lib/api/system';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/shared/confirm-modal';

type Role = {
  id: string;
  name: string;
  type: string;
  scope: string;
  permissionCount: number;
  status: string;
};

type Permission = {
  id: string;
  name: string;
  category: string;
  scope: string;
  description: string;
  status: string;
};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#f2f2f2]">
        <ClipboardList className="size-7 text-[#bbb]" />
      </div>
      <p className="text-[14px] text-[#888]">No {label} found</p>
    </div>
  );
}

function PermDetailModal({
  permId,
  open,
  onClose,
}: {
  permId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [perm, setPerm] = useState<SystemPermission | null>(null);
  useEffect(() => {
    if (!permId || !open) return;
    getSystemPermissionById(permId).then(setPerm).catch(() => {});
  }, [permId, open]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92%] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
          <div className="flex items-start justify-between">
            <Dialog.Title className="text-[18px] font-bold">Permission Details</Dialog.Title>
            <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {perm ? (
            <div className="mt-5 flex flex-col gap-4">
              <InfoRow label="Name" value={String(perm.name ?? '')} />
              <InfoRow label="Code" value={String(perm.code ?? '')} />
              <InfoRow label="Type / Category" value={String(perm.type ?? '')} />
              <InfoRow label="Description" value={String(perm.description ?? '')} />
            </div>
          ) : (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-brand-blue" /></div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RoleDetailDrawer({
  roleId,
  open,
  onClose,
  onDeleted,
}: {
  roleId: string | null;
  open: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [role, setRole] = useState<SystemRole | null>(null);
  const [allPerms, setAllPerms] = useState<SystemPermission[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!roleId) return;
    setLoading(true);
    Promise.all([
      getSystemRole(roleId),
      getSystemPermissions(),
      getSystemRolePermissions(roleId),
    ]).then(([r, perms, rp]) => {
      setRole(r);
      setName(String(r.name ?? ''));
      setDescription(String(r.description ?? ''));
      setAllPerms(perms);
      const ids = new Set<string>();
      if (Array.isArray(rp)) {
        (rp as SystemPermission[]).forEach((p) => { const pid = String(p.id ?? p.code ?? ''); if (pid) ids.add(pid); });
      } else if (rp && typeof rp === 'object') {
        const r2 = rp as Record<string, unknown>;
        const pa = (r2.permissions ?? r2.permissionIds) as unknown[];
        if (Array.isArray(pa)) {
          pa.forEach((p) => {
            if (typeof p === 'string') ids.add(p);
            else if (p && typeof p === 'object') {
              const pp = p as Record<string, unknown>;
              const pid = String(pp.id ?? pp.code ?? '');
              if (pid) ids.add(pid);
            }
          });
        }
      }
      setAssigned(ids);
    }).catch(() => { toast.error('Could not load role details.'); })
    .finally(() => setLoading(false));
  }, [roleId]);

  useEffect(() => {
    if (open) load();
    else { setRole(null); setEditing(false); setAssigned(new Set()); }
  }, [open, load]);

  const togglePerm = (permId: string) => {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!roleId) return;
    setSaving(true);
    try {
      await updateSystemRole(roleId, { name, description });
      await updateSystemRolePermissions(roleId, { permissionIds: [...assigned] });
      toast.success('Role updated.');
      setEditing(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!roleId) return;
    setDeleting(true);
    try {
      await deleteSystemRole(roleId);
      toast.success('Role deleted.');
      onDeleted(roleId);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const grouped = allPerms.reduce<Record<string, SystemPermission[]>>((acc, p) => {
    const cat = String(p.type ?? 'Other');
    (acc[cat] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl data-[state=open]:animate-in data-[state=open]:slide-in-from-right-5">
            <div className="flex items-start justify-between border-b border-[#eee] px-6 py-5">
              <div>
                <Dialog.Title className="text-[20px] font-bold">
                  {loading ? 'Loading…' : (role?.name ?? 'Role')}
                </Dialog.Title>
                <p className="mt-0.5 text-[12px] text-brand-gray-500">
                  {role?.description || 'Platform role'}
                </p>
              </div>
              <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd] hover:bg-[#f5f5f5]">
                <X className="size-4" />
              </Dialog.Close>
            </div>

            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="size-7 animate-spin text-brand-blue" />
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-0 overflow-y-auto px-6 py-5">
                {editing ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-[#333]">Role Name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-medium text-[#333]">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="rounded-[8px] border border-[#ddd] px-3 py-2 text-[13px] outline-none focus:border-brand-blue resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 flex flex-col gap-2">
                    <InfoRow label="Type" value={String(role?.type ?? '')} />
                    <InfoRow label="Status" value={role?.active === false ? 'Inactive' : 'Active'} />
                    <InfoRow label="Code" value={String(role?.code ?? '')} />
                  </div>
                )}

                <p className="mt-4 text-[13px] font-semibold text-[#333]">
                  Permissions
                  {editing && <span className="ml-2 text-[11px] font-normal text-brand-gray-500">(check to assign)</span>}
                </p>

                {Object.entries(grouped).map(([cat, perms]) => (
                  <div key={cat} className="mt-3">
                    <p className="mb-1.5 rounded bg-[#f4f7ff] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-blue">
                      {cat}
                    </p>
                    <div className="flex flex-col gap-1">
                      {perms.map((p) => {
                        const pid = String(p.id ?? p.code ?? '');
                        const checked = assigned.has(pid);
                        return (
                          <label
                            key={pid}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-[8px] px-3 py-2.5 transition-colors',
                              editing ? 'hover:bg-[#f4f7ff]' : 'cursor-default',
                              checked && !editing ? 'bg-[#f4f7ff]' : ''
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                                checked
                                  ? 'border-brand-blue bg-brand-blue'
                                  : 'border-[#ccc] bg-white'
                              )}
                              onClick={() => editing && togglePerm(pid)}
                            >
                              {checked && <Check className="size-2.5 text-white" />}
                            </span>
                            <span className="flex flex-col">
                              <span className="text-[13px] font-medium text-[#333]">{p.name ?? p.code}</span>
                              {p.description && (
                                <span className="text-[11px] text-brand-gray-500">{p.description}</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#eee] px-6 py-4">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="text-[13px] text-brand-gray-500 hover:opacity-70"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className="flex h-[38px] items-center gap-2 rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white disabled:opacity-50"
                  >
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setConfirmDelete(true)}
                    className="text-[13px] font-medium text-[#eb0000] hover:opacity-70 disabled:opacity-50"
                  >
                    Delete Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex h-[38px] items-center gap-2 rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white"
                  >
                    Edit Role <ChevronRight className="size-4" />
                  </button>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f4f4f4] py-2.5 last:border-0">
      <span className="text-[12px] text-brand-gray-500">{label}</span>
      <span className="text-right text-[13px] font-medium text-[#333]">{value || '—'}</span>
    </div>
  );
}

function CreateRoleModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload: SystemRolePayload = { name: name.trim(), description: description.trim() || undefined, type: type.trim() || undefined };
      await createSystemRole(payload);
      toast.success('Role created.');
      setName(''); setDescription(''); setType('');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-[18px] font-bold">Create Role</Dialog.Title>
            <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
          </div>
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Role Name <span className="text-[#eb0000]">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. Content Manager" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Type</label>
              <input value={type} onChange={(e) => setType(e.target.value)} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. System, Custom" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-[8px] border border-[#ddd] px-3 py-2 text-[13px] outline-none focus:border-brand-blue resize-none" placeholder="Short description of this role" />
            </div>
            <button type="submit" disabled={saving || !name.trim()} className="mt-1 flex h-[44px] items-center justify-center gap-2 rounded-[8px] bg-brand-blue text-[13px] font-medium text-white disabled:opacity-50">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? 'Creating…' : 'Create Role'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EditPermModal({
  perm,
  open,
  onClose,
  onSaved,
  onDeleted,
}: {
  perm: Permission | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (perm) { setName(perm.name); setDescription(perm.description); }
  }, [perm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perm?.id) return;
    setSaving(true);
    try {
      await updateSystemPermission(perm.id, { name: name.trim(), description: description.trim() });
      toast.success('Permission updated.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!perm?.id) return;
    setDeleting(true);
    try {
      await deleteSystemPermission(perm.id);
      toast.success('Permission deleted.');
      onDeleted(perm.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-[18px] font-bold">Edit Permission</Dialog.Title>
              <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
            </div>
            <form onSubmit={(e) => void handleSave(e)} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-[8px] border border-[#ddd] px-3 py-2 text-[13px] outline-none focus:border-brand-blue resize-none" />
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                  className="text-[13px] font-medium text-[#eb0000] hover:opacity-70 disabled:opacity-50"
                >
                  Delete
                </button>
                <button type="submit" disabled={saving} className="flex h-[40px] items-center gap-2 rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white disabled:opacity-50">
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <ConfirmModal open={confirmDelete} onOpenChange={setConfirmDelete} onConfirm={() => void handleDelete()} />
    </>
  );
}

function CreatePermModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createSystemPermission({ name: name.trim(), description: description.trim() || undefined, type: category.trim() || undefined });
      toast.success('Permission created.');
      setName(''); setDescription(''); setCategory('');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[92%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-[18px] font-bold">Create Permission</Dialog.Title>
            <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
          </div>
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Name <span className="text-[#eb0000]">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. manage.events" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Category / Type</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. Events, Members" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-[8px] border border-[#ddd] px-3 py-2 text-[13px] outline-none focus:border-brand-blue resize-none" />
            </div>
            <button type="submit" disabled={saving || !name.trim()} className="mt-1 flex h-[44px] items-center justify-center gap-2 rounded-[8px] bg-brand-blue text-[13px] font-medium text-white disabled:opacity-50">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? 'Creating…' : 'Create Permission'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function SystemRolesPage() {
  const [activeTab, setActiveTab] = useState<'Roles' | 'Permissions'>('Roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermId, setSelectedPermId] = useState<string | null>(null);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [createPermOpen, setCreatePermOpen] = useState(false);
  const [editPermOpen, setEditPermOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null);

  const loadAll = useCallback(() => {
    getSystemRoles()
      .then((arr) => {
        const mapped: Role[] = arr.map((r) => ({
          id: String(r.id ?? r.code ?? ''),
          name: String(r.name ?? r.code ?? ''),
          type: String(r.type ?? 'System'),
          scope: 'Platform',
          permissionCount: 0,
          status: r.active === false ? 'Inactive' : 'Active',
        })).filter((r) => r.name);
        if (mapped.length > 0) setRoles(mapped);
      })
      .catch(() => {});

    getSystemPermissions()
      .then((arr) => {
        const mapped: Permission[] = arr.map((p) => ({
          id: String(p.id ?? p.code ?? ''),
          name: String(p.name ?? p.code ?? ''),
          category: String(p.type ?? ''),
          scope: 'System',
          description: String(p.description ?? ''),
          status: 'Active',
        })).filter((p) => p.name);
        if (mapped.length > 0) setPermissions(mapped);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openRoleDrawer = (id: string) => {
    setSelectedRoleId(id);
    setRoleDrawerOpen(true);
  };

  const openPermModal = (id: string) => {
    setSelectedPermId(id);
    setPermModalOpen(true);
  };

  const handleRoleDeleted = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
  };

  const openEditPerm = (p: Permission) => {
    setEditingPerm(p);
    setEditPermOpen(true);
  };

  const handlePermDeleted = (id: string) => {
    setPermissions((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeletePermDirect = async (id: string) => {
    try {
      await deleteSystemPermission(id);
      toast.success('Permission deleted.');
      handlePermDeleted(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const roleRows: SmartRow[] = roles.map((r) => ({
    group: r.status,
    text: [r.name, r.type, r.scope, String(r.permissionCount), r.status],
    cells: [
      <span key="n" className="flex items-center gap-2 font-medium">
        <span className="flex size-7 items-center justify-center rounded-[6px] bg-[#e9f0ff]">
          <ShieldCheck className="size-3.5 text-brand-blue" />
        </span>
        {r.name}
      </span>,
      <span key="t" className="text-brand-gray-500">{r.type}</span>,
      <span key="sc" className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px] text-[#555]">{r.scope}</span>,
      <span key="p">{r.permissionCount}</span>,
      <span
        key="s"
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-medium',
          r.status === 'Active' ? 'bg-[#e7f7ee] text-[#34a853]' : 'bg-[#fde8e8] text-[#eb0000]'
        )}
      >
        {r.status}
      </span>,
      <span key="a" className="flex items-center gap-3 text-[12px] font-medium">
        <button
          type="button"
          onClick={() => openRoleDrawer(r.id)}
          className="text-brand-blue hover:opacity-70"
        >
          View / Edit
        </button>
        <button
          type="button"
          onClick={() => openRoleDrawer(r.id)}
          className="text-[#eb0000] hover:opacity-70"
        >
          Delete
        </button>
      </span>,
    ],
  }));

  const permRows: SmartRow[] = permissions.map((p) => ({
    group: p.category,
    text: [p.name, p.category, p.scope, p.description, p.status],
    cells: [
      <span key="n" className="font-medium">{p.name}</span>,
      <span key="c" className="text-brand-gray-500">{p.category}</span>,
      <span key="sc" className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[11px] text-[#555]">{p.scope}</span>,
      <span key="d" className="max-w-[260px] text-brand-gray-500">{p.description}</span>,
      <span key="s" className="rounded-full bg-[#e7f7ee] px-2.5 py-1 text-[11px] font-medium text-[#34a853]">
        {p.status}
      </span>,
      <span key="a" className="flex items-center gap-3 text-[12px] font-medium">
        <button
          type="button"
          onClick={() => openPermModal(p.id)}
          className="text-brand-blue hover:opacity-70"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => openEditPerm(p)}
          className="text-brand-gray-500 hover:opacity-70"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => void handleDeletePermDirect(p.id)}
          className="text-[#eb0000] hover:opacity-70"
        >
          <Trash2 className="size-3.5" />
        </button>
      </span>,
    ],
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#e9f0ff]">
          <ShieldCheck className="size-5 text-brand-blue" />
        </span>
        <div>
          <h1 className="text-[26px] font-bold lg:text-[32px]">Roles &amp; Permissions</h1>
          <p className="mt-1 text-[14px] text-brand-gray-500">
            Platform roles and what each one can do
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[13px]">
          {(['Roles', 'Permissions'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={cn(
                'rounded-full px-4 py-1.5 font-medium transition-colors',
                activeTab === t
                  ? 'bg-brand-blue text-white'
                  : 'bg-[#f2f2f2] text-brand-gray-500 hover:bg-[#e6e6e6]'
              )}
            >
              {t} {t === 'Roles' ? roles.length : permissions.length}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => activeTab === 'Roles' ? setCreateRoleOpen(true) : setCreatePermOpen(true)}
          className="flex items-center gap-1.5 rounded-[8px] bg-brand-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          {activeTab === 'Roles' ? 'New Role' : 'New Permission'}
        </button>
      </div>

      {activeTab === 'Roles' ? (
        roles.length === 0 ? (
          <div className="rounded-[14px] bg-white p-6"><EmptyState label="roles" /></div>
        ) : (
          <SmartTable
            headers={['Role', 'Type', 'Scope', 'Permissions', 'Status', 'Action']}
            rows={roleRows}
            filterOptions={['Active', 'Inactive']}
            filterAll="All roles"
          />
        )
      ) : (
        <SmartTable
          headers={['Permission', 'Category', 'Scope', 'Description', 'Status', 'Action']}
          rows={permRows}
          filterAll="All categories"
        />
      )}

      <RoleDetailDrawer
        roleId={selectedRoleId}
        open={roleDrawerOpen}
        onClose={() => setRoleDrawerOpen(false)}
        onDeleted={handleRoleDeleted}
      />

      <PermDetailModal
        permId={selectedPermId}
        open={permModalOpen}
        onClose={() => { setPermModalOpen(false); setSelectedPermId(null); }}
      />

      <CreateRoleModal
        open={createRoleOpen}
        onClose={() => setCreateRoleOpen(false)}
        onCreated={loadAll}
      />

      <CreatePermModal
        open={createPermOpen}
        onClose={() => setCreatePermOpen(false)}
        onCreated={loadAll}
      />

      <EditPermModal
        perm={editingPerm}
        open={editPermOpen}
        onClose={() => { setEditPermOpen(false); setEditingPerm(null); }}
        onSaved={loadAll}
        onDeleted={handlePermDeleted}
      />
    </div>
  );
}
