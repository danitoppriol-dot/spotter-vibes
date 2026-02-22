export type SpotCategory = 'study' | 'nightlife' | 'cafe' | 'cowork' | 'outdoor';

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
  imageUrl?: string;
  reviews: Review[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
}

export const CATEGORIES: { id: SpotCategory; label: string; icon: string; color: string }[] = [
  { id: 'study', label: 'Study Spots', icon: '📚', color: 'bg-spot-study' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙', color: 'bg-spot-nightlife' },
  { id: 'cafe', label: 'Cafés', icon: '☕', color: 'bg-spot-cafe' },
  { id: 'cowork', label: 'Coworking', icon: '💻', color: 'bg-spot-cowork' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌿', color: 'bg-spot-outdoor' },
];

export const VISIBILITY_THRESHOLD = 5;

export const MOCK_SPOTS: Spot[] = [
  {
    id: '1',
    name: 'KTH Library',
    category: 'study',
    lat: 59.3500,
    lng: 18.0700,
    address: 'Osquars backe 31, Stockholm',
    description: 'The main KTH library with silent study halls and group rooms. Great WiFi and plenty of outlets.',
    recommendations: 42,
    rating: 4.3,
    reviewCount: 28,
    isVisible: true,
    trending: true,
    reviews: [
      { id: 'r1', userName: 'Anna K.', rating: 5, text: 'Best study spot on campus. Always quiet and great natural light.', date: '2026-02-15' },
      { id: 'r2', userName: 'Erik L.', rating: 4, text: 'Good spot but can get crowded during exam season.', date: '2026-02-10' },
    ],
  },
  {
    id: '2',
    name: 'Café Pascal',
    category: 'cafe',
    lat: 59.3426,
    lng: 18.0549,
    address: 'Norrtullsgatan 4, Stockholm',
    description: 'Specialty coffee with a cozy Scandinavian interior. Great pastries and laptop-friendly.',
    recommendations: 31,
    rating: 4.6,
    reviewCount: 19,
    isVisible: true,
    trending: true,
    reviews: [
      { id: 'r3', userName: 'Lisa M.', rating: 5, text: 'Amazing flat white and the cinnamon buns are to die for!', date: '2026-02-12' },
    ],
  },
  {
    id: '3',
    name: 'Trädgården',
    category: 'nightlife',
    lat: 59.3140,
    lng: 18.0760,
    address: 'Hammarby Slussväg 2, Stockholm',
    description: 'Iconic open-air club under the Skanstull bridge. Live DJs and amazing summer vibes.',
    recommendations: 67,
    rating: 4.1,
    reviewCount: 45,
    isVisible: true,
    trending: true,
    reviews: [
      { id: 'r4', userName: 'Max S.', rating: 4, text: 'Legendary spot for summer nights. The outdoor area is incredible.', date: '2026-01-20' },
    ],
  },
  {
    id: '4',
    name: 'Epicenter Stockholm',
    category: 'cowork',
    lat: 59.3358,
    lng: 18.0617,
    address: 'Mäster Samuelsgatan 36, Stockholm',
    description: 'Modern coworking hub in the heart of Stockholm. Day passes available for students.',
    recommendations: 18,
    rating: 4.4,
    reviewCount: 12,
    isVisible: true,
    trending: false,
    reviews: [
      { id: 'r5', userName: 'Sofia R.', rating: 4, text: 'Great space but a bit pricey for students. Worth it for focus days.', date: '2026-02-01' },
    ],
  },
  {
    id: '5',
    name: 'Djurgården Trail',
    category: 'outdoor',
    lat: 59.3268,
    lng: 18.1146,
    address: 'Djurgården, Stockholm',
    description: 'Beautiful waterfront walk around the island. Perfect for study breaks and fresh air.',
    recommendations: 24,
    rating: 4.8,
    reviewCount: 16,
    isVisible: true,
    trending: false,
    reviews: [
      { id: 'r6', userName: 'Johan A.', rating: 5, text: 'Nothing beats a run here in autumn. The views are stunning.', date: '2026-02-08' },
    ],
  },
  {
    id: '6',
    name: 'Stadsbiblioteket',
    category: 'study',
    lat: 59.3435,
    lng: 18.0542,
    address: 'Sveavägen 73, Stockholm',
    description: 'The iconic Stockholm Public Library designed by Gunnar Asplund. Beautiful rotunda for focused study.',
    recommendations: 38,
    rating: 4.7,
    reviewCount: 22,
    isVisible: true,
    trending: true,
    reviews: [
      { id: 'r7', userName: 'Hanna B.', rating: 5, text: 'The most beautiful library in Stockholm. An inspiring place to study.', date: '2026-02-14' },
    ],
  },
  {
    id: '7',
    name: 'Drop Coffee',
    category: 'cafe',
    lat: 59.3178,
    lng: 18.0635,
    address: 'Wollmar Yxkullsgatan 10, Stockholm',
    description: 'Award-winning specialty roastery. Minimalist space with incredible single-origin brews.',
    recommendations: 22,
    rating: 4.5,
    reviewCount: 14,
    isVisible: true,
    trending: false,
    reviews: [],
  },
  {
    id: '8',
    name: 'Skinnarviksberget',
    category: 'outdoor',
    lat: 59.3198,
    lng: 18.0525,
    address: 'Skinnarviksberget, Södermalm',
    description: 'Highest natural point in central Stockholm. Stunning sunset views over the city.',
    recommendations: 55,
    rating: 4.9,
    reviewCount: 33,
    isVisible: true,
    trending: true,
    reviews: [
      { id: 'r8', userName: 'Clara N.', rating: 5, text: 'The best sunset spot in all of Stockholm. Bring a blanket!', date: '2026-02-18' },
    ],
  },
];
