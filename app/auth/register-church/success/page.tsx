import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterChurchSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f6f8fb] p-4">
      <div className="flex w-full max-w-[480px] flex-col items-center gap-6 rounded-[16px] bg-white p-8 text-center shadow-sm">
        <Image
          src="/auth/infinity-blue.svg"
          alt="Go Worship"
          width={64}
          height={22}
          className="h-[22px] w-[64px]"
        />

        <span className="text-[72px] leading-none">🎉</span>

        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold -tracking-[0.02em]">
            Church registered!
          </h1>
          <p className="text-[15px] font-light text-brand-gray-500">
            Your church has been successfully registered on Go-Worship. Check
            your email for login instructions and next steps.
          </p>
        </div>

        <Button asChild size="lg" className="mt-2 h-[52px] w-full">
          <Link href="/auth/login">Go to Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
