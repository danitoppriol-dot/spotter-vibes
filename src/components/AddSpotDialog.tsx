import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, SpotCategory, PLACE_SEARCH_RESULTS } from '@/lib/mockData';
import { Mail, ArrowRight, Search, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '@/components/AuthDialog';

interface AddSpotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddSpotDialog = ({ open, onOpenChange }: AddSpotDialogProps) => {
  const [placeQuery, setPlaceQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [category, setCategory] = useState<SpotCategory | ''>('');
  const [description, setDescription] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const { toast } = useToast();
  const { isLoggedIn } = useAuth();

  const searchResults = useMemo(() => {
    if (!placeQuery || placeQuery.length < 2) return [];
    return PLACE_SEARCH_RESULTS.filter(
      (p) =>
        p.name.toLowerCase().includes(placeQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(placeQuery.toLowerCase())
    ).slice(0, 5);
  }, [placeQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }
    if (!selectedPlace) {
      toast({ title: 'Select a place', description: 'Search and select a place from the results.', variant: 'destructive' });
      return;
    }
    toast({
      title: 'Spot submitted! 🎉',
      description: `"${selectedPlace.name}" will appear on the map once 5 students recommend it.`,
    });
    onOpenChange(false);
    setPlaceQuery('');
    setSelectedPlace(null);
    setCategory('');
    setDescription('');
  };

  const handleSelectPlace = (place: typeof PLACE_SEARCH_RESULTS[0]) => {
    setSelectedPlace(place);
    setPlaceQuery(place.name);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Recommend a New Spot</DialogTitle>
            <DialogDescription>
              {isLoggedIn
                ? 'Search for a place and recommend it. Spots appear on the map after 5 student recommendations.'
                : 'You need to sign in first to recommend a spot.'}
            </DialogDescription>
          </DialogHeader>

          {!isLoggedIn ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in with your university or work email to start recommending spots.
              </p>
              <Button className="w-full gap-2 bg-gradient-hero" onClick={() => { onOpenChange(false); setAuthOpen(true); }}>
                <Mail className="h-4 w-4" /> Sign In to Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Place Search */}
              <div className="space-y-2">
                <Label>Search Place</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={placeQuery}
                    onChange={(e) => { setPlaceQuery(e.target.value); setSelectedPlace(null); }}
                    placeholder="Search for a café, library, park..."
                    className="pl-9"
                  />
                </div>
                {searchResults.length > 0 && !selectedPlace && (
                  <div className="rounded-lg border bg-popover shadow-md">
                    {searchResults.map((place, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectPlace(place)}
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{place.name}</p>
                          <p className="text-xs text-muted-foreground">{place.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPlace && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedPlace.name}</span>
                    <span className="text-muted-foreground">— {selectedPlace.address}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as SpotCategory)}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spot-desc">Why is this spot great?</Label>
                <Textarea id="spot-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell students what makes this place special..." rows={3} required />
              </div>

              <Button type="submit" className="w-full bg-gradient-hero">Submit Recommendation</Button>
              <p className="text-center text-xs text-muted-foreground">
                ℹ️ Spots become visible after 5 unique student recommendations.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default AddSpotDialog;
