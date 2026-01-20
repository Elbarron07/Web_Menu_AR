import { useState, useMemo, useEffect, useRef } from 'react';
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

// Fonction pour obtenir les couleurs par catégorie
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, { fill: string; stroke: string; glow: string; hoverFill: string }> = {
    'Pizza': { fill: 'rgba(255, 107, 53, 0.4)', stroke: '#FF6B35', glow: 'rgba(255, 107, 53, 0.6)', hoverFill: 'rgba(255, 107, 53, 0.6)' },
    'Hamburger': { fill: 'rgba(139, 69, 19, 0.4)', stroke: '#8B4513', glow: 'rgba(212, 165, 116, 0.6)', hoverFill: 'rgba(212, 165, 116, 0.6)' },
    'Chawarma': { fill: 'rgba(255, 165, 0, 0.4)', stroke: '#FFA500', glow: 'rgba(255, 140, 0, 0.6)', hoverFill: 'rgba(255, 140, 0, 0.6)' },
    'Tacos': { fill: 'rgba(50, 205, 50, 0.4)', stroke: '#32CD32', glow: 'rgba(255, 215, 0, 0.6)', hoverFill: 'rgba(255, 215, 0, 0.6)' },
    'Sushi': { fill: 'rgba(65, 105, 225, 0.4)', stroke: '#4169E1', glow: 'rgba(32, 178, 170, 0.6)', hoverFill: 'rgba(32, 178, 170, 0.6)' },
    'Pâtes': { fill: 'rgba(255, 248, 220, 0.4)', stroke: '#DC143C', glow: 'rgba(220, 20, 60, 0.6)', hoverFill: 'rgba(220, 20, 60, 0.6)' },
    'Salade': { fill: 'rgba(144, 238, 144, 0.4)', stroke: '#90EE90', glow: 'rgba(152, 251, 152, 0.6)', hoverFill: 'rgba(152, 251, 152, 0.6)' },
    'Desserts': { fill: 'rgba(255, 105, 180, 0.4)', stroke: '#FF69B4', glow: 'rgba(218, 112, 214, 0.6)', hoverFill: 'rgba(218, 112, 214, 0.6)' },
    'Boissons': { fill: 'rgba(135, 206, 235, 0.4)', stroke: '#87CEEB', glow: 'rgba(0, 206, 209, 0.6)', hoverFill: 'rgba(0, 206, 209, 0.6)' },
    'Plats': { fill: 'rgba(255, 140, 0, 0.4)', stroke: '#FF8C00', glow: 'rgba(255, 215, 0, 0.6)', hoverFill: 'rgba(255, 215, 0, 0.6)' },
  };
  return colorMap[category] || { fill: 'rgba(0, 0, 0, 0.85)', stroke: 'rgba(255, 255, 255, 0.2)', glow: 'rgba(255, 255, 255, 0.3)', hoverFill: 'rgba(230, 166, 0, 0.3)' };
};

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
  
  // Obtenir la catégorie de l'item actuel pour les couleurs
  const getItemCategory = (itemId: string): string => {
    // Pour le niveau root, utiliser le label comme catégorie
    if (currentLevel === 'root') {
      return menuData.root.find(item => item.id === itemId)?.label || 'Plats';
    }
    // Pour les sous-niveaux, utiliser le nom de la catégorie parente
    return currentLevel;
  };

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
      // Sur mobile, utiliser au moins outerRadius * 2 pour voir le cercle complet
      // Mais limiter à 80% de l'écran pour laisser de l'espace
      const screenWidth = window.innerWidth;
      const minWidth = outerRadius * 2; // 560px minimum pour voir le cercle complet
      const maxWidth = screenWidth * 0.8; // Maximum 80% de l'écran
      // Utiliser le minimum entre minWidth et maxWidth pour garantir la visibilité
      // Si l'écran est petit, maxWidth sera utilisé, sinon minWidth
      return Math.min(minWidth, maxWidth);
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
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    // Vérifier si le clic est sur un élément interactif (segment ou bouton central)
    const target = e.target as HTMLElement;
    if (target.closest('path') || target.closest('circle') || target.closest('text')) {
      // Ne pas démarrer le drag si c'est un clic sur un élément interactif
      return;
    }
    
    setIsDragging(true);
    setLastY(clientY);
    setStartRotation(rotation.get());
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStartRef.current) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    // Si le drag n'a pas encore démarré, vérifier si c'est un mouvement suffisant
    if (!isDragging && dragStartRef.current) {
      const dx = Math.abs(clientX - dragStartRef.current.x);
      const dy = Math.abs(clientY - dragStartRef.current.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Si le mouvement est suffisant (seuil de 10px), démarrer le drag
      if (distance > 10) {
        setIsDragging(true);
        setLastY(clientY);
        setStartRotation(rotation.get());
      } else {
        return; // Pas assez de mouvement, ne pas faire de rotation
      }
    }
    
    if (!isDragging) return;
    
    e.stopPropagation();
    const deltaY = clientY - lastY;
    // Conversion du mouvement vertical en rotation (plus le deltaY est grand, plus on tourne)
    const rotationDelta = (deltaY / outerRadius) * (180 / Math.PI);
    rotation.set(startRotation + rotationDelta);
    setLastY(clientY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
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
      if (!isDragging || !dragStartRef.current) return;
      // preventDefault est maintenant possible car l'event listener est non-passif
      e.preventDefault();
      e.stopPropagation();
      if (e.touches.length > 0) {
        const deltaY = e.touches[0].clientY - lastY;
        // Seuil minimum pour éviter les micro-mouvements
        if (Math.abs(deltaY) > 2) {
          const rotationDelta = (deltaY / outerRadius) * (180 / Math.PI);
          rotation.set(startRotation + rotationDelta);
          setLastY(e.touches[0].clientY);
        }
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
          {/* Overlay avec dégradé chaleureux */}
          <div
            className="absolute inset-0 pointer-events-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.4) 0%, rgba(255, 165, 0, 0.4) 50%, rgba(255, 215, 0, 0.3) 100%)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
          />

          {/* Conteneur du menu (masque la moitié gauche) */}
          <div 
            className="absolute left-0 top-0 bottom-0 overflow-hidden pointer-events-auto"
            style={{ width: `${containerWidth}px` }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <motion.div
              className="relative h-full"
              initial={{ x: -outerRadius, scale: 0.8, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={{ x: -outerRadius, scale: 0.8, opacity: 0 }}
              transition={{ 
                type: 'spring', 
                damping: 20, 
                stiffness: 300,
                opacity: { duration: 0.3 }
              }}
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
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleDragStart(e);
                }}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  handleDragStart(e);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  handleDragEnd();
                }}
                onTouchCancel={(e) => {
                  e.stopPropagation();
                  handleDragEnd();
                }}
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
                    
                    // Obtenir les couleurs selon la catégorie
                    const category = getItemCategory(segment.item.id);
                    const colors = getCategoryColor(category);

                    return (
                      <g key={segment.item.id}>
                        {/* Effet de glow pour le segment survolé */}
                        {isHovered && (
                          <motion.path
                            d={path}
                            fill="none"
                            stroke={colors.glow}
                            strokeWidth="8"
                            opacity={0.5}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            style={{ filter: 'blur(8px)' }}
                          />
                        )}
                        <motion.path
                          d={path}
                          fill={isHovered ? colors.hoverFill : colors.fill}
                          stroke={isHovered ? colors.stroke : colors.stroke}
                          strokeWidth={isHovered ? '3' : '2'}
                          className="cursor-pointer transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(segment.item.id);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseEnter={() => setHoveredItem(segment.item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          whileHover={{ scale: 1.05, opacity: 1 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        />
                        {/* Label avec compensation de rotation */}
                        <g
                          transform={`translate(${labelPos.x}, ${labelPos.y}) rotate(${segment.midAngle + 90})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(segment.item.id);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseEnter={() => setHoveredItem(segment.item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="cursor-pointer"
                        >
                          {segment.item.icon && (
                            <motion.text
                              x="0"
                              y="-15"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="36"
                              className="select-none pointer-events-none"
                              style={{ 
                                fontFamily: 'Fredoka One, cursive',
                                filter: isHovered ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                              }}
                              animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                              {segment.item.icon}
                            </motion.text>
                          )}
                          <motion.text
                            x="0"
                            y="12"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={isHovered ? colors.stroke : 'white'}
                            fontSize="14"
                            fontWeight="bold"
                            className="select-none pointer-events-none"
                            style={{ 
                              fontFamily: 'Comfortaa, sans-serif',
                              textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                            }}
                            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          >
                            {segment.item.label}
                          </motion.text>
                          {segment.item.price && (
                            <text
                              x="0"
                              y="28"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="rgba(255, 255, 255, 0.9)"
                              fontSize="11"
                              fontWeight="600"
                              className="select-none pointer-events-none"
                              style={{ 
                                fontFamily: 'Comfortaa, sans-serif',
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                              }}
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
                    fill="rgba(0, 0, 0, 0.85)"
                    stroke="rgba(255, 215, 0, 0.5)"
                    strokeWidth="3"
                    clipPath="url(#halfCircleClip)"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBack();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    whileHover={{ 
                      fill: 'rgba(255, 140, 0, 0.2)', 
                      stroke: 'rgba(255, 215, 0, 0.8)',
                      scale: 1.05
                    }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      stroke: navigationPath.length > 0 ? 'rgba(255, 107, 53, 0.6)' : 'rgba(255, 215, 0, 0.5)'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                  {/* Effet de pulse sur le bouton central */}
                  <motion.circle
                    cx={centerX}
                    cy={centerY}
                    r={innerRadius}
                    fill="none"
                    stroke="rgba(255, 215, 0, 0.3)"
                    strokeWidth="2"
                    clipPath="url(#halfCircleClip)"
                    className="pointer-events-none"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  <text
                    x={centerX + innerRadius / 2}
                    y={centerY - 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="16"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                    style={{ 
                      fontFamily: 'Fredoka One, cursive',
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {navigationPath.length > 0 ? '← RETOUR' : '🍽️ MENU'}
                  </text>
                  {navigationPath.length > 0 && (
                    <text
                      x={centerX + innerRadius / 2}
                      y={centerY + 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255, 255, 255, 0.8)"
                      fontSize="11"
                      className="select-none pointer-events-none"
                      style={{ 
                        fontFamily: 'Comfortaa, sans-serif',
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {currentLevelTitle}
                    </text>
                  )}
                  {navigationPath.length === 0 && (
                    <text
                      x={centerX + innerRadius / 2}
                      y={centerY + 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255, 215, 0, 0.9)"
                      fontSize="10"
                      className="select-none pointer-events-none"
                      style={{ 
                        fontFamily: 'Comfortaa, sans-serif',
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      Bienvenue !
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
