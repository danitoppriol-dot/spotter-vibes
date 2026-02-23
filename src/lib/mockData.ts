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
  openingHours?: string;
  googleMapsUrl?: string;
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

// Simulated place search results (mimicking Google Maps autocomplete)
export const PLACE_SEARCH_RESULTS = [
  { name: 'Café Saturnus', address: 'Eriksbergsgatan 6, Stockholm', lat: 59.3397, lng: 18.0644 },
  { name: 'Johan & Nyström', address: 'Swedenborgsgatan 7, Stockholm', lat: 59.3166, lng: 18.0627 },
  { name: 'Snickarbacken 7', address: 'Snickarbacken 7, Stockholm', lat: 59.3357, lng: 18.0748 },
  { name: 'Under Kastanjen', address: 'Kindstugatan 1, Stockholm', lat: 59.3233, lng: 18.0707 },
  { name: 'Mellqvist Café', address: 'Hornsgatan 78, Stockholm', lat: 59.3178, lng: 18.0465 },
  { name: 'Kungliga Biblioteket', address: 'Humlegården, Stockholm', lat: 59.3395, lng: 18.0735 },
  { name: 'Fotografiska', address: 'Stadsgårdshamnen 22, Stockholm', lat: 59.3179, lng: 18.0856 },
  { name: 'Berns Salonger', address: 'Berzelii Park, Stockholm', lat: 59.3331, lng: 18.0748 },
  { name: 'Stureplan Coworking', address: 'Stureplan 4, Stockholm', lat: 59.3369, lng: 18.0738 },
  { name: 'Tantolunden Park', address: 'Tantolunden, Södermalm', lat: 59.3118, lng: 18.0499 },
];

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
    openingHours: 'Mon–Fri 8:00–20:00, Sat 10:00–16:00',
    googleMapsUrl: 'https://maps.google.com/?q=KTH+Library+Stockholm',
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
    openingHours: 'Mon–Fri 7:30–18:00, Sat–Sun 9:00–17:00',
    googleMapsUrl: 'https://maps.google.com/?q=Café+Pascal+Stockholm',
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
    openingHours: 'Thu–Sat 20:00–03:00 (Summer only)',
    googleMapsUrl: 'https://maps.google.com/?q=Trädgården+Stockholm',
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
    openingHours: 'Mon–Fri 7:00–22:00',
    googleMapsUrl: 'https://maps.google.com/?q=Epicenter+Stockholm',
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
    openingHours: 'Open 24/7',
    googleMapsUrl: 'https://maps.google.com/?q=Djurgården+Stockholm',
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
    openingHours: 'Mon–Thu 9:00–21:00, Fri 9:00–19:00, Sat–Sun 11:00–17:00',
    googleMapsUrl: 'https://maps.google.com/?q=Stadsbiblioteket+Stockholm',
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
    openingHours: 'Mon–Fri 8:00–17:00, Sat 10:00–16:00',
    googleMapsUrl: 'https://maps.google.com/?q=Drop+Coffee+Stockholm',
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
    openingHours: 'Open 24/7',
    googleMapsUrl: 'https://maps.google.com/?q=Skinnarviksberget+Stockholm',
    reviews: [
      { id: 'r8', userName: 'Clara N.', rating: 5, text: 'The best sunset spot in all of Stockholm. Bring a blanket!', date: '2026-02-18' },
    ],
  },
];
