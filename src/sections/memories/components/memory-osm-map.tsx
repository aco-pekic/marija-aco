import 'leaflet/dist/leaflet.css';

import type { CSSProperties } from 'react';
import type { DivIcon, Map as LeafletMap } from 'leaflet';

import L from 'leaflet';
import { useRef, useMemo, useState, useEffect } from 'react';
import { Marker, TileLayer, MapContainer } from 'react-leaflet';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

type GeoPoint = {
  type: 'Point';
  coordinates: [number, number];
};

type Props = {
  address: string;
  height?: number | string;
  width?: number | string;
  coordinates?: GeoPoint;
};

function createMarkerIcon(color: string) {
  return L.divIcon({
    className: 'custom-memory-marker',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    html: `
      <div style="position: relative; width: 30px; height: 42px;">
        <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="${color}"/>
          <path d="M15 19C17.2091 19 19 17.2091 19 15C19 12.7909 17.2091 11 15 11C12.7909 11 11 12.7909 11 15C11 17.2091 12.7909 19 15 19Z" fill="white"/>
        </svg>
        <div style="
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: #FF4C61;
          border-radius: 50%;
          box-shadow: 0 0 10px #FF4C61;
          animation: markerPulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes markerPulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
        }
      </style>
    `,
  });
}

export function MemoryOsmMap({ address, height = '340px', width = '100%', coordinates }: Props) {
  const theme = useTheme();
  const mapRef = useRef<LeafletMap | null>(null);
  const isDarkMode = theme.palette.mode === 'dark';

  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const markerColor = isDarkMode ? '#fda4af' : '#fb7185';
  const markerIcon: DivIcon = useMemo(() => createMarkerIcon(markerColor), [markerColor]);

  useEffect(() => {
    if (coordinates?.coordinates) {
      const [lon, lat] = coordinates.coordinates;
      setPosition({ lat, lon });
      setError(null);
    }
  }, [coordinates]);

  useEffect(() => {
    if (coordinates?.coordinates || !address) return undefined;

    let active = true;
    const controller = new AbortController();

    const geocode = async () => {
      const variants = [
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=rs&q=${encodeURIComponent(
          address
        )}`,
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(
          address
        )}`,
      ];

      setError(null);
      setPosition(null);

      for (const url of variants) {
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept-Language': 'sr-Latn,en;q=0.7' },
          });

          if (!response.ok) {
            if (response.status === 429) {
              if (active) setError('Previše zahteva ka geokoderu. Pokušaj ponovo kasnije.');
              return;
            }
            continue;
          }

          const data = (await response.json()) as Array<{ lat: string; lon: string }>;

          if (data.length && active) {
            setPosition({
              lat: Number.parseFloat(data[0].lat),
              lon: Number.parseFloat(data[0].lon),
            });
            return;
          }
        } catch (geocodeError) {
          if (geocodeError instanceof DOMException && geocodeError.name === 'AbortError') return;
        }
      }

      if (active) setError('Adresa nije pronađena.');
    };

    void geocode();

    return () => {
      active = false;
      controller.abort();
    };
  }, [address, coordinates]);

  useEffect(
    () => () => {
      const map = mapRef.current;
      if (!map) return;
      const container = map.getContainer();
      map.remove();
      if (container && '_leaflet_id' in container) {
        delete (container as { _leaflet_id?: number })._leaflet_id;
      }
      mapRef.current = null;
    },
    []
  );

  const mapStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    filter: isDarkMode
      ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(85%)'
      : 'none',
  };

  if (error) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width, height, bgcolor: 'background.neutral', borderRadius: 3, px: 2, textAlign: 'center' }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {error}
        </Typography>
      </Stack>
    );
  }

  if (!position) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width, height, bgcolor: 'background.neutral', borderRadius: 3 }}
      >
        <CircularProgress size={24} sx={{ color: 'primary.main', mb: 1 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Pronalazimo lokaciju...
        </Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ width, height, position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
      <MapContainer
        key={isDarkMode ? 'dark' : 'light'}
        center={[position.lat, position.lon]}
        zoom={14}
        scrollWheelZoom={false}
        style={mapStyle}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.lat, position.lon]} icon={markerIcon} />
      </MapContainer>
    </Box>
  );
}
