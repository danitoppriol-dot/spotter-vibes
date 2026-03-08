import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { LAYERS, MapLayer } from '@/lib/mockData';
import { Mail, ArrowRight, Search, MapPin, Loader2, Camera, Upload, Clock } from 'lucide-react';
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

// Questionnaire fields per layer
const QUESTIONNAIRES: Record<MapLayer, { id: string; label: string; options: string[] }[]> = {
  study: [
    { id: 'wifi_speed', label: 'Wi-Fi Speed', options: ['Fast', 'Moderate', 'Slow', 'None'] },
    { id: 'outlets', label: 'Power Outlets', options: ['Many', 'Some', 'Few', 'None'] },
    { id: 'noise_level', label: 'Noise Level', options: ['Silent', 'Quiet', 'Moderate', 'Loud'] },
  ],
  nightlife: [
    { id: 'crowd_size', label: 'Crowd Size', options: ['Packed', 'Busy', 'Moderate', 'Chill'] },
    { id: 'music_type', label: 'Music Type', options: ['Electronic', 'Hip-Hop', 'Live Band', 'Mixed', 'None'] },
    { id: 'queue_length', label: 'Queue Length', options: ['Long', 'Short', 'None'] },
  ],
  outdoor: [
    { id: 'activity', label: 'Main Activity', options: ['Tennis', 'Running', 'Swimming', 'Viewpoint', 'Park', 'Cycling', 'Other'] },
  ],
};

const AddSpotDialog = ({ open, onOpenChange, onSpotAdded }: AddSpotDialogProps) => {
  const [placeQuery, setPlaceQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [category, setCategory] = useState<MapLayer | ''>('');
  const [description, setDescription] = useState('');
  const [mapType, setMapType] = useState<'personal' | 'general' | 'both'>('both');
  const [questionnaire, setQuestionnaire] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiryHours, setExpiryHours] = useState<string>('12');
  const [authOpen, setAuthOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'search' | 'details'>('search');
  const { toast } = useToast();
  const { isLoggedIn, user } = useAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        toast({ title: 'Search failed', description: 'Could not search places. Try again later.', variant: 'destructive' });
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [placeQuery, selectedPlace]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Photo too large', description: 'Max 5MB allowed.', variant: 'destructive' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

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
    // Photo is optional — no validation needed

    // Check questionnaire completeness
    const requiredFields = QUESTIONNAIRES[category as MapLayer] || [];
    const missing = requiredFields.filter(f => !questionnaire[f.id]);
    if (missing.length > 0) {
      toast({ title: 'Complete the questionnaire', description: `Please answer: ${missing.map(f => f.label).join(', ')}`, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    // Upload photo
    let photoUrl: string | null = null;
    const ext = photoFile.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('place-photos').upload(path, photoFile);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('place-photos').getPublicUrl(path);
    photoUrl = urlData.publicUrl;

    const expiresAt = isTemporary
      ? new Date(Date.now() + parseInt(expiryHours) * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase.from('places').insert({
      name: selectedPlace.name,
      category,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      address: selectedPlace.address,
      description,
      created_by: user.id,
      google_maps_url: selectedPlace.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(selectedPlace.name + ' ' + selectedPlace.address)}`,
      photo_url: photoUrl,
      map_type: mapType,
      questionnaire: questionnaire,
      filters: questionnaire,
      expires_at: expiresAt,
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
    resetForm();
    onOpenChange(false);
    onSpotAdded?.();
  };

  const resetForm = () => {
    setPlaceQuery('');
    setSelectedPlace(null);
    setCategory('');
    setDescription('');
    setMapType('both');
    setQuestionnaire({});
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsTemporary(false);
    setExpiryHours('12');
    setStep('search');
  };

  const handleSelectPlace = (place: PlaceResult) => {
    setSelectedPlace(place);
    setPlaceQuery(place.name);
    setSearchResults([]);
  };

  const canProceed = selectedPlace && category;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Recommend a Spot</DialogTitle>
            <DialogDescription>
              {isLoggedIn
                ? step === 'search' ? 'Search for a place and choose a layer.' : 'Upload a photo and complete the questionnaire.'
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
          ) : step === 'search' ? (
            <div className="space-y-4">
              {/* Place search */}
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
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted"
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

              {/* Layer selection */}
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

              {/* Map type */}
              <div className="space-y-2">
                <Label>Add to</Label>
                <RadioGroup value={mapType} onValueChange={(v) => setMapType(v as any)} className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="personal" id="map-personal" />
                    <Label htmlFor="map-personal" className="text-sm cursor-pointer">My Map</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="general" id="map-general" />
                    <Label htmlFor="map-general" className="text-sm cursor-pointer">General Map</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="both" id="map-both" />
                    <Label htmlFor="map-both" className="text-sm cursor-pointer">Both</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                className="w-full bg-gradient-hero"
                disabled={!canProceed}
                onClick={() => setStep('details')}
              >
                Next: Photo & Questionnaire <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload */}
              <div className="space-y-2">
                <Label>Photo *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="h-40 w-full rounded-lg object-cover" />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2 gap-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-3 w-3" /> Change
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Upload a photo of the spot</span>
                    <span className="text-xs">Max 5MB</span>
                  </button>
                )}
              </div>

              {/* Questionnaire */}
              {category && QUESTIONNAIRES[category as MapLayer]?.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>{field.label} *</Label>
                  <Select
                    value={questionnaire[field.id] || ''}
                    onValueChange={(v) => setQuestionnaire(prev => ({ ...prev, [field.id]: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder={`Select ${field.label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {/* Temporary pin */}
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <Switch checked={isTemporary} onCheckedChange={setIsTemporary} />
                  <Label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Clock className="h-3.5 w-3.5" /> Temporary pin
                  </Label>
                </div>
                {isTemporary && (
                  <div className="space-y-1 pl-10">
                    <Label className="text-xs text-muted-foreground">Expires after</Label>
                    <Select value={expiryHours} onValueChange={setExpiryHours}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="spot-desc">Why is this spot great?</Label>
                <Textarea id="spot-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell students what makes this place special..." rows={3} />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('search')} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-hero shadow-glow" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Spot'}
                </Button>
              </div>
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
