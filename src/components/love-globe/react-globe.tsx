import type { Theme } from '@mui/material/styles';

import * as THREE from 'three';
import { varAlpha } from 'minimal-shared/utils';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

// ----------------------------------------------------------------------

export type LoveGlobePlace = {
  id: string;
  name: string;
  status: 'visited' | 'wishlist';
  coordinates: [lat: number, lng: number];
  imageSrc?: string;
};

const markerTextureCache = new Map<string, THREE.Texture>();

function drawPinTexture(
  context: CanvasRenderingContext2D,
  size: number,
  accentColor: string,
  image?: CanvasImageSource,
  badgeCount = 1
) {
  const center = size / 2;
  const outerRadius = size * 0.48;
  const innerRadius = size * 0.43;

  context.clearRect(0, 0, size, size);

  context.beginPath();
  context.arc(center, center, outerRadius, 0, Math.PI * 2);
  context.fillStyle = accentColor;
  context.fill();

  context.save();
  context.beginPath();
  context.arc(center, center, innerRadius, 0, Math.PI * 2);
  context.closePath();
  context.clip();

  if (image) {
    context.drawImage(image, size * 0.07, size * 0.07, size * 0.86, size * 0.86);
  } else {
    context.fillStyle = '#0f172a';
    context.fillRect(size * 0.07, size * 0.07, size * 0.86, size * 0.86);
  }

  context.restore();

  context.beginPath();
  context.arc(center, center, innerRadius, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  context.lineWidth = size * 0.03;
  context.stroke();

  if (badgeCount > 1) {
    const badgeLabel = badgeCount > 99 ? '99+' : String(badgeCount);
    const badgeRadius = size * 0.15;
    const badgeX = size * 0.78;
    const badgeY = size * 0.24;

    context.beginPath();
    context.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    context.fillStyle = accentColor;
    context.shadowColor = 'rgba(15, 23, 42, 0.4)';
    context.shadowBlur = size * 0.04;
    context.fill();
    context.shadowBlur = 0;

    context.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    context.lineWidth = size * 0.024;
    context.stroke();

    context.fillStyle = '#ffffff';
    context.font = `700 ${size * 0.14}px Inter, system-ui, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(badgeLabel, badgeX, badgeY + size * 0.005);
  }
}

function getMarkerTexture(src: string | undefined, accentColor: string, badgeCount = 1) {
  const cacheKey = `${src ?? 'fallback'}|${accentColor}|${badgeCount}`;
  const cachedTexture = markerTextureCache.get(cacheKey);

  if (cachedTexture) return cachedTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');

  if (!context) {
    const fallbackTexture = new THREE.Texture();
    markerTextureCache.set(cacheKey, fallbackTexture);
    return fallbackTexture;
  }

  drawPinTexture(context, size, accentColor, undefined, badgeCount);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  if (src) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      drawPinTexture(context, size, accentColor, image, badgeCount);
      texture.needsUpdate = true;
    };
    image.src = src;
  }

  markerTextureCache.set(cacheKey, texture);

  return texture;
}

type LoveGlobeMarker = LoveGlobePlace & {
  lat: number;
  lng: number;
  pinScale: number;
  placeCount: number;
  placeIds: string[];
  label: string;
  pinObject: THREE.Group;
};

export type LoveGlobeProps = {
  places: LoveGlobePlace[];
  onOpenMap: () => void;
  onOpenPlace: (placeId: string) => void;
};

// ----------------------------------------------------------------------

export function LoveGlobe({ places, onOpenMap, onOpenPlace }: LoveGlobeProps) {
  const muiTheme = useTheme();
  const mdUp = useMediaQuery(muiTheme.breakpoints.up('md'));
  const smUp = useMediaQuery(muiTheme.breakpoints.up('sm'));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const suppressNextOpenMapRef = useRef(false);

  const [globeWidth, setGlobeWidth] = useState(0);
  const [globeRadius, setGlobeRadius] = useState(100);

  const globeHeight = mdUp ? 480 : smUp ? 380 : 300;

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return undefined;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setGlobeWidth(entry.contentRect.width);
    });

    resizeObserver.observe(element);
    setGlobeWidth(element.getBoundingClientRect().width);

    return () => resizeObserver.disconnect();
  }, []);

  const createPinObject = useCallback(
    (place: LoveGlobePlace, pinScale: number, color: string, badgeCount: number) => {
      const group = new THREE.Group();
      const spriteSize = globeRadius * pinScale;
      const accentRadius = spriteSize * 0.11;
      const pinGap = accentRadius * 0.12;

      const accent = new THREE.Mesh(
        new THREE.SphereGeometry(accentRadius, 16, 16),
        new THREE.MeshStandardMaterial({
          color: '#ffffff',
          emissive: new THREE.Color(color),
          emissiveIntensity: 0.35,
          roughness: 0.35,
          metalness: 0.05,
        })
      );
      // Anchor the dot directly on the place coordinate at the globe surface.
      accent.position.y = accentRadius;

      const pin = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: getMarkerTexture(place.imageSrc || '/logo/logo-single.png', color, badgeCount),
          transparent: true,
          depthWrite: false,
        })
      );
      pin.center.set(0.5, 0);
      pin.scale.set(spriteSize, spriteSize, 1);
      pin.position.y = accent.position.y + accentRadius + pinGap;

      group.add(accent);
      group.add(pin);

      return group;
    },
    [globeRadius]
  );

  const markers = useMemo<LoveGlobeMarker[]>(
    () => {
      const placesByCoordinate = new Map<string, LoveGlobePlace[]>();

      places.forEach((place) => {
        const [lat, lng] = place.coordinates;
        const key = `${lat.toFixed(6)}:${lng.toFixed(6)}`;
        const existingPlaces = placesByCoordinate.get(key);

        if (existingPlaces) {
          existingPlaces.push(place);
        } else {
          placesByCoordinate.set(key, [place]);
        }
      });

      // Collapse identical coordinates into a single marker and badge the count.
      return Array.from(placesByCoordinate.values()).map((groupedPlaces) => {
        const primaryPlace = groupedPlaces.find((place) => place.status === 'visited') ?? groupedPlaces[0];
        const hasVisitedPlace = groupedPlaces.some((place) => place.status === 'visited');
        const color = hasVisitedPlace ? '#4f8cff' : '#ffb347';
        const pinScale = hasVisitedPlace ? 0.07 : 0.064;
        const placeCount = groupedPlaces.length;
        const label =
          placeCount === 1
            ? primaryPlace.name
            : `${placeCount} pins: ${groupedPlaces.map((place) => place.name).join(', ')}`;

        return {
          ...primaryPlace,
          lat: primaryPlace.coordinates[0],
          lng: primaryPlace.coordinates[1],
          pinScale,
          placeCount,
          placeIds: groupedPlaces.map((place) => place.id),
          label,
          pinObject: createPinObject(primaryPlace, pinScale, color, placeCount),
        };
      });
    },
    [createPinObject, places]
  );

  const handleOpenMap = useCallback(() => {
    if (suppressNextOpenMapRef.current) return;
    onOpenMap();
  }, [onOpenMap]);

  const handleMarkerClick = useCallback(
    (markerData: object, event: MouseEvent) => {
      const marker = markerData as LoveGlobeMarker;

      suppressNextOpenMapRef.current = true;
      window.setTimeout(() => {
        suppressNextOpenMapRef.current = false;
      }, 0);

      event.stopPropagation?.();
      if (marker.placeCount > 1) {
        onOpenMap();
        return;
      }

      onOpenPlace(marker.placeIds[0] ?? marker.id);
    },
    [onOpenMap, onOpenPlace]
  );

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;

    if (!globe) return;

    const radius = globe.getGlobeRadius();

    setGlobeRadius(radius);
    globe.pointOfView({ lat: 20, lng: 95, altitude: 1.7 }, 0);

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = radius * 1.08;
    controls.maxDistance = radius * 4.2;
  }, []);

  const renderLegend = () => (
    <Stack direction="row" spacing={1.5} sx={{ mt: 2, opacity: 0.85 }}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4f8cff' }} />
        <Typography variant="caption">Visited</Typography>
      </Stack>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffb347' }} />
        <Typography variant="caption">Wishlist</Typography>
      </Stack>
    </Stack>
  );

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: { xs: 2, md: 3 } }}>
      <Box
        ref={containerRef}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') handleOpenMap();
        }}
        sx={(theme) => ({
          width: '100%',
          maxWidth: 1120,
          height: globeHeight,
          borderRadius: 3,
          overflow: 'hidden',
          cursor: 'pointer',
          outline: 'none',
          position: 'relative',
          bgcolor: '#02040a',
          border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.1)}`,
          boxShadow: `0 18px 60px -30px ${varAlpha(theme.vars.palette.common.blackChannel, 0.85)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(circle at 12% 18%, rgba(255,255,255,0.95) 0 1px, transparent 1.5px),
              radial-gradient(circle at 22% 72%, rgba(255,255,255,0.65) 0 1px, transparent 1.6px),
              radial-gradient(circle at 38% 28%, rgba(255,255,255,0.9) 0 1.2px, transparent 1.8px),
              radial-gradient(circle at 54% 66%, rgba(255,255,255,0.7) 0 1px, transparent 1.6px),
              radial-gradient(circle at 68% 24%, rgba(255,255,255,0.8) 0 1.2px, transparent 1.8px),
              radial-gradient(circle at 82% 58%, rgba(255,255,255,0.9) 0 1.2px, transparent 1.8px),
              radial-gradient(circle at 90% 14%, rgba(255,255,255,0.65) 0 1px, transparent 1.5px),
              radial-gradient(circle at 78% 84%, rgba(255,255,255,0.75) 0 1px, transparent 1.6px),
              radial-gradient(circle at 50% 50%, rgba(120,160,255,0.16) 0, transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0, transparent 62%)
            `,
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 50%, transparent 52%, rgba(0, 0, 0, 0.06) 80%, rgba(0, 0, 0, 0.22) 100%)',
            pointerEvents: 'none',
          },
        })}
      >
        {globeWidth > 0 && (
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Globe
              ref={globeRef}
              width={globeWidth}
              height={globeHeight}
              backgroundColor="rgba(0,0,0,0)"
              waitForGlobeReady
              animateIn
              globeImageUrl="/assets/globe/react-globe-globe.jpg"
              bumpImageUrl="/assets/globe/earth-day-2048.png"
              showAtmosphere
              atmosphereColor="#9fc8ff"
              atmosphereAltitude={0.16}
              objectsData={markers}
              objectLat="lat"
              objectLng="lng"
              objectAltitude={0}
              objectLabel="label"
              objectThreeObject="pinObject"
              showPointerCursor
              onGlobeReady={handleGlobeReady}
              onGlobeClick={handleOpenMap}
              onObjectClick={handleMarkerClick}
            />
          </Box>
        )}

        <Box
          aria-hidden
          sx={(theme: Theme) => ({
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: `inset 0 0 0 1px ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
          })}
        />
      </Box>

      {renderLegend()}
    </Box>
  );
}
