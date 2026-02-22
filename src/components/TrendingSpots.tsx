import { Spot, CATEGORIES } from '@/lib/mockData';
import { Star, ThumbsUp, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface TrendingSpotsProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
}

const TrendingSpots = ({ spots, onSpotClick }: TrendingSpotsProps) => {
  const trending = spots.filter((s) => s.trending).sort((a, b) => b.recommendations - a.recommendations);

  if (trending.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <TrendingUp className="h-4 w-4 text-secondary" />
        <h3 className="font-display text-sm font-semibold">Trending Now</h3>
      </div>
      <div className="space-y-2">
        {trending.slice(0, 5).map((spot, i) => {
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
                <p className="truncate text-sm font-medium">{spot.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-secondary text-secondary" /> {spot.rating}
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
