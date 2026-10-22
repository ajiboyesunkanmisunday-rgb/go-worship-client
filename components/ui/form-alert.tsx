import { AlertTriangle, CircleCheck, Info, OctagonX } from 'lucide-react';
import type { ReactNode } from 'react';

export type FormAlertVariant = 'error' | 'success' | 'warning' | 'info';

const VARIANTS: Record<
  FormAlertVariant,
  { outer: string; iconClass: string; Icon: React.ElementType }
> = {
  error:   { outer: 'border-red-200 bg-red-50 text-red-700',           iconClass: 'text-red-500',    Icon: OctagonX       },
  success: { outer: 'border-green-200 bg-green-50 text-green-700',      iconClass: 'text-green-600',  Icon: CircleCheck    },
  warning: { outer: 'border-amber-200 bg-amber-50 text-amber-800',      iconClass: 'text-amber-500',  Icon: AlertTriangle  },
  info:    { outer: 'border-blue-200 bg-blue-50 text-blue-700',         iconClass: 'text-blue-500',   Icon: Info           },
};

export function FormAlert({
  variant = 'error',
  children,
  className,
}: {
  variant?: FormAlertVariant;
  children: ReactNode;
  className?: string;
}) {
  const { outer, iconClass, Icon } = VARIANTS[variant];
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-[10px] border px-4 py-3 text-[13px] ${outer}${className ? ` ${className}` : ''}`}
    >
      <Icon className={`mt-px size-4 shrink-0 ${iconClass}`} aria-hidden="true" />
      <span className="leading-snug">{children}</span>
    </div>
  );
}
