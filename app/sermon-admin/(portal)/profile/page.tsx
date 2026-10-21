'use client';

import { PersonalInfo } from '@/components/profile/personal-info';
import { ProfileActions } from '@/components/profile/profile-actions';
import { ProfileImageSection } from '@/components/profile/profile-image';
import { SecurityLogin } from '@/components/profile/security-login';
import { UserProfile } from '@/types/user';
import { getProfile } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';
import { useEffect, useState } from 'react';
import { getTenantBranding } from '@/lib/api/tenant';
import { api } from '@/lib/api/client';

const MOCK: UserProfile = {
  id: '1',
  firstName: 'Daniel',
  lastName: 'Okoro',
  email: 'daniel.okoro@gmail.com',
  phoneNumber: '(+62) 821 554 - 5432',
  church: 'Celebration Church Int.',
  gender: 'Male',
  location: 'Ontario, Canada',
  role: 'Sermon Staff',
};

export default function SermonAdminProfilePage() {
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
        role: p.roles?.[0] ?? 'Sermon Staff',
      });
    }).catch(() => {});
    getTenantBranding().then((b) => {
      if (b.organizationName) setUser((prev) => ({ ...prev, church: prev.church || b.organizationName! }));
    }).catch(() => {});
    (api.get<Record<string, unknown>>('/tenant/profile') as Promise<Record<string, unknown>>)
      .then((d) => {
        const loc = (d['city'] as string | undefined) ?? (d['location'] as string | undefined) ?? (d['address'] as string | undefined) ?? (d['country'] as string | undefined);
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
