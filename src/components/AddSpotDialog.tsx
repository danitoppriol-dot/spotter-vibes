import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LAYERS, MapLayer } from '@/lib/mockData';
import { Mail, ArrowRight, Search, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '@/components/AuthDialog';
import { supabase } from '@/integrations/supabase/client';

interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
}

interface AddSpotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpotAdded?: () => void;
}

const AddSpotDialog = ({ open, onOpenChange, onSpotAdded }: AddSpotDialogProps) => {
  const [placeQuery, setPlaceQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [category, setCategory] = useState<MapLayer | ''>('');
  const [description, setDescription] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isLoggedIn, user } = useAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (!placeQuery || placeQuery.length < 2 || selectedPlace) {
      setSearchResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke('places-autocomplete', {
          body: { query: placeQuery },
        });
        if (error) throw error;
        setSearchResults(data?.results || []);
      } catch (err) {
        console.error('Place search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [placeQuery, selectedPlace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !user) { setAuthOpen(true); return; }
    if (!selectedPlace) {
      toast({ title: 'Select a place', description: 'Search and select a place from the results.', variant: 'destructive' });
      return;
    }
    if (!category) {
      toast({ title: 'Select a layer', description: 'Please choose a map layer for this spot.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('places').insert({
      name: selectedPlace.name,
      category,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      address: selectedPlace.address,
      description,
      created_by: user.id,
      google_maps_url: selectedPlace.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(selectedPlace.name + ' ' + selectedPlace.address)}`,
    } as any);

    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Error adding spot', description: error.message, variant: 'destructive' });
      return;
    }

    toast({
      title: 'Spot submitted! 🎉',
      description: `"${selectedPlace.name}" is now on the map. It becomes official after 4 endorsements.`,
    });
    onOpenChange(false);
    onSpotAdded?.();
    setPlaceQuery('');
    setSelectedPlace(null);
    setCategory('');
    setDescription('');
  };

  const handleSelectPlace = (place: PlaceResult) => {
    setSelectedPlace(place);
    setPlaceQuery(place.name);
    setSearchResults([]);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Recommend a Spot</DialogTitle>
            <DialogDescription>
              {isLoggedIn
                ? 'Search for a place and add it to the map. Spots start transparent and become official after 4 endorsements.'
                : 'Sign in with your university email to recommend spots.'}
            </DialogDescription>
          </DialogHeader>

          {!isLoggedIn ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in with your university email to start recommending spots.
              </p>
              <Button className="w-full gap-2 bg-gradient-hero" onClick={() => { onOpenChange(false); setAuthOpen(true); }}>
                <Mail className="h-4 w-4" /> Sign In to Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {searchResults.length > 0 && !selectedPlace && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-md">
                    {searchResults.map((place, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectPlace(place)}
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
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
                <Label>Map Layer</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as MapLayer)}>
                  <SelectTrigger><SelectValue placeholder="Select a layer" /></SelectTrigger>
                  <SelectContent>
                    {LAYERS.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.icon} {l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spot-desc">Why is this spot great?</Label>
                <Textarea id="spot-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell students what makes this place special..." rows={3} />
              </div>

              <Button type="submit" className="w-full bg-gradient-hero shadow-glow" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Recommendation'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                👻 New spots start transparent. They become official after 4 endorsements or a ≥3.5 rating.
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
