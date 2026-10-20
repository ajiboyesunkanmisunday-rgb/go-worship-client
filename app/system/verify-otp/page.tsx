'use client';

import VerifyOTPPage from '@/app/auth/verify-otp/page';

const SYSTEM_SHELL = {
  imgSrc: '/auth/system-bg.svg',
  imgAlt: 'Go-Worship platform',
  imgClassName: 'object-cover',
  logoSrc: '/leadremit-logo-white.svg',
  flat: true,
};

export default function SystemVerifyOTPPage() {
  return <VerifyOTPPage shellProps={SYSTEM_SHELL} />;
}
