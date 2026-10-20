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
  flat?: boolean;
};

export function AuthLayout({
  children,
  containerClassName,
  imgSrc,
  imgAlt,
  logoSrc,
  imgClassName,
  flat,
}: AuthLayoutProps) {
  return (
    <AuthShell contentClassName={containerClassName} imgSrc={imgSrc} imgAlt={imgAlt} logoSrc={logoSrc} imgClassName={imgClassName} flat={flat}>
      {children}
    </AuthShell>
  );
}
