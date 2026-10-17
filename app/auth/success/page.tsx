import { AuthShell } from '@/components/auth/auth-shell';
import { SuccessScreen } from '@/components/auth/success-screen';

export default function AuthSuccessPage() {
  return (
    <AuthShell mainClassName="bg-[#f2f2f2]">
      <SuccessScreen />
    </AuthShell>
  );
}
