import {
  Poppins,
  Plus_Jakarta_Sans as PlusJakartaSans,
} from 'next/font/google';

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const plusJakartaSans = PlusJakartaSans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});
