/**
 * Type stub for qrcode.react — the actual package is an optional runtime dep.
 * The component that imports it does so dynamically and falls back gracefully
 * if the package is not installed.
 *
 * Install: pnpm add qrcode.react  (requires pnpm 11)
 */
declare module 'qrcode.react' {
  import type { FC } from 'react';
  export interface QRCodeProps {
    value: string;
    size?: number;
    bgColor?: string;
    fgColor?: string;
    level?: 'L' | 'M' | 'Q' | 'H';
    includeMargin?: boolean;
  }
  export const QRCodeSVG: FC<QRCodeProps>;
  export const QRCodeCanvas: FC<QRCodeProps>;
  const QRCode: FC<QRCodeProps>;
  export default QRCode;
}
