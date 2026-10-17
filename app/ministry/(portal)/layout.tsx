import { PortalShell } from '@/components/ministry/portal-shell';
import { IdleTimeout } from '@/components/auth/idle-timeout';

export default function MinistryPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IdleTimeout loginPath="/ministry/login" />
      <PortalShell>{children}</PortalShell>
    </>
  );
}
