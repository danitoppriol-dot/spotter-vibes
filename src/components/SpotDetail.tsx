import { useState, useEffect } from 'react';
import { Spot, CATEGORIES } from '@/lib/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Star, ThumbsUp, MapPin, TrendingUp, Clock, ExternalLink, Send, Heart, Ghost, CheckCircle2, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '@/components/AuthDialog';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface SpotDetailProps {
  spot: Spot | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

function StarRating({ rating, interactive, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= (interactive ? (hover || rating) : Math.round(rating))
              ? 'fill-secondary text-secondary'
              : 'text-muted'
          } ${interactive ? 'cursor-pointer' : ''}`}
          onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
        />
      ))}
      {!interactive && <span className="ml-1 text-sm font-medium text-foreground">{rating.toFixed(1)}</span>}
    </div>
  );
}

const SpotDetail = ({ spot, open, onClose, onUpdate }: SpotDetailProps) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const { toast } = useToast();
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    if (!user || !spot) return;
    supabase
      .from('saved_places')
      .select('id')
      .eq('user_id', user.id)
      .eq('place_id', spot.id)
      .then(({ data }: any) => setIsSaved((data || []).length > 0));
  }, [user, spot?.id]);

  const handleToggleSave = async () => {
    if (!isLoggedIn || !user) { setAuthOpen(true); return; }
    if (!spot) return;
    setSavingToggle(true);
    if (isSaved) {
      await supabase.from('saved_places').delete().eq('user_id', user.id).eq('place_id', spot.id);
      setIsSaved(false);
      toast({ title: 'Removed from favorites' });
    } else {
      await (supabase.from('saved_places').insert({ user_id: user.id, place_id: spot.id } as any) as any);
      setIsSaved(true);
      toast({ title: 'Saved to favorites ❤️' });
    }
    setSavingToggle(false);
  };

  if (!spot) return null;

  const category = CATEGORIES.find((c) => c.id === spot.category);

  const handleRecommend = async () => {
    if (!isLoggedIn || !user) { setAuthOpen(true); return; }
    const { error } = await supabase.from('recommendations').insert({
      user_id: user.id,
      place_id: spot.id,
    } as any);
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already recommended', description: 'You already endorsed this spot!' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      return;
    }
    toast({ title: 'Spot recommended! 👍', description: `You endorsed "${spot.name}".` });
    onUpdate?.();
  };

  const handleOpenReview = () => {
    if (!isLoggedIn) { setAuthOpen(true); return; }
    setShowReviewForm(true);
  };

  const handleSubmitReview = async () => {
    if (!user) return;
    if (reviewRating === 0) {
      toast({ title: 'Add a rating', description: 'Please select a star rating.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      place_id: spot.id,
      rating: reviewRating,
      text: reviewText || null,
    } as any);
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Review submitted! ✍️' });
    setShowReviewForm(false);
    setReviewRating(0);
    setReviewText('');
    onUpdate?.();
  };

  const googleMapsUrl = spot.googleMapsUrl || `https://maps.google.com/?q=${spot.lat},${spot.lng}`;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) { onClose(); setShowReviewForm(false); } }}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader className="pb-4">
            <div className="space-y-2">
              <SheetTitle className="font-display text-xl">{spot.name}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={`${category?.color} text-primary-foreground`}>
                  {category?.icon} {category?.label}
                </Badge>
                {spot.isOfficial ? (
                  <Badge variant="outline" className="gap-1 border-accent text-accent">
                    <CheckCircle2 className="h-3 w-3" /> Official
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-muted-foreground/50 text-muted-foreground">
                    <Ghost className="h-3 w-3" /> Unconfirmed
                  </Badge>
                )}
                {spot.trending && (
                  <Badge variant="outline" className="gap-1 border-secondary text-secondary">
                    <TrendingUp className="h-3 w-3" /> Trending
                  </Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-5">
            {/* Photo */}
            {spot.photoUrl && (
              <img src={spot.photoUrl} alt={spot.name} className="h-44 w-full rounded-lg object-cover" />
            )}

            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary hover:underline">
              <MapPin className="h-4 w-4" /> {spot.address} <ExternalLink className="h-3 w-3" />
            </a>

            {spot.openingHours && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {spot.openingHours}
              </div>
            )}

            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <StarRating rating={spot.rating} />
                <p className="text-xs text-muted-foreground">{spot.reviewCount} reviews</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <ThumbsUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{spot.recommendations}</p>
                  <p className="text-xs text-muted-foreground">endorsements</p>
                </div>
              </div>
            </div>

            {/* Questionnaire info */}
            {spot.questionnaire && Object.keys(spot.questionnaire).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(spot.questionnaire).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs capitalize">
                    {key.replace(/_/g, ' ')}: {value}
                  </Badge>
                ))}
              </div>
            )}

            {!spot.isOfficial && (
              <div className="rounded-lg border border-muted bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  👻 This spot is <strong>unconfirmed</strong>. It needs {Math.max(0, 4 - spot.recommendations)} more endorsements or a ≥3.5 rating to become official.
                </p>
              </div>
            )}

            <p className="text-sm leading-relaxed text-foreground/80">{spot.description}</p>

            <div className="flex gap-2">
              <Button className="flex-1 gap-2 bg-gradient-hero" onClick={handleRecommend}>
                <ThumbsUp className="h-4 w-4" /> Endorse
              </Button>
              <Button
                variant={isSaved ? 'secondary' : 'outline'}
                className="gap-2"
                onClick={handleToggleSave}
                disabled={savingToggle}
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={handleOpenReview}>
              Write Review
            </Button>

            <Button variant="outline" className="w-full gap-2" asChild>
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className="h-4 w-4" /> Open in Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            </Button>

            {showReviewForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <h4 className="font-display text-sm font-semibold">Your Review</h4>
                <div className="space-y-1">
                  <Label className="text-xs">Rating</Label>
                  <StarRating rating={reviewRating} interactive onRate={setReviewRating} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Comment (optional)</Label>
                  <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                    placeholder="What did you like about this place?" rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5 bg-gradient-hero" onClick={handleSubmitReview} disabled={isSubmitting}>
                    <Send className="h-3 w-3" /> {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="font-display text-sm font-semibold">Reviews ({spot.reviews.length})</h3>
              {spot.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
              ) : (
                spot.reviews.map((review, i) => (
                  <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }} className="space-y-2 rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{review.userName}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.text && <p className="text-sm text-foreground/70">{review.text}</p>}
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default SpotDetail;
