'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetPage } from '@/components/ui/sheet-page';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTenantRoleById, getTenantPermissions, deleteTenantRole } from '@/lib/api/tenant';
import { toast } from 'sonner';

const PERMS = ['View', 'Create', 'Edit', 'Delete', 'Export'];

type PermRow = { module: string; flags: boolean[] };

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

/** Admin Management → View Account role detail page. */
export function ViewAccount({ id }: { id?: string } = {}) {
  const router = useRouter();
  const back = '/ministry/admin-management';
  const [del, setDel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [matrix, setMatrix] = useState<PermRow[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getTenantRoleById(id).catch(() => null),
      getTenantPermissions().catch(() => []),
    ]).then(([role, perms]) => {
      if (role) {
        const r = role as Record<string, unknown>;
        setName(String(r['name'] ?? ''));
        setDescription(String(r['description'] ?? ''));
        setStatus(r['active'] === false ? 'Inactive' : 'Active');
        const ts = r['createdAt'] ?? r['created_at'] ?? '';
        if (ts) {
          try {
            setCreatedAt(new Date(String(ts)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
          } catch { setCreatedAt(String(ts)); }
        }
      }
      {
        const rows: PermRow[] = perms.map((p) => ({
          module: String((p as Record<string, unknown>)['name'] ?? (p as Record<string, unknown>)['code'] ?? ''),
          flags: PERMS.map(() => false),
        }));
        setMatrix(rows);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    if (!id) return;
    deleteTenantRole(id)
      .then(() => {
        toast.success('Role deleted.');
        router.push(back);
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : 'Could not delete role.');
        setDel(false);
      });
  };

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

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-7 animate-spin text-brand-blue" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[22px] font-bold">{name || 'Role'}</h1>
                <div className="mt-2 flex flex-col gap-1 text-[12px] text-brand-gray-500">
                  <p>Status: <span className="font-medium text-[#22a45d]">{status}</span></p>
                  {createdAt && <p>Created on: <span className="text-[#333]">{createdAt}</span></p>}
                </div>
              </div>
              <span className="flex size-[64px] shrink-0 items-center justify-center rounded-full bg-[#ff8d28]">
                <UserRound className="size-8 text-white" />
              </span>
            </div>

            <SectionBar label="Role Info:" />
            <div className="flex flex-col gap-4">
              <Field label="Role name" value={name} />
              <Field label="Description" value={description} />
            </div>

            {matrix.length > 0 && (
              <>
                <SectionBar label="Permissions Matrix:" />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse">
                    <thead>
                      <tr className="text-left text-[12px] text-[#333]">
                        <th className="py-2 font-medium">Module</th>
                        {PERMS.map((p) => (
                          <th key={p} className="py-2 text-center font-medium">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map((row) => (
                        <tr key={row.module} className="border-t border-[#f2f2f2]">
                          <td className="py-2.5 text-[12px] text-[#333]">{row.module}</td>
                          {row.flags.map((on, i) => (
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
              </>
            )}

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
          </>
        )}

        <ConfirmModal
          open={del}
          onOpenChange={setDel}
          onConfirm={handleDelete}
        />
      </div>
    </SheetPage>
  );
}
