import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuCategory {
  category: string;
  icon: string;
  items: string[];
}

interface FoodRadialMenuProps {
  menuItems: MenuCategory[];
  onSelectItem?: (category: string, item: string) => void;
  onSelectCategory?: (category: string) => void;
  isOpen: boolean;
  onClose: () => void;
}


// Fonction pour convertir un angle en radians en coordonnées
const angleToCoords = (angle: number, radius: number, centerX: number, centerY: number) => {
  const rad = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(rad),
    y: centerY + radius * Math.sin(rad),
  };
};

// Fonction pour créer un path SVG pour un segment
const createSegmentPath = (
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number,
  centerX: number,
  centerY: number
): string => {
  const startOuter = angleToCoords(startAngle, outerRadius, centerX, centerY);
  const endOuter = angleToCoords(endAngle, outerRadius, centerX, centerY);
  const startInner = angleToCoords(startAngle, innerRadius, centerX, centerY);
  const endInner = angleToCoords(endAngle, innerRadius, centerX, centerY);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${centerX} ${centerY}`,
    `L ${startInner.x} ${startInner.y}`,
    `L ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ');
};

export const FoodRadialMenu = ({
  menuItems,
  onSelectItem,
  onSelectCategory,
  isOpen,
  onClose,
}: FoodRadialMenuProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Constantes pour les dimensions (responsive)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const centerX = isMobile ? 200 : 300;
  const centerY = isMobile ? 200 : 300;
  const innerRadius = isMobile ? 50 : 80;
  const outerRadiusLevel1 = isMobile ? 120 : 180;
  const outerRadiusLevel2 = isMobile ? 200 : 280;
  const svgSize = isMobile ? 400 : 600;

  // Calculer les segments pour le niveau 1
  const segments = useMemo(() => {
    const anglePerSegment = 360 / menuItems.length;
    return menuItems.map((item, index) => {
      const startAngle = index * anglePerSegment - 90; // -90 pour commencer en haut
      const endAngle = (index + 1) * anglePerSegment - 90;
      const midAngle = (startAngle + endAngle) / 2;

      return {
        index,
        category: item.category,
        icon: item.icon,
        startAngle,
        endAngle,
        midAngle,
      };
    });
  }, [menuItems]);

  // Obtenir les items de la catégorie sélectionnée
  const selectedCategoryItems = useMemo(() => {
    if (!selectedCategory) return [];
    const category = menuItems.find((item) => item.category === selectedCategory);
    return category?.items || [];
  }, [selectedCategory, menuItems]);

  // Calculer les segments pour le niveau 2 (articles)
  const itemSegments = useMemo(() => {
    if (!selectedCategory || selectedCategoryItems.length === 0) return [];
    const selectedSegment = segments.find((s) => s.category === selectedCategory);
    if (!selectedSegment) return [];

    // Centrer les items autour du segment sélectionné
    const segmentAngle = selectedSegment.midAngle;
    const segmentSpan = selectedSegment.endAngle - selectedSegment.startAngle;

    return selectedCategoryItems.map((item, index) => {
      const itemAngle = segmentAngle - segmentSpan / 2 + (index + 0.5) * (segmentSpan / selectedCategoryItems.length);
      const startAngle = itemAngle - (segmentSpan / selectedCategoryItems.length) / 2;
      const endAngle = itemAngle + (segmentSpan / selectedCategoryItems.length) / 2;

      return {
        index,
        item,
        startAngle,
        endAngle,
        midAngle: itemAngle,
      };
    });
  }, [selectedCategory, selectedCategoryItems, segments]);

  // Gérer la fermeture avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedCategory) {
          setSelectedCategory(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, selectedCategory, onClose]);

  // Gérer le clic sur une catégorie
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  // Gérer le clic sur un article
  const handleItemClick = (item: string) => {
    if (selectedCategory && onSelectItem) {
      onSelectItem(selectedCategory, item);
    }
    setSelectedCategory(null);
    onClose();
  };

  // Gérer le clic sur le centre (fermer/désélectionner)
  const handleCenterClick = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCenterClick();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative"
          >
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="drop-shadow-2xl"
            >
              {/* Niveau 1 : Segments de catégories */}
              {segments.map((segment) => {
                const isSelected = selectedCategory === segment.category;
                const isHovered = hoveredCategory === segment.category;
                const path = createSegmentPath(
                  segment.startAngle,
                  segment.endAngle,
                  innerRadius,
                  outerRadiusLevel1,
                  centerX,
                  centerY
                );

                return (
                  <g key={segment.category}>
                    <motion.path
                      d={path}
                      fill={isSelected ? 'rgba(251, 191, 36, 0.3)' : isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.8)'}
                      stroke={isSelected ? 'rgba(251, 191, 36, 0.8)' : isHovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'}
                      strokeWidth={isSelected ? '2' : '1'}
                      className="cursor-pointer transition-all"
                      onClick={() => handleCategoryClick(segment.category)}
                      onMouseEnter={() => setHoveredCategory(segment.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ scale: 0.95 }}
                    />
                    {/* Label et icône au centre du segment */}
                    <g
                      onClick={() => handleCategoryClick(segment.category)}
                      onMouseEnter={() => setHoveredCategory(segment.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className="cursor-pointer"
                    >
                      <text
                        x={angleToCoords(segment.midAngle, (innerRadius + outerRadiusLevel1) / 2, centerX, centerY).x}
                        y={angleToCoords(segment.midAngle, (innerRadius + outerRadiusLevel1) / 2, centerX, centerY).y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="select-none pointer-events-none"
                        fill="white"
                        fontSize={isMobile ? "24" : "32"}
                      >
                        {segment.icon}
                      </text>
                      <text
                        x={angleToCoords(segment.midAngle, (innerRadius + outerRadiusLevel1) / 2 + (isMobile ? 20 : 30), centerX, centerY).x}
                        y={angleToCoords(segment.midAngle, (innerRadius + outerRadiusLevel1) / 2 + (isMobile ? 20 : 30), centerX, centerY).y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-bold select-none pointer-events-none"
                        fill={isSelected ? '#fbbf24' : 'white'}
                        fontSize={isMobile ? "11" : "14"}
                      >
                        {segment.category}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Niveau 2 : Anneau extérieur avec articles (apparaît seulement si une catégorie est sélectionnée) */}
              <AnimatePresence>
                {selectedCategory && itemSegments.length > 0 && (
                  <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {itemSegments.map((itemSegment) => {
                      const path = createSegmentPath(
                        itemSegment.startAngle,
                        itemSegment.endAngle,
                        outerRadiusLevel1 + 10,
                        outerRadiusLevel2,
                        centerX,
                        centerY
                      );

                      return (
                        <g key={itemSegment.index}>
                          <motion.path
                            d={path}
                            fill="rgba(0, 0, 0, 0.85)"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="1"
                            className="cursor-pointer"
                            onClick={() => handleItemClick(itemSegment.item)}
                            whileHover={{ fill: 'rgba(251, 191, 36, 0.2)', stroke: 'rgba(251, 191, 36, 0.6)' }}
                            whileTap={{ scale: 0.95 }}
                          />
                          {/* Label de l'article */}
                          <text
                            x={angleToCoords(itemSegment.midAngle, (outerRadiusLevel1 + outerRadiusLevel2) / 2, centerX, centerY).x}
                            y={angleToCoords(itemSegment.midAngle, (outerRadiusLevel1 + outerRadiusLevel2) / 2, centerX, centerY).y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-semibold select-none pointer-events-none cursor-pointer"
                            fill="white"
                            fontSize={isMobile ? "10" : "12"}
                            onClick={() => handleItemClick(itemSegment.item)}
                          >
                            {itemSegment.item}
                          </text>
                        </g>
                      );
                    })}
                  </motion.g>
                )}
              </AnimatePresence>

              {/* Cercle central */}
              <motion.circle
                cx={centerX}
                cy={centerY}
                r={innerRadius}
                fill="rgba(0, 0, 0, 0.9)"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
                className="cursor-pointer"
                onClick={handleCenterClick}
                whileHover={{ fill: 'rgba(0, 0, 0, 0.95)', stroke: 'rgba(251, 191, 36, 0.6)' }}
                whileTap={{ scale: 0.95 }}
              />
              <text
                x={centerX}
                y={centerY - (isMobile ? 6 : 10)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-bold select-none pointer-events-none"
                fill="white"
                fontSize={isMobile ? "12" : "14"}
              >
                Menu
              </text>
              <text
                x={centerX}
                y={centerY + (isMobile ? 6 : 10)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="select-none pointer-events-none"
                fill="rgba(255, 255, 255, 0.6)"
                fontSize={isMobile ? "9" : "10"}
              >
                {selectedCategory ? selectedCategory : 'Catégories'}
              </text>
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
