import {
  Poppins,
  Plus_Jakarta_Sans as PlusJakartaSans,
} from 'next/font/google';

export const poppins = Poppins({
  subsets: ['latin', 'devanagari', 'latin-ext'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const plusJakartaSans = PlusJakartaSans({
  subsets: ['latin', 'cyrillic-ext', 'latin-ext', 'vietnamese'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});
