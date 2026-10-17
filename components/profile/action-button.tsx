'use client';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { PencilIcon } from '@/icons/notes';

type Props = {
  mode: 'view' | 'edit';
  className?: string;
} & React.ComponentProps<'button'>;

export function ActionButton({ mode, className, ...props }: Props) {
  return (
    <Button
      variant={mode === 'view' ? 'default' : 'secondary'}
      className={cn(
        'gap-1 text-[16px] font-semibold leading-[150%] tracking-[0%]',
        {
          'bg-[#CDCDCD] hover:bg-[#CDCDCD]/90 text-white w-[71px] rounded-[7px]':
            mode === 'view',
          'bg-brand-orange hover:bg-brand-orange/90 text-white rounded-[7px]':
            mode === 'edit',
        },
        className
      )}
      {...props}
    >
      <span>{mode === 'view' ? 'Edit' : 'Save Changes'}</span>
      <PencilIcon
        color="white"
        className={cn('size-[20px] shrink-0', {
          hidden: mode === 'edit',
        })}
      />
    </Button>
  );
}
