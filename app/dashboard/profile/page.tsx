'use client';
import { PersonalInfo } from '@/components/profile/personal-info';
import { ProfileActions } from '@/components/profile/profile-actions';
import { ProfileImageSection } from '@/components/profile/profile-image';
import { SecurityLogin } from '@/components/profile/security-login';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types/user';
import { getProfile, listSessions, revokeSession, type SessionInfo } from '@/lib/api/auth';
import { USE_LIVE_API } from '@/lib/api/config';
import { useEffect, useState } from 'react';
import { getTenantBranding, getTenantOrganization } from '@/lib/api/tenant';

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

const emptyProfile: UserProfile = {
  id: 'me',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  church: '',
  gender: '',
  location: '',
  role: '',
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile>(USE_LIVE_API ? emptyProfile : dummyUser);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

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
    getTenantOrganization()
      .then((o) => {
        const loc = o.city ?? o.location ?? o.address ?? o.country;
        if (loc) setUser((prev) => ({ ...prev, location: prev.location || loc }));
      }).catch(() => {});
    listSessions().then((data) => {
      if (Array.isArray(data)) setSessions(data);
    }).catch(() => {});
  }, []);

  function handleRevoke(id: string) {
    setRevokingId(id);
    revokeSession(id)
      .then(() => setSessions((prev) => prev.filter((s) => (s.id ?? s.sessionId) !== id)))
      .catch(() => {})
      .finally(() => setRevokingId(null));
  }

  return (
    <div
      className={cn('w-full flex flex-col justify-start items-start gap-8')}
    >
      <div className="w-full flex flex-col justify-self-start items-start gap-3">
        <h1 className="text-[26px] lg:text-[32px] leading-[100%] tracking-[0%] font-bold">
          My Profile
        </h1>
        <p className="font-poppins font-light text-[15px] text-brand-gray-500">
          Manage your personal details, security, and sign-in settings.
        </p>
      </div>

      <ProfileImageSection user={user} />
      <PersonalInfo user={user} onUpdated={(updated) => setUser((prev) => ({ ...prev, ...updated }))} />
      <SecurityLogin />

      <div className="w-full rounded-[12.68px] bg-[#FBFBFB] p-6 md:p-10 lg:px-[55px] lg:py-[28px]">
        <h2 className="font-semibold text-[18px] text-[#243F84]">Active Sessions</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-[13px] text-brand-gray-500">You are currently signed in on this device.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {sessions.map((s) => {
              const id = s.id ?? s.sessionId ?? '';
              return (
                <div key={id} className="flex items-center justify-between rounded-[8px] border border-[#e8e8e8] bg-white px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#1a1a1a]">
                        {s.deviceInfo || 'Unknown device'}
                      </span>
                      {s.current && (
                        <span className="rounded-full bg-[#e7f7ee] px-2 py-0.5 text-[11px] font-medium text-[#34a853]">
                          This device
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-brand-gray-500">
                      {s.ipAddress ? `${s.ipAddress} · ` : ''}
                      {s.lastActive ? `Last active ${s.lastActive}` : s.createdAt ? `Started ${s.createdAt}` : ''}
                    </span>
                  </div>
                  {!s.current && (
                    <button
                      type="button"
                      disabled={revokingId === id}
                      onClick={() => handleRevoke(id)}
                      className="rounded-[6px] border border-[#eb0000] px-3 py-1.5 text-[12px] font-medium text-[#eb0000] transition-opacity disabled:opacity-50"
                    >
                      {revokingId === id ? 'Revoking…' : 'Revoke'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProfileActions />
    </div>
  );
}
