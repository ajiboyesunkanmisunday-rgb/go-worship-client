'use client';

/**
 * MFA Enrollment & Preferences Manager.
 *
 * Driven by the self-service security endpoints (TN-009..TN-034).
 * Supports OTP_EMAIL (send code → verify) and TOTP (QR code / manual key → verify).
 * Mounted inside security-settings.tsx as the MFA section.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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

type EnrollStep =
  | 'idle'
  | 'choose_method'
  | 'email_sent'
  | 'totp_scan'
  | 'done';

const METHOD_LABELS: Record<string, string> = {
  OTP_EMAIL: 'Email code',
  TOTP: 'Authenticator app (TOTP)',
  PASSKEY: 'Passkey',
  PUSH_FCM: 'Push notification',
  OTP_SMS: 'SMS code',
};

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
        // Build otpauth URI for QR — use backend's if available, else construct
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
      await completeEmailMfaEnrollment({
        method: 'OTP_EMAIL',
        tokenId: emailTokenId,
        code,
      });
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
      await completeTotpMfaEnrollment({
        method: 'TOTP',
        secret: totpSecret,
        code,
        makePreferred: true,
      });
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

  if (loading) {
    return (
      <div className="py-6 text-[14px] text-[#888]">
        Loading security settings…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-bold">Two-factor authentication</h3>
          <p className="text-[13px] text-[#666]">
            {settings?.mfaEnabled
              ? `Enabled — ${settings.enrolledMethods.length} method(s) enrolled`
              : 'Not enabled'}
          </p>
        </div>
        {settings && !settings.mfaEnabled && step === 'idle' && (
          <Button
            size="sm"
            onClick={() => setStep('choose_method')}
          >
            Enable 2FA
          </Button>
        )}
      </div>

      {/* Enrolled methods list */}
      {settings?.enrolledMethods && settings.enrolledMethods.length > 0 && (
        <ul className="flex flex-col gap-2">
          {settings.enrolledMethods.map((m) => (
            <li
              key={m}
              className="flex items-center justify-between rounded-[10px] border border-[#e5e7eb] px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-medium">
                  {METHOD_LABELS[m] ?? m}
                </span>
                {m === settings.preferredMethod && (
                  <span className="text-[12px] text-brand-blue">Preferred</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {m !== settings.preferredMethod && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSetPreferred(m)}
                    className="text-[13px] text-brand-blue hover:underline disabled:opacity-50"
                  >
                    Set preferred
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDisable(m)}
                  className="text-[13px] text-destructive hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add a method */}
      {settings && step === 'idle' && settings.mfaEnabled && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setStep('choose_method')}
        >
          + Add another method
        </Button>
      )}

      {/* Choose method */}
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
            className="h-[48px] rounded-[8px] border border-[#d0d0d0] px-4 text-[20px] font-bold tracking-[0.3em] text-center"
          />
          <div className="flex gap-3">
            <Button
              onClick={handleCompleteEmail}
              disabled={busy || code.length < 6}
              className="flex-1"
            >
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

          {totpUri && (
            <TotpQrCode uri={totpUri} />
          )}

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

          <p className="text-[13px] text-[#666]">
            Then enter the 6-digit code from your app:
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="h-[48px] rounded-[8px] border border-[#d0d0d0] px-4 text-[20px] font-bold tracking-[0.3em] text-center"
          />
          <div className="flex gap-3">
            <Button
              onClick={handleCompleteTotp}
              disabled={busy || code.length < 6}
              className="flex-1"
            >
              {busy ? 'Verifying…' : 'Activate'}
            </Button>
            <Button variant="outline" onClick={() => { setStep('idle'); setCode(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Renders a QR code for the given otpauth URI using an inline SVG via the
 * QR code canvas API, or falls back to a manual-entry notice if the browser
 * can't render it. Uses qrcode.react if available (installed separately).
 */
function TotpQrCode({ uri }: { uri: string }) {
  const [QRCode, setQRCode] = useState<React.ComponentType<{ value: string; size?: number }> | null>(null);

  useEffect(() => {
    // qrcode.react is an optional dep — try to import it
    import('qrcode.react')
      .then((mod) => {
        // The package exports QRCodeSVG as a named export
        const Comp = mod.QRCodeSVG ?? mod.default;
        if (Comp) setQRCode(() => Comp as React.ComponentType<{ value: string; size?: number }>);
      })
      .catch(() => {
        // Package not installed; fall back gracefully
      });
  }, []);

  if (!QRCode) {
    return (
      <div className="flex h-[140px] w-[140px] items-center justify-center rounded-[8px] bg-[#f5f5f5] text-[12px] text-[#888] text-center p-3">
        QR unavailable — use setup key below
      </div>
    );
  }

  return (
    <div className="rounded-[8px] bg-white p-3 shadow-sm self-start">
      <QRCode value={uri} size={140} />
    </div>
  );
}
