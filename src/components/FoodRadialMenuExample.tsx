import { useState } from 'react';
import { FoodRadialMenu } from './FoodRadialMenu';

// Données d'exemple pour le menu radial
const menuItems = [
  {
    category: "Pizza",
    icon: "🍕",
    items: ["Pepperoni", "Pizza de la Maman", "Reine", "Calzone"]
  },
  {
    category: "Chawarma",
    icon: "🥙",
    items: ["Poulet", "Boeuf", "Mixte", "Falafel"]
  },
  {
    category: "Hamburger",
    icon: "🍔",
    items: ["Cheeseburger", "Bacon", "Double", "Végé"]
  },
  {
    category: "Frites",
    icon: "🍟",
    items: ["Classiques", "Cheddar", "Bacon", "Piquantes"]
  },
  {
    category: "Poulet",
    icon: "🍗",
    items: ["Wings", "Tenders", "Grillé", "Crispy"]
  }
];

export const FoodRadialMenuExample = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ category: string; item: string } | null>(null);

  const handleSelectItem = (category: string, item: string) => {
    setSelectedItem({ category, item });
    console.log(`Article sélectionné: ${item} de la catégorie ${category}`);
  };

  const handleSelectCategory = (category: string) => {
    console.log(`Catégorie sélectionnée: ${category}`);
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
      {/* Bouton pour ouvrir le menu */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="px-8 py-4 bg-amber-500/90 hover:bg-amber-600 text-white font-black text-xl rounded-2xl shadow-xl backdrop-blur-xl border-2 border-amber-400/50 transition-all hover:scale-105"
      >
        Ouvrir le Menu Radial
      </button>

      {/* Affichage de l'article sélectionné */}
      {selectedItem && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl text-white px-6 py-3 rounded-full border border-white/20">
          <span className="font-bold">
            {selectedItem.item} ({selectedItem.category})
          </span>
        </div>
      )}

      {/* Menu Radial */}
      <FoodRadialMenu
        menuItems={menuItems}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectItem={handleSelectItem}
        onSelectCategory={handleSelectCategory}
      />
    </div>
  );
};
