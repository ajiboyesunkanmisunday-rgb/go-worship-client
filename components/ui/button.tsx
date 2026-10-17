import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none',
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring",
    'focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20',
    'dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer disabled:cursor-not-allowed!',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-brand-blue text-white hover:bg-brand-blue/90',
        destructive:
          'bg-brand-red text-white hover:bg-brand-red/90 focus-visible:ring-brand-red/20',
        outline:
          'border-[0.5px] border-[#3E3E3E] bg-transparent hover:bg-brand-gray-100 text-black',
        secondary: 'bg-brand-yellow text-white hover:bg-brand-yellow/90',
        ghost: 'hover:bg-brand-blue/10 hover:text-brand-blue',
        link: 'text-brand-blue underline-offset-4 hover:underline',
      },
      size: {
        default: cn(
          'min-h-[41px] rounded-[5px] px-4',
          'font-semibold text-[16px] leading-[150%] tracking-[0%]'
        ),
        sm: cn(
          'min-h-[24px] rounded-[5px] gap-1.5',
          'font-medium text-[14px] leading-[150%] tracking-[0%]'
        ),
        lg: cn(
          'min-h-[48px] rounded-[3.75px] lg:rounded-[5.87px] px-6',
          'font-semibold lg:text-[17px] lg:leading-[130%] tracking-[0%]'
        ),
        icon: cn('size-[40px] rounded-[5px] p-[10px]'),
        'icon-sm': 'size-[34px] rounded-[5px] p-[8px]',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type Props = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  isDisabled = false,
  isLoading = false,
  ...props
}: Props) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled || isLoading}
      aria-disabled={isDisabled || isLoading}
      {...props}
    />
  );
}

export { Button, buttonVariants };
