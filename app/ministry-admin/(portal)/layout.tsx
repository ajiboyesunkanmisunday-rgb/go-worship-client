import { PortalShell } from '@/components/ministry-admin/portal-shell';
import { IdleTimeout } from '@/components/auth/idle-timeout';

export default function GroupLeaderPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IdleTimeout loginPath="/ministry-admin/login" />
      <PortalShell>{children}</PortalShell>
    </>
  );
}
