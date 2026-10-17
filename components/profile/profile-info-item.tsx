'use client';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Props = {
  label: string;
  content: ReactNode;
  className?: string;
};

export function ProfileInfoItem({ content, label, className }: Props) {
  return (
    <div
      className={cn('flex flex-col justify-start items-start gap-2', className)}
    >
      <span className="text-[#333333] text-[14px] leading-[100%] tracking-[0%]">
        {label}
      </span>
      <div className="text-[#333333] font-semibold leading-[100%] tracking-[0%]">
        {content}
      </div>
    </div>
  );
}
