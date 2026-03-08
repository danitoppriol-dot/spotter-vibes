import { LAYERS, MapLayer } from '@/lib/mockData';
import { motion } from 'framer-motion';

interface LayerFilterProps {
  activeCategories: MapLayer[];
  onToggle: (category: MapLayer) => void;
}

const LayerFilter = ({ activeCategories, onToggle }: LayerFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {LAYERS.map((layer) => {
        const isActive = activeCategories.includes(layer.id);
        return (
          <motion.button
            key={layer.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(layer.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? `${layer.color} text-primary-foreground shadow-sm`
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span>{layer.icon}</span>
            <span>{layer.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default LayerFilter;
