'use client';

import { createContext, useContext } from 'react';
import type { SiteContext } from './api/bootstrap';

export type SiteContextValue = {
  /** false = bootstrap not fetched (demo mode or server error) */
  loaded: boolean;
  context: SiteContext | null;
};

const DEFAULT: SiteContextValue = { loaded: false, context: null };

const SiteCtx = createContext<SiteContextValue>(DEFAULT);

export function SiteContextProvider({
  value,
  children,
}: {
  value: SiteContextValue;
  children: React.ReactNode;
}) {
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export function useSiteContext(): SiteContextValue {
  return useContext(SiteCtx);
}
