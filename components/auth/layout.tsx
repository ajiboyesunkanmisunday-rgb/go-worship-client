import { AuthShell } from './auth-shell';

type AuthLayoutProps = {
  children?: React.ReactNode;
  containerClassName?: string;
  imgSrc?: string;
  imgAlt?: string;
  imgWidth?: number;
  imgHeight?: number;
  logoSrc?: string;
  imgClassName?: string;
};

export function AuthLayout({
  children,
  containerClassName,
  imgSrc,
  imgAlt,
  logoSrc,
  imgClassName,
}: AuthLayoutProps) {
  return (
    <AuthShell contentClassName={containerClassName} imgSrc={imgSrc} imgAlt={imgAlt} logoSrc={logoSrc} imgClassName={imgClassName}>
      {children}
    </AuthShell>
  );
}
