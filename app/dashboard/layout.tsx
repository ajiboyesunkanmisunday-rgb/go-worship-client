import { Header } from '@/components/shared/header';
import { Sidebar } from '@/components/shared/sidebar';
import { IdleTimeout } from '@/components/auth/idle-timeout';
import { SiteContextProvider } from '@/lib/site-context';
import { CommunicationProvider } from '@/components/shared/communications-provider';
import { FloatingChatDock } from '@/components/shared/floating-chat-dock';
import { fetchSiteContext } from '@/lib/api/bootstrap';
import { resolveUpstreamFromHeaders } from '@/lib/api/server';
import { headers } from 'next/headers';
import { cn } from '@/lib/utils';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const upstream = resolveUpstreamFromHeaders(hdrs);
  const context = await fetchSiteContext(upstream);

  if (context?.subscriptionAccess === 'NO_ACCESS') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F7FF] p-8">
        <div className="flex max-w-[440px] flex-col items-center gap-4 rounded-[16px] bg-white p-10 text-center shadow-sm">
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Account Suspended</h1>
          <p className="text-[15px] font-light text-[#6B7280]">
            Access to this platform has been suspended. Please contact your
            administrator or{' '}
            <a href="mailto:support@go-worship.com" className="text-brand-blue underline">
              support@go-worship.com
            </a>{' '}
            to restore access.
          </p>
        </div>
      </main>
    );
  }

  return (
    <SiteContextProvider value={{ loaded: true, context }}>
      <CommunicationProvider>
        <main
          className={cn(
            'w-full h-full min-h-screen overflow-y-auto',
            'relative bg-[#F4F7FF]'
          )}
        >
          <IdleTimeout />
          <Header />
          <Sidebar />
          <div className="w-full px-6 pt-[110px] pb-10 lg:pl-[274px] lg:pt-[120px] max-w-[1440px] mx-auto">
            {children}
          </div>
          <FloatingChatDock />
        </main>
      </CommunicationProvider>
    </SiteContextProvider>
  );
}
