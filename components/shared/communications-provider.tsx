'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  getInAppSummary,
  inAppStreamUrl,
  type InAppCommunicationSummary,
} from '@/lib/api/auth';

type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

type CommunicationContextValue = {
  summary: InAppCommunicationSummary;
  refresh: () => Promise<void>;
  status: StreamStatus;
};

const EMPTY_SUMMARY: InAppCommunicationSummary = {
  unreadMessages: 0,
  unreadNotifications: 0,
  unreadChats: 0,
  totalUnread: 0,
};

const CommunicationContext = createContext<CommunicationContextValue>({
  summary: EMPTY_SUMMARY,
  refresh: async () => undefined,
  status: 'offline',
});

export function CommunicationProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<InAppCommunicationSummary>(EMPTY_SUMMARY);
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const latestSummary = useRef(summary);
  latestSummary.current = summary;

  const refresh = useCallback(async () => {
    try {
      const next = await getInAppSummary();
      setSummary(next);
    } catch {
      // Keep existing summary on failure
    }
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let mounted = true;

    const connect = () => {
      if (!mounted) return;
      setStatus(attempts > 0 ? 'reconnecting' : 'connecting');
      void refresh();

      source = new EventSource(inAppStreamUrl(), { withCredentials: true });

      source.onopen = () => {
        if (!mounted) return;
        attempts = 0;
        setStatus('live');
      };

      source.onmessage = () => {
        if (!mounted) return;
        void refresh();
        window.dispatchEvent(new CustomEvent('gw:communication'));
      };

      source.onerror = () => {
        if (!mounted) return;
        source?.close();
        source = null;
        setStatus('reconnecting');
        const delay = Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5));
        retryTimeout = setTimeout(connect, delay);
      };
    };

    const online = () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      connect();
    };
    const offline = () => setStatus('offline');

    window.addEventListener('online', online);
    window.addEventListener('offline', offline);

    connect();

    // Reconcile every 30s in case SSE events are missed
    const poll = setInterval(() => {
      if (navigator.onLine) void refresh();
    }, 30000);

    return () => {
      mounted = false;
      source?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
      clearInterval(poll);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [refresh]);

  return (
    <CommunicationContext.Provider value={{ summary, refresh, status }}>
      {children}
    </CommunicationContext.Provider>
  );
}

export const useCommunications = () => useContext(CommunicationContext);
