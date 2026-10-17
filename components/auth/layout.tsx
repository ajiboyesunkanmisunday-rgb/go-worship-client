import { AuthShell } from './auth-shell';

type AuthLayoutProps = {
  children?: React.ReactNode;
  containerClassName?: string;
  imgSrc?: string;
  imgAlt?: string;
  imgWidth?: number;
  imgHeight?: number;
  logoSrc?: string;
};

export function AuthLayout({
  children,
  containerClassName,
  imgSrc,
  imgAlt,
  logoSrc,
}: AuthLayoutProps) {
  return (
    <AuthShell contentClassName={containerClassName} imgSrc={imgSrc} imgAlt={imgAlt} logoSrc={logoSrc}>
      {children}
    </AuthShell>
  );
}
