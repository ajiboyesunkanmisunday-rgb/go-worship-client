import { SVGProps } from 'react';

export function CircleCloseIcon({
  width = 36,
  height = 36,
  color = '#747070',
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="18" cy="18" r="17.5" stroke={color} />
      <path
        d="M23.1187 13.5L13.5 23.1187"
        stroke={color}
        strokeWidth="1.1875"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.1187 23.1187L13.5 13.5"
        stroke={color}
        strokeWidth="1.1875"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
