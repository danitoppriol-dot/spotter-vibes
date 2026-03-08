import { Spot, CATEGORIES } from '@/lib/mockData';
import { Star, ThumbsUp, TrendingUp, Ghost, CheckCircle2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface TrendingSpotsProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
}

const TrendingSpots = ({ spots, onSpotClick }: TrendingSpotsProps) => {
  const sorted = [...spots].sort((a, b) => b.recommendations - a.recommendations);
  const trending = sorted.filter((s) => s.trending);
  const recent = sorted.filter((s) => !s.trending).slice(0, 5);
  const displaySpots = trending.length > 0 ? trending.slice(0, 5) : recent;
  const title = trending.length > 0 ? 'Trending Now' : 'Recent Spots';

  if (displaySpots.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <TrendingUp className="h-4 w-4 text-secondary" />
        <h3 className="font-display text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">
        {displaySpots.map((spot, i) => {
          const cat = CATEGORIES.find((c) => c.id === spot.category);
          return (
            <motion.button
              key={spot.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSpotClick(spot)}
              className="flex w-full items-center gap-3 rounded-lg bg-card p-3 text-left shadow-card transition-all hover:shadow-elevated"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${cat?.color} text-primary-foreground`}>
                {cat?.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium">{spot.name}</p>
                  {spot.isOfficial ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-accent" />
                  ) : (
                    <Ghost className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-secondary text-secondary" /> {spot.rating > 0 ? spot.rating.toFixed(1) : '—'}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <ThumbsUp className="h-3 w-3" /> {spot.recommendations}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">{cat?.label}</Badge>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingSpots;
