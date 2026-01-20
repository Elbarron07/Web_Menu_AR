import { motion } from 'framer-motion';
import menuData from '../data/menu.json';

interface SimpleMenuProps {
  onSelectDish: (dishId: string | number) => void;
}

export const SimpleMenu = ({ onSelectDish }: SimpleMenuProps) => {
  const dishes = menuData;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl"
        >
          <h2 className="text-3xl font-black text-white mb-6 text-center">
            Notre Menu
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishes.map((dish: any) => (
              <motion.button
                key={dish.id}
                onClick={() => onSelectDish(dish.id)}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-left hover:bg-white/20 transition-all shadow-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{dish.name}</h3>
                  <span className="text-amber-400 font-black text-xl">
                    {dish.price.toFixed(2)}€
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-2">{dish.shortDesc}</p>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>🔥 {dish.nutrition?.calories} kcal</span>
                  <span>⏱️ {dish.nutrition?.temps}</span>
                </div>
              </motion.button>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            Sélectionnez un plat pour le voir en réalité augmentée
          </p>
        </motion.div>
      </div>
    </div>
  );
};
