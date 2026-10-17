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
  imgAlt,
}: AuthLayoutProps) {
  return (
    <AuthShell contentClassName={containerClassName} imgAlt={imgAlt}>
      {children}
    </AuthShell>
  );
}
