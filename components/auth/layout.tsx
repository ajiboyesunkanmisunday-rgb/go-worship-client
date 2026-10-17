import { AuthShell } from './auth-shell';

type AuthLayoutProps = {
  children?: React.ReactNode;
  containerClassName?: string;
  /** @deprecated the shared church image is used for every auth screen */
  imgSrc?: string;
  imgAlt?: string;
  imgWidth?: number;
  imgHeight?: number;
};

export function AuthLayout({
  children,
  containerClassName,
  imgSrc,
  imgAlt,
}: AuthLayoutProps) {
  return (
    <AuthShell contentClassName={containerClassName} imgSrc={imgSrc} imgAlt={imgAlt}>
      {children}
    </AuthShell>
  );
}
