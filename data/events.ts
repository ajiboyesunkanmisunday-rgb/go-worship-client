import { Event } from '@/types/event';
import { PaginatedResponse } from '@/types/utils';

export const events: Event[] = [
  {
    id: '1',
    name: 'Midweek Recharge Program',
    eventDate: '2024-01-01',
    eventTime: '10:00',
    location: 'Location 1',
    type: 'Type 1',
    createdAt: new Date().toISOString(),
    status: 'upcoming',
    registered: true,
    eventImg: '/upcoming-1.png',
  },
  {
    id: '2',
    name: 'Renewal Conference',
    eventDate: '2024-02-15',
    eventTime: '18:30',
    location: 'Main Auditorium',
    type: 'Conference',
    createdAt: '2024-01-10T17:00:00Z',
    status: 'upcoming',
    registered: false,
    eventImg: '/upcoming-2.png',
  },
  {
    id: '3',
    name: 'Youth Fellowship Night',
    eventDate: '2024-03-10',
    eventTime: '19:00',
    location: 'Youth Hall',
    type: 'Fellowship',
    createdAt: '2023-12-22T13:15:00Z',
    status: 'upcoming',
    registered: true,
    eventImg: '/Frame 1321316418.png',
  },
  {
    id: '4',
    name: 'Spring Picnic',
    eventDate: '2024-03-28',
    eventTime: '12:30',
    location: 'Community Park',
    type: 'Outdoor',
    createdAt: '2024-02-05T16:22:00Z',
    status: 'upcoming',
    registered: false,
    eventImg: '/Church event 1.png',
  },
  {
    id: '5',
    name: "Men's Prayer Breakfast",
    eventDate: '2024-04-07',
    eventTime: '08:00',
    location: 'Fellowship Hall',
    type: 'Prayer',
    createdAt: '2024-03-20T08:45:00Z',
    status: 'upcoming',
    registered: true,
    eventImg: '/upcoming-1.png',
  },
  {
    id: '6',
    name: 'Worship Workshop',
    eventDate: '2024-04-21',
    eventTime: '14:00',
    location: 'Music Room',
    type: 'Workshop',
    createdAt: '2024-03-30T09:00:00Z',
    status: 'upcoming',
    registered: false,
    eventImg: '/Church event 1.png',
  },
  {
    id: '7',
    name: 'Annual Thanksgiving',
    eventDate: '2024-05-04',
    eventTime: '17:30',
    location: 'Main Auditorium',
    type: 'Celebration',
    createdAt: '2024-04-11T10:11:00Z',
    status: 'upcoming',
    registered: true,
    eventImg: '/upcoming-2.png',
  },
  {
    id: '8',
    name: 'Family Movie Night',
    eventDate: '2024-06-11',
    eventTime: '20:00',
    location: 'Courtyard',
    type: 'Social',
    createdAt: '2024-05-30T15:10:00Z',
    status: 'upcoming',
    registered: false,
    eventImg: '/Church event 1.png',
  },
  {
    id: '9',
    name: 'Easter Sunday Service',
    eventDate: '2024-03-31',
    eventTime: '09:00',
    location: 'Sanctuary',
    type: 'Service',
    createdAt: '2024-02-20T12:00:00Z',
    status: 'past',
    registered: true,
    eventImg: '/upcoming-2.png',
  },
  {
    id: '10',
    name: 'Christmas Candlelight',
    eventDate: '2023-12-24',
    eventTime: '19:30',
    location: 'Main Auditorium',
    type: 'Service',
    createdAt: '2023-11-28T08:45:00Z',
    status: 'past',
    registered: true,
    eventImg: '/upcoming-2.png',
  },
];

export async function fetchPaginatedEvents(
  pageIndex: number,
  pageSize: number
): Promise<PaginatedResponse<Event>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedData = events.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    totalItems: events.length,
    pageCount: Math.ceil(events.length / pageSize),
  };
}

export function fetchEvent(id: string) {
  return events.find((event) => event.id === id);
}
