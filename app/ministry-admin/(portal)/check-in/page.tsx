import {
  EventsTable,
  QuickAccessCard,
  StatCard,
  type EventRow,
} from '@/components/ministry-admin/shared';

const EVENTS: EventRow[] = [
  {
    name: 'Midweek Recharge',
    date: 'Feb 21, 2025 • 6PM',
    location: 'Main Hall',
    registrations: '125',
    status: 'Upcoming',
  },
  {
    name: 'Weekend Workshop',
    date: 'Feb 25, 2025 • 10AM',
    location: 'Conference Room A',
    registrations: '75',
    status: 'Completed',
  },
  {
    name: 'Team Building Retreat',
    date: 'Mar 10, 2025 • 8AM',
    location: 'Offsite Location',
    registrations: '50',
    status: 'Ongoing',
  },
  {
    name: 'Monthly Check-in',
    date: 'Mar 15, 2025 • 3PM',
    location: 'Zoom',
    registrations: 'Unlimited',
    status: 'Cancelled',
  },
  {
    name: 'Spring Networking Event',
    date: 'Apr 5, 2025 • 5PM',
    location: 'Rooftop Garden',
    registrations: '150',
    status: 'Upcoming',
  },
  {
    name: 'Spring Networking Event',
    date: 'Apr 5, 2025 • 5PM',
    location: 'Rooftop Garden',
    registrations: '150',
    status: 'Upcoming',
  },
];

export default function GroupLeaderCheckInPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <StatCard title="Total Check in" value="15" variant="purple" />
        <StatCard title="Registered event" value="45" />
        <div className="lg:col-span-2">
          <QuickAccessCard />
        </div>
      </div>

      <EventsTable title="Events" rows={EVENTS} actionLabel="Check-in" />
    </div>
  );
}
