import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary',
        'selection:text-primary-foreground dark:bg-input/30 border-[#3E3E3E] h-[45px] w-full min-w-0',
        'rounded-[3.75px] lg:rounded-[5.87px] border-[0.5px] bg-transparent px-3 py-1 text-base transition-[color]',
        'outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-[16px]',
        'focus-visible:border-none focus-visible:ring-brand-blue/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
