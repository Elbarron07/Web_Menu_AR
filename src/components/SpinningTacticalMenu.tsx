import { useState, useMemo, useEffect } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  price?: string;
}

interface SpinningTacticalMenuProps {
  menuData: {
    root: MenuItem[];
    [key: string]: MenuItem[];
  };
  onSelectItem?: (itemId: string, path: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Fonction pour convertir un angle en coordonnées
const angleToCoords = (angle: number, radius: number, centerX: number, centerY: number) => {
  const rad = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(rad),
    y: centerY + radius * Math.sin(rad),
  };
};

// Fonction pour créer un path SVG pour un segment d'arc
const createArcPath = (
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
    `M ${startInner.x} ${startInner.y}`,
    `L ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ');
};

export const SpinningTacticalMenu = ({
  menuData,
  onSelectItem,
  isOpen,
  onClose,
}: SpinningTacticalMenuProps) => {
  const [currentLevel, setCurrentLevel] = useState<string>('root');
  const [navigationPath, setNavigationPath] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Constantes pour les dimensions
  const innerRadius = 120;
  const outerRadius = 280;
  const centerX = 0; // Ancré à gauche
  
  // Calculer centerY de manière adaptative pour mobile
  const [centerY, setCenterY] = useState(400);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateCenterY = () => {
        setCenterY(window.innerHeight / 2);
      };
      updateCenterY();
      window.addEventListener('resize', updateCenterY);
      return () => window.removeEventListener('resize', updateCenterY);
    }
  }, []);
  
  const svgSize = outerRadius * 2;
  
  // Calculer la largeur du conteneur pour mobile
  const containerWidth = useMemo(() => {
    if (typeof window !== 'undefined') {
      // Utiliser au minimum outerRadius * 2 pour voir le cercle, mais pas plus de 60% de l'écran
      return Math.min(outerRadius * 2, window.innerWidth * 0.6);
    }
    return outerRadius * 2;
  }, [outerRadius]);

  // Obtenir les items du niveau actuel
  const currentItems = useMemo(() => {
    return menuData[currentLevel] || menuData.root;
  }, [currentLevel, menuData]);

  // Calculer les segments pour les items actuels
  const segments = useMemo(() => {
    const anglePerSegment = 360 / currentItems.length;
    return currentItems.map((item, index) => {
      const startAngle = index * anglePerSegment - 90; // -90 pour commencer en haut
      const endAngle = (index + 1) * anglePerSegment - 90;
      const midAngle = (startAngle + endAngle) / 2;

      return {
        item,
        index,
        startAngle,
        endAngle,
        midAngle,
      };
    });
  }, [currentItems]);

  // Motion value pour la rotation avec inertie
  const rotation = useMotionValue(0);
  const springRotation = useSpring(rotation, {
    damping: 30,
    stiffness: 300,
    mass: 0.5,
  });

  // Gérer le drag pour la rotation
  const [isDragging, setIsDragging] = useState(false);
  const [lastY, setLastY] = useState(0);
  const [startRotation, setStartRotation] = useState(0);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    // Ne pas appeler preventDefault sur les événements React (peuvent être passifs)
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setLastY(clientY);
    setStartRotation(rotation.get());
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    // Pour les événements touch, preventDefault peut être nécessaire
    if ('touches' in e) {
      e.preventDefault();
    }
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - lastY;
    // Conversion du mouvement vertical en rotation (plus le deltaY est grand, plus on tourne)
    const rotationDelta = (deltaY / outerRadius) * (180 / Math.PI);
    rotation.set(startRotation + rotationDelta);
    setLastY(clientY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // L'inertie est gérée automatiquement par useSpring
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - lastY;
      const rotationDelta = (deltaY / outerRadius) * (180 / Math.PI);
      rotation.set(startRotation + rotationDelta);
      setLastY(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // preventDefault est maintenant possible car l'event listener est non-passif
      e.preventDefault();
      e.stopPropagation();
      if (e.touches.length > 0) {
        const deltaY = e.touches[0].clientY - lastY;
        const rotationDelta = (deltaY / outerRadius) * (180 / Math.PI);
        rotation.set(startRotation + rotationDelta);
        setLastY(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    const handleTouchCancel = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isDragging, lastY, outerRadius, rotation, startRotation]);

  // Gérer la navigation vers un sous-niveau
  const handleItemClick = (itemId: string) => {
    if (menuData[itemId] && menuData[itemId].length > 0) {
      // Il y a un sous-menu
      setNavigationPath([...navigationPath, currentLevel]);
      setCurrentLevel(itemId);
      rotation.set(0); // Réinitialiser la rotation pour le nouveau niveau
    } else {
      // C'est un item final
      if (onSelectItem) {
        onSelectItem(itemId, [...navigationPath, currentLevel]);
      }
      onClose();
    }
  };

  // Gérer le retour au niveau précédent
  const handleBack = () => {
    if (navigationPath.length > 0) {
      const previousLevel = navigationPath[navigationPath.length - 1];
      setNavigationPath(navigationPath.slice(0, -1));
      setCurrentLevel(previousLevel);
      rotation.set(0); // Réinitialiser la rotation
    }
    // Ne pas fermer le menu au niveau root - l'utilisateur doit cliquer sur l'overlay pour fermer
  };

  // Gérer la fermeture avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (navigationPath.length > 0) {
          handleBack();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, navigationPath.length]);

  if (!isOpen) return null;

  // Calculer le titre du niveau actuel
  const currentLevelTitle = useMemo(() => {
    if (navigationPath.length === 0) return 'MENU';
    // Trouver le label du niveau actuel depuis root
    const findLabel = (level: string, path: string[]): string => {
      if (path.length === 0) {
        const item = menuData.root.find((item) => item.id === level);
        return item?.label || level;
      }
      const parentLevel = path[path.length - 1];
      const parentItems = menuData[parentLevel] || menuData.root;
      const item = parentItems.find((item) => item.id === level);
      return item?.label || level;
    };
    return findLabel(currentLevel, navigationPath);
  }, [currentLevel, navigationPath, menuData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none"
        >
          {/* Overlay sombre */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />

          {/* Conteneur du menu (masque la moitié gauche) */}
          <div 
            className="absolute left-0 top-0 bottom-0 overflow-hidden pointer-events-auto"
            style={{ width: `${containerWidth}px` }}
          >
            <motion.div
              className="relative h-full"
              initial={{ x: -outerRadius }}
              animate={{ x: 0 }}
              exit={{ x: -outerRadius }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* SVG avec le cercle complet */}
              <svg
                width={svgSize}
                height={svgSize}
                viewBox={`${-outerRadius} ${centerY - outerRadius} ${svgSize} ${svgSize}`}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: -outerRadius,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                } as React.CSSProperties}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onTouchCancel={handleDragEnd}
              >
                {/* Groupe rotatif avec tous les segments */}
                <motion.g
                  style={{
                    transformOrigin: `${centerX}px ${centerY}px`,
                    rotate: springRotation,
                  }}
                >
                  {/* Segments */}
                  {segments.map((segment) => {
                    const isHovered = hoveredItem === segment.item.id;
                    const path = createArcPath(
                      segment.startAngle,
                      segment.endAngle,
                      innerRadius,
                      outerRadius,
                      centerX,
                      centerY
                    );

                    // Position du label (au milieu du segment)
                    const labelRadius = (innerRadius + outerRadius) / 2;
                    const labelPos = angleToCoords(segment.midAngle, labelRadius, centerX, centerY);

                    return (
                      <g key={segment.item.id}>
                        <motion.path
                          d={path}
                          fill={isHovered ? 'rgba(230, 166, 0, 0.3)' : 'rgba(0, 0, 0, 0.85)'}
                          stroke={isHovered ? '#E6A600' : 'rgba(255, 255, 255, 0.2)'}
                          strokeWidth={isHovered ? '2' : '1'}
                          className="cursor-pointer"
                          onClick={() => handleItemClick(segment.item.id)}
                          onMouseEnter={() => setHoveredItem(segment.item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          whileHover={{ opacity: 0.9 }}
                          whileTap={{ scale: 0.98 }}
                        />
                        {/* Label avec compensation de rotation */}
                        <g
                          transform={`translate(${labelPos.x}, ${labelPos.y}) rotate(${segment.midAngle + 90})`}
                          onClick={() => handleItemClick(segment.item.id)}
                          onMouseEnter={() => setHoveredItem(segment.item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="cursor-pointer"
                        >
                          {segment.item.icon && (
                            <text
                              x="0"
                              y="-10"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="24"
                              className="select-none pointer-events-none"
                            >
                              {segment.item.icon}
                            </text>
                          )}
                          <text
                            x="0"
                            y="10"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={isHovered ? '#E6A600' : 'white'}
                            fontSize="12"
                            fontWeight="bold"
                            className="select-none pointer-events-none"
                          >
                            {segment.item.label}
                          </text>
                          {segment.item.price && (
                            <text
                              x="0"
                              y="24"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="rgba(255, 255, 255, 0.7)"
                              fontSize="10"
                              className="select-none pointer-events-none"
                            >
                              {segment.item.price}
                            </text>
                          )}
                        </g>
                      </g>
                    );
                  })}
                </motion.g>

                {/* Bouton central fixe (demi-lune) - positionné après le groupe rotatif */}
                <g>
                  {/* Cercle central avec masque pour demi-lune (seulement la partie droite visible) */}
                  <defs>
                    <clipPath id="halfCircleClip">
                      <rect x={centerX} y={centerY - innerRadius} width={innerRadius} height={innerRadius * 2} />
                    </clipPath>
                  </defs>
                  <motion.circle
                    cx={centerX}
                    cy={centerY}
                    r={innerRadius}
                    fill="rgba(0, 0, 0, 0.9)"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="2"
                    clipPath="url(#halfCircleClip)"
                    className="cursor-pointer"
                    onClick={handleBack}
                    whileHover={{ fill: 'rgba(0, 0, 0, 0.95)', stroke: 'rgba(230, 166, 0, 0.6)' }}
                    whileTap={{ scale: 0.95 }}
                  />
                  <text
                    x={centerX + innerRadius / 2}
                    y={centerY - 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    {navigationPath.length > 0 ? 'RETOUR' : currentLevelTitle}
                  </text>
                  {navigationPath.length > 0 && (
                    <text
                      x={centerX + innerRadius / 2}
                      y={centerY + 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255, 255, 255, 0.6)"
                      fontSize="10"
                      className="select-none pointer-events-none"
                    >
                      {currentLevelTitle}
                    </text>
                  )}
                </g>
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
