'use client';
import { PersonalInfo } from '@/components/profile/personal-info';
import { ProfileActions } from '@/components/profile/profile-actions';
import { ProfileImageSection } from '@/components/profile/profile-image';
import { SecurityLogin } from '@/components/profile/security-login';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types/user';
import { getProfile } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';
import { useEffect, useState } from 'react';
import { getTenantBranding } from '@/lib/api/tenant';
import { api } from '@/lib/api/client';

const dummyUser: UserProfile = {
  id: '1',
  firstName: 'Natashia',
  lastName: 'Khalerira',
  email: 'Khalerira002@gmail.com',
  phoneNumber: '(+62) 821 554 - 5432',
  church: 'Celebration Church Int.',
  gender: 'Female',
  location: 'Ontario, Canada',
  role: 'Member',
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile>(dummyUser);

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
        role: p.roles?.[0] ?? '',
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
    <div
      className={cn('w-full flex flex-col justify-start items-start gap-8')}
    >
      <div className="w-full flex flex-col justify-self-start items-start gap-3">
        <h1 className="text-[26px] lg:text-[32px] leading-[100%] tracking-[0%] font-bold">
          My Profile
        </h1>
        <p className="font-poppins font-light text-[15px] text-brand-gray-500">
          Connect with smaller communities and grow spiritually through
          fellowship.
        </p>
      </div>

      <ProfileImageSection user={user} />
      <PersonalInfo user={user} onUpdated={(updated) => setUser((prev) => ({ ...prev, ...updated }))} />
      <SecurityLogin />

      <ProfileActions />
    </div>
  );
}
