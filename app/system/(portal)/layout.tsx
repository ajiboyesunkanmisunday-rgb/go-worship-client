import { PortalShell } from '@/components/system/portal-shell';
import { IdleTimeout } from '@/components/auth/idle-timeout';

export default function SystemPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IdleTimeout loginPath="/system/login" />
      <PortalShell>{children}</PortalShell>
    </>
  );
}
