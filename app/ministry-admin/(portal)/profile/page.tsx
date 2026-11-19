'use client';

import { PersonalInfo } from '@/components/profile/personal-info';
import { ProfileActions } from '@/components/profile/profile-actions';
import { ProfileImageSection } from '@/components/profile/profile-image';
import { SecurityLogin } from '@/components/profile/security-login';
import { UserProfile } from '@/types/user';
import { getProfile } from '@/lib/api/auth';
import { useEffect, useState } from 'react';
import { getTenantBranding } from '@/lib/api/tenant';

export default function MinistryAdminProfilePage() {
  const [user, setUser] = useState<UserProfile>({ id: '', firstName: '', lastName: '', email: '', phoneNumber: '', church: '', gender: '', location: '', role: '' });

  useEffect(() => {
    getProfile().then((p) => {
      if (!p) return;
      setUser({
        id: p.id ?? 'me',
        firstName: p.firstName ?? '',
        lastName: p.lastName ?? '',
        email: p.email ?? '',
        phoneNumber: p.mobilePhone ?? '',
        church: '',
        gender: '',
        location: '',
        role: p.roles?.[0] ?? 'Ministry Admin',
      });
    }).catch(() => {});
    getTenantBranding().then((b) => {
      if (b.organizationName) setUser((prev) => ({ ...prev, church: prev.church || b.organizationName! }));
    }).catch(() => {});
  }, []);

  return (
    <div className="flex w-full flex-col items-start gap-8">
      <h1 className="text-[26px] leading-[100%] font-bold lg:text-[32px]">
        Profile
      </h1>

      <ProfileImageSection user={user} />
      <PersonalInfo user={user} onUpdated={(updated) => setUser((prev) => ({ ...prev, ...updated }))} />
      <SecurityLogin />
      <ProfileActions />
    </div>
  );
}
