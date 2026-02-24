import { useState, useMemo, useEffect, useCallback } from 'react';
import { CATEGORIES, Spot, SpotCategory, MOCK_SPOTS } from '@/lib/mockData';
import MapView from '@/components/MapView';
import LayerFilter from '@/components/LayerFilter';
import SpotDetail from '@/components/SpotDetail';
import AddSpotDialog from '@/components/AddSpotDialog';
import TrendingSpots from '@/components/TrendingSpots';
import Navbar from '@/components/Navbar';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const Explore = () => {
  const [activeCategories, setActiveCategories] = useState<SpotCategory[]>(
    CATEGORIES.map((c) => c.id)
  );
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([59.3293, 18.0686]);
  const [addSpotOpen, setAddSpotOpen] = useState(false);
  const [dbSpots, setDbSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    const { data: places, error } = await supabase
      .from('places')
      .select('*')
      .eq('is_visible', true) as any;

    if (error || !places) {
      setDbSpots([]);
      setLoading(false);
      return;
    }

    // Fetch reviews for visible places
    const placeIds = places.map((p: any) => p.id);
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .in('place_id', placeIds.length > 0 ? placeIds : ['none']) as any;

    // Fetch profile names for reviews
    const userIds = [...new Set((reviews || []).map((r: any) => r.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds) as any
      : { data: [] };

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));

    const spots: Spot[] = places.map((p: any) => {
      const placeReviews = (reviews || []).filter((r: any) => r.place_id === p.id);
      const avgRating = placeReviews.length > 0
        ? placeReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / placeReviews.length
        : 0;

      return {
        id: p.id,
        name: p.name,
        category: p.category as SpotCategory,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        description: p.description || '',
        recommendations: p.recommendation_count || 0,
        rating: avgRating,
        reviewCount: placeReviews.length,
        isVisible: p.is_visible,
        trending: (p.recommendation_count || 0) >= 10,
        openingHours: p.opening_hours,
        googleMapsUrl: p.google_maps_url,
        reviews: placeReviews.map((r: any) => ({
          id: r.id,
          userName: profileMap.get(r.user_id) || 'Student',
          rating: r.rating,
          text: r.text || '',
          date: r.created_at?.split('T')[0] || '',
        })),
      };
    });

    setDbSpots(spots);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  // Combine mock spots with DB spots (mock spots shown for demo)
  const allSpots = useMemo(() => [...MOCK_SPOTS, ...dbSpots], [dbSpots]);

  const toggleCategory = (cat: SpotCategory) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredSpots = useMemo(() => {
    return allSpots.filter((s) => {
      if (!s.isVisible) return false;
      if (!activeCategories.includes(s.category)) return false;
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allSpots, activeCategories, searchQuery]);

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
    setMapCenter([spot.lat, spot.lng]);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 flex-col border-r bg-card md:flex">
          <div className="space-y-4 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search spots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <LayerFilter activeCategories={activeCategories} onToggle={toggleCategory} />
            <Button className="gap-2 bg-gradient-hero shadow-glow" onClick={() => setAddSpotOpen(true)}>
              <Plus className="h-4 w-4" /> Add Spot
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pt-0">
            <TrendingSpots spots={filteredSpots} onSpotClick={handleSpotClick} />
          </div>
        </aside>

        <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2 md:hidden">
          <div className="flex gap-2 overflow-x-auto rounded-xl bg-card/90 p-2 shadow-elevated backdrop-blur-md">
            <LayerFilter activeCategories={activeCategories} onToggle={toggleCategory} />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card/90 pl-9 shadow-elevated backdrop-blur-md"
              />
            </div>
            <Button className="gap-2 bg-gradient-hero shadow-glow" onClick={() => setAddSpotOpen(true)}>
              <Plus className="h-4 w-4" /> Add Spot
            </Button>
          </div>
        </div>

        <main className="relative flex-1">
          <MapView spots={filteredSpots} onSpotClick={handleSpotClick} center={mapCenter} />
          <Button
            onClick={() => setAddSpotOpen(true)}
            className="absolute right-4 top-4 z-10 h-12 w-12 rounded-full bg-gradient-hero p-0 shadow-glow md:right-6 md:top-6"
            aria-label="Add a new spot"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </main>
      </div>

      <SpotDetail spot={selectedSpot} open={!!selectedSpot} onClose={() => setSelectedSpot(null)} onUpdate={fetchSpots} />
      <AddSpotDialog open={addSpotOpen} onOpenChange={setAddSpotOpen} onSpotAdded={fetchSpots} />
    </div>
  );
};

export default Explore;
