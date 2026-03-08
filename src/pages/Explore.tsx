import { useState, useMemo, useEffect, useCallback } from 'react';
import { LAYERS, Spot, MapLayer, isSpotOfficial } from '@/lib/mockData';
import MapView from '@/components/MapView';
import LayerFilter from '@/components/LayerFilter';
import SpotDetail from '@/components/SpotDetail';
import AddSpotDialog from '@/components/AddSpotDialog';
import TrendingSpots from '@/components/TrendingSpots';
import Navbar from '@/components/Navbar';
import ModeratorPanel from '@/components/ModeratorPanel';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Explore = () => {
  const { isModerator } = useAuth();
  const [activeCategories, setActiveCategories] = useState<MapLayer[]>(
    LAYERS.map((l) => l.id)
  );
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([59.3293, 18.0686]);
  const [addSpotOpen, setAddSpotOpen] = useState(false);
  const [dbSpots, setDbSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    const query = supabase.from('places').select('*');
    if (!isModerator) {
      (query as any).eq('is_visible', true);
    }
    const { data: places, error } = await query as any;

    if (error || !places) {
      setDbSpots([]);
      setLoading(false);
      return;
    }

    const placeIds: string[] = places.map((p: any) => p.id);

    if (placeIds.length === 0) {
      setDbSpots([]);
      setLoading(false);
      return;
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .in('place_id', placeIds) as any;

    const userIds: string[] = (reviews || []).map((r: any) => String(r.user_id)).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
    const { data: profiles } = userIds.length > 0
      ? await (supabase.from('profiles').select('user_id, display_name').in('user_id', userIds) as any)
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
        category: p.category as MapLayer,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        description: p.description || '',
        recommendations: p.recommendation_count || 0,
        rating: avgRating,
        reviewCount: placeReviews.length,
        isVisible: p.is_visible,
        trending: (p.recommendation_count || 0) >= 10,
        isOfficial: isSpotOfficial(p.recommendation_count || 0, avgRating),
        openingHours: p.opening_hours,
        googleMapsUrl: p.google_maps_url,
        filters: p.filters || {},
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
  }, [isModerator]);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  const toggleCategory = (cat: MapLayer) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredSpots = useMemo(() => {
    return dbSpots.filter((s) => {
      if (!isModerator && !s.isVisible) return false;
      if (!activeCategories.includes(s.category)) return false;
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [dbSpots, activeCategories, searchQuery, isModerator]);

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
    setMapCenter([spot.lat, spot.lng]);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 flex-col border-r border-border/50 bg-card md:flex">
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
            <div className="flex gap-2">
              <Button className="flex-1 gap-2 bg-gradient-hero shadow-glow" onClick={() => setAddSpotOpen(true)}>
                <Plus className="h-4 w-4" /> Add Spot
              </Button>
              {isModerator && <ModeratorPanel spots={dbSpots} onUpdate={fetchSpots} />}
            </div>
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
              <Plus className="h-4 w-4" /> Add
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
