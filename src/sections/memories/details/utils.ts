import type { DashboardMemory, DashboardMemoryDetails } from 'src/sections/dashboard/types';

import dayjs from 'dayjs';

export function buildFallbackMemoryDetails(memory: DashboardMemory): DashboardMemoryDetails {
  return {
    ...memory,
    photos: [
      {
        id: `fallback-${memory.id}`,
        imageSrc: memory.imageSrc,
        sortOrder: 0,
      },
    ],
    photoCount: 1,
    previousMemory: null,
    nextMemory: null,
    relatedMemories: [],
  };
}

export function formatMemoryDate(value: string) {
  const date = dayjs(value);
  return date.isValid() ? date.format('DD MMM YYYY') : value;
}

export function getPrimaryPlaceName(name: string) {
  return name.split(',')[0]?.trim() || name;
}

export function getTimelineLabel(memory: DashboardMemory) {
  return memory.title ?? memory.description ?? memory.location.name;
}
