import { Spot, CATEGORIES } from '@/lib/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Star, ThumbsUp, MapPin, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

interface SpotDetailProps {
  spot: Spot | null;
  open: boolean;
  onClose: () => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? 'fill-secondary text-secondary' : 'text-muted'}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

const SpotDetail = ({ spot, open, onClose }: SpotDetailProps) => {
  if (!spot) return null;

  const category = CATEGORIES.find((c) => c.id === spot.category);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
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
          </div>
        </SheetHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {spot.address}
          </div>

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
            <Button className="flex-1 gap-2">
              <ThumbsUp className="h-4 w-4" /> Recommend
            </Button>
            <Button variant="outline" className="flex-1">
              Write Review
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-display text-sm font-semibold">Recent Reviews</h3>
            {spot.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
            ) : (
              spot.reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-2 rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{review.userName}</span>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-sm text-foreground/70">{review.text}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SpotDetail;
