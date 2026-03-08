/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Spot, MapLayer } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';

const LAYER_COLORS: Record<MapLayer, string> = {
  study: '#00d4ff',
  nightlife: '#a855f7',
  outdoor: '#22c55e',
};

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555570' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a3e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252540' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2e2e4a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e1e32' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
];

interface MapViewProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
  center?: [number, number];
}

let cachedApiKey: string | null = null;
let loaderInstance: Loader | null = null;

const MapView = ({ spots, onSpotClick, center = [59.3293, 18.0686] }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!containerRef.current) return;

      try {
        if (!cachedApiKey) {
          const { data, error: fnError } = await supabase.functions.invoke('get-maps-key');
          if (fnError || !data?.key) {
            setError('Could not load map');
            setLoading(false);
            return;
          }
          cachedApiKey = data.key;
        }

        if (cancelled) return;

        if (!loaderInstance) {
          loaderInstance = new Loader({
            apiKey: cachedApiKey,
            version: 'weekly',
          });
        }

        await loaderInstance.load();

        if (cancelled || !containerRef.current) return;

        const map = new google.maps.Map(containerRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom: 13,
          styles: DARK_MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          backgroundColor: '#1a1a2e',
        });

        mapRef.current = map;
        setLoading(false);
      } catch (err) {
        console.error('Google Maps init error:', err);
        setError('Failed to load map');
        setLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: center[0], lng: center[1] });
    }
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    spots.forEach((spot) => {
      const isOfficial = spot.isOfficial;
      const color = LAYER_COLORS[spot.category as MapLayer] || '#00d4ff';

      const marker = new google.maps.Marker({
        position: { lat: spot.lat, lng: spot.lng },
        map: mapRef.current!,
        opacity: isOfficial ? 1 : 0.45,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: isOfficial ? '#ffffff' : 'rgba(255,255,255,0.5)',
          strokeWeight: isOfficial ? 2.5 : 1.5,
          scale: spot.trending ? 11 : 8,
        },
        title: spot.name,
        zIndex: spot.trending ? 10 : isOfficial ? 5 : 1,
      });

      if (spot.trending && isOfficial) {
        const pulseMarker = new google.maps.Marker({
          position: { lat: spot.lat, lng: spot.lng },
          map: mapRef.current!,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 0.15,
            strokeColor: color,
            strokeWeight: 1,
            scale: 18,
          },
          clickable: false,
          zIndex: 0,
        });
        markersRef.current.push(pulseMarker);
      }

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family:'Space Grotesk',sans-serif;padding:4px 0;">
            <div style="font-size:14px;font-weight:600;color:#0a0a14;">${spot.name}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">${spot.address}</div>
            ${!isOfficial ? '<div style="font-size:11px;color:#a855f7;margin-top:4px;">👻 Unconfirmed</div>' : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapRef.current!, marker);
        onSpotClick(spot);
      });

      markersRef.current.push(marker);
    });
  }, [spots, onSpotClick]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs text-muted-foreground">Loading map...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full rounded-lg" style={{ zIndex: 0 }} />
    </div>
  );
};

export default MapView;
