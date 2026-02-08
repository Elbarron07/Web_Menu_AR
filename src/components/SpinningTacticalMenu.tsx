import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  price?: string;
}

export interface CategoryStyles {
  strokeRgba: string;
  glowRgba: string;
}

interface SpinningTacticalMenuProps {
  menuData: {
    root: MenuItem[];
    [key: string]: MenuItem[];
  };
  categoryStyles?: Record<string, CategoryStyles>;
  onSelectItem?: (itemId: string, path: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

const DEFAULT_COLORS = {
  fill: 'rgba(255, 255, 255, 0.7)',
  stroke: 'rgba(37, 99, 235, 0.3)',
  glow: 'rgba(37, 99, 235, 0.6)',
  hoverFill: 'rgba(37, 99, 235, 0.15)',
  activeFill: '#2563EB',
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

// Animation variants pour l'entrée orbitale
const orbitalVariants: Variants = {
  hidden: () => ({
    scale: 0,
    opacity: 0,
    rotate: -90,
    x: 0,
    y: 0,
  }),
  visible: (index: number) => ({
    scale: 1,
    opacity: 1,
    rotate: 0,
    x: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      delay: index * 0.08, // Staggered delay (80ms per item)
    },
  }),
};

// Variants pour les icônes avec effet orbital
const iconVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: -180,
  },
  visible: (index: number) => ({
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
      delay: index * 0.08 + 0.2, // Delay après les segments
    },
  }),
};

export const SpinningTacticalMenu = ({
  menuData,
  onSelectItem,
  isOpen,
  onClose,
  categoryStyles = {},
  initialCategory,
}: SpinningTacticalMenuProps) => {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState<string>(initialCategory && menuData[initialCategory] ? initialCategory : 'root');
  const [navigationPath, setNavigationPath] = useState<string[]>(initialCategory && menuData[initialCategory] ? ['root'] : []);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<{ x: number; y: number } | null>(null);

  // Synchroniser le niveau quand initialCategory change (navigation entre routes)
  useEffect(() => {
    if (initialCategory && menuData[initialCategory]) {
      setCurrentLevel(initialCategory);
      setNavigationPath(['root']);
    } else {
      setCurrentLevel('root');
      setNavigationPath([]);
    }
  }, [initialCategory, menuData]);

  const getColors = (category: string) => {
    const s = categoryStyles[category];
    if (s) return { ...DEFAULT_COLORS, stroke: s.strokeRgba, glow: s.glowRgba };
    return DEFAULT_COLORS;
  };

  // Obtenir la catégorie de l'item actuel pour les couleurs
  // Pour les sous-menus, hériter la catégorie du menu principal
  const getItemCategory = (itemId: string): string => {
    if (currentLevel === 'root') {
      return menuData.root.find(item => item.id === itemId)?.label || 'Plats';
    }
    // Pour les sous-menus, retourner la catégorie du parent (premier élément du navigationPath)
    if (navigationPath.length > 0) {
      const parentLevel = navigationPath[0];
      const parentItem = menuData.root.find(item => item.id === parentLevel);
      return parentItem?.label || currentLevel;
    }
    // Fallback : utiliser le currentLevel si pas de navigationPath
    return currentLevel;
  };

  // Constantes pour les dimensions
  const innerRadius = 120;
  const outerRadius = 280;
  const centerX = 0;
  
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

  // Obtenir les items du niveau actuel
  const currentItems = useMemo(() => {
    return menuData[currentLevel] || menuData.root;
  }, [currentLevel, menuData]);

  // Calculer les segments pour les items actuels
  const segments = useMemo(() => {
    const anglePerSegment = 360 / currentItems.length;
    return currentItems.map((item, index) => {
      const startAngle = index * anglePerSegment - 90;
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
    damping: 20, // Réduit pour plus d'inertie et de fluidité
    stiffness: 320, // Augmenté pour une réponse plus rapide
    mass: 0.35, // Réduit pour une réponse plus rapide
  });
  
  // Transform SVG pour la rotation autour du centre
  // Utiliser un state pour stocker le transform qui se met à jour dynamiquement
  const [svgTransformValue, setSvgTransformValue] = useState('');
  
  // Mettre à jour le transform quand springRotation ou centerY change
  useEffect(() => {
    const updateTransform = () => {
      const currentCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : centerY;
      const rotationValue = springRotation.get();
      setSvgTransformValue(`rotate(${rotationValue}, ${centerX}, ${currentCenterY})`);
    };
    
    // Initialiser avec la valeur actuelle
    updateTransform();
    
    // Écouter les changements de springRotation
    const unsubscribe = springRotation.on('change', updateTransform);
    
    return () => unsubscribe();
  }, [springRotation, centerY]);

  // Gérer le drag pour la rotation
  const [isDragging, setIsDragging] = useState(false);
  const [startRotation, setStartRotation] = useState(0);
  const dragStartRef = useRef<{ x: number; y: number; time: number; startAngle?: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    const target = e.target as HTMLElement;
    if (target.closest('path') || target.closest('circle') || target.closest('text')) {
      return;
    }
    
    // Obtenir les coordonnées du centre de la roue à l'écran
    // Le conteneur de drag est positionné avec left: '2px', top: '50%', transform: 'translate(-50%, -50%)'
    // Donc le centre réel est à 2px du bord gauche et au milieu vertical
    const centerXScreen = 2; // 2px du bord gauche (après transform -50%)
    const centerYScreen = window.innerHeight / 2; // Milieu vertical de l'écran
    centerRef.current = { x: centerXScreen, y: centerYScreen };
    
    // Calculer l'angle initial avec Math.atan2
    const startAngle = Math.atan2(
      clientY - centerRef.current.y,
      clientX - centerRef.current.x
    );
    
    setIsDragging(true); // Démarrer le drag immédiatement
    setStartRotation(rotation.get());
    dragStartRef.current = { 
      x: clientX, 
      y: clientY, 
      time: Date.now(),
      startAngle: startAngle
    };
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStartRef.current || !centerRef.current || !isDragging) return;
    
    e.stopPropagation();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    // Calculer l'angle actuel avec Math.atan2
    const currentAngle = Math.atan2(
      clientY - centerRef.current.y,
      clientX - centerRef.current.x
    );
    
    // Calculer la différence d'angle
    const startAngle = dragStartRef.current.startAngle ?? currentAngle;
    let angleDelta = currentAngle - startAngle;
    
    // Normaliser l'angle pour gérer le passage par -π/π
    if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
    if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;
    
    // Convertir en degrés et appliquer un facteur de sensibilité
    const sensitivity = 1.3; // Facteur de sensibilité ajustable
    const rotationDelta = angleDelta * (180 / Math.PI) * sensitivity;
    
    // Appliquer la rotation
    rotation.set(startRotation + rotationDelta);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  useEffect(() => {
    if (!isDragging || !dragStartRef.current || !centerRef.current) return;

    const sensitivity = 1.3; // Facteur de sensibilité ajustable

    const handleMouseMove = (e: MouseEvent) => {
      // Calculer l'angle actuel avec Math.atan2
      const currentAngle = Math.atan2(
        e.clientY - centerRef.current!.y,
        e.clientX - centerRef.current!.x
      );
      
      // Calculer la différence d'angle
      const startAngle = dragStartRef.current!.startAngle ?? currentAngle;
      let angleDelta = currentAngle - startAngle;
      
      // Normaliser l'angle pour gérer le passage par -π/π
      if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
      if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;
      
      // Convertir en degrés et appliquer le facteur de sensibilité
      const rotationDelta = angleDelta * (180 / Math.PI) * sensitivity;
      
      // Appliquer la rotation
      rotation.set(startRotation + rotationDelta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragStartRef.current || !centerRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        
        // Calculer l'angle actuel avec Math.atan2
        const currentAngle = Math.atan2(
          touch.clientY - centerRef.current.y,
          touch.clientX - centerRef.current.x
        );
        
        // Calculer la différence d'angle
        const startAngle = dragStartRef.current.startAngle ?? currentAngle;
        let angleDelta = currentAngle - startAngle;
        
        // Normaliser l'angle pour gérer le passage par -π/π
        if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
        if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;
        
        // Convertir en degrés et appliquer le facteur de sensibilité
        const rotationDelta = angleDelta * (180 / Math.PI) * sensitivity;
        
        // Appliquer la rotation
        rotation.set(startRotation + rotationDelta);
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
  }, [isDragging, rotation, startRotation]);

  // Parallax effect avec deviceorientation
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        // Limiter les offsets à ±20px pour éviter la désorientation
        const maxOffset = 20;
        const betaNormalized = Math.max(-45, Math.min(45, e.beta || 0)) / 45;
        const gammaNormalized = Math.max(-45, Math.min(45, e.gamma || 0)) / 45;
        
        setParallaxOffset({
          x: gammaNormalized * maxOffset,
          y: betaNormalized * maxOffset,
        });
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      // Demander la permission sur iOS 13+
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(() => {
            // Fallback silencieux si la permission est refusée
          });
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }

      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, [isOpen]);

  // Gérer la navigation vers un sous-niveau avec ripple effect
  const handleItemClick = (itemId: string, e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isTouchEvent = 'touches' in e;
    const x = isTouchEvent ? (e.touches[0]?.clientX ?? 0) : (e as React.MouseEvent).clientX;
    const y = isTouchEvent ? (e.touches[0]?.clientY ?? 0) : (e as React.MouseEvent).clientY;
    
    setRipplePosition({ x: x - rect.left, y: y - rect.top });
    setSelectedItem(itemId);
    
    // Animation visuelle (peut continuer en arrière-plan)
    setTimeout(() => {
      setRipplePosition(null);
      setSelectedItem(null);
    }, 600);

    // Navigation immédiate via react-router
    if (menuData[itemId] && menuData[itemId].length > 0) {
      // Categorie avec enfants → naviguer vers la route sous-menu
      navigate(`/menu/${itemId}`);
    } else {
      // Item final → appeler onSelectItem (navigation vers /ar/:id)
      if (onSelectItem) {
        onSelectItem(itemId, [...navigationPath, currentLevel]);
      }
      onClose();
    }
  };

  // Gérer le retour au niveau précédent via react-router
  const handleBack = () => {
    if (navigationPath.length > 0) {
      navigate(-1);
    }
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

  // Plus besoin de pushState : react-router gere l'historique via les routes

  // Plus besoin de popstate : react-router gere le retour arriere via les routes

  if (!isOpen) return null;

  // Calculer le titre du niveau actuel
  const currentLevelTitle = useMemo(() => {
    if (navigationPath.length === 0) return 'MENU';
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
          {/* Overlay avec glassmorphism premium - Version claire */}
          <div
            className="absolute inset-0 pointer-events-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.03) 50%, rgba(147, 197, 253, 0.02) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            onClick={onClose}
          />

          {/* Conteneur du menu avec parallax - permet au menu d'être coupé aux bords */}
          <div 
            ref={containerRef}
            className="absolute left-0 top-0 bottom-0 overflow-hidden pointer-events-auto parallax-container"
            style={{ 
              width: '100vw',
              transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
            }}
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
                damping: 22, 
                stiffness: 320,
                mass: 0.35,
                opacity: { duration: 0.3 }
              }}
            >
              {/* Conteneur invisible élargi pour la zone de drag (200% de la taille du SVG) */}
              <div
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: '2px',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${svgSize * 2}px`,
                  height: `${svgSize * 2}px`,
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                  pointerEvents: 'auto',
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
                {/* SVG avec le cercle complet - centré dans le conteneur invisible */}
                <svg
                  width={svgSize}
                  height={svgSize}
                  viewBox={`${-outerRadius} ${centerY - outerRadius} ${svgSize} ${svgSize}`}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  } as React.CSSProperties}
                >
                {/* Groupe rotatif avec tous les segments */}
                <g
                  transform={svgTransformValue}
                >
                  {/* Segments avec animations orbitales */}
                  {segments.map((segment) => {
                    const isHovered = hoveredItem === segment.item.id;
                    const isSelected = selectedItem === segment.item.id;
                    const path = createArcPath(
                      segment.startAngle,
                      segment.endAngle,
                      innerRadius,
                      outerRadius,
                      centerX,
                      centerY
                    );

                    const labelRadius = (innerRadius + outerRadius) / 2;
                    const labelPos = angleToCoords(segment.midAngle, labelRadius, centerX, centerY);
                    
                    const category = getItemCategory(segment.item.id);
                    const colors = getColors(category);

                    return (
                      <motion.g 
                        key={segment.item.id}
                        custom={segment.index}
                        variants={orbitalVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {/* Effet de glow externe avec breathing animation */}
                        {isHovered && (
                          <motion.path
                            d={path}
                            fill="none"
                            stroke={colors.glow}
                            strokeWidth="12"
                            opacity={0.6}
                            initial={{ opacity: 0 }}
                            animate={{ 
                              opacity: [0.4, 0.8, 0.4],
                              filter: ['blur(8px)', 'blur(12px)', 'blur(8px)'],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                            style={{ filter: 'blur(10px)' }}
                          />
                        )}
                        
                        {/* Segment principal avec glassmorphism blanc */}
                        <motion.path
                          d={path}
                          fill={isSelected ? colors.activeFill : (isHovered ? colors.hoverFill : colors.fill)}
                          stroke={isSelected ? '#2563EB' : colors.stroke}
                          strokeWidth={isHovered || isSelected ? '2.5' : '1.5'}
                          className="cursor-pointer transition-all"
                          style={{
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            filter: isSelected ? 'drop-shadow(0 0 20px rgba(37, 99, 235, 0.4))' : (isHovered ? 'drop-shadow(0 0 8px ' + colors.glow + ')' : 'none'),
                            pointerEvents: 'auto',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Vérifier que ce n'est pas un drag avant de cliquer
                            if (!isDragging) {
                              handleItemClick(segment.item.id, e);
                            }
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            // Initialiser le dragStartRef pour le touch
                            const clientY = e.touches[0]?.clientY ?? 0;
                            const clientX = e.touches[0]?.clientX ?? 0;
                            dragStartRef.current = { x: clientX, y: clientY, time: Date.now() };
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation();
                            // Si c'est un clic rapide (< 200ms et pas de drag), déclencher la navigation
                            if (dragStartRef.current && Date.now() - dragStartRef.current.time < 200 && !isDragging) {
                              handleItemClick(segment.item.id, e);
                            }
                            setIsDragging(false);
                            dragStartRef.current = null;
                          }}
                          onMouseEnter={() => setHoveredItem(segment.item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          whileHover={{ 
                            scale: 1.05,
                            transition: { type: 'spring', stiffness: 400, damping: 20 }
                          }}
                          whileTap={{ 
                            scale: 0.95,
                            transition: { type: 'spring', stiffness: 600, damping: 30 }
                          }}
                          animate={isSelected ? { 
                            scale: 1.1,
                            filter: 'drop-shadow(0 0 20px rgba(37, 99, 235, 0.4))',
                          } : {}}
                          transition={{ type: 'spring', stiffness: 400, damping: 25, duration: 0.3 }}
                        />
                        
                        {/* Ripple effect */}
                        {ripplePosition && isSelected && (
                          <motion.circle
                            cx={labelPos.x}
                            cy={labelPos.y}
                            r={0}
                            fill="rgba(255, 255, 255, 0.5)"
                            initial={{ r: 0, opacity: 0.8 }}
                            animate={{ r: outerRadius, opacity: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{ pointerEvents: 'none' }}
                          />
                        )}
                        
                        {/* Label avec compensation de rotation */}
                        <g
                          transform={`translate(${labelPos.x}, ${labelPos.y}) rotate(${segment.midAngle + 90})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(segment.item.id, e);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseEnter={() => setHoveredItem(segment.item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="cursor-pointer"
                          style={{ pointerEvents: 'auto' }}
                        >
                          {segment.item.icon && (
                            <motion.text
                              x="0"
                              y="-15"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={isSelected ? "white" : (isHovered ? colors.stroke : "#1F2937")}
                              fontSize="36"
                              className="select-none pointer-events-none"
                              custom={segment.index}
                              variants={iconVariants}
                              initial="hidden"
                              animate="visible"
                              style={{ 
                                fontFamily: 'Inter, sans-serif',
                                filter: isSelected ? 'drop-shadow(0 0 12px rgba(255,255,255,0.9))' : (isHovered ? 'drop-shadow(0 0 8px ' + colors.glow + ')' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'),
                              }}
                            >
                              {segment.item.icon}
                            </motion.text>
                          )}
                          <motion.text
                            x="0"
                            y="12"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={isSelected ? "white" : (isHovered ? colors.stroke : "#1F2937")}
                            fontSize="14"
                            fontWeight="600"
                            className="select-none pointer-events-none"
                            style={{ 
                              fontFamily: 'Inter, sans-serif',
                              textShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20, duration: 0.25 }}
                          >
                            {segment.item.label}
                          </motion.text>
                          {segment.item.price && (
                            <motion.text
                              x="0"
                              y="28"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={isSelected ? "rgba(255, 255, 255, 0.95)" : "#6B7280"}
                              fontSize="11"
                              fontWeight="600"
                              className="select-none pointer-events-none"
                              style={{ 
                                fontFamily: 'Inter, sans-serif',
                                textShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                              }}
                              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20, duration: 0.25 }}
                            >
                              {segment.item.price}
                            </motion.text>
                          )}
                        </g>
                      </motion.g>
                    );
                  })}
                </g>

                {/* Bouton central fixe avec glassmorphism premium */}
                <g>
                  <defs>
                    <clipPath id="halfCircleClip">
                      <rect x={centerX} y={centerY - innerRadius} width={innerRadius} height={innerRadius * 2} />
                    </clipPath>
                  </defs>
                  <motion.circle
                    cx={centerX}
                    cy={centerY}
                    r={innerRadius}
                    fill={navigationPath.length > 0 ? "rgba(37, 99, 235, 0.9)" : "rgba(255, 255, 255, 0.8)"}
                    stroke={navigationPath.length > 0 ? "#2563EB" : "rgba(37, 99, 235, 0.3)"}
                    strokeWidth="2"
                    clipPath="url(#halfCircleClip)"
                    className="cursor-pointer"
                    style={{
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      pointerEvents: 'auto',
                      boxShadow: navigationPath.length > 0 ? '0 0 20px rgba(37, 99, 235, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigationPath.length > 0) {
                        handleBack();
                      }
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    whileHover={{ 
                      fill: navigationPath.length > 0 ? 'rgba(37, 99, 235, 1)' : 'rgba(255, 255, 255, 0.9)', 
                      stroke: navigationPath.length > 0 ? '#2563EB' : 'rgba(37, 99, 235, 0.5)',
                      scale: 1.05
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                  {/* Effet de pulse sur le bouton central - seulement si navigationPath */}
                  {navigationPath.length > 0 && (
                    <motion.circle
                      cx={centerX}
                      cy={centerY}
                      r={innerRadius}
                      fill="none"
                      stroke="rgba(37, 99, 235, 0.3)"
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
                  )}
                  <text
                    x={centerX + innerRadius / 2}
                    y={centerY - 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={navigationPath.length > 0 ? "white" : "#1F2937"}
                    fontSize="16"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                    style={{ 
                      fontFamily: 'Inter, sans-serif',
                      textShadow: navigationPath.length > 0 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {navigationPath.length > 0 ? '← RETOUR' : 'MENU'}
                  </text>
                  {navigationPath.length > 0 && (
                    <text
                      x={centerX + innerRadius / 2}
                      y={centerY + 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255, 255, 255, 0.9)"
                      fontSize="11"
                      className="select-none pointer-events-none"
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        textShadow: '0 1px 4px rgba(0,0,0,0.3)'
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
                      fill="#6B7280"
                      fontSize="10"
                      className="select-none pointer-events-none"
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Bienvenue !
                    </text>
                  )}
                </g>
              </svg>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
