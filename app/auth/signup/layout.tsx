'use client';
import { useEffect } from 'react';

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('signup-account-details');
    };
  }, []);

  return <>{children}</>;
}
