import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { fetchSiteContext } from '@/lib/api/bootstrap';
import { resolveUpstreamFromHeaders } from '@/lib/api/server';
import { ChurchLandingPage } from '@/components/landing/church-landing-page';

export default async function Home() {
  const hdrs = await headers();
  const upstream = resolveUpstreamFromHeaders(hdrs);
  const context = await fetchSiteContext(upstream);

  if (context?.contextType === 'TENANT') {
    return <ChurchLandingPage context={context} />;
  }

  return redirect('/auth/login');
}
