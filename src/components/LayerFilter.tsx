import { CATEGORIES, SpotCategory } from '@/lib/mockData';
import { motion } from 'framer-motion';

interface LayerFilterProps {
  activeCategories: SpotCategory[];
  onToggle: (category: SpotCategory) => void;
}

const LayerFilter = ({ activeCategories, onToggle }: LayerFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategories.includes(cat.id);
        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(cat.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? `${cat.color} text-primary-foreground shadow-sm`
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default LayerFilter;
