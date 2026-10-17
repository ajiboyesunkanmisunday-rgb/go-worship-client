import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-8 px-6 text-center">
      <Image
        src="/auth/infinity-blue.svg"
        alt="Go Worship"
        width={96}
        height={33}
        className="h-[33px] w-[96px]"
      />

      <div className="flex flex-col items-center gap-3">
        <p className="font-plus-jakarta-sans text-[80px] font-bold leading-none text-brand-blue lg:text-[120px]">
          404
        </p>
        <h1 className="text-[24px] font-bold lg:text-[32px]">
          Page not found
        </h1>
        <p className="max-w-[440px] text-[15px] font-light text-brand-gray-500 lg:text-[17px]">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Let&apos;s get you back on track.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/" className="no-underline">
            Back to home
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard" className="no-underline">
            Go to dashboard
          </Link>
        </Button>
      </div>
    </main>
  );
}
