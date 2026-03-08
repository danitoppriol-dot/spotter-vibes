export type MapLayer = 'study' | 'nightlife' | 'outdoor';

// Backward compatibility alias
export type SpotCategory = MapLayer;

export interface SubFilter {
  id: string;
  label: string;
  options: string[];
}

export interface LayerConfig {
  id: MapLayer;
  label: string;
  icon: string;
  color: string;
  subFilters: SubFilter[];
}

export const LAYERS: LayerConfig[] = [
  {
    id: 'study',
    label: 'Study & Focus',
    icon: '📚',
    color: 'bg-spot-study',
    subFilters: [
      { id: 'wifi_speed', label: 'Wi-Fi', options: ['Fast', 'Moderate', 'Slow'] },
      { id: 'outlets', label: 'Outlets', options: ['Many', 'Some', 'Few'] },
      { id: 'noise_level', label: 'Noise', options: ['Silent', 'Quiet', 'Moderate', 'Loud'] },
    ],
  },
  {
    id: 'nightlife',
    label: 'Nightlife & Social',
    icon: '🪩',
    color: 'bg-spot-nightlife',
    subFilters: [
      { id: 'crowd_size', label: 'Crowd', options: ['Packed', 'Busy', 'Moderate', 'Chill'] },
      { id: 'music_type', label: 'Music', options: ['Electronic', 'Hip-Hop', 'Live Band', 'Mixed'] },
      { id: 'queue_length', label: 'Queue', options: ['Long', 'Short', 'None'] },
    ],
  },
  {
    id: 'outdoor',
    label: 'Outdoor & Active',
    icon: '🌲',
    color: 'bg-spot-outdoor',
    subFilters: [
      { id: 'activity', label: 'Activity', options: ['Tennis', 'Running', 'Swimming', 'Viewpoint', 'Park', 'Cycling'] },
    ],
  },
];

// Backward compat: CATEGORIES maps to LAYERS
export const CATEGORIES: { id: SpotCategory; label: string; icon: string; color: string }[] =
  LAYERS.map((l) => ({ id: l.id, label: l.label, icon: l.icon, color: l.color }));

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory;
  lat: number;
  lng: number;
  address: string;
  description: string;
  recommendations: number;
  rating: number;
  reviewCount: number;
  isVisible: boolean;
  trending: boolean;
  isOfficial: boolean;
  imageUrl?: string;
  openingHours?: string;
  googleMapsUrl?: string;
  filters?: Record<string, string>;
  reviews: Review[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
}

export const VISIBILITY_THRESHOLD = 5;
export const OFFICIAL_RECS = 4;
export const OFFICIAL_RATING = 3.5;

// Compute if a spot is "official" (full opacity)
export function isSpotOfficial(recommendations: number, rating: number): boolean {
  return recommendations >= OFFICIAL_RECS || rating >= OFFICIAL_RATING;
}

// Mock data removed — all data comes from DB
export const MOCK_SPOTS: Spot[] = [];
export const PLACE_SEARCH_RESULTS: any[] = [];
