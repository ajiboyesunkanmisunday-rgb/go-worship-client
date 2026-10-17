import { GroupActivity } from '@/types/groups';
import { PaginatedResponse } from '@/types/utils';

export const groupActivities: GroupActivity[] = [
  {
    id: '1',
    date: '2024-06-10',
    time: '18:30',
    location: 'Community Hall A',
    status: 'Upcoming',
    createdAt: '2024-05-15T12:00:00Z',
  },
  {
    id: '2',
    date: '2024-06-12',
    time: '19:00',
    location: 'Zoom (Online)',
    status: 'Upcoming',
    createdAt: '2024-05-18T15:22:00Z',
  },
  {
    id: '3',
    date: '2024-05-28',
    time: '18:00',
    location: 'Room 201, Campus Center',
    status: 'Completed',
    createdAt: '2024-05-01T10:00:00Z',
  },
  {
    id: '4',
    date: '2024-05-22',
    time: '17:30',
    location: 'Cafe Bella',
    status: 'Completed',
    createdAt: '2024-04-28T09:30:00Z',
  },
  {
    id: '5',
    date: '2024-06-15',
    time: '14:00',
    location: 'Local Park',
    status: 'Upcoming',
    createdAt: '2024-05-20T08:00:00Z',
  },
  {
    id: '6',
    date: '2024-06-17',
    time: '16:00',
    location: 'Community Hall B',
    status: 'Upcoming',
    createdAt: '2024-05-22T12:00:00Z',
  },
  {
    id: '7',
    date: '2024-06-18',
    time: '18:30',
    location: 'Youth Center',
    status: 'Upcoming',
    createdAt: '2024-05-23T11:00:00Z',
  },
  {
    id: '8',
    date: '2024-05-30',
    time: '18:45',
    location: 'Online Hangout',
    status: 'Completed',
    createdAt: '2024-05-04T13:00:00Z',
  },
  {
    id: '9',
    date: '2024-05-10',
    time: '15:00',
    location: 'Cafe Bella',
    status: 'Completed',
    createdAt: '2024-04-11T11:00:00Z',
  },
  {
    id: '10',
    date: '2024-06-20',
    time: '20:00',
    location: 'Rooftop Meeting Room',
    status: 'Upcoming',
    createdAt: '2024-05-25T09:00:00Z',
  },
  {
    id: '11',
    date: '2024-06-21',
    time: '17:00',
    location: 'Main Auditorium',
    status: 'Upcoming',
    createdAt: '2024-05-25T12:15:00Z',
  },
  {
    id: '12',
    date: '2024-05-13',
    time: '19:30',
    location: 'Annex Building',
    status: 'Completed',
    createdAt: '2024-04-14T14:43:00Z',
  },
  {
    id: '13',
    date: '2024-05-07',
    time: '18:00',
    location: 'Zoom (Online)',
    status: 'Completed',
    createdAt: '2024-04-08T10:15:00Z',
  },
  {
    id: '14',
    date: '2024-06-23',
    time: '14:30',
    location: 'Community Hall A',
    status: 'Upcoming',
    createdAt: '2024-05-28T13:50:00Z',
  },
  {
    id: '15',
    date: '2024-06-25',
    time: '18:00',
    location: 'Main Auditorium',
    status: 'Upcoming',
    createdAt: '2024-05-29T19:05:00Z',
  },
  {
    id: '16',
    date: '2024-05-27',
    time: '16:45',
    location: 'Room 201, Campus Center',
    status: 'Completed',
    createdAt: '2024-05-01T09:00:00Z',
  },
  {
    id: '17',
    date: '2024-06-27',
    time: '17:30',
    location: 'Local Park',
    status: 'Upcoming',
    createdAt: '2024-05-30T10:00:00Z',
  },
  {
    id: '18',
    date: '2024-06-28',
    time: '19:00',
    location: 'Annex Building',
    status: 'Upcoming',
    createdAt: '2024-05-31T11:00:00Z',
  },
  {
    id: '19',
    date: '2024-05-05',
    time: '17:00',
    location: 'Rooftop Meeting Room',
    status: 'Completed',
    createdAt: '2024-04-06T14:00:00Z',
  },
  {
    id: '20',
    date: '2024-06-30',
    time: '20:00',
    location: 'Youth Center',
    status: 'Upcoming',
    createdAt: '2024-06-01T12:00:00Z',
  },
  {
    id: '21',
    date: '2024-05-16',
    time: '15:30',
    location: 'Community Hall B',
    status: 'Completed',
    createdAt: '2024-04-18T08:30:00Z',
  },
  {
    id: '22',
    date: '2024-06-08',
    time: '16:00',
    location: 'Main Auditorium',
    status: 'Upcoming',
    createdAt: '2024-05-12T14:00:00Z',
  },
  {
    id: '23',
    date: '2024-05-18',
    time: '17:30',
    location: 'Cafe Bella',
    status: 'Completed',
    createdAt: '2024-04-20T19:15:00Z',
  },
  {
    id: '24',
    date: '2024-07-01',
    time: '19:30',
    location: 'Online Hangout',
    status: 'Upcoming',
    createdAt: '2024-06-02T15:00:00Z',
  },
  {
    id: '25',
    date: '2024-07-02',
    time: '18:30',
    location: 'Community Hall A',
    status: 'Upcoming',
    createdAt: '2024-06-03T16:00:00Z',
  },
];

export async function fetchPaginatedGroupActivities(
  pageIndex: number,
  pageSize: number
): Promise<PaginatedResponse<GroupActivity>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedData = groupActivities.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    totalItems: groupActivities.length,
    pageCount: Math.ceil(groupActivities.length / pageSize),
  };
}
