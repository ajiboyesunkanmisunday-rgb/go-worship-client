import { Header } from '@/components/shared/header';
import { Sidebar } from '@/components/shared/sidebar';
import { IdleTimeout } from '@/components/auth/idle-timeout';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
    </main>
  );
}
