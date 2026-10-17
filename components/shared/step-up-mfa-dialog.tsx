'use client';

/**
 * Step-up MFA dialog for sensitive actions (provisioning, etc.).
 *
 * When a write returns 200 ok:false code:"MFA_REQUIRED" the caller:
 *  1. Detects it with `isStepUpChallenge(data)`
 *  2. Renders <StepUpMfaDialog challenge={...} onSuccess={reloadData} onClose={...} />
 *
 * This dialog shows a TOTP/OTP input, calls stepUpBeginMfa then stepUpVerifyMfa
 * (via /bff/gw — authenticated; the pendingActionId commits the deferred action).
 *
 * Confirmed from live HAR (2026-08-30):
 *   begin → 200 {challengeType:"ENTER_TOTP"}
 *   verify {mfaSessionId, method:"TOTP", code, pendingActionId} → 200 ok
 * Backend then commits the pending action on verify success.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  stepUpBeginMfa,
  stepUpVerifyMfa,
  type StepUpMfaChallengeResponse,
} from '@/lib/api/auth';

type Props = {
  challenge: StepUpMfaChallengeResponse;
  onSuccess(): void;
  onClose(): void;
};

type Phase = 'choose' | 'waiting' | 'enter_code';

const METHOD_LABELS: Record<string, string> = {
  TOTP: 'Authenticator app',
  OTP_EMAIL: 'Email code',
  OTP_SMS: 'SMS code',
};

export function StepUpMfaDialog({ challenge, onSuccess, onClose }: Props) {
  const methods = challenge.allowedMethods ?? ['TOTP'];
  const [method, setMethod] = useState(methods[0] ?? 'TOTP');
  const [phase, setPhase] = useState<Phase>(
    methods.length <= 1 ? 'waiting' : 'choose'
  );
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-begin if there's only one method
  const handleBegin = async (m: string) => {
    setMethod(m);
    setError(null);
    setPhase('waiting');
    setBusy(true);
    try {
      await stepUpBeginMfa({ mfaSessionId: challenge.mfaSessionId, method: m });
      setPhase('enter_code');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start challenge');
      setPhase('choose');
    } finally {
      setBusy(false);
    }
  };

  // Auto-begin on mount when single method
  const [started, setStarted] = useState(false);
  if (!started && methods.length <= 1) {
    setStarted(true);
    handleBegin(methods[0] ?? 'TOTP');
  }

  const handleVerify = async () => {
    if (code.length < 6) return;
    setError(null);
    setBusy(true);
    try {
      await stepUpVerifyMfa({
        mfaSessionId: challenge.mfaSessionId,
        method,
        code,
        pendingActionId: challenge.pendingActionId,
      });
      toast.success('Action confirmed');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm with two-factor code"
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="mx-4 flex w-full max-w-[400px] flex-col gap-5 rounded-[20px] bg-white p-8 shadow-xl">
        <h2 className="text-[20px] font-bold">Security verification required</h2>
        <p className="text-[13px] text-[#666]">
          This action requires a two-factor code to complete.
        </p>

        {phase === 'choose' && methods.length > 1 && (
          <div className="flex flex-col gap-3">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                disabled={busy}
                onClick={() => handleBegin(m)}
                className={`flex items-center rounded-[10px] border px-4 py-3 text-[14px] font-medium transition-colors hover:bg-[#f5f5f5] disabled:opacity-50 ${
                  m === method ? 'border-brand-blue' : 'border-[#e5e7eb]'
                }`}
              >
                {METHOD_LABELS[m] ?? m}
              </button>
            ))}
          </div>
        )}

        {phase === 'waiting' && (
          <p className="text-[13px] text-[#888]">Starting verification…</p>
        )}

        {phase === 'enter_code' && (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-[#666]">
              {method === 'TOTP'
                ? 'Enter the 6-digit code from your authenticator app.'
                : 'Enter the 6-digit code sent to your email.'}
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="h-[52px] rounded-[8px] border border-[#d0d0d0] px-4 text-[22px] font-bold tracking-[0.3em] text-center"
              autoFocus
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          {phase === 'enter_code' && (
            <Button
              className="flex-1"
              disabled={busy || code.length < 6}
              onClick={handleVerify}
            >
              {busy ? 'Verifying…' : 'Confirm'}
            </Button>
          )}
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Convenience: extract the step-up challenge from a provisioning response and
 * render the dialog. Returns null if no challenge is present.
 *
 * Usage:
 *   const [challenge, setChallenge] = useState<StepUpMfaChallengeResponse | null>(null);
 *   // on provisioning response: if (isStepUpChallenge(data)) setChallenge(data);
 *   return challenge && <StepUpMfaDialog challenge={challenge} onSuccess={reload} onClose={() => setChallenge(null)} />;
 */
export { isStepUpChallenge } from '@/lib/api/auth';
export type { StepUpMfaChallengeResponse } from '@/lib/api/auth';
