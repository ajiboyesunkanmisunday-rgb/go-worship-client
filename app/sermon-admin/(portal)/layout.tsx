import { PortalShell } from '@/components/sermon-admin/portal-shell';
import { IdleTimeout } from '@/components/auth/idle-timeout';

export default function SermonAdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IdleTimeout loginPath="/sermon-admin/login" />
      <PortalShell>{children}</PortalShell>
    </>
  );
}
