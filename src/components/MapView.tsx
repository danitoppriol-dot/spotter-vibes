import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spot, SpotCategory } from '@/lib/mockData';

const CATEGORY_COLORS: Record<SpotCategory, string> = {
  study: '#2563eb',
  nightlife: '#8b5cf6',
  cafe: '#d97706',
  cowork: '#0d9488',
  outdoor: '#16a34a',
};

function createCategoryIcon(category: SpotCategory, trending: boolean) {
  const color = CATEGORY_COLORS[category];
  const size = trending ? 16 : 12;
  const pulse = trending
    ? `<div style="position:absolute;top:-4px;left:-4px;width:${size + 8}px;height:${size + 8}px;border-radius:50%;background:${color};opacity:0.3;animation:pulse-dot 2s ease-in-out infinite;"></div>`
    : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
      ${pulse}
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);position:relative;z-index:1;"></div>
    </div>`,
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
  });
}

interface MapViewProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
  center?: [number, number];
}

const MapView = ({ spots, onSpotClick, center = [59.3293, 18.0686] }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo(center, 14, { duration: 0.8 });
    }
  }, [center]);

  // Update markers
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    spots.forEach((spot) => {
      const marker = L.marker([spot.lat, spot.lng], {
        icon: createCategoryIcon(spot.category, spot.trending),
      });

      marker.bindPopup(
        `<div style="font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;">${spot.name}</div>
         <div style="font-size:11px;color:#64748b;">${spot.address}</div>`
      );

      marker.on('click', () => onSpotClick(spot));
      markersRef.current!.addLayer(marker);
    });
  }, [spots, onSpotClick]);

  return <div ref={containerRef} className="h-full w-full rounded-lg" style={{ zIndex: 0 }} />;
};

export default MapView;
