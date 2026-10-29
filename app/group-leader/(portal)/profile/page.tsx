'use client';

import { PersonalInfo } from '@/components/profile/personal-info';
import { ProfileActions } from '@/components/profile/profile-actions';
import { ProfileImageSection } from '@/components/profile/profile-image';
import { SecurityLogin } from '@/components/profile/security-login';
import { UserProfile } from '@/types/user';
import { getProfile } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';
import { useEffect, useState } from 'react';
import { getTenantBranding, getTenantOrganization } from '@/lib/api/tenant';

const MOCK: UserProfile = {
  id: '1',
  firstName: 'Natashia',
  lastName: 'Khalerira',
  email: 'Khalerira002@gmail.com',
  phoneNumber: '(+62) 821 554 - 5432',
  church: 'Celebration Church Int.',
  gender: 'Female',
  location: 'Ontario, Canada',
  role: 'Group Leader',
};

export default function GroupLeaderProfilePage() {
  const [user, setUser] = useState<UserProfile>(USE_LIVE_API ? { id: '', firstName: '', lastName: '', email: '', phoneNumber: '', church: '', gender: '', location: '', role: '' } : MOCK);

  useEffect(() => {
    if (!USE_LIVE_API) return;
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
        role: p.roles?.[0] ?? 'Group Leader',
      });
    }).catch(() => {});
    getTenantBranding().then((b) => {
      if (b.organizationName) setUser((prev) => ({ ...prev, church: prev.church || b.organizationName! }));
    }).catch(() => {});
    getTenantOrganization()
      .then((o) => {
        const loc = o.city ?? o.location ?? o.address ?? o.country;
        if (loc) setUser((prev) => ({ ...prev, location: prev.location || loc }));
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
