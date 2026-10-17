import { cn } from '@/lib/utils';

/** 3-step progress bar for the password-reset flow (matches Figma 103:5416). */
export function ResetProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex w-full gap-3">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'h-[3px] flex-1 rounded-full',
            i <= step ? 'bg-brand-orange' : 'bg-brand-gray-300'
          )}
        />
      ))}
    </div>
  );
}
