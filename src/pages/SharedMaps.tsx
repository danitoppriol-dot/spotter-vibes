import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Star, MapPin, Heart, Search, Globe, Users, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import AuthDialog from '@/components/AuthDialog';

interface PublicProfile {
  user_id: string;
  display_name: string | null;
  university: string | null;
  is_name_public: boolean;
  share_token: string | null;
  map_title: string | null;
  saved_count: number;
  avg_rating: number;
  rating_count: number;
  my_rating: number | null;
}

const SharedMaps = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [ratingInProgress, setRatingInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicMaps();
  }, [user]);

  const fetchPublicMaps = async () => {
    setLoading(true);

    // Get all public profiles
    const { data: publicProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_map_public', true) as any;

    if (!publicProfiles || publicProfiles.length === 0) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    const userIds = publicProfiles.map((p: any) => p.user_id);

    // Get spot counts (places created by each user)
    const { data: createdCounts } = await supabase
      .from('places')
      .select('created_by')
      .in('created_by', userIds)
      .eq('is_visible', true) as any;

    const countMap = new Map<string, number>();
    (createdCounts || []).forEach((s: any) => {
      countMap.set(s.created_by, (countMap.get(s.created_by) || 0) + 1);
    });

    // Get map ratings
    const { data: ratings } = await supabase
      .from('map_ratings')
      .select('*')
      .in('profile_user_id', userIds) as any;

    const ratingMap = new Map<string, { sum: number; count: number }>();
    (ratings || []).forEach((r: any) => {
      const existing = ratingMap.get(r.profile_user_id) || { sum: 0, count: 0 };
      ratingMap.set(r.profile_user_id, { sum: existing.sum + r.rating, count: existing.count + 1 });
    });

    // Get my ratings
    const myRatings = new Map<string, number>();
    if (user) {
      (ratings || [])
        .filter((r: any) => r.rater_user_id === user.id)
        .forEach((r: any) => myRatings.set(r.profile_user_id, r.rating));
    }

    const result: PublicProfile[] = publicProfiles
      .map((p: any) => {
        const rData = ratingMap.get(p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          university: p.university,
          is_name_public: p.is_name_public,
          share_token: p.share_token,
          map_title: p.map_title,
          saved_count: countMap.get(p.user_id) || 0,
          avg_rating: rData ? rData.sum / rData.count : 0,
          rating_count: rData?.count || 0,
          my_rating: myRatings.get(p.user_id) || null,
        };
      })
      .sort((a: PublicProfile, b: PublicProfile) => b.avg_rating - a.avg_rating || b.saved_count - a.saved_count);

    setProfiles(result);
    setLoading(false);
  };

  const handleRateMap = async (profileUserId: string, rating: number) => {
    if (!isLoggedIn || !user) { setAuthOpen(true); return; }
    setRatingInProgress(profileUserId);

    // Upsert rating
    const existing = profiles.find(p => p.user_id === profileUserId)?.my_rating;
    if (existing) {
      await supabase
        .from('map_ratings')
        .update({ rating } as any)
        .eq('rater_user_id', user.id)
        .eq('profile_user_id', profileUserId);
    } else {
      await (supabase.from('map_ratings').insert({
        rater_user_id: user.id,
        profile_user_id: profileUserId,
        rating,
      } as any) as any);
    }

    toast({ title: `Rated ${rating}/5 ⭐` });
    setRatingInProgress(null);
    fetchPublicMaps();
  };

  const filtered = profiles.filter(p => {
    if (!searchQuery) return true;
    const name = p.is_name_public ? p.display_name || '' : '';
    const uni = p.university || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           uni.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="container flex-1 py-6">
        <div className="mb-6 space-y-2">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Shared Maps
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover curated maps from the community. Rate and explore other students' favorite spots.
          </p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Globe className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No public maps found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((profile, i) => (
              <motion.div
                key={profile.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border bg-card p-5 shadow-card transition-all hover:shadow-elevated"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold">
                      {profile.map_title || (profile.is_name_public ? `${profile.display_name}'s Map` : 'Anonymous Map')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {profile.is_name_public ? profile.display_name : 'Anonymous'}
                      {profile.university && ` · 🎓 ${profile.university}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" /> {profile.saved_count} spots
                  </Badge>
                </div>

                {/* Average rating display */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= Math.round(profile.avg_rating)
                            ? 'fill-secondary text-secondary'
                            : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : '—'} ({profile.rating_count})
                  </span>
                </div>

                {/* Rate this map */}
                {isLoggedIn && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs text-muted-foreground">Your rating:</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`h-4 w-4 cursor-pointer transition-colors ${
                            s <= (profile.my_rating || 0)
                              ? 'fill-primary text-primary'
                              : 'text-muted hover:text-primary/50'
                          } ${ratingInProgress === profile.user_id ? 'pointer-events-none opacity-50' : ''}`}
                          onClick={() => handleRateMap(profile.user_id, s)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => navigate(`/profile/${profile.user_id}`)}
                >
                  <MapPin className="h-3.5 w-3.5" /> View Map <ExternalLink className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default SharedMaps;
