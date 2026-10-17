import { SVGProps } from 'react';

export function MapPinIcon({
  width = 17,
  height = 17,
  color = 'black',
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.271 8.78809C9.41305 8.78809 10.3389 7.86227 10.3389 6.72021C10.3389 5.57816 9.41305 4.65234 8.271 4.65234C7.12894 4.65234 6.20312 5.57816 6.20312 6.72021C6.20312 7.86227 7.12894 8.78809 8.271 8.78809Z"
        stroke={color}
        strokeWidth="1.03394"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.4409 6.72046C13.4409 11.3732 8.27124 14.9919 8.27124 14.9919C8.27124 14.9919 3.10156 11.3732 3.10156 6.72046C3.10156 5.34938 3.64622 4.03445 4.61573 3.06494C5.58523 2.09544 6.90016 1.55078 8.27124 1.55078C9.64232 1.55078 10.9573 2.09544 11.9268 3.06494C12.8963 4.03445 13.4409 5.34938 13.4409 6.72046V6.72046Z"
        stroke={color}
        strokeWidth="1.03394"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
