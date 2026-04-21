export type PlaceStatus = 'visited' | 'wishlist';

export type GlobePlace = {
  id: string;
  name: string;
  status: PlaceStatus;
  coordinates: [lat: number, lng: number];
  memories: Array<{ src: string; label: string; date: string }>;
};

export type Vibe = { emoji: string; text: string };

export type DashboardPerson = 'marija' | 'aco';

export type DashboardVibes = Record<DashboardPerson, Vibe>;

export type DashboardVibesStorage = {
  dayKey: string;
  vibes: DashboardVibes;
  lastExpired?: { dayKey: string; vibes: DashboardVibes };
};

export type DashboardMemoryDraft = {
  title?: string;
  description?: string;
  date: string;
  imageFile: File;
  location: DashboardLocation;
};

export type DashboardMemory = {
  id: string;
  title?: string;
  description?: string;
  date: string;
  imageSrc: string;
  location: DashboardLocation;
};

export type DashboardLocation = {
  name: string;
  coordinates: [lat: number, lng: number];
  source: 'device' | 'search';
};
