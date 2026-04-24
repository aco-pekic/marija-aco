import 'leaflet/dist/leaflet.css';

import type { DashboardWish, DashboardMemory } from 'src/sections/dashboard/types';

import L from 'leaflet';
import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useEffect } from 'react';
import { Marker, useMap, TileLayer, MapContainer } from 'react-leaflet';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { isSupabaseReady } from 'src/lib/supabase';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { listDashboardWishes, listDashboardMemories } from 'src/sections/dashboard/supabase';

import { PlaceMemoriesDialog } from '../components/place-memories-dialog';

// --- Color Channels ---
const ROSE_CHANNELS = '198 91 124';
const PLUM_CHANNELS = '94 55 80';
const DEFAULT_MAP_CENTER: [number, number] = [44.787, 20.457];
const DEFAULT_MAP_ZOOM = 5;

// --- Types & Helpers ---
type PlaceStatus = 'visited' | 'wishlist';

type MapPlace = {
  id: string;
  name: string;
  status: PlaceStatus;
  coordinates: [lat: number, lng: number];
  memories: DashboardMemory[];
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Nešto je pošlo po zlu. Pokušaj ponovo.';
}

function isMissingWishesTableError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);

  const normalized = message.toLowerCase();

  return (
    normalized.includes('dashboard_wishes') &&
    (normalized.includes('schema cache') ||
      normalized.includes('could not find the table') ||
      normalized.includes('pgrst205'))
  );
}

function toPlaceId(name: string, coordinates: [number, number]) {
  const slug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'place';

  return `${slug}-${coordinates[0].toFixed(5)}-${coordinates[1].toFixed(5)}`;
}

function buildPlaces(memories: DashboardMemory[], wishes: DashboardWish[]): MapPlace[] {
  const visitedMap = new Map<string, MapPlace>();

  for (const memory of memories) {
    const coords = memory.location.coordinates;
    const key = `${memory.location.name}|${coords[0].toFixed(6)}|${coords[1].toFixed(6)}`;
    const existing = visitedMap.get(key);

    if (existing) {
      existing.memories.push(memory);
      continue;
    }

    visitedMap.set(key, {
      id: toPlaceId(memory.location.name, coords),
      name: memory.location.name,
      status: 'visited',
      coordinates: coords,
      memories: [memory],
    });
  }

  const visited = Array.from(visitedMap.values()).map((place) => ({
    ...place,
    memories: [...place.memories].sort((a, b) => b.date.localeCompare(a.date)),
  }));

  const wishlist: MapPlace[] = wishes.map((wish) => ({
    id: `wish-${wish.id}`,
    name: wish.location.name,
    status: 'wishlist',
    coordinates: wish.location.coordinates,
    memories: [],
  }));

  return [...visited, ...wishlist].sort((a, b) => a.name.localeCompare(b.name));
}

// Custom Marker with "Story" Animation
function createStoryMarker(args: { imageSrc?: string; status: PlaceStatus; isActive?: boolean }) {
  const { imageSrc, status, isActive = false } = args;
  const isVisited = status === 'visited';
  const size = isActive ? 54 : 46;
  const innerSize = isActive ? 48 : 40;
  const ringWidth = isActive ? 3 : 2;
  const activeScale = isActive ? 1.06 : 1;

  // Visited = Photo Ring | Wishlist = Glowing Heart
  const innerContent =
    imageSrc && isVisited
      ? `<img src="${imageSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
      : `<div style="display:grid; place-items:center; height:100%; color:white;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>`;

  const ringColor = isVisited ? `rgb(${ROSE_CHANNELS})` : '#FFB5C5';

  return L.divIcon({
    className: 'story-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        position: relative;
        transform: scale(${activeScale});
        animation: markerFloat 3s ease-in-out infinite;
      ">
        <div style="
          position: absolute; bottom: 0; left: 50%;
          width: 4px; height: 4px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          transform: translateX(-50%) scaleX(2);
          filter: blur(2px);
          animation: shadowScale 3s ease-in-out infinite;
        "></div>
        <div style="
          width: ${innerSize}px; height: ${innerSize}px;
          border-radius: 50%;
          border: 3px solid white;
          background: ${isVisited ? 'white' : ringColor};
          box-shadow: 0 8px 16px rgba(0,0,0,0.2), 0 0 0 ${ringWidth}px ${ringColor}, ${
            isActive ? `0 0 0 8px ${varAlpha(ROSE_CHANNELS, 0.16)}` : 'none'
          };
          overflow: hidden;
        ">${innerContent}</div>
      </div>
      <style>
        @keyframes markerFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes shadowScale { 0%, 100% { transform: translateX(-50%) scaleX(2); opacity: 0.2; } 50% { transform: translateX(-50%) scaleX(1); opacity: 0.1; } }
      </style>
    `,
  });
}

function MapViewportController({ selectedPlace }: { selectedPlace: MapPlace | null }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (selectedPlace) {
      map.flyTo(selectedPlace.coordinates, Math.max(map.getZoom(), 8), { duration: 0.6 });
      return;
    }

    map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
  }, [map, selectedPlace]);

  return null;
}

export function MapView() {
  const theme = useTheme();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const query = '';
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null);

  const [memories, setMemories] = useState<DashboardMemory[]>([]);
  const [wishes, setWishes] = useState<DashboardWish[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseReady);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoading(isSupabaseReady);
      setLoadError(null);

      if (!isSupabaseReady) {
        setMemories([]);
        setWishes([]);
        return;
      }

      try {
        const [memoriesResult, wishesResult] = await Promise.allSettled([
          listDashboardMemories('shared'),
          listDashboardWishes('shared'),
        ]);

        if (memoriesResult.status === 'rejected') throw memoriesResult.reason;

        let nextWishes: DashboardWish[] = [];
        if (wishesResult.status === 'fulfilled') {
          nextWishes = wishesResult.value;
        } else if (!isMissingWishesTableError(wishesResult.reason)) {
          throw wishesResult.reason;
        }

        if (!active) return;
        setMemories(memoriesResult.value);
        setWishes(nextWishes);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setLoadError(getErrorMessage(error));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const places = useMemo(() => buildPlaces(memories, wishes), [memories, wishes]);

  const filteredPlaces = useMemo(
    () =>
      places.filter((p) => {
        const matchQuery = p.name.toLowerCase().includes(query.toLowerCase());
        return matchQuery;
      }),
    [places, query]
  );

  useEffect(() => {
    if (selectedPlaceId && !filteredPlaces.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId(null);
    }
  }, [filteredPlaces, selectedPlaceId]);

  const selectedPlace = useMemo(
    () => (selectedPlaceId ? (filteredPlaces.find((p) => p.id === selectedPlaceId) ?? null) : null),
    [filteredPlaces, selectedPlaceId]
  );

  const openPlace = useMemo(
    () => (openPlaceId ? (places.find((p) => p.id === openPlaceId) ?? null) : null),
    [openPlaceId, places]
  );

  const handleClosePlace = () => setOpenPlaceId(null);

  return (
    <DashboardContent maxWidth="xl" sx={{ pb: 0 }}>
      {/* --- Header Section --- */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900 }}>
            Naša Mapa
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {places.length} lokacija koje smo otkrili zajedno.
          </Typography>
          {loadError ? (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'error.main' }}>
              {loadError}
            </Typography>
          ) : null}
        </Box>
        <Chip
          label={dayjs().format('MMMM YYYY')}
          sx={{
            bgcolor: varAlpha(ROSE_CHANNELS, 0.1),
            color: `rgb(${ROSE_CHANNELS})`,
            fontWeight: 800,
            borderRadius: 1.5,
          }}
        />
      </Stack>

      {/* --- Integrated Container --- */}
      <Card
        sx={{
          width: 1,
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${varAlpha(PLUM_CHANNELS, 0.1)}`,
          boxShadow: `0 24px 48px -12px ${varAlpha(PLUM_CHANNELS, 0.15)}`,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 1,
            height: 'auto',
            aspectRatio: { xs: '3 / 4', sm: '4 / 5', md: '16 / 10', lg: '16 / 9' },
            minHeight: { xs: 420, sm: 540, md: 620 },
          }}
        >
          <MapContainer
            center={DEFAULT_MAP_CENTER}
            zoom={DEFAULT_MAP_ZOOM}
            scrollWheelZoom
            style={{
              height: '100%',
              width: '100%',
              filter:
                theme.palette.mode === 'dark'
                  ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(85%)'
                  : 'none',
            }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapViewportController selectedPlace={selectedPlace} />
            {filteredPlaces.map((place) => (
              <Marker
                key={place.id}
                position={place.coordinates}
                icon={createStoryMarker({
                  imageSrc: place.memories[0]?.imageSrc,
                  status: place.status,
                  isActive: place.id === selectedPlaceId,
                })}
                eventHandlers={{
                  click: () => {
                    setSelectedPlaceId(place.id);
                    setOpenPlaceId(place.id);
                  },
                }}
              />
            ))}
          </MapContainer>

          {isLoading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 900,
                bgcolor: varAlpha('255 255 255', 0.6),
                backdropFilter: 'blur(6px)',
              }}
            >
              <CircularProgress size={26} />
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                Učitavam lokacije...
              </Typography>
            </Stack>
          ) : null}

          {!isLoading && !filteredPlaces.length ? (
            <Stack
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 900,
                px: 3,
                bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.72),
                backdropFilter: 'blur(10px)',
                textAlign: 'center',
              }}
            >
              <Iconify
                icon="solar:map-point-search-bold-duotone"
                width={36}
                sx={{ color: 'primary.main' }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Nema mesta za ovaj filter
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Promeni pretragu da vidiš lokacije na mapi.
              </Typography>
            </Stack>
          ) : null}
        </Box>
      </Card>
      <PlaceMemoriesDialog
        open={Boolean(openPlace)}
        place={openPlace}
        onClose={handleClosePlace}
        roseChannels={ROSE_CHANNELS}
        plumChannels={PLUM_CHANNELS}
      />
    </DashboardContent>
  );
}
