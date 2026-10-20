'use client';

import MfaEnrollPage from '@/app/auth/mfa-enroll/page';

const SYSTEM_SHELL = {
  imgSrc: '/auth/system-bg.svg',
  imgAlt: 'Go-Worship platform',
  imgClassName: 'object-cover',
  logoSrc: '/leadremit-logo-white.svg',
  flat: true,
};

export default function SystemMfaEnrollPage() {
  return <MfaEnrollPage shellProps={SYSTEM_SHELL} />;
}
