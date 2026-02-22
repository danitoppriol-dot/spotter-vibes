import { useState, useMemo } from 'react';
import { MOCK_SPOTS, Spot, SpotCategory, CATEGORIES } from '@/lib/mockData';
import MapView from '@/components/MapView';
import LayerFilter from '@/components/LayerFilter';
import SpotDetail from '@/components/SpotDetail';
import AddSpotDialog from '@/components/AddSpotDialog';
import TrendingSpots from '@/components/TrendingSpots';
import Navbar from '@/components/Navbar';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Explore = () => {
  const [activeCategories, setActiveCategories] = useState<SpotCategory[]>(
    CATEGORIES.map((c) => c.id)
  );
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([59.3293, 18.0686]);

  const toggleCategory = (cat: SpotCategory) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredSpots = useMemo(() => {
    return MOCK_SPOTS.filter((s) => {
      if (!s.isVisible) return false;
      if (!activeCategories.includes(s.category)) return false;
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [activeCategories, searchQuery]);

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
    setMapCenter([spot.lat, spot.lng]);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
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
            <AddSpotDialog />
          </div>
          <div className="flex-1 overflow-y-auto p-4 pt-0">
            <TrendingSpots spots={filteredSpots} onSpotClick={handleSpotClick} />
          </div>
        </aside>

        {/* Mobile controls */}
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
            <AddSpotDialog />
          </div>
        </div>

        {/* Map */}
        <main className="relative flex-1">
          <MapView spots={filteredSpots} onSpotClick={handleSpotClick} center={mapCenter} />
        </main>
      </div>

      <SpotDetail spot={selectedSpot} open={!!selectedSpot} onClose={() => setSelectedSpot(null)} />
    </div>
  );
};

export default Explore;
