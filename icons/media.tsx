import { SVGProps } from 'react';

export function CameraIcon({
  width = 22,
  height = 22,
  color = 'black',
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M17.875 17.875H4.125C3.76033 17.875 3.41059 17.7301 3.15273 17.4723C2.89487 17.2144 2.75 16.8647 2.75 16.5V6.875C2.75 6.51033 2.89487 6.16059 3.15273 5.90273C3.41059 5.64487 3.76033 5.5 4.125 5.5H6.8745L8.2495 3.4375H13.7495L15.1245 5.5H17.875C18.2397 5.5 18.5894 5.64487 18.8473 5.90273C19.1051 6.16059 19.25 6.51033 19.25 6.875V16.5C19.25 16.8647 19.1051 17.2144 18.8473 17.4723C18.5894 17.7301 18.2397 17.875 17.875 17.875Z"
        stroke={color}
        strokeWidth="1.375"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 14.4375C12.7086 14.4375 14.0938 13.0524 14.0938 11.3438C14.0938 9.63512 12.7086 8.25 11 8.25C9.29137 8.25 7.90625 9.63512 7.90625 11.3438C7.90625 13.0524 9.29137 14.4375 11 14.4375Z"
        stroke={color}
        strokeWidth="1.375"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
