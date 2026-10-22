'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { USE_LIVE_API } from '@/lib/api/config';
import { getProfile, logout } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';

/**
 * Idle session guard.
 *
 * Backend enforces idle timeout via JWT lastActivity (401 IDLE_TIMEOUT after
 * inactivity). Frontend shows an animated warning modal before acting, and
 * calls getProfile() to refresh lastActivity on the server when the user
 * chooses "Stay signed in".
 *
 * Defaults match the backend: 30 min idle → timeout; 60 s warning before that.
 * Override via env:
 *   NEXT_PUBLIC_IDLE_TIMEOUT_MS   (default 1 800 000 ms = 30 min)
 *   NEXT_PUBLIC_IDLE_WARNING_MS   (default     60 000 ms = 60 s)
 *   NEXT_PUBLIC_IDLE_HEARTBEAT_MS (default    300 000 ms = 5 min)
 *
 * LIVE-ONLY: inert when USE_LIVE_API is false.
 */

const IDLE_MS =
  Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS) || 30 * 60 * 1000;
const WARN_MS =
  Number(process.env.NEXT_PUBLIC_IDLE_WARNING_MS) || 60 * 1000;
const HEARTBEAT_MS =
  Number(process.env.NEXT_PUBLIC_IDLE_HEARTBEAT_MS) || 5 * 60 * 1000;

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
] as const;

const CIRCUMFERENCE = 2 * Math.PI * 50; // r=50 SVG ring

export function IdleTimeout({ loginPath = '/auth/login' }: { loginPath?: string }) {
  const router = useRouter();
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(WARN_MS / 1000));

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningActive = useRef(false);
  // Set when the backend already expired the session (401 IDLE_TIMEOUT received).
  const sessionExpiredOnServer = useRef(false);

  useEffect(() => {
    if (!USE_LIVE_API) return;

    const clearTimers = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };

    const signOut = async () => {
      clearTimers();
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      setWarning(false);
      warningActive.current = false;
      try {
        await logout();
      } catch {
        // Still redirect even on logout failure.
      }
      router.replace(`${loginPath}?reason=idle`);
    };

    const startCountdown = () => {
      warningActive.current = true;
      setSecondsLeft(Math.ceil(WARN_MS / 1000));
      setWarning(true);

      const start = Date.now();
      countdownInterval.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, Math.ceil((WARN_MS - elapsed) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          signOut();
        }
      }, 500);
    };

    const reset = () => {
      if (warningActive.current) return; // don't cancel the warning on activity
      clearTimers();
      warnTimer.current = setTimeout(startCountdown, IDLE_MS - WARN_MS);
      idleTimer.current = setTimeout(signOut, IDLE_MS);
    };

    reset();
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, reset, { passive: true })
    );

    // Periodic heartbeat: refresh lastActivity on the server so the backend
    // session stays alive while the user is active on the page.
    heartbeatInterval.current = setInterval(async () => {
      if (!warningActive.current) {
        try {
          await getProfile();
        } catch {
          // If the heartbeat gets a 401 the BFF will have cleared cookies;
          // the next API call will redirect to login automatically.
        }
      }
    }, HEARTBEAT_MS);

    // When the API client receives a 401 IDLE_TIMEOUT it dispatches this event
    // instead of hard-redirecting, so we can show the countdown first.
    const handleServerExpired = () => {
      if (warningActive.current) return; // countdown already visible
      sessionExpiredOnServer.current = true;
      clearTimers();
      startCountdown();
    };
    window.addEventListener('gw:session-expired', handleServerExpired);

    return () => {
      clearTimers();
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
      window.removeEventListener('gw:session-expired', handleServerExpired);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginPath]);

  const staySignedIn = async () => {
    warningActive.current = false;
    setWarning(false);
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    if (sessionExpiredOnServer.current) {
      // Backend session is already gone — redirect straight to login.
      sessionExpiredOnServer.current = false;
      router.replace(`${loginPath}?reason=idle`);
      return;
    }

    // Refresh server lastActivity so the backend doesn't expire us.
    try {
      await getProfile();
    } catch {
      // Session expired between the warning and the click — redirect now.
      router.replace(`${loginPath}?reason=idle`);
    }
  };

  const signOutNow = async () => {
    try {
      await logout();
    } catch {
      // Continue regardless.
    }
    router.replace(`${loginPath}?reason=idle`);
  };

  if (!warning) return null;

  const totalSecs = Math.ceil(WARN_MS / 1000);
  const progress = secondsLeft / totalSecs;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Session expiring"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="mx-4 flex w-full max-w-[380px] flex-col items-center gap-6 rounded-[20px] bg-white p-8 text-center shadow-2xl">
        {/* Animated countdown ring */}
        <div className="relative flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#1e40af"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
          </svg>
          <span className="absolute text-[28px] font-bold tabular-nums text-[#1e40af]">
            {secondsLeft}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-[22px] font-bold">Still there?</h2>
          <p className="text-[14px] text-[#555]">
            You&apos;ve been inactive for a while. For your security you&apos;ll be signed out in{' '}
            {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button
            size="lg"
            className="h-[48px] w-full"
            onClick={staySignedIn}
          >
            Stay signed in
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-[48px] w-full"
            onClick={signOutNow}
          >
            Sign out now
          </Button>
        </div>
      </div>
    </div>
  );
}
