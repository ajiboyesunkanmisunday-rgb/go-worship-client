import { WizardShell } from '@/components/auth/wizard-shell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SignupSuccessPage() {
  return (
    <WizardShell contentClassName="flex flex-col justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="text-[80px] leading-none lg:text-[96px]">🎉</span>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-[32px] font-bold -tracking-[0.02em] lg:text-[40px]">
            Congratulations
          </h1>
          <p className="max-w-[420px] font-poppins text-[16px] font-light lg:text-[18px]">
            You&apos;ve successfully signed up your goworship.cci account
          </p>
        </div>

        <Button asChild size="lg" className="mt-2 h-[56px] w-full max-w-[532px]">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </WizardShell>
  );
}
