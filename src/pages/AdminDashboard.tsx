import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, Search, UserPlus, Trash2, Eye, EyeOff, Ban, CheckCircle2,
  Users, MapPin, Crown, ShieldCheck, ShieldOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Spot, MapLayer, isSpotOfficial, CATEGORIES } from '@/lib/mockData';
import { motion } from 'framer-motion';

interface UserRow {
  user_id: string;
  email: string;
  created_at: string;
  display_name: string | null;
  university: string | null;
  is_blocked: boolean;
  roles: string[];
}

const AdminDashboard = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [spotSearch, setSpotSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchAll();
    }
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchSpots()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    // Get all auth users via security definer function
    const { data: authUsers } = await supabase.rpc('list_all_users') as any;

    // Get all profiles
    const { data: profiles } = await supabase.from('profiles').select('*') as any;

    // Get all roles
    const { data: roles } = await supabase.from('user_roles').select('*') as any;

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    const roleMap = new Map<string, string[]>();
    (roles || []).forEach((r: any) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    });

    const userRows: UserRow[] = (authUsers || []).map((u: any) => {
      const profile = profileMap.get(u.user_id);
      return {
        user_id: u.user_id,
        email: u.email,
        created_at: u.created_at,
        display_name: profile?.display_name || null,
        university: profile?.university || null,
        is_blocked: profile?.is_blocked || false,
        roles: roleMap.get(u.user_id) || [],
      };
    });

    setUsers(userRows);
  };

  const fetchSpots = async () => {
    const { data: places } = await supabase.from('places').select('*') as any;
    if (!places) { setSpots([]); return; }

    const placeIds = places.map((p: any) => p.id);
    const { data: reviews } = await supabase.from('reviews').select('*').in('place_id', placeIds) as any;

    const mapped: Spot[] = places.map((p: any) => {
      const placeReviews = (reviews || []).filter((r: any) => r.place_id === p.id);
      const avgRating = placeReviews.length > 0
        ? placeReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / placeReviews.length
        : 0;
      return {
        id: p.id, name: p.name, category: p.category as MapLayer,
        lat: p.lat, lng: p.lng, address: p.address,
        description: p.description || '', recommendations: p.recommendation_count || 0,
        rating: avgRating, reviewCount: placeReviews.length,
        isVisible: p.is_visible, trending: (p.recommendation_count || 0) >= 10,
        isOfficial: isSpotOfficial(p.recommendation_count || 0, avgRating),
        reviews: [],
      };
    });
    setSpots(mapped);
  };

  const handleToggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? 'sbloccare' : 'bloccare';
    if (!confirm(`Sei sicuro di voler ${action} questo utente?`)) return;

    await supabase.from('profiles').update({ is_blocked: !currentlyBlocked } as any).eq('user_id', userId);
    toast({ title: currentlyBlocked ? 'Utente sbloccato ✅' : 'Utente bloccato 🚫' });
    fetchUsers();
  };

  const handleSetRole = async (userId: string, role: 'admin' | 'moderator', action: 'add' | 'remove') => {
    if (action === 'add') {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role } as any);
      if (error?.code === '23505') {
        toast({ title: 'Ruolo già assegnato' });
      } else if (error) {
        toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: `${role === 'admin' ? 'Admin' : 'Moderatore'} aggiunto! 🛡️` });
      }
    } else {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
      toast({ title: `Ruolo ${role} rimosso` });
    }
    fetchUsers();
  };

  const handleToggleVisibility = async (spotId: string, visible: boolean) => {
    await supabase.from('places').update({ is_visible: !visible } as any).eq('id', spotId);
    toast({ title: visible ? 'Spot nascosto' : 'Spot visibile' });
    fetchSpots();
  };

  const handleDeleteSpot = async (spotId: string, name: string) => {
    if (!confirm(`Eliminare "${name}"?`)) return;
    await supabase.from('places').delete().eq('id', spotId);
    toast({ title: 'Spot eliminato 🗑️' });
    fetchSpots();
  };

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.email.toLowerCase().includes(q) ||
           (u.display_name || '').toLowerCase().includes(q) ||
           (u.university || '').toLowerCase().includes(q);
  });

  const filteredSpots = spots.filter(s => {
    if (!spotSearch) return true;
    return s.name.toLowerCase().includes(spotSearch.toLowerCase()) ||
           s.address.toLowerCase().includes(spotSearch.toLowerCase());
  });

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="container flex-1 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">{users.length} users · {spots.length} spots</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <Tabs defaultValue="users">
            <TabsList className="mb-4">
              <TabsTrigger value="users" className="gap-1.5">
                <Users className="h-4 w-4" /> Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="spots" className="gap-1.5">
                <MapPin className="h-4 w-4" /> Spots ({spots.length})
              </TabsTrigger>
            </TabsList>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, university..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2">
                {filteredUsers.map((u, i) => (
                  <motion.div
                    key={u.user_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                      u.is_blocked ? 'bg-destructive/5 border-destructive/20' : 'bg-card'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium truncate">{u.email}</p>
                        {u.is_blocked && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <Ban className="h-3 w-3" /> Blocked
                          </Badge>
                        )}
                        {u.roles.includes('admin') && (
                          <Badge className="bg-gradient-hero text-primary-foreground text-xs gap-1">
                            <Crown className="h-3 w-3" /> Admin
                          </Badge>
                        )}
                        {u.roles.includes('moderator') && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <ShieldCheck className="h-3 w-3" /> Mod
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {u.display_name || '—'} · {u.university || '—'} · Joined {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      {/* Block/unblock */}
                      <Button
                        variant={u.is_blocked ? 'outline' : 'destructive'}
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => handleToggleBlock(u.user_id, u.is_blocked)}
                        disabled={u.user_id === user?.id}
                      >
                        {u.is_blocked ? <CheckCircle2 className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                        {u.is_blocked ? 'Unblock' : 'Block'}
                      </Button>

                      {/* Toggle admin */}
                      {u.user_id !== user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => handleSetRole(u.user_id, 'admin', u.roles.includes('admin') ? 'remove' : 'add')}
                        >
                          <Crown className="h-3 w-3" />
                          {u.roles.includes('admin') ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      )}

                      {/* Toggle moderator */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => handleSetRole(u.user_id, 'moderator', u.roles.includes('moderator') ? 'remove' : 'add')}
                        disabled={u.user_id === user?.id}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {u.roles.includes('moderator') ? 'Remove Mod' : 'Make Mod'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="py-10 text-center text-muted-foreground">No users found.</p>
                )}
              </div>
            </TabsContent>

            {/* SPOTS TAB */}
            <TabsContent value="spots" className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search spots..."
                  value={spotSearch}
                  onChange={(e) => setSpotSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2">
                {filteredSpots.map((spot, i) => {
                  const cat = CATEGORIES.find(c => c.id === spot.category);
                  return (
                    <motion.div
                      key={spot.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center justify-between rounded-xl border bg-card p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{spot.name}</p>
                          <Badge variant="secondary" className={`${cat?.color} text-primary-foreground text-xs`}>
                            {cat?.icon}
                          </Badge>
                          <Badge variant={spot.isVisible ? 'default' : 'secondary'} className="text-xs">
                            {spot.isVisible ? 'Visible' : 'Hidden'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {spot.address} · {spot.recommendations} endorsements · ⭐ {spot.rating > 0 ? spot.rating.toFixed(1) : '—'}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleVisibility(spot.id, spot.isVisible)}
                        >
                          {spot.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSpot(spot.id, spot.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
                {filteredSpots.length === 0 && (
                  <p className="py-10 text-center text-muted-foreground">No spots found.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
