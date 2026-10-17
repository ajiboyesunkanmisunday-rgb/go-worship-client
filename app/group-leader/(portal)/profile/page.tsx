import { PersonalInfo } from '@/components/profile/personal-info';
import { ProfileActions } from '@/components/profile/profile-actions';
import { ProfileImageSection } from '@/components/profile/profile-image';
import { SecurityLogin } from '@/components/profile/security-login';
import { UserProfile } from '@/types/user';

const leaderUser: UserProfile = {
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
  return (
    <div className="flex w-full flex-col items-start gap-8">
      <h1 className="text-[26px] leading-[100%] font-bold lg:text-[32px]">
        Profile
      </h1>

      <ProfileImageSection user={leaderUser} />
      <PersonalInfo user={leaderUser} />
      <SecurityLogin />
      <ProfileActions />
    </div>
  );
}
