import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import MapView from '@/components/MapView';
import SpotDetail from '@/components/SpotDetail';
import { Spot, SpotCategory, CATEGORIES } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Map, List, Star, MapPin, Lock, Globe, Eye, EyeOff, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isOwnProfile = !userId || userId === user?.id;
  const profileUserId = userId || user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [savedSpots, setSavedSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([59.3293, 18.0686]);

  // Profile settings (own profile only)
  const [isMapPublic, setIsMapPublic] = useState(false);
  const [isNamePublic, setIsNamePublic] = useState(false);

  useEffect(() => {
    if (!profileUserId) return;
    fetchProfileData();
  }, [profileUserId]);

  const fetchProfileData = async () => {
    if (!profileUserId) return;
    setLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', profileUserId)
      .single() as any;

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setIsMapPublic(profileData.is_map_public || false);
    setIsNamePublic(profileData.is_name_public || false);

    // Check access: own profile or public map
    if (!isOwnProfile && !profileData.is_map_public) {
      setLoading(false);
      return;
    }

    // Fetch saved places
    const { data: saved } = await supabase
      .from('saved_places')
      .select('place_id')
      .eq('user_id', profileUserId) as any;

    if (!saved || saved.length === 0) {
      setSavedSpots([]);
      setLoading(false);
      return;
    }

    const placeIds = saved.map((s: any) => s.place_id);
    const { data: places } = await supabase
      .from('places')
      .select('*')
      .in('id', placeIds) as any;

    if (!places) {
      setSavedSpots([]);
      setLoading(false);
      return;
    }

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .in('place_id', placeIds) as any;

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
          userName: 'Student',
          rating: r.rating,
          text: r.text || '',
          date: r.created_at?.split('T')[0] || '',
        })),
      };
    });

    setSavedSpots(spots);
    if (spots.length > 0) {
      setMapCenter([spots[0].lat, spots[0].lng]);
    }
    setLoading(false);
  };

  const handleToggleMapPublic = async (value: boolean) => {
    setIsMapPublic(value);
    await supabase.from('profiles').update({ is_map_public: value } as any).eq('user_id', user!.id);
    toast({ title: value ? 'Mappa pubblica 🌍' : 'Mappa privata 🔒' });
  };

  const handleToggleNamePublic = async (value: boolean) => {
    setIsNamePublic(value);
    await supabase.from('profiles').update({ is_name_public: value } as any).eq('user_id', user!.id);
    toast({ title: value ? 'Nome visibile' : 'Nome nascosto' });
  };

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
    setMapCenter([spot.lat, spot.lng]);
  };

  const displayName = profile
    ? (isOwnProfile || profile.is_name_public ? profile.display_name : 'Utente anonimo')
    : '';

  if (!isLoggedIn && isOwnProfile) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Accedi per vedere il tuo profilo</p>
        </div>
      </div>
    );
  }

  const isPrivateAndNotOwner = !isOwnProfile && profile && !profile.is_map_public;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <div className="container flex-1 overflow-y-auto py-6">
        {/* Profile Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold">{displayName}</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {profile?.university && <span>📧 {profile.university}</span>}
              <span>·</span>
              <Heart className="h-3.5 w-3.5" /> {savedSpots.length} posti salvati
            </p>
            {!isOwnProfile && (
              <Badge variant="outline" className="gap-1">
                {profile?.is_map_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {profile?.is_map_public ? 'Mappa pubblica' : 'Mappa privata'}
              </Badge>
            )}
          </div>

          {isOwnProfile && (
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold">Impostazioni profilo</h3>
              <div className="flex items-center gap-3">
                <Switch checked={isMapPublic} onCheckedChange={handleToggleMapPublic} />
                <Label className="flex items-center gap-1.5 text-sm">
                  {isMapPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  Mappa {isMapPublic ? 'pubblica' : 'privata'}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isNamePublic} onCheckedChange={handleToggleNamePublic} />
                <Label className="flex items-center gap-1.5 text-sm">
                  {isNamePublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Nome {isNamePublic ? 'visibile' : 'nascosto'}
                </Label>
              </div>
            </div>
          )}
        </div>

        {isPrivateAndNotOwner ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Lock className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Questa mappa è privata</p>
          </div>
        ) : (
          <>
            {/* View Toggle */}
            <div className="mb-4 flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" /> Lista
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setViewMode('map')}
              >
                <Map className="h-4 w-4" /> Mappa
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : savedSpots.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Heart className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {isOwnProfile ? 'Non hai ancora salvato nessun posto' : 'Nessun posto salvato'}
                </p>
                {isOwnProfile && (
                  <Button variant="outline" onClick={() => navigate('/explore')}>
                    Esplora la mappa
                  </Button>
                )}
              </div>
            ) : viewMode === 'map' ? (
              <div className="h-[500px] overflow-hidden rounded-xl border">
                <MapView spots={savedSpots} onSpotClick={handleSpotClick} center={mapCenter} />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {savedSpots.map((spot, i) => {
                  const cat = CATEGORIES.find(c => c.id === spot.category);
                  return (
                    <motion.div
                      key={spot.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="cursor-pointer rounded-xl border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated"
                      onClick={() => handleSpotClick(spot)}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-display text-sm font-semibold">{spot.name}</h3>
                        <Badge variant="secondary" className={`${cat?.color} text-primary-foreground text-xs`}>
                          {cat?.icon}
                        </Badge>
                      </div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {spot.address}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-secondary text-secondary" />
                        {spot.rating > 0 ? spot.rating.toFixed(1) : '—'}
                        <span>·</span>
                        {spot.recommendations} endorsements
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <SpotDetail spot={selectedSpot} open={!!selectedSpot} onClose={() => setSelectedSpot(null)} onUpdate={fetchProfileData} />
    </div>
  );
};

export default Profile;
