'use client';
import { EyeIcon, EyeSlashIcon } from '@/icons/eye';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  containerProps?: React.ComponentProps<'div'>;
  addonClassName?: string;
  iconClassName?: string;
} & Omit<React.ComponentProps<'input'>, 'type'>;

export function PasswordInput({
  containerProps = {},
  addonClassName,
  iconClassName,
  ...inputProps
}: Props) {
  const [isVisible, setIsVisible] = useState(false);

  let icon = <EyeSlashIcon className={cn('lg:size-[20px]', iconClassName)} />;
  if (isVisible) {
    icon = <EyeIcon className={cn('lg:size-[20px]', iconClassName)} />;
  }

  return (
    <InputGroup {...containerProps}>
      <InputGroupInput type={isVisible ? 'text' : 'password'} {...inputProps} />
      <InputGroupAddon align="inline-end" className={addonClassName}>
        <InputGroupButton
          aria-label="Toggle password visibility"
          title="Toggle password visibility"
          //   size="icon-sm"
          className="size-fit!"
          onClick={() => setIsVisible((c) => !c)}
        >
          {icon}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
