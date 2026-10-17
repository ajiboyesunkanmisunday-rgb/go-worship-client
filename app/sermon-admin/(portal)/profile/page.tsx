import { PersonalInfo } from '@/components/profile/personal-info';
import { ProfileActions } from '@/components/profile/profile-actions';
import { ProfileImageSection } from '@/components/profile/profile-image';
import { SecurityLogin } from '@/components/profile/security-login';
import { UserProfile } from '@/types/user';

const staffUser: UserProfile = {
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
  return (
    <div className="flex w-full flex-col items-start gap-8">
      <h1 className="text-[26px] leading-[100%] font-bold lg:text-[32px]">
        Profile
      </h1>

      <ProfileImageSection user={staffUser} />
      <PersonalInfo user={staffUser} />
      <SecurityLogin />
      <ProfileActions />
    </div>
  );
}
