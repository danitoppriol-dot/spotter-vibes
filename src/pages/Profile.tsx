import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import MapView from '@/components/MapView';
import SpotDetail from '@/components/SpotDetail';
import { Spot, MapLayer, isSpotOfficial, CATEGORIES } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, List, Star, MapPin, Lock, Globe, Eye, EyeOff, Heart, Share2, Copy, Check, Pencil, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const Profile = () => {
  const { userId, shareToken } = useParams<{ userId?: string; shareToken?: string }>();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isSharedView = !!shareToken;
  const isOwnProfile = !isSharedView && (!userId || userId === user?.id);
  const profileUserId = userId || (isSharedView ? undefined : user?.id);

  const [profile, setProfile] = useState<any>(null);
  const [savedSpots, setSavedSpots] = useState<Spot[]>([]);
  const [createdSpots, setCreatedSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([59.3293, 18.0686]);
  const [isMapPublic, setIsMapPublic] = useState(false);
  const [isNamePublic, setIsNamePublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState('saved');
  const [mapTitle, setMapTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState('');

  useEffect(() => {
    if (!profileUserId && !shareToken) return;
    fetchProfileData();
  }, [profileUserId, shareToken]);

  const buildSpots = (places: any[], reviews: any[]): Spot[] => {
    return places.map((p: any) => {
      const placeReviews = reviews.filter((r: any) => r.place_id === p.id);
      const avgRating = placeReviews.length > 0
        ? placeReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / placeReviews.length
        : 0;
      return {
        id: p.id, name: p.name, category: p.category as MapLayer,
        lat: p.lat, lng: p.lng, address: p.address,
        description: p.description || '',
        recommendations: p.recommendation_count || 0,
        rating: avgRating, reviewCount: placeReviews.length,
        isVisible: p.is_visible, trending: (p.recommendation_count || 0) >= 10,
        isOfficial: isSpotOfficial(p.recommendation_count || 0, avgRating),
        openingHours: p.opening_hours, googleMapsUrl: p.google_maps_url,
        reviews: placeReviews.map((r: any) => ({
          id: r.id, userName: 'Student', rating: r.rating,
          text: r.text || '', date: r.created_at?.split('T')[0] || '',
        })),
      };
    });
  };

  const fetchProfileData = async () => {
    setLoading(true);

    let profileData: any = null;

    if (shareToken) {
      const { data } = await supabase.from('profiles').select('*').eq('share_token', shareToken).single();
      profileData = data;
    } else if (profileUserId) {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', profileUserId).single();
      profileData = data;
    }

    if (!profileData) { setLoading(false); return; }

    setProfile(profileData);
    setIsMapPublic(profileData.is_map_public || false);
    setIsNamePublic(profileData.is_name_public || false);
    setMapTitle(profileData.map_title || '');

    const canViewMap = isOwnProfile || isSharedView || profileData.is_map_public;
    if (!canViewMap) { setLoading(false); return; }

    const targetUserId = profileData.user_id;

    // Fetch saved spots
    const { data: saved } = await supabase.from('saved_places').select('place_id').eq('user_id', targetUserId) as any;
    const savedPlaceIds = (saved || []).map((s: any) => s.place_id);

    // Fetch created spots
    const { data: created } = await supabase.from('places').select('*').eq('created_by', targetUserId) as any;
    const createdPlaceIds = (created || []).map((p: any) => p.id);

    // Get all unique place IDs for saved spots
    let savedPlaces: any[] = [];
    if (savedPlaceIds.length > 0) {
      const { data } = await supabase.from('places').select('*').in('id', savedPlaceIds) as any;
      savedPlaces = data || [];
    }

    // Get reviews for all relevant places
    const allPlaceIds = [...new Set([...savedPlaceIds, ...createdPlaceIds])];
    let allReviews: any[] = [];
    if (allPlaceIds.length > 0) {
      const { data } = await supabase.from('reviews').select('*').in('place_id', allPlaceIds) as any;
      allReviews = data || [];
    }

    setSavedSpots(buildSpots(savedPlaces, allReviews));
    setCreatedSpots(buildSpots(created || [], allReviews));

    const allSpots = [...savedPlaces, ...(created || [])];
    if (allSpots.length > 0) setMapCenter([allSpots[0].lat, allSpots[0].lng]);
    setLoading(false);
  };

  const handleToggleMapPublic = async (value: boolean) => {
    setIsMapPublic(value);
    await supabase.from('profiles').update({ is_map_public: value } as any).eq('user_id', user!.id);
    toast({ title: value ? 'Map is now public 🌍' : 'Map is now private 🔒' });
  };

  const handleToggleNamePublic = async (value: boolean) => {
    setIsNamePublic(value);
    await supabase.from('profiles').update({ is_name_public: value } as any).eq('user_id', user!.id);
    toast({ title: value ? 'Name visible' : 'Name hidden' });
  };

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) return;
    await supabase.from('profiles').update({ display_name: newDisplayName.trim() } as any).eq('user_id', user!.id);
    setProfile((p: any) => ({ ...p, display_name: newDisplayName.trim() }));
    setEditingName(false);
    toast({ title: 'Name updated ✏️' });
  };

  const handleSaveMapTitle = async () => {
    await supabase.from('profiles').update({ map_title: newMapTitle.trim() || null } as any).eq('user_id', user!.id);
    setMapTitle(newMapTitle.trim());
    setProfile((p: any) => ({ ...p, map_title: newMapTitle.trim() || null }));
    setEditingTitle(false);
    toast({ title: 'Map title updated 🗺️' });
  };

  const handleShareLink = async () => {
    if (!profile?.share_token) return;
    const url = `${window.location.origin}/shared/${profile.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: 'Link copied! 🔗', description: 'Share it with anyone to show your map.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
    setMapCenter([spot.lat, spot.lng]);
  };

  const displayName = profile
    ? (isOwnProfile || isSharedView || profile.is_name_public ? profile.display_name : 'Anonymous')
    : '';

  if (!isLoggedIn && isOwnProfile && !isSharedView) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Sign in to view your profile</p>
        </div>
      </div>
    );
  }

  const isPrivateAndNotOwner = !isOwnProfile && !isSharedView && profile && !profile.is_map_public;

  const currentSpots = activeTab === 'saved' ? savedSpots : createdSpots;

  const renderSpotsList = (spots: Spot[]) => (
    spots.length === 0 ? (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        {activeTab === 'saved' ? <Heart className="h-12 w-12 text-muted-foreground/50" /> : <PlusCircle className="h-12 w-12 text-muted-foreground/50" />}
        <p className="text-muted-foreground">
          {activeTab === 'saved'
            ? (isOwnProfile ? 'No saved spots yet. Explore and save your favorites!' : 'No saved spots')
            : (isOwnProfile ? 'No spots created yet. Add your first recommendation!' : 'No spots created')}
        </p>
        {isOwnProfile && (
          <Button variant="outline" onClick={() => navigate('/explore')}>
            Explore the map
          </Button>
        )}
      </div>
    ) : viewMode === 'map' ? (
      <div className="h-[500px] overflow-hidden rounded-xl border">
        <MapView spots={spots} onSpotClick={handleSpotClick} center={mapCenter} />
      </div>
    ) : (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {spots.map((spot, i) => {
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
    )
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <div className="container flex-1 overflow-y-auto py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="h-8 w-48 text-lg font-bold"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveDisplayName()}
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveDisplayName}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancel</Button>
                </div>
              ) : (
                <>
                  <h1 className="font-display text-2xl font-bold">{displayName}</h1>
                  {isOwnProfile && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setNewDisplayName(profile?.display_name || ''); setEditingName(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
            {/* Map title */}
            {(mapTitle || isOwnProfile) && (
              <div className="flex items-center gap-2">
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newMapTitle}
                      onChange={(e) => setNewMapTitle(e.target.value)}
                      placeholder="e.g. Best spots in Stockholm"
                      className="h-7 w-64 text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveMapTitle()}
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveMapTitle}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground italic">
                      {mapTitle || (isOwnProfile ? 'Add a title to your map…' : '')}
                    </p>
                    {isOwnProfile && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setNewMapTitle(mapTitle); setEditingTitle(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {profile?.university && <span>📧 {profile.university}</span>}
              <span>·</span>
              <Heart className="h-3.5 w-3.5" /> {savedSpots.length} saved
              <span>·</span>
              <PlusCircle className="h-3.5 w-3.5" /> {createdSpots.length} created
            </p>
            {isSharedView && (
              <Badge variant="outline" className="gap-1">
                <Share2 className="h-3 w-3" /> Shared map
              </Badge>
            )}
            {!isOwnProfile && !isSharedView && (
              <Badge variant="outline" className="gap-1">
                {profile?.is_map_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {profile?.is_map_public ? 'Public map' : 'Private map'}
              </Badge>
            )}
          </div>

          {isOwnProfile && (
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold">Profile Settings</h3>
              <div className="flex items-center gap-3">
                <Switch checked={isMapPublic} onCheckedChange={handleToggleMapPublic} />
                <Label className="flex items-center gap-1.5 text-sm">
                  {isMapPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  Map {isMapPublic ? 'public' : 'private'}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isNamePublic} onCheckedChange={handleToggleNamePublic} />
                <Label className="flex items-center gap-1.5 text-sm">
                  {isNamePublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Name {isNamePublic ? 'visible' : 'hidden'}
                </Label>
              </div>
              <div className="border-t pt-3">
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={handleShareLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy share link'}
                </Button>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Anyone with this link can see your map, even if it's private.
                </p>
              </div>
            </div>
          )}
        </div>

        {isPrivateAndNotOwner ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Lock className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">This map is private</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading profile…</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="saved" className="gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> Saved ({savedSpots.length})
                  </TabsTrigger>
                  <TabsTrigger value="created" className="gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" /> Created ({createdSpots.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex gap-2">
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={() => setViewMode('list')}>
                  <List className="h-4 w-4" /> List
                </Button>
                <Button variant={viewMode === 'map' ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={() => setViewMode('map')}>
                  <Map className="h-4 w-4" /> Map
                </Button>
              </div>
            </div>

            {renderSpotsList(currentSpots)}
          </>
        )}
      </div>

      <SpotDetail spot={selectedSpot} open={!!selectedSpot} onClose={() => setSelectedSpot(null)} onUpdate={fetchProfileData} />
    </div>
  );
};

export default Profile;
