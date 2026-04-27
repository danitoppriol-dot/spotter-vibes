/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import { Spot, MapLayer } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';

const LAYER_COLORS: Record<MapLayer, string> = {
  study: '#3b6fd4',
  nightlife: '#9333ea',
  outdoor: '#16a34a',
};

const LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#666680' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d4d4e0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e8f0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#edeef5' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8ddf0' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e8ede8' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dceedd' }] },
];

interface MapViewProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
  center?: [number, number];
}

let cachedApiKey: string | null = null;
let mapsLoaded = false;

async function loadGoogleMaps(apiKey: string) {
  if (mapsLoaded) return;
  
  return new Promise<void>((resolve, reject) => {
    if (window.google?.maps) {
      mapsLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => { mapsLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

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

        await loadGoogleMaps(cachedApiKey);

        if (cancelled || !containerRef.current) return;

        const map = new google.maps.Map(containerRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom: 13,
          styles: LIGHT_MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          backgroundColor: '#f5f5f5',
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
      const isOutdoor = spot.category === 'outdoor';
      // Outdoor spots are always shown at full opacity regardless of confirmations
      const isOfficial = spot.isOfficial || isOutdoor;
      const color = LAYER_COLORS[spot.category as MapLayer] || '#3b6fd4';

      const marker = new google.maps.Marker({
        position: { lat: spot.lat, lng: spot.lng },
        map: mapRef.current!,
        opacity: isOfficial ? 1 : 0.45,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: isOfficial ? '#ffffff' : 'rgba(255,255,255,0.7)',
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
            fillOpacity: 0.12,
            strokeColor: color,
            strokeWeight: 1,
            scale: 18,
          },
          clickable: false,
          zIndex: 0,
        });
        markersRef.current.push(pulseMarker);
      }

      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = "font-family:'Space Grotesk',sans-serif;padding:4px 0;";

      const title = document.createElement('div');
      title.style.cssText = 'font-size:14px;font-weight:600;color:#1a1a2e;';
      title.textContent = (spot.hasOutlets ? '⚡ ' : '') + spot.name;
      infoDiv.appendChild(title);

      const addr = document.createElement('div');
      addr.style.cssText = 'font-size:12px;color:#6b7280;margin-top:2px;';
      addr.textContent = spot.address;
      infoDiv.appendChild(addr);

      if (spot.avgSilenceLevel) {
        const silence = document.createElement('div');
        silence.style.cssText = 'font-size:11px;color:#3b6fd4;margin-top:3px;';
        silence.textContent = `🤫 Silence: ${spot.avgSilenceLevel.toFixed(1)}/5`;
        infoDiv.appendChild(silence);
      }

      if (!isOfficial) {
        const unofficial = document.createElement('div');
        unofficial.style.cssText = 'font-size:11px;color:#9333ea;margin-top:4px;';
        unofficial.textContent = '👻 Unconfirmed';
        infoDiv.appendChild(unofficial);
      }

      const infoWindow = new google.maps.InfoWindow({ content: infoDiv });

      marker.addListener('click', () => {
        infoWindow.open(mapRef.current!, marker);
        onSpotClick(spot);
      });

      markersRef.current.push(marker);
    });
  }, [spots, onSpotClick, loading]);

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
