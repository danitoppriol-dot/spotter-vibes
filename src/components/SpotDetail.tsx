import { useState } from 'react';
import { Spot, CATEGORIES } from '@/lib/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Star, ThumbsUp, MapPin, TrendingUp, Clock, ExternalLink, Send } from 'lucide-react';
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
  const { toast } = useToast();
  const { isLoggedIn, user } = useAuth();

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
    toast({ title: 'Review submitted! ✍️', description: 'Thanks for sharing your experience.' });
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
            <div className="space-y-1">
              <SheetTitle className="font-display text-xl">{spot.name}</SheetTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`${category?.color} text-primary-foreground`}>
                  {category?.icon} {category?.label}
                </Badge>
                {spot.trending && (
                  <Badge variant="outline" className="gap-1 border-secondary text-secondary">
                    <TrendingUp className="h-3 w-3" /> Trending
                  </Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-5">
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

            <p className="text-sm leading-relaxed text-foreground/80">{spot.description}</p>

            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={handleRecommend}>
                <ThumbsUp className="h-4 w-4" /> Recommend
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleOpenReview}>
                Write Review
              </Button>
            </div>

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
                  <Button size="sm" className="gap-1.5" onClick={handleSubmitReview} disabled={isSubmitting}>
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
