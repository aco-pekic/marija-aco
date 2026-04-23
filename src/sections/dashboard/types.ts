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
  addedBy?: DashboardPerson;
};

export type DashboardMemory = {
  id: string;
  title?: string;
  description?: string;
  date: string;
  imageSrc: string;
  location: DashboardLocation;
  addedBy?: DashboardPerson;
  sharedNote?: string;
  updatedAt?: string;
  photoCount?: number;
};

export type DashboardMemoryPhoto = {
  id: string;
  imageSrc: string;
  caption?: string;
  sortOrder: number;
  createdAt?: string;
};

export type DashboardMemoryPhotoUpdateInput = {
  id: string;
  imageSrc: string;
  caption?: string;
  sortOrder: number;
};

export type DashboardMemoryDetails = DashboardMemory & {
  photos: DashboardMemoryPhoto[];
  previousMemory: DashboardMemory | null;
  nextMemory: DashboardMemory | null;
  relatedMemories: DashboardMemory[];
};

export type DashboardMemoryUpdateInput = {
  title?: string;
  description?: string;
  date?: string;
  sharedNote?: string;
  coverImageSrc?: string;
  photos?: DashboardMemoryPhotoUpdateInput[];
};

export type DashboardLocation = {
  name: string;
  coordinates: [lat: number, lng: number];
  source: 'device' | 'search';
};

export type DashboardWish = {
  id: string;
  location: DashboardLocation;
  note?: string;
};

export type DashboardMediaTarget = 'hero' | 'marija' | 'aco';

export type DashboardMedia = {
  heroImage?: string;
  marijaAvatar?: string;
  acoAvatar?: string;
};
