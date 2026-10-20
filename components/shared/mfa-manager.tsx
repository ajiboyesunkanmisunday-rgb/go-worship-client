'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, Smartphone, Mail, MessageSquare, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  getMfaSettings,
  beginMfaEnrollment,
  completeEmailMfaEnrollment,
  completeTotpMfaEnrollment,
  updateMfaPreferences,
  disableMfaEnrollment,
  type MfaSettings,
  type OtpEmailEnrollBeginResponse,
  type TotpEnrollBeginResponse,
} from '@/lib/api/auth';

type EnrollStep = 'idle' | 'choose_method' | 'email_sent' | 'totp_scan';

const METHOD_LABELS: Record<string, string> = {
  OTP_EMAIL: 'Email code',
  TOTP: 'Authenticator app',
  PASSKEY: 'Passkey',
  PUSH_FCM: 'Push notification',
  OTP_SMS: 'Text message (SMS)',
};

function MethodIcon({ method, enrolled }: { method: string; enrolled: boolean }) {
  const bg = enrolled ? 'bg-[#22c55e]' : 'bg-[#9ca3af]';
  const icon =
    method === 'TOTP' ? <Smartphone className="size-[18px] text-white" /> :
    method === 'OTP_EMAIL' ? <Mail className="size-[18px] text-white" /> :
    method === 'OTP_SMS' ? <MessageSquare className="size-[18px] text-white" /> :
    <QrCode className="size-[18px] text-white" />;
  return (
    <div className={`flex size-[36px] shrink-0 items-center justify-center rounded-[8px] ${bg}`}>
      {icon}
    </div>
  );
}

export function MfaManager() {
  const [settings, setSettings] = useState<MfaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<EnrollStep>('idle');
  const [chosenMethod, setChosenMethod] = useState<'OTP_EMAIL' | 'TOTP'>('TOTP');
  const [emailTokenId, setEmailTokenId] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await getMfaSettings();
      setSettings(res.data ?? null);
    } catch {
      toast.error('Could not load security settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleSetPreferred = async (method: string) => {
    setBusy(true);
    try {
      await updateMfaPreferences({ enabled: true, preferredMethod: method });
      toast.success(`${METHOD_LABELS[method] ?? method} set as preferred`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update preference');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async (method: string) => {
    setBusy(true);
    try {
      await disableMfaEnrollment(method);
      toast.success(`${METHOD_LABELS[method] ?? method} removed`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove method');
    } finally {
      setBusy(false);
    }
  };

  const handleBeginEnroll = async (method: 'OTP_EMAIL' | 'TOTP') => {
    setChosenMethod(method);
    setBusy(true);
    try {
      const res = await beginMfaEnrollment({ method });
      if (method === 'OTP_EMAIL') {
        const r = res as OtpEmailEnrollBeginResponse;
        setEmailTokenId(r.tokenId ?? null);
        setStep('email_sent');
      } else {
        const r = res as TotpEnrollBeginResponse;
        setTotpSecret(r.secret ?? null);
        const issuer = 'Go-Worship';
        const uri =
          r.otpauthUri ??
          (r.secret
            ? `otpauth://totp/${issuer}?secret=${r.secret}&issuer=${issuer}`
            : null);
        setTotpUri(uri);
        setStep('totp_scan');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to start enrollment');
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteEmail = async () => {
    if (!emailTokenId) return;
    setBusy(true);
    try {
      await completeEmailMfaEnrollment({ method: 'OTP_EMAIL', tokenId: emailTokenId, code });
      toast.success('Email OTP enrolled successfully');
      setCode('');
      setStep('idle');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteTotp = async () => {
    if (!totpSecret) return;
    setBusy(true);
    try {
      await completeTotpMfaEnrollment({ method: 'TOTP', secret: totpSecret, code, makePreferred: true });
      toast.success('Authenticator app enrolled successfully');
      setCode('');
      setStep('idle');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  const unenrolledMethods = (['TOTP', 'OTP_EMAIL'] as const).filter(
    (m) => settings && !settings.enrolledMethods.includes(m)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-[18px]" />
          <h3 className="text-[17px] font-bold">Two-factor authentication</h3>
          {!loading && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                settings?.mfaEnabled
                  ? 'bg-[#dcfce7] text-[#16a34a]'
                  : 'bg-[#f3f4f6] text-[#6b7280]'
              }`}
            >
              {settings?.mfaEnabled ? 'On' : 'Off'}
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-[#666]">
          Add a second step when signing in, so a password alone isn&apos;t enough.
        </p>
      </div>

      {loading ? (
        <div className="py-4 text-[14px] text-[#888]">Loading security settings…</div>
      ) : (
        <>
          {/* Primary method selector */}
          {settings?.mfaEnabled && settings.enrolledMethods.length > 0 && step === 'idle' && (
            <div className="flex items-center justify-between rounded-[10px] border border-[#e5e7eb] px-4 py-3">
              <div>
                <p className="text-[14px] font-medium">Primary method</p>
                <p className="text-[12px] text-[#888]">
                  The method you&apos;ll be asked for first when signing in.
                </p>
              </div>
              <NativeSelect
                value={settings.preferredMethod ?? settings.enrolledMethods[0]}
                onChange={(e) => handleSetPreferred(e.target.value)}
                disabled={busy}
                className="w-[160px] text-[13px]"
              >
                {settings.enrolledMethods.map((m) => (
                  <NativeSelectOption key={m} value={m}>
                    {METHOD_LABELS[m] ?? m}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}

          {/* Enrolled method cards */}
          {settings?.enrolledMethods && settings.enrolledMethods.length > 0 && step === 'idle' && (
            <div className="flex flex-col gap-3">
              {settings.enrolledMethods.map((m) => {
                const isPreferred =
                  m === settings.preferredMethod ||
                  (!settings.preferredMethod && m === settings.enrolledMethods[0]);
                return (
                  <div
                    key={m}
                    className="flex items-center gap-3 rounded-[10px] border border-[#e5e7eb] px-4 py-3"
                  >
                    <MethodIcon method={m} enrolled />
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold">
                        {METHOD_LABELS[m] ?? m}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-semibold text-[#16a34a]">
                        ✓ Enrolled
                      </span>
                      {isPreferred && (
                        <span className="rounded-full bg-[#fef9c3] px-2 py-0.5 text-[11px] font-semibold text-[#854d0e]">
                          Preferred
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDisable(m)}
                      className="shrink-0 rounded-[6px] border border-destructive px-3 py-1 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Enable 2FA button when not yet enabled */}
          {settings && !settings.mfaEnabled && step === 'idle' && (
            <Button size="sm" className="self-start" onClick={() => setStep('choose_method')}>
              Enable 2FA
            </Button>
          )}

          {/* Add another method — only if there are unenrolled TOTP/Email methods */}
          {settings?.mfaEnabled && unenrolledMethods.length > 0 && step === 'idle' && (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setStep('choose_method')}
            >
              + Add another method
            </Button>
          )}

          {/* SMS Coming soon — always shown */}
          {step === 'idle' && (
            <div className="flex items-start gap-3 rounded-[10px] border border-[#e5e7eb] px-4 py-3">
              <MethodIcon method="OTP_SMS" enrolled={false} />
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold">Text message (SMS)</span>
                  <span className="rounded-full bg-[#ffedd5] px-2 py-0.5 text-[11px] font-semibold text-[#c2410c]">
                    Coming soon
                  </span>
                </div>
                <p className="text-[12px] text-[#888]">
                  Receive a one-time code by text message to your phone.
                </p>
                <p className="text-[12px] text-[#888]">
                  Coming soon — text-message codes aren&apos;t enabled yet. Set up another
                  method now and switch when SMS is available.
                </p>
              </div>
            </div>
          )}

          {/* Choose method panel */}
          {step === 'choose_method' && (
            <div className="flex flex-col gap-4 rounded-[12px] border border-[#e5e7eb] p-5">
              <h4 className="text-[15px] font-bold">Choose a method</h4>
              <div className="flex flex-col gap-3">
                {(['TOTP', 'OTP_EMAIL'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={busy}
                    onClick={() => handleBeginEnroll(m)}
                    className={`flex items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors hover:bg-[#f5f5f5] disabled:opacity-50 ${
                      chosenMethod === m ? 'border-brand-blue' : 'border-[#e5e7eb]'
                    }`}
                  >
                    <MethodIcon method={m} enrolled={false} />
                    <span className="text-[14px] font-medium">{METHOD_LABELS[m]}</span>
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" className="self-start" onClick={() => setStep('idle')}>
                Cancel
              </Button>
            </div>
          )}

          {/* Email OTP enrollment */}
          {step === 'email_sent' && (
            <div className="flex flex-col gap-4 rounded-[12px] border border-[#e5e7eb] p-5">
              <h4 className="text-[15px] font-bold">Verify your email</h4>
              <p className="text-[13px] text-[#666]">
                Enter the 6-digit code we sent to your email address.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="h-[48px] rounded-[8px] border border-[#d0d0d0] px-4 text-center text-[20px] font-bold tracking-[0.3em]"
              />
              <div className="flex gap-3">
                <Button onClick={handleCompleteEmail} disabled={busy || code.length < 6} className="flex-1">
                  {busy ? 'Verifying…' : 'Verify'}
                </Button>
                <Button variant="outline" onClick={() => { setStep('idle'); setCode(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* TOTP enrollment */}
          {step === 'totp_scan' && (
            <div className="flex flex-col gap-4 rounded-[12px] border border-[#e5e7eb] p-5">
              <h4 className="text-[15px] font-bold">Set up authenticator app</h4>
              <p className="text-[13px] text-[#666]">
                Scan the QR code with your authenticator app, or enter the setup key manually.
              </p>
              {totpUri && <TotpQrCode uri={totpUri} />}
              {totpSecret && (
                <details className="text-[13px]">
                  <summary className="cursor-pointer text-brand-blue">
                    Can&apos;t scan? Enter setup key manually
                  </summary>
                  <code className="mt-2 block break-all rounded-[6px] bg-[#f5f5f5] px-3 py-2 font-mono text-[13px]">
                    {totpSecret}
                  </code>
                </details>
              )}
              <p className="text-[13px] text-[#666]">Then enter the 6-digit code from your app:</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="h-[48px] rounded-[8px] border border-[#d0d0d0] px-4 text-center text-[20px] font-bold tracking-[0.3em]"
              />
              <div className="flex gap-3">
                <Button onClick={handleCompleteTotp} disabled={busy || code.length < 6} className="flex-1">
                  {busy ? 'Verifying…' : 'Activate'}
                </Button>
                <Button variant="outline" onClick={() => { setStep('idle'); setCode(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TotpQrCode({ uri }: { uri: string }) {
  const [QRCode, setQRCode] = useState<React.ComponentType<{ value: string; size?: number }> | null>(null);

  useEffect(() => {
    import('qrcode.react')
      .then((mod) => {
        const Comp = mod.QRCodeSVG ?? mod.default;
        if (Comp) setQRCode(() => Comp as React.ComponentType<{ value: string; size?: number }>);
      })
      .catch(() => {});
  }, []);

  if (!QRCode) {
    return (
      <div className="flex h-[140px] w-[140px] items-center justify-center rounded-[8px] bg-[#f5f5f5] p-3 text-center text-[12px] text-[#888]">
        QR unavailable — use setup key below
      </div>
    );
  }

  return (
    <div className="self-start rounded-[8px] bg-white p-3 shadow-sm">
      <QRCode value={uri} size={140} />
    </div>
  );
}
