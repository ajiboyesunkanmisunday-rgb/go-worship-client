import { PortalShell } from '@/components/group-leader/portal-shell';
import { IdleTimeout } from '@/components/auth/idle-timeout';

export default function GroupLeaderPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IdleTimeout loginPath="/group-leader/login" />
      <PortalShell>{children}</PortalShell>
    </>
  );
}
