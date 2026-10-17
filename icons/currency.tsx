import { SVGProps } from 'react';

export function DollarCircleIcon({
  width = 20,
  height = 20,
  color = '#333333',
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.74219 5.48047V6.69833"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.74219 12.7871V14.005"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.74464 17.0498C13.7803 17.0498 17.0518 13.7783 17.0518 9.74269C17.0518 5.70706 13.7803 2.43555 9.74464 2.43555C5.70902 2.43555 2.4375 5.70706 2.4375 9.74269C2.4375 13.7783 5.70902 17.0498 9.74464 17.0498Z"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.91362 12.7865H10.6538C11.0575 12.7865 11.4447 12.6262 11.7302 12.3407C12.0157 12.0552 12.1761 11.668 12.1761 11.2642C12.1761 10.8605 12.0157 10.4733 11.7302 10.1878C11.4447 9.90229 11.0575 9.74191 10.6538 9.74191H8.82701C8.42326 9.74191 8.03606 9.58152 7.75056 9.29603C7.46507 9.01054 7.30469 8.62333 7.30469 8.21959C7.30469 7.81584 7.46507 7.42863 7.75056 7.14314C8.03606 6.85765 8.42326 6.69727 8.82701 6.69727H11.5672"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CurrencyCircleDollarIcon({
  width = 23,
  height = 23,
  color = '#BBCEFF',
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 23 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.0469 6.21484V7.59593"
        stroke={color}
        strokeWidth="1.38109"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.0469 14.502V15.883"
        stroke={color}
        strokeWidth="1.38109"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.0522 19.3348C15.6287 19.3348 19.3387 15.6248 19.3387 11.0482C19.3387 6.47172 15.6287 2.76172 11.0522 2.76172C6.47563 2.76172 2.76562 6.47172 2.76562 11.0482C2.76562 15.6248 6.47563 19.3348 11.0522 19.3348Z"
        stroke={color}
        strokeWidth="1.38109"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.97961 14.5011H12.0871C12.5449 14.5011 12.984 14.3193 13.3078 13.9955C13.6315 13.6717 13.8134 13.2326 13.8134 12.7748C13.8134 12.3169 13.6315 11.8778 13.3078 11.5541C12.984 11.2303 12.5449 11.0484 12.0871 11.0484H10.0154C9.55756 11.0484 9.11846 10.8665 8.7947 10.5428C8.47095 10.219 8.28906 9.77992 8.28906 9.32206C8.28906 8.8642 8.47095 8.4251 8.7947 8.10134C9.11846 7.77759 9.55756 7.5957 10.0154 7.5957H13.1229"
        stroke={color}
        strokeWidth="1.38109"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
