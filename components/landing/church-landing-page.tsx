'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, MapPin, Clock, Users, Heart, ChevronDown } from 'lucide-react';
import type { SiteContext } from '@/lib/api/bootstrap';
import { getPublicUpcomingEvents } from '@/lib/api/public';
import { cn } from '@/lib/utils';

type LandingEvent = {
  id?: string;
  title?: string;
  name?: string;
  date?: string;
  startDate?: string;
  time?: string;
  startTime?: string;
  location?: string;
  venue?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  attendeeCount?: number;
};

function formatEventDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

function formatEventTime(timeStr?: string): string {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return timeStr;
  } catch { return timeStr; }
}

export function ChurchLandingPage({ context }: { context: SiteContext }) {
  const [events, setEvents] = useState<LandingEvent[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const orgName = context.branding?.organizationName ?? context.displayName ?? 'Our Church';
  const logoUrl = context.branding?.logoUrl;
  const primaryColor = context.branding?.primaryColor ?? '#1A56DB';
  const secondaryColor = context.branding?.secondaryColor ?? '#4F46E5';

  useEffect(() => {
    getPublicUpcomingEvents()
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : ((data as Record<string, unknown>)['items'] ?? []);
        if (Array.isArray(list)) {
          setEvents((list as LandingEvent[]).slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const gradientStyle = {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
  };

  const ctaStyle = {
    background: primaryColor,
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Nav */}
      <nav
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled ? 'bg-white/95 shadow-sm backdrop-blur-md' : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={orgName}
                width={40}
                height={40}
                className="size-10 rounded-lg object-contain"
              />
            ) : (
              <div
                className="flex size-10 items-center justify-center rounded-lg text-[16px] font-bold text-white"
                style={ctaStyle}
              >
                {orgName.charAt(0)}
              </div>
            )}
            <span
              className={cn(
                'text-[17px] font-bold transition-colors',
                scrolled ? 'text-[#111]' : 'text-white'
              )}
            >
              {orgName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className={cn(
                'hidden rounded-full px-5 py-2 text-[14px] font-medium transition-colors sm:block',
                scrolled
                  ? 'text-[#333] hover:bg-[#f5f5f5]'
                  : 'text-white/90 hover:bg-white/10'
              )}
            >
              Sign in
            </Link>
            {context.registration?.customerRegistration && (
              <Link
                href="/auth/signup"
                className="rounded-full px-5 py-2 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                style={ctaStyle}
              >
                Join us
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center"
        style={gradientStyle}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 size-[500px] rounded-full bg-white/5" />
          <div className="absolute -bottom-48 -right-24 size-[600px] rounded-full bg-white/5" />
          <div className="absolute left-1/2 top-1/2 size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03]" />
        </div>

        {logoUrl && (
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-xl" />
            <Image
              src={logoUrl}
              alt={orgName}
              width={96}
              height={96}
              className="relative size-24 rounded-2xl object-contain shadow-2xl"
            />
          </div>
        )}

        <h1 className="relative mx-auto max-w-4xl text-[48px] font-extrabold leading-tight tracking-tight text-white lg:text-[72px]">
          Welcome to<br />
          <span className="text-white/90">{orgName}</span>
        </h1>

        <p className="relative mt-6 max-w-xl text-[18px] leading-relaxed text-white/80 lg:text-[20px]">
          A community of faith, hope, and love. Join us as we worship together and grow in God&apos;s grace.
        </p>

        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/auth/login"
            className="flex h-[56px] items-center gap-2 rounded-full bg-white px-8 text-[16px] font-semibold transition-opacity hover:opacity-90"
            style={{ color: primaryColor }}
          >
            Sign in to your account
            <ArrowRight className="size-5" />
          </Link>

          {context.registration?.customerRegistration && (
            <Link
              href="/auth/signup"
              className="flex h-[56px] items-center gap-2 rounded-full border-2 border-white/40 px-8 text-[16px] font-semibold text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10"
            >
              New here? Join us
            </Link>
          )}
        </div>

        {/* Scroll indicator */}
        {events.length > 0 && (
          <div className="absolute bottom-10 flex flex-col items-center gap-1">
            <ChevronDown className="size-6 animate-bounce text-white/60" />
          </div>
        )}
      </section>

      {/* Stats strip */}
      <section className="border-y border-[#f0f0f0] bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-[#f0f0f0] lg:grid-cols-4">
          {[
            { icon: Users, label: 'Community', value: 'Growing Together' },
            { icon: Heart, label: 'Worship', value: 'Every Week' },
            { icon: Calendar, label: 'Events', value: 'All Year Long' },
            { icon: MapPin, label: 'Location', value: 'Near You' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-6 py-8 text-center">
              <Icon className="size-6 text-[#999]" />
              <p className="mt-1 text-[15px] font-semibold text-[#111]">{value}</p>
              <p className="text-[12px] text-[#999]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="bg-[#fafbff] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <span
                className="inline-block rounded-full px-4 py-1.5 text-[13px] font-semibold"
                style={{ background: `${primaryColor}18`, color: primaryColor }}
              >
                What&apos;s Coming Up
              </span>
              <h2 className="mt-4 text-[36px] font-extrabold text-[#111] lg:text-[44px]">
                Upcoming Events
              </h2>
              <p className="mt-3 text-[16px] text-[#666]">
                Come gather with us. Everyone is welcome.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((ev, i) => {
                const title = ev.title ?? ev.name ?? 'Church Event';
                const date = formatEventDate(ev.startDate ?? ev.date);
                const time = formatEventTime(ev.startTime ?? ev.time ?? ev.startDate ?? ev.date);
                const location = ev.venue ?? ev.location;
                const cover = ev.coverImageUrl ?? ev.imageUrl;

                return (
                  <div
                    key={ev.id ?? i}
                    className="group overflow-hidden rounded-2xl border border-[#eee] bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {cover ? (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={cover}
                          alt={title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                    ) : (
                      <div
                        className="flex h-48 items-center justify-center"
                        style={gradientStyle}
                      >
                        <Calendar className="size-12 text-white/60" />
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="line-clamp-2 text-[17px] font-bold text-[#111]">{title}</h3>

                      <div className="mt-3 flex flex-col gap-1.5">
                        {date && (
                          <div className="flex items-center gap-2 text-[13px] text-[#555]">
                            <Calendar className="size-3.5 shrink-0" style={{ color: primaryColor }} />
                            {date}
                          </div>
                        )}
                        {time && (
                          <div className="flex items-center gap-2 text-[13px] text-[#555]">
                            <Clock className="size-3.5 shrink-0" style={{ color: primaryColor }} />
                            {time}
                          </div>
                        )}
                        {location && (
                          <div className="flex items-center gap-2 text-[13px] text-[#555]">
                            <MapPin className="size-3.5 shrink-0" style={{ color: primaryColor }} />
                            <span className="line-clamp-1">{location}</span>
                          </div>
                        )}
                      </div>

                      <Link
                        href="/auth/login"
                        className="mt-4 flex h-10 items-center justify-center rounded-[8px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                        style={ctaStyle}
                      >
                        Sign in to register
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Guest giving section */}
      <section className="px-6 py-24">
        <div
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-8 py-16 text-center lg:px-16"
          style={gradientStyle}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-10 size-48 rounded-full bg-white/10" />
          </div>

          <div className="relative">
            <span className="inline-flex size-16 items-center justify-center rounded-full bg-white/20">
              <Heart className="size-8 text-white" />
            </span>
            <h2 className="mt-5 text-[32px] font-extrabold text-white lg:text-[40px]">
              Give Online
            </h2>
            <p className="mt-4 text-[16px] text-white/80">
              Support our ministry and help us grow God&apos;s kingdom together.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/checkout"
                className="flex h-[52px] items-center gap-2 rounded-full bg-white px-8 text-[15px] font-bold transition-opacity hover:opacity-90"
                style={{ color: primaryColor }}
              >
                Give as Guest
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/auth/login"
                className="flex h-[52px] items-center gap-2 rounded-full border-2 border-white/40 px-8 text-[15px] font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                Sign in to Give
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#f0f0f0] bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <Image src={logoUrl} alt={orgName} width={28} height={28} className="size-7 rounded-md object-contain" />
            ) : (
              <div
                className="flex size-7 items-center justify-center rounded-md text-[12px] font-bold text-white"
                style={ctaStyle}
              >
                {orgName.charAt(0)}
              </div>
            )}
            <span className="text-[15px] font-bold text-[#111]">{orgName}</span>
          </div>
          <p className="text-[13px] text-[#999]">
            Powered by{' '}
            <a href="https://go-worship.com" target="_blank" rel="noreferrer" className="hover:underline">
              GoWorship
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
