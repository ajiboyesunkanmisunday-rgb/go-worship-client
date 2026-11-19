import { headers } from 'next/headers';
import { resolveUpstreamFromHeaders } from '@/lib/api/server';
import { fetchSiteContext } from '@/lib/api/bootstrap';
import { SiteContextProvider } from '@/lib/site-context';

export default async function GroupLeaderRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const upstream = resolveUpstreamFromHeaders(hdrs);
  const context = await fetchSiteContext(upstream);

  if (context?.contextType === 'UNKNOWN') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-8">
        <div className="flex max-w-[420px] flex-col items-center gap-4 text-center">
          <h1 className="text-[24px] font-bold">Organization Not Found</h1>
          <p className="text-[16px] font-light text-[#6B7280]">
            We could not find an organization configured for this address.
            Please check the URL or contact your administrator.
          </p>
        </div>
      </main>
    );
  }

  return (
    <SiteContextProvider value={{ loaded: true, context }}>
      {children}
    </SiteContextProvider>
  );
}
