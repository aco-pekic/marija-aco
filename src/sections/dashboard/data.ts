import type { GlobePlace } from './types';

export const DASHBOARD_PLACES: GlobePlace[] = [
  {
    id: 'paris',
    name: 'Paris',
    status: 'visited',
    coordinates: [48.8566, 2.3522],
    memories: [
      { src: '/assets/background/background-5.webp', label: 'Seine night walk', date: '2024-05-12' },
      { src: '/assets/background/background-7.webp', label: 'Coffee & croissant', date: '2024-05-13' },
    ],
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    status: 'visited',
    coordinates: [52.3676, 4.9041],
    memories: [{ src: '/assets/background/background-6.webp', label: 'Canal light', date: '2023-09-18' }],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    status: 'wishlist',
    coordinates: [35.6762, 139.6503],
    memories: [{ src: '/assets/background/background-3.webp', label: 'Someday', date: '—' }],
  },
  {
    id: 'bali',
    name: 'Bali',
    status: 'wishlist',
    coordinates: [-8.3405, 115.092],
    memories: [{ src: '/assets/background/background-4.jpg', label: 'Sunset dreams', date: '—' }],
  },
];

