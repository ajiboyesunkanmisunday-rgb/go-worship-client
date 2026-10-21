'use client';

import { useState, useEffect } from 'react';
import { USE_LIVE_API } from '@/lib/api/config';
import {
  AlignLeft,
  Bold,
  ChevronDown,
  Download,
  FileText,
  Italic,
  Link2,
  List,
  Paperclip,
  Search,
  Underline,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * System → Support Management (778:38441). A 3-column support desk:
 *  1. Recent Tickets list (search + "My open tickets", ticket cards w/ badges)
 *  2. Ticket conversation + rich-text reply editor
 *  3. Visitor Information (Basic + Device details) + Files Shared
 * Replaces the earlier pattern-built "4 stat cards + Support Tickets table".
 */

type Ticket = {
  id: string;
  name: string;
  preview: string;
  badges: { label: string; tone: 'open' | 'priority' }[];
};

const TICKETS: Ticket[] = [
  { id: 't1', name: 'Grace of God Mission', preview: 'Help needed for payment failure', badges: [{ label: 'Open', tone: 'open' }, { label: 'High priority', tone: 'priority' }] },
  { id: 't2', name: 'Christ the King', preview: 'I need help to process the payment', badges: [{ label: 'Open', tone: 'open' }, { label: 'High priority', tone: 'priority' }] },
  { id: 't3', name: 'Believers World', preview: 'Can you review the latest marketing…', badges: [{ label: 'Open', tone: 'open' }, { label: 'High priority', tone: 'priority' }] },
  { id: 't4', name: 'Power Solutions Inter', preview: "Let's schedule a team meeting…", badges: [{ label: 'Open', tone: 'open' }, { label: 'High priority', tone: 'priority' }] },
  { id: 't5', name: 'Liam Johnson', preview: 'Please send me the updated project…', badges: [{ label: 'Open', tone: 'open' }, { label: 'High priority', tone: 'priority' }] },
];

const TONE = {
  open: 'bg-[#e9f0ff] text-brand-blue',
  priority: 'bg-[#fff4e5] text-[#ff8d28]',
};

export default function SystemSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(USE_LIVE_API ? [] : TICKETS);
  const [active, setActive] = useState(USE_LIVE_API ? '' : 't1');
  const current = tickets.find((t) => t.id === active) ?? tickets[0];
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const [ticketTitle, setTicketTitle] = useState(USE_LIVE_API ? '' : 'Help needed for payment failure');
  const [ticketBody, setTicketBody] = useState(USE_LIVE_API ? '' : 'I need help to process the payment after the checkout. I need to send out this campaign within today. Can you please help ASAP?');
  const [ticketDate, setTicketDate] = useState(USE_LIVE_API ? '' : '23rd December 4:15pm');
  const [ticketFiles, setTicketFiles] = useState<string[]>(USE_LIVE_API ? [] : ['Doc.pdf', 'Doc.pdf']);
  const [visitorEmail, setVisitorEmail] = useState(USE_LIVE_API ? '' : 'dean.laptop@gmail.com');
  const [visitorPhone, setVisitorPhone] = useState(USE_LIVE_API ? '' : '+234 812 345 6789');
  const [visitorLocation, setVisitorLocation] = useState(USE_LIVE_API ? '' : 'Nigeria (View on map)');
  const [visitorLocalTime, setVisitorLocalTime] = useState(USE_LIVE_API ? '' : '04:30 am / 2:30 pm');
  const [visitorLanguage, setVisitorLanguage] = useState(USE_LIVE_API ? '' : 'English');
  const [visitorIp, setVisitorIp] = useState(USE_LIVE_API ? '' : '107.116.97.201');
  const [visitorOs, setVisitorOs] = useState(USE_LIVE_API ? '' : 'Windows 10');
  const [visitorBrowser, setVisitorBrowser] = useState(USE_LIVE_API ? '' : 'Mozilla Firefox');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    // /system/support/tickets not in backend API — disabled.
  }, [active]);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    // /system/support/tickets not in backend API — disabled.
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Support Management</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_300px]">
        {/* ---- Column 1: Recent Tickets ---- */}
        <div className="rounded-[14px] border border-[#eee] p-4">
          <p className="text-[15px] font-semibold">Recent Tickets</p>
          <div className="mt-3 flex items-center gap-2 rounded-full border border-[#e5e5e5] px-3 py-2">
            <Search className="size-4 text-brand-gray-500" />
            <input
              placeholder="Search"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-brand-gray-500"
            />
          </div>

          <p className="mt-4 text-[12px] font-medium text-brand-gray-500">
            My open tickets (8)
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={cn(
                  'flex flex-col gap-2 rounded-[10px] border p-3 text-left transition-colors',
                  active === t.id
                    ? 'border-brand-blue bg-[#f4f8ff]'
                    : 'border-[#eee] hover:bg-[#f7f9fc]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eef1f6] text-[11px] font-semibold">
                    {t.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{t.name}</p>
                    <p className="truncate text-[11px] text-brand-gray-500">
                      {t.preview}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.badges.map((b) => (
                    <span
                      key={b.label}
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        TONE[b.tone]
                      )}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ---- Column 2: Conversation ---- */}
        <div className="flex flex-col rounded-[14px] border border-[#eee] p-5">
          <p className="text-[16px] font-bold">{ticketTitle}</p>
          <p className="text-[12px] text-brand-gray-500">
            {current?.name} · {ticketDate}
          </p>

          <div className="mt-4 flex-1 rounded-[10px] bg-[#f7f9fc] p-4 text-[13px] text-[#333]">
            <p>Hi,</p>
            <p className="mt-2">{ticketBody}</p>
            <p className="mt-2">Thanks</p>
            {ticketFiles.slice(0, 1).map((f, i) => (
              <div key={i} className="mt-3 flex items-center gap-2 rounded-[8px] border border-[#e5e5e5] bg-white p-2 text-[12px]">
                <FileText className="size-4 text-[#eb0000]" />
                {f}
              </div>
            ))}
          </div>

          {/* Reply editor */}
          <div className="mt-4 rounded-[10px] border border-[#e5e5e5]">
            <div className="flex flex-wrap items-center gap-1 border-b border-[#eee] px-3 py-2 text-brand-gray-500">
              <span className="flex items-center gap-1 rounded px-2 py-1 text-[12px] hover:bg-[#f2f2f2]">
                Paragraph <ChevronDown className="size-3" />
              </span>
              <span className="mx-1 h-4 w-px bg-[#e5e5e5]" />
              {[Bold, Italic, Underline, List, AlignLeft, Link2].map((Icon, i) => (
                <span
                  key={i}
                  className="flex size-7 items-center justify-center rounded hover:bg-[#f2f2f2]"
                >
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to…"
              className="min-h-[90px] w-full resize-none bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-brand-gray-500"
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <Paperclip className="size-4 text-brand-gray-500" />
              <Button
                size="lg"
                className="h-[40px] px-6"
                disabled={!reply.trim() || sending}
                onClick={async () => {
                  if (USE_LIVE_API) {
                    // /system/support/tickets not in backend API — disabled.
                  }
                  setReply('');
                }}
              >
                {sending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
        </div>

        {/* ---- Column 3: Visitor Information ---- */}
        <div className="flex flex-col gap-4">
          <button
            type="button"
            className="flex items-center justify-between rounded-[10px] border border-[#e5e5e5] px-4 py-3 text-[13px] font-medium"
          >
            Tickets Actions <ChevronDown className="size-4" />
          </button>

          <div className="rounded-[14px] border border-[#eee] p-5">
            <p className="text-[15px] font-bold">Visitor Information</p>

            <p className="mt-4 text-[12px] font-semibold text-brand-gray-500">
              Basic Details
            </p>
            <div className="mt-2 flex flex-col gap-3">
              <Info label="Email" value={visitorEmail} />
              <Info label="Phone" value={visitorPhone} />
              <Info label="Location" value={visitorLocation} />
              <Info label="Local time" value={visitorLocalTime} />
              <Info label="Language" value={visitorLanguage} />
            </div>

            <p className="mt-5 text-[12px] font-semibold text-brand-gray-500">
              Device Details
            </p>
            <div className="mt-2 flex flex-col gap-3">
              <Info label="IP" value={visitorIp} />
              <Info label="OS" value={visitorOs} />
              <Info label="Browser" value={visitorBrowser} />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#eee] p-5">
            <p className="text-[15px] font-bold">Files Shared</p>
            <div className="mt-3 flex flex-col gap-2">
              {ticketFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[8px] border border-[#e5e5e5] p-2.5 text-[12px]"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="size-4 text-[#eb0000]" />
                    {f}
                  </span>
                  <Download className="size-4 text-brand-gray-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[12px]">
      <span className="text-brand-gray-500">{label}</span>
      <span className="text-right font-medium text-[#333]">{value}</span>
    </div>
  );
}
