'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, Mail, MessageSquare, ShieldCheck, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import {
  getMfaSettings,
  beginMfaEnrollment,
  completeEmailMfaEnrollment,
  completeTotpMfaEnrollment,
  updateMfaPreferences,
  disableMfaEnrollment,
  type MfaSettings,
} from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { USE_LIVE_API } from '@/lib/api/config';

type MfaMethod = 'OTP_EMAIL' | 'TOTP' | 'OTP_SMS';

type Enrolling = {
  method: 'OTP_EMAIL' | 'TOTP';
  tokenId?: string;
  secret?: string;
  otpauth?: string;
  /** Backend may send a pre-rendered base64 PNG QR code image. */
  qrCodeUrl?: string;
};

/**
 * Detect the specific backend bug on TOTP enrollment-complete where the server
 * validates a `tenantId` field that the request doesn't send, returning 400
 * with fieldErrors containing tenantId. Show a clear message rather than
 * "wrong code".
 */
function isTotpServerBug(e: unknown): boolean {
  if (!(e instanceof ApiError) || e.status !== 400) return false;
  const body = e.body as { fieldErrors?: { field?: string }[]; message?: string } | null;
  const fe = body?.fieldErrors;
  if (Array.isArray(fe) && fe.some((f) => String(f?.field).toLowerCase() === 'tenantid'))
    return true;
  return typeof body?.message === 'string' && /constraint|tenant/i.test(body.message);
}

function otpauthUri(secret?: string, provided?: string): string | null {
  if (provided && provided.startsWith('otpauth://')) return provided;
  if (!secret) return null;
  const issuer = 'Go-Worship';
  return `otpauth://totp/${encodeURIComponent(issuer)}?secret=${encodeURIComponent(
    secret.replace(/\s+/g, '')
  )}&issuer=${encodeURIComponent(issuer)}`;
}

const METHODS: { key: MfaMethod; title: string; desc: string; icon: typeof Mail }[] = [
  {
    key: 'TOTP',
    title: 'Authenticator app',
    desc: 'Use Google Authenticator, Authy, or 1Password. Most secure.',
    icon: Smartphone,
  },
  {
    key: 'OTP_EMAIL',
    title: 'Email code',
    desc: 'Receive a one-time code by email each time you sign in.',
    icon: Mail,
  },
  {
    key: 'OTP_SMS',
    title: 'Text message (SMS)',
    desc: 'Receive a one-time code by text message to your phone.',
    icon: MessageSquare,
  },
];

export function MfaManager() {
  const [settings, setSettings] = useState<MfaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [totpUnavailable, setTotpUnavailable] = useState(false);

  const refresh = async () => {
    if (!USE_LIVE_API) {
      setSettings({
        mfaEnabled: true,
        preferredMethod: 'TOTP',
        enrolledMethods: ['TOTP'],
        totpEnrolled: true,
        otpEmailAvailable: true,
        eligibleMethods: ['TOTP', 'OTP_EMAIL'],
      });
      setLoading(false);
      return;
    }
    try {
      const res = await getMfaSettings();
      setSettings(res.data ?? null);
    } catch {
      // Not available — stay as not configured.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const enrolled = new Set<string>(settings?.enrolledMethods ?? []);
  if (settings?.totpEnrolled) enrolled.add('TOTP');
  const anyEnabled = (settings?.mfaEnabled ?? false) || enrolled.size > 0;
  const enrolledList = METHODS.filter((m) => enrolled.has(m.key));
  const preferred = settings?.preferredMethod ?? enrolledList[0]?.key ?? '';
  const primaryMethod = preferred && enrolled.has(preferred) ? preferred : (enrolledList[0]?.key ?? '');

  async function startEnrol(method: 'OTP_EMAIL' | 'TOTP') {
    setBusy(`begin:${method}`);
    setCode('');
    try {
      const raw = await beginMfaEnrollment({ method });
      // Backend wraps in { ok, data: { ... } } — unwrap before reading fields.
      const r = ((raw as Record<string, unknown>).data as Record<string, unknown> | undefined) ?? (raw as Record<string, unknown>);
      if (method === 'OTP_EMAIL') {
        const tokenId = r.tokenId ? String(r.tokenId) : undefined;
        setEnrolling({ method, tokenId });
        toast.success('Code sent to your email');
      } else {
        const secret = r.secret ? String(r.secret) : undefined;
        const otpauth = r.otpauthUri ? String(r.otpauthUri) : undefined;
        // Backend may send a pre-rendered QR as data:image/png;base64,...
        const qrCodeUrl = typeof r.qrCodeUrl === 'string' && r.qrCodeUrl.startsWith('data:image/')
          ? r.qrCodeUrl
          : undefined;
        setEnrolling({ method, secret, otpauth, qrCodeUrl });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start setup');
    } finally {
      setBusy(null);
    }
  }

  async function confirmEnrol() {
    if (!enrolling || code.trim().length < 4) return;
    setBusy('complete');
    try {
      if (enrolling.method === 'OTP_EMAIL') {
        await completeEmailMfaEnrollment({
          method: 'OTP_EMAIL',
          tokenId: enrolling.tokenId ?? '',
          code: code.trim(),
        });
      } else {
        await completeTotpMfaEnrollment({
          method: 'TOTP',
          secret: enrolling.secret ?? '',
          code: code.trim(),
          makePreferred: true,
        });
      }
      toast.success('Two-factor authentication enabled');
      setEnrolling(null);
      setCode('');
      await refresh();
    } catch (e) {
      if (enrolling.method === 'TOTP' && isTotpServerBug(e)) {
        toast.error(
          'Authenticator-app setup is temporarily unavailable due to a server issue. Use "Email code" for now.'
        );
        setTotpUnavailable(true);
        setEnrolling(null);
        setCode('');
      } else {
        toast.error(e instanceof Error ? e.message : 'That code did not match');
      }
    } finally {
      setBusy(null);
    }
  }

  async function disable(method: 'OTP_EMAIL' | 'TOTP') {
    setBusy(`disable:${method}`);
    try {
      await disableMfaEnrollment(method);
      toast.success('Method removed');
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove that method');
    } finally {
      setBusy(null);
    }
  }

  async function makePreferred(method: string) {
    setBusy(`prefer:${method}`);
    try {
      await updateMfaPreferences({ enabled: true, preferredMethod: method });
      toast.success('Preferred method updated');
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update preference');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-[14px] bg-white p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-[#22a45d]" aria-hidden="true" />
        <h2 className="text-[18px] font-bold">Two-factor authentication</h2>
        {!loading && anyEnabled && (
          <span className="rounded-full bg-[#e7f7ee] px-2.5 py-0.5 text-[11px] font-medium text-[#34a853]">
            On
          </span>
        )}
        {!loading && !anyEnabled && (
          <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280]">
            Off
          </span>
        )}
      </div>
      <p className="mt-1 text-[13px] text-brand-gray-500">
        Add a second step when signing in, so a password alone isn&apos;t enough.
      </p>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-[13px] text-brand-gray-500">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading your security settings…
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {enrolled.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#dfe6ff] bg-[#f7f9ff] p-4">
              <div className="min-w-[180px]">
                <p className="text-[14px] font-semibold">Primary method</p>
                <p className="max-w-[300px] text-[12px] text-brand-gray-500">
                  {enrolled.size > 1
                    ? 'The method you\'ll be asked for first when signing in.'
                    : 'Enrol a second method below to add a backup you can switch to.'}
                </p>
              </div>
              <div className="ml-auto">
                <NativeSelect
                  aria-label="Primary two-factor method"
                  value={primaryMethod}
                  disabled={!!busy || enrolled.size < 2}
                  onChange={(e) => makePreferred(e.target.value)}
                  className="h-[42px] min-w-[190px] bg-white"
                >
                  {enrolledList.map((m) => (
                    <NativeSelectOption key={m.key} value={m.key}>
                      {m.title}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {METHODS.map((m) => {
              const on = enrolled.has(m.key);
              const isPreferred = primaryMethod === m.key;
              const isSms = m.key === 'OTP_SMS';
              const Icon = m.icon;
              return (
                <div
                  key={m.key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#ededed] p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                        on ? 'bg-[#e7f7ee] text-[#22a45d]' : 'bg-[#f2f2f2] text-brand-gray-500'
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                        {m.title}
                        {on && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-[#22a45d]">
                            <Check className="size-3" aria-hidden="true" /> Enrolled
                          </span>
                        )}
                        {isPreferred && on && (
                          <span className="rounded-full bg-[#eef1ff] px-2 py-0.5 text-[10px] font-medium text-brand-blue">
                            Preferred
                          </span>
                        )}
                      </p>
                      <p className="max-w-[420px] text-[12px] leading-snug text-brand-gray-500">
                        {m.desc}
                      </p>
                      {m.key === 'TOTP' && totpUnavailable && !on && (
                        <p className="mt-1 max-w-[420px] text-[12px] font-medium leading-snug text-[#b45309]">
                          Temporarily unavailable due to a server issue — use Email code for now.
                        </p>
                      )}
                      {isSms && (
                        <p className="mt-1 max-w-[420px] text-[12px] leading-snug text-brand-gray-500">
                          Coming soon — text-message codes aren&apos;t enabled yet. Set up another
                          method now and switch when SMS is available.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {on ? (
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => disable(m.key as 'OTP_EMAIL' | 'TOTP')}
                        className="min-h-[24px] rounded-[5px] border-[0.5px] border-[#3E3E3E] bg-transparent px-3 py-1 text-[14px] font-medium leading-[150%] text-destructive transition-colors hover:bg-brand-gray-100 disabled:opacity-50"
                      >
                        {busy === `disable:${m.key}` ? 'Removing…' : 'Remove'}
                      </button>
                    ) : isSms ? (
                      <span className="rounded-full bg-[#fff4e5] px-3 py-1.5 text-[11px] font-medium text-[#ff8d28]">
                        Coming soon
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!!busy}
                        onClick={() => startEnrol(m.key as 'OTP_EMAIL' | 'TOTP')}
                      >
                        {busy === `begin:${m.key}` ? 'Starting…' : 'Enable'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {enrolling && (
        <div className="mt-4 rounded-[10px] border border-[#dfe6ff] bg-[#f7f9ff] p-4">
          {enrolling.method === 'TOTP' ? (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-medium">
                Add this account to your authenticator app
              </p>
              <p className="text-[12px] text-brand-gray-500">
                Scan this QR code with Google Authenticator, Authy, or 1Password — then enter the
                6-digit code it shows.
              </p>
              {/* Prefer the backend-rendered PNG; fall back to generating from secret */}
              {enrolling.qrCodeUrl ? (
                <div className="mt-1 flex w-fit justify-center rounded-[10px] bg-white p-3 shadow-sm">
                  <img src={enrolling.qrCodeUrl} width={168} height={168} alt="QR code for authenticator app" />
                </div>
              ) : otpauthUri(enrolling.secret, enrolling.otpauth) ? (
                <div className="mt-1 flex w-fit justify-center rounded-[10px] bg-white p-3 shadow-sm">
                  <QRCodeSVG
                    value={otpauthUri(enrolling.secret, enrolling.otpauth)!}
                    size={168}
                    level="M"
                  />
                </div>
              ) : null}
              {enrolling.secret && (
                <div className="mt-1">
                  <p className="text-[12px] text-brand-gray-500">
                    Can&apos;t scan? Enter this setup key manually:
                  </p>
                  <code className="mt-1 block break-all rounded-[8px] bg-white px-3 py-2 font-mono text-[13px] tracking-wide">
                    {enrolling.secret}
                  </code>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] font-medium">Enter the code we emailed you</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="123456"
              inputMode="numeric"
              className="h-[44px] w-[140px] text-center tracking-[0.3em]"
              aria-label="Verification code"
            />
            <Button
              disabled={busy === 'complete' || code.trim().length < 4}
              onClick={confirmEnrol}
            >
              {busy === 'complete' ? 'Verifying…' : 'Verify & enable'}
            </Button>
            <Button
              variant="outline"
              disabled={busy === 'complete'}
              onClick={() => { setEnrolling(null); setCode(''); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
