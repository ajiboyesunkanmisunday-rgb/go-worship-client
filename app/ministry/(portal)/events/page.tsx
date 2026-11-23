'use client';

import { CheckInButton } from '@/components/ministry/check-in-button';
import { TableCard } from '@/components/shared/table-card';
import { ActionCard, StatCard } from '@/components/ministry/shared';
import { cn } from '@/lib/utils';
import { ChevronDown, Plus, X, Users } from 'lucide-react';
import {
  getTenantEvents,
  getTenantEvent,
  publishTenantEvent,
  unpublishTenantEvent,
  archiveTenantEvent,
  updateTenantEvent,
  recordEventAttendance,
  getEventAttendance,
  getEventRegistrations,
  getEventRegistration,
  cancelEventRegistration,
  type TenantEvent,
  type EventRegistration,
  type CreateEventPayload,
} from '@/lib/api/tenant';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import * as Dialog from '@radix-ui/react-dialog';

const STATUS_COLORS: Record<string, string> = {
  Upcoming: 'text-brand-blue',
  Completed: 'text-[#34a853]',
  Ongoing: 'text-[#ff8d28]',
  Cancelled: 'text-[#eb0000]',
  Archived: 'text-brand-gray-400',
  Published: 'text-[#34a853]',
};

type EventModal =
  | { type: 'attendance'; event: TenantEvent }
  | { type: 'registrations'; event: TenantEvent }
  | { type: 'edit'; event: TenantEvent }
  | { type: 'detail'; event: TenantEvent };

function EventActionsMenu({ event, onStatusChange, onEdit, onView }: { event: TenantEvent; onStatusChange: (id: string, status: string) => void; onEdit: (e: TenantEvent) => void; onView: (e: TenantEvent) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const status = event.status.toUpperCase();
  const isPublished = status === 'PUBLISHED' || status === 'ACTIVE' || status === 'LIVE';
  const isArchived = status === 'ARCHIVED';

  async function run(label: string, fn: () => Promise<unknown>, newStatus: string) {
    setOpen(false);
    try {
      await fn();
      toast.success(`${label} successful`);
      onStatusChange(event.id, newStatus);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `${label} failed`);
    }
  }

  const items = [
    { label: 'View', handler: () => { setOpen(false); onView(event); } },
    { label: 'Edit', handler: () => { setOpen(false); onEdit(event); } },
    ...(isPublished
      ? [{ label: 'Unpublish', handler: () => run('Unpublish', () => unpublishTenantEvent(event.id), 'Draft') }]
      : [{ label: 'Publish', handler: () => run('Publish', () => publishTenantEvent(event.id), 'Published') }]
    ),
    ...(!isArchived
      ? [{ label: 'Archive', handler: () => run('Archive', () => archiveTenantEvent(event.id), 'Archived'), danger: true }]
      : []
    ),
  ];

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-[6px] border border-[#e5e5e5] bg-white px-2.5 py-1 text-[11px] font-medium hover:bg-[#f5f5f5]"
      >
        Actions <ChevronDown className="size-3" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-36 overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-white shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.handler}
              className={cn(
                'w-full px-3 py-2 text-left text-[12px] transition-colors hover:bg-[#f5f5f5]',
                item.danger ? 'text-[#eb0000]' : 'text-[#333]'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MinistryEventsPage() {
  const [events, setEvents] = useState<TenantEvent[]>([]);
  const [modal, setModal] = useState<EventModal | null>(null);
  const [modalData, setModalData] = useState<EventRegistration[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);
  const [expandedRegDetail, setExpandedRegDetail] = useState<EventRegistration | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateEventPayload>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [attendeeId, setAttendeeId] = useState('');
  const [detailEventData, setDetailEventData] = useState<TenantEvent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getTenantEvents()
      .then((data) => setEvents(data))
      .catch(() => { toast.error('Could not load events.'); });
  }, []);

  function handleStatusChange(id: string, newStatus: string) {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: newStatus } : e));
  }

  function openAttendance(event: TenantEvent) {
    setModal({ type: 'attendance', event });
    setModalData([]);
    setModalLoading(true);
    getEventAttendance(event.id)
      .then((arr) => setModalData(arr as unknown as EventRegistration[]))
      .catch(() => toast.error('Could not load attendance.'))
      .finally(() => setModalLoading(false));
  }

  function openRegistrations(event: TenantEvent) {
    setModal({ type: 'registrations', event });
    setModalData([]);
    setModalLoading(true);
    getEventRegistrations(event.id)
      .then((arr) => setModalData(arr))
      .catch(() => toast.error('Could not load registrations.'))
      .finally(() => setModalLoading(false));
  }

  function openEdit(event: TenantEvent) {
    setEditForm({ name: event.name, location: event.location, eventDate: event.eventDate, eventTime: event.eventTime });
    setModal({ type: 'edit', event });
  }

  function openDetail(event: TenantEvent) {
    setDetailEventData(null);
    setDetailLoading(true);
    setModal({ type: 'detail', event });
    getTenantEvent(event.id)
      .then((fresh) => { if (fresh) setDetailEventData(fresh); })
      .catch(() => toast.error('Could not load event detail.'))
      .finally(() => setDetailLoading(false));
  }

  async function handleSaveEdit() {
    if (modal?.type !== 'edit') return;
    setEditSaving(true);
    try {
      await updateTenantEvent(modal.event.id, editForm);
      setEvents((prev) => prev.map((e) => e.id === modal.event.id ? { ...e, ...editForm } : e));
      toast.success('Event updated.');
      setModal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update event.');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleRecordAttendance(eventId: string) {
    if (!attendeeId.trim()) return;
    try {
      await recordEventAttendance({ event: { id: eventId }, userProfileId: attendeeId.trim(), status: 'PRESENT', source: 'MANUAL' });
      toast.success('Attendance recorded.');
      setAttendeeId('');
      // Reload attendance list
      setModalLoading(true);
      getEventAttendance(eventId)
        .then((arr) => setModalData(arr as unknown as EventRegistration[]))
        .catch(() => {})
        .finally(() => setModalLoading(false));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not record attendance.');
    }
  }

  function handleExpandRegistration(regId: string) {
    if (expandedRegId === regId) {
      setExpandedRegId(null);
      setExpandedRegDetail(null);
      return;
    }
    setExpandedRegId(regId);
    setExpandedRegDetail(null);
    getEventRegistration(regId).then((d) => {
      setExpandedRegDetail(d);
    }).catch(() => {});
  }

  async function handleCancelRegistration(regId: string) {
    try {
      await cancelEventRegistration(regId);
      setModalData((prev) => prev.map((r) => r.id === regId ? { ...r, status: 'CANCELLED' } : r));
      toast.success('Registration cancelled.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not cancel registration.');
    }
  }

  const upcoming = events.filter((e) => /upcoming/i.test(e.status)).length;
  const totalReg = events.reduce((sum, e) => sum + (Number(e.registrations) || 0), 0);

  const statusCounts = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled', 'Published', 'Archived'].map((s) => ({
    name: s,
    value: events.filter((e) => e.status.toLowerCase() === s.toLowerCase()).length,
  })).filter((d) => d.value > 0);
  const COLORS = ['#243f84', '#ff8d28', '#22a45d', '#eb0000', '#34a853', '#888'];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Events</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Events" value={String(events.length)} variant="blue" trend={[2,3,2,4,3,events.length]} />
        <StatCard title="Upcoming Events" value={String(upcoming)} variant="green" trend={[1,2,1,2,upcoming]} />
        <StatCard title="Total Registrations" value={String(totalReg)} variant="white" />
        <ActionCard
          href="/ministry/events/create"
          title="Create Event"
          subtitle="Click here to create events"
          icon={
            <span className="flex size-9 items-center justify-center rounded-full bg-[#22a45d]">
              <Plus className="size-5 text-white" />
            </span>
          }
        />
      </div>

      {events.length > 0 && statusCounts.length > 0 && (
        <div className="rounded-[14px] bg-white p-6">
          <p className="text-[16px] font-bold">Event Status Breakdown</p>
          <div className="mt-4 h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [String(v), 'Events']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                  {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <TableCard
        title="All Events"
        filterOptions={['Upcoming', 'Completed', 'Ongoing', 'Cancelled']}
        filterAll="All status"
      >
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="text-left text-[13px] text-[#333]">
              {['Event Name', 'Date & Time', 'Location', 'Registrations', 'Status', 'Actions'].map((h) => (
                <th key={h} className="py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const label = e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase();
              const dateStr = e.eventDate
                ? `${new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${e.eventTime ? ` • ${e.eventTime}` : ''}`
                : '';
              return (
                <tr key={e.id} className="border-t border-[#f2f2f2] text-[12px]">
                  <td className="py-4 font-medium">{e.name}</td>
                  <td className="py-4">{dateStr}</td>
                  <td className="py-4">{e.location}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <span>{e.registrations}</span>
                      {e.id && (
                        <button
                          type="button"
                          onClick={() => openRegistrations(e)}
                          className="text-brand-blue hover:underline"
                          title="View registrations"
                        >
                          <Users className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className={cn('py-4 font-medium', STATUS_COLORS[label] ?? '')}>{label}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <CheckInButton eventName={e.name} highlighted={false} />
                      {e.id && (
                        <EventActionsMenu event={e} onStatusChange={handleStatusChange} onEdit={openEdit} onView={openDetail} />
                      )}
                      {e.id && (
                        <button
                          type="button"
                          onClick={() => openAttendance(e)}
                          className="text-[11px] text-brand-gray-500 hover:text-brand-blue"
                          title="View attendance"
                        >
                          Attend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableCard>

      {/* Edit Event Modal */}
      <Dialog.Root open={modal?.type === 'edit'} onOpenChange={(v) => { if (!v) setModal(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[500px] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-[18px] font-bold">Edit Event</Dialog.Title>
              <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
            </div>
            <div className="flex flex-col gap-4">
              {(['name', 'location', 'eventDate', 'eventTime'] as const).map((field) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    value={String(editForm[field] ?? '')}
                    onChange={(e) => setEditForm((p) => ({ ...p, [field]: e.target.value }))}
                    type={field === 'eventDate' ? 'date' : field === 'eventTime' ? 'time' : 'text'}
                    className="h-[42px] rounded-[8px] border border-[#ddd] px-3 text-[13px] outline-none focus:border-brand-blue"
                  />
                </div>
              ))}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Dialog.Close className="text-[13px] text-brand-gray-500 hover:opacity-70">Cancel</Dialog.Close>
                <button type="button" disabled={editSaving} onClick={() => void handleSaveEdit()} className="h-[40px] rounded-[8px] bg-brand-blue px-5 text-[13px] font-medium text-white disabled:opacity-50">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Event Detail Modal */}
      <Dialog.Root open={modal?.type === 'detail'} onOpenChange={(v) => { if (!v) { setModal(null); setDetailEventData(null); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[500px] max-h-[80vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-7">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-[18px] font-bold">Event Detail</Dialog.Title>
              <Dialog.Close className="flex size-8 items-center justify-center rounded-full border border-[#ddd]"><X className="size-4" /></Dialog.Close>
            </div>
            {detailLoading ? (
              <p className="py-6 text-center text-[13px] text-brand-gray-500">Loading…</p>
            ) : detailEventData ? (
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                {([
                  ['Name', detailEventData.name],
                  ['Type', detailEventData.type],
                  ['Status', detailEventData.status],
                  ['Date', detailEventData.eventDate],
                  ['Time', detailEventData.eventTime],
                  ['Location', detailEventData.location],
                  ['Registrations', String(detailEventData.registrations ?? '—')],
                  ['Created', detailEventData.createdAt ? new Date(detailEventData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined],
                ] as [string, string | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-brand-gray-500">{label}</span>
                    <span className="font-medium break-words">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-[13px] text-brand-gray-500">No detail available.</p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Attendance / Registrations Modal */}
      <Dialog.Root open={modal?.type === 'attendance' || modal?.type === 'registrations'} onOpenChange={(v) => { if (!v) setModal(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[94%] max-w-[560px] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px] bg-white data-[state=open]:animate-in data-[state=open]:zoom-in-95 flex flex-col">
            <div className="flex items-start justify-between p-6 pb-4">
              <div>
                <Dialog.Title className="text-[18px] font-bold">
                  {modal?.type === 'attendance' ? 'Attendance' : 'Registrations'}
                </Dialog.Title>
                <p className="text-[12px] text-brand-gray-500 mt-0.5">{modal?.event.name}</p>
              </div>
              <Dialog.Close aria-label="Close">
                <span className="flex size-8 items-center justify-center rounded-full border border-[#ddd]">
                  <X className="size-4" />
                </span>
              </Dialog.Close>
            </div>
            {modal?.type === 'attendance' && (
              <div className="flex items-center gap-2 px-6 pb-3">
                <input
                  value={attendeeId}
                  onChange={(e) => setAttendeeId(e.target.value)}
                  placeholder="User profile ID to record…"
                  className="h-[36px] flex-1 rounded-[8px] border border-[#ddd] px-3 text-[12px] outline-none focus:border-brand-blue"
                />
                <button
                  type="button"
                  onClick={() => { if (modal?.event.id) void handleRecordAttendance(modal.event.id); }}
                  className="h-[36px] rounded-[8px] bg-brand-blue px-3 text-[12px] font-medium text-white hover:opacity-90"
                >
                  Record
                </button>
              </div>
            )}
            <div className="overflow-y-auto px-6 pb-6">
              {modalLoading ? (
                <p className="py-8 text-center text-[13px] text-brand-gray-500">Loading…</p>
              ) : modalData.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-brand-gray-500">No records found</p>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="text-left text-[11px] text-brand-gray-500">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Status</th>
                      {modal?.type === 'registrations' && <th className="pb-2 font-medium">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((r, i) => (
                      <>
                        <tr key={r.id ?? i} className="border-t border-[#f2f2f2]">
                          <td className="py-2.5">
                            <button
                              type="button"
                              onClick={() => r.id && handleExpandRegistration(r.id)}
                              className="text-left hover:underline"
                            >
                              {r.fullName || '—'}
                            </button>
                          </td>
                          <td className="py-2.5 text-brand-gray-500">{r.email || '—'}</td>
                          <td className="py-2.5">{r.status || '—'}</td>
                          {modal?.type === 'registrations' && (
                            <td className="py-2.5">
                              {r.id && r.status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  onClick={() => void handleCancelRegistration(r.id!)}
                                  className="text-[11px] font-medium text-[#eb0000] hover:underline"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                        {expandedRegId === r.id && (
                          <tr key={`${r.id ?? i}-detail`} className="bg-[#f9fafb]">
                            <td colSpan={modal?.type === 'registrations' ? 4 : 3} className="px-2 py-2 text-[11px] text-brand-gray-500">
                              {expandedRegDetail === null
                                ? 'Loading…'
                                : `Phone: ${expandedRegDetail.phone || '—'} | Registered: ${expandedRegDetail.registeredAt || '—'} | Checked in: ${expandedRegDetail.checkedInAt || '—'}`}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
