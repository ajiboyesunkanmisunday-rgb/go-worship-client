'use client';

import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { CameraIcon } from '@/icons/media';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/types/user';

type Props = {
  user: UserProfile;
};

export function ProfileImageSection({ user }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getuserImgSrc = () => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }

    if (user.profileImage) {
      return user.profileImage;
    }

    return '/User.svg';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getImgDimensions = () => {
    if (selectedFile) return { width: 115, height: 115 };
    if (user.profileImage) return { width: 115, height: 115 };
    return { width: 77, height: 77 };
  };

  return (
    <div
      className={cn(
        'w-full p-6 md:p-10 rounded-[12.68px] bg-[#FBFBFB]',
        'lg:px-[55px] lg:py-[32px] flex flex-col md:flex-row justify-start md:items-center gap-8'
      )}
    >
      <div
        className={cn(
          'relative rounded-full size-[115px] shrink-0 flex justify-center items-center',
          'border-6 border-t-[#EB0000] border-r-[#243F84] border-b-[#34A853] border-l-[#FF8D28]'
        )}
      >
        <input
          type="file"
          className="hidden"
          ref={inputRef}
          accept="image/*"
          onChange={handleFileChange}
        />

        <Image
          src={getuserImgSrc()}
          alt="User Image"
          width={getImgDimensions().width}
          height={getImgDimensions().height}
          className={cn('object-cover shrink-0', {
            'w-[77px] h-[77px]': !selectedFile && !user.profileImage,
            'w-full h-full rounded-full': selectedFile || user.profileImage,
          })}
        />

        <Button
          size="icon-lg"
          className={cn(
            'absolute rounded-full shrink-0 -bottom-2 -right-2',
            'bg-white hover:bg-brand-gray-700'
          )}
          onClick={() => inputRef.current?.click()}
        >
          <CameraIcon color="black" className="size-[22px]" />
          <span className="sr-only">Change Profile Image</span>
        </Button>
      </div>

      <div className="flex flex-col justify-start items-start gap-3">
        <p className="font-semibold text-[#243F84] text-[18px] leading-[100%] tracking-[0%]">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-[#333333] text-[14px] leading-[100%] tracking-[0%]">
          {user.role}
        </p>
        <p className="text-[#333333] text-[14px] leading-[100%] tracking-[0%]">
          {user.location}
        </p>
      </div>
    </div>
  );
}
