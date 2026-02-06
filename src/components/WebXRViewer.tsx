import { useEffect, useRef, useState, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, PresentationControls } from '@react-three/drei';
import { useCameraStream } from '../hooks/useCameraStream';
import { useWebXR } from '../hooks/useWebXR';
import { PlaneDetector } from './PlaneDetector';
import { ARMenu } from './ARMenu';
import { logger } from '../lib/logger';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

interface WebXRViewerProps {
  modelPath?: string;
  selectedDishId?: number | string;
  onDishSelect?: (dishId: string | number) => void;
  hotspots?: Array<{ position: string; name: string; detail?: string }>;
  scale?: string;
  dimensions?: string; // Ex: "Diamètre 30cm", "Hauteur 15cm"
}

// Composant de contrôles AR améliorés
interface ARControlsOverlayProps {
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  currentScale: number;
  isPlaced: boolean;
  onReplace: () => void;
}

const ARControlsOverlay: React.FC<ARControlsOverlayProps> = ({
  onReset,
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  currentScale,
  isPlaced,
  onReplace
}) => {
  return (
    <motion.div
      className="webxr-controls-overlay"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {/* Instructions contextuelles */}
      <div className="webxr-instructions">
        {!isPlaced ? (
          <span>👆 Tapez sur une surface pour placer le plat</span>
        ) : (
          <span>✨ Glissez pour déplacer • Pincez pour zoomer</span>
        )}
      </div>

      {/* Barre de contrôles */}
      <div className="webxr-control-bar">
        {/* Rotation */}
        <div className="webxr-control-group">
          <button onClick={onRotateLeft} className="webxr-btn" aria-label="Tourner gauche">
            <span>↶</span>
          </button>
          <button onClick={onRotateRight} className="webxr-btn" aria-label="Tourner droite">
            <span>↷</span>
          </button>
        </div>

        {/* Zoom */}
        <div className="webxr-control-group">
          <button onClick={onZoomOut} className="webxr-btn" aria-label="Réduire">
            <span>−</span>
          </button>
          <div className="webxr-scale-display">
            {Math.round(currentScale * 100)}%
          </div>
          <button onClick={onZoomIn} className="webxr-btn" aria-label="Agrandir">
            <span>+</span>
          </button>
        </div>

        {/* Actions */}
        <div className="webxr-control-group">
          {isPlaced && (
            <button onClick={onReplace} className="webxr-btn webxr-btn-accent" aria-label="Replacer">
              <span>📍</span>
            </button>
          )}
          <button onClick={onReset} className="webxr-btn webxr-btn-warning" aria-label="Réinitialiser">
            <span>⟲</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface ModelRendererProps {
  modelPath: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  hotspots?: Array<{ position: string; name: string; detail?: string }>;
  realWorldSize?: number; // Taille réelle en mètres (ex: 0.30 pour 30cm)
}

// Composant de modèle interactif amélioré
interface InteractiveModelProps extends ModelRendererProps {
  userScale?: number;
  userRotation?: number;
  userOffset?: THREE.Vector3;
  onDrag?: (delta: THREE.Vector3) => void;
}

const InteractiveModelRenderer = ({ 
  modelPath, 
  position, 
  scale, 
  realWorldSize,
  userScale = 1,
  userRotation = 0,
  userOffset
}: InteractiveModelProps) => {
  const modelRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  
  useEffect(() => {
    logger.debug('✅ Modèle GLTF chargé avec succès:', modelPath, 'Scene:', scene);
  }, [modelPath, scene]);

  useEffect(() => {
    if (modelRef.current && scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      let finalScale = scale.clone();
      
      if (realWorldSize) {
        const horizontalSize = Math.max(size.x, size.z);
        const verticalSize = size.y;
        const isVertical = verticalSize > horizontalSize * 1.5;
        const modelDimension = isVertical ? verticalSize : horizontalSize;
        const scaleFactor = realWorldSize / modelDimension;
        finalScale.multiplyScalar(scaleFactor);
      }
      
      // Appliquer l'échelle utilisateur
      finalScale.multiplyScalar(userScale);
      
      // Position de base
      const adjustedY = position.y + (size.y / 2) * finalScale.y;
      let finalX = position.x - center.x * finalScale.x;
      let finalZ = position.z - center.z * finalScale.z;
      
      // Appliquer l'offset utilisateur (drag)
      if (userOffset) {
        finalX += userOffset.x;
        finalZ += userOffset.z;
      }
      
      modelRef.current.position.set(finalX, adjustedY, finalZ);
      modelRef.current.scale.copy(finalScale);
      modelRef.current.rotation.y = userRotation;
      
      logger.debug('📍 Modèle mis à jour:', {
        position: modelRef.current.position,
        scale: modelRef.current.scale,
        rotation: userRotation,
        userScale
      });
    }
  }, [position, scale, scene, modelPath, realWorldSize, userScale, userRotation, userOffset]);

  return (
    <primitive 
      ref={modelRef} 
      object={scene.clone()}
    />
  );
};


export const WebXRViewer = ({ 
  modelPath, 
  selectedDishId,
  onDishSelect,
  hotspots = [],
  scale = "1 1 1",
  dimensions
}: WebXRViewerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { stream, error: cameraError, startCamera, stopCamera } = useCameraStream();
  const { 
    session, 
    referenceSpace, 
    isSupported, 
    error: webXRError,
    startSession,
    endSession
  } = useWebXR();

  const [detectedPlane, setDetectedPlane] = useState<THREE.Vector3 | null>(null);
  const [showMenu, setShowMenu] = useState(!selectedDishId || !modelPath);
  const [glContext, setGlContext] = useState<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const [testMode, setTestMode] = useState(false); // Mode test pour afficher le modèle sans détection
  
  // États de manipulation utilisateur
  const [userScale, setUserScale] = useState(1);
  const [userRotation, setUserRotation] = useState(0);
  const [userOffset, setUserOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [isModelPlaced, setIsModelPlaced] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Handlers de manipulation
  const handleZoomIn = useCallback(() => {
    setUserScale(prev => Math.min(prev + 0.1, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setUserScale(prev => Math.max(prev - 0.1, 0.3));
  }, []);
  
  const handleRotateLeft = useCallback(() => {
    setUserRotation(prev => prev - Math.PI / 8);
  }, []);
  
  const handleRotateRight = useCallback(() => {
    setUserRotation(prev => prev + Math.PI / 8);
  }, []);
  
  const handleReset = useCallback(() => {
    setUserScale(1);
    setUserRotation(0);
    setUserOffset(new THREE.Vector3(0, 0, 0));
    logger.debug('🔄 Manipulation réinitialisée');
  }, []);
  
  const handleReplace = useCallback(() => {
    setIsModelPlaced(false);
    setDetectedPlane(null);
    setUserOffset(new THREE.Vector3(0, 0, 0));
    logger.debug('📍 Mode replacement activé');
  }, []);

  // Activer la caméra au montage
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      endSession();
    };
  }, []);

  // Connecter le flux vidéo à l'élément video
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(logger.error);
    }
  }, [stream]);

  // Note: L'initialisation WebXR est maintenant gérée dans onCreated du Canvas

  // Gérer la sélection d'un plat
  const handleDishSelect = (dishId: string | number) => {
    setShowMenu(false);
    setDetectedPlane(null); // Réinitialiser la détection de plan
    if (onDishSelect) {
      onDishSelect(dishId);
    }
  };

  // Afficher le menu si aucun plat n'est sélectionné
  // Note: Le menu est géré par DirectARView, donc on ne montre pas ARMenu ici
  useEffect(() => {
    if (!selectedDishId || !modelPath) {
      setShowMenu(false); // Ne pas afficher ARMenu, laisser DirectARView gérer SpinningTacticalMenu
    } else {
      setShowMenu(false);
    }
  }, [selectedDishId, modelPath]);

  // Gérer la détection de plan
  const handlePlaneDetected = (position: THREE.Vector3, _normal: THREE.Vector3) => {
    logger.debug('Plan détecté à la position:', position);
    setDetectedPlane(position);
    setIsModelPlaced(true);
  };

  // Mode test : afficher le modèle à une position fixe pour tester
  useEffect(() => {
    if (modelPath && !detectedPlane && !showMenu) {
      // Après 3 secondes, activer le mode test si aucune surface n'est détectée
      const timer = setTimeout(() => {
        logger.debug('Mode test activé - affichage du modèle à position fixe');
        setTestMode(true);
        setDetectedPlane(new THREE.Vector3(0, 0, -1)); // Position fixe devant la caméra
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setTestMode(false);
    }
  }, [modelPath, detectedPlane, showMenu]);

  // Parser l'échelle
  const parseScale = (scaleStr: string): THREE.Vector3 => {
    const parts = scaleStr.split(' ').map(Number);
    return new THREE.Vector3(parts[0] || 1, parts[1] || 1, parts[2] || 1);
  };

  // Extraire la taille réelle en mètres depuis les dimensions
  const extractRealWorldSize = (dimensionsStr?: string): number | undefined => {
    if (!dimensionsStr) return undefined;
    
    // Extraire les nombres suivis de "cm" ou "m"
    const match = dimensionsStr.match(/(\d+(?:\.\d+)?)\s*(cm|m)/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      // Convertir en mètres
      return unit === 'cm' ? value / 100 : value;
    }
    return undefined;
  };

  const modelScale = parseScale(scale);
  const realWorldSize = extractRealWorldSize(dimensions);

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* Flux vidéo de la caméra en arrière-plan */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ transform: 'scaleX(-1)' }} // Miroir pour une expérience naturelle
      />

      {/* Canvas WebXR pour le rendu 3D */}
      <Canvas
        className="absolute inset-0 z-10"
        gl={{ 
          alpha: true, 
          antialias: true,
          preserveDrawingBuffer: true
        }}
        camera={{ position: [0, 1.6, 3], fov: 60 }}
        onCreated={(state: any) => {
          // Récupérer la référence au canvas depuis le renderer Three.js
          if (state.gl && state.gl.domElement) {
            canvasRef.current = state.gl.domElement;
            
            // Initialiser WebXR si la caméra est prête
            if (stream && canvasRef.current && !glContext && isSupported) {
              // Obtenir le contexte WebGL depuis le canvas
              const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl');
              if (gl) {
                setGlContext(gl);
                // Démarrer la session WebXR
                startSession(gl).catch((err) => {
                  logger.error('Erreur démarrage WebXR:', err);
                });
              }
            }
          }
        }}
      >
        {/* Éclairage */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.3} />

        {/* Menu AR transparent */}
        {showMenu && (
          <ARMenu onSelectDish={handleDishSelect} />
        )}

        {/* Détecteur de plan */}
        {session && referenceSpace && (
          <PlaneDetector
            session={session}
            referenceSpace={referenceSpace}
            onPlaneDetected={handlePlaneDetected}
            showIndicator={!detectedPlane}
          />
        )}

        {/* Modèle 3D sur la table détectée ou en mode test */}
        {modelPath && (detectedPlane || testMode) && (
          <Suspense fallback={
            <mesh position={detectedPlane || new THREE.Vector3(0, 0, -1)}>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshBasicMaterial color="#ffaa00" transparent opacity={0.5} />
            </mesh>
          }>
            {/* Contrôles de rotation améliorés - seulement si WebXR n'est pas actif */}
            {!session && (
              <PresentationControls
                global
                zoom={0.8}
                rotation={[0, 0, 0]}
                polar={[-Math.PI / 3, Math.PI / 3]}
                azimuth={[-Math.PI / 1.4, Math.PI / 2]}
              >
                <InteractiveModelRenderer
                  modelPath={modelPath}
                  position={detectedPlane || new THREE.Vector3(0, 0, -1)}
                  scale={modelScale}
                  hotspots={hotspots}
                  realWorldSize={realWorldSize}
                  userScale={userScale}
                  userRotation={userRotation}
                  userOffset={userOffset}
                />
              </PresentationControls>
            )}
            
            {/* En mode WebXR, utiliser le modèle interactif avec contrôles utilisateur */}
            {session && (
              <InteractiveModelRenderer
                modelPath={modelPath}
                position={detectedPlane || new THREE.Vector3(0, 0, -1)}
                scale={modelScale}
                hotspots={hotspots}
                realWorldSize={realWorldSize}
                userScale={userScale}
                userRotation={userRotation}
                userOffset={userOffset}
              />
            )}
          </Suspense>
        )}
        
        {/* Contrôles Orbit pour rotation libre (fallback si PresentationControls ne fonctionne pas) */}
        {modelPath && (detectedPlane || testMode) && !session && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={5}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI - Math.PI / 6}
            autoRotate={false}
            rotateSpeed={0.5}
          />
        )}
      </Canvas>

      {/* Messages d'erreur */}
      {cameraError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full">
          Erreur caméra: {cameraError}
        </div>
      )}

      {webXRError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full">
          {webXRError}
        </div>
      )}

      {/* Indicateur de chargement */}
      {!isSupported && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-xl text-white px-8 py-6 rounded-2xl border border-white/20">
            <p className="text-lg font-bold mb-2">WebXR non supporté</p>
            <p className="text-sm text-gray-300">
              Veuillez utiliser un navigateur compatible (Chrome Android, Safari iOS 15+)
            </p>
          </div>
        </div>
      )}

      {/* Instructions pour la détection de table */}
      {!detectedPlane && !testMode && modelPath && !showMenu && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-black/20 backdrop-blur-xl text-white px-6 py-4 rounded-2xl border border-white/20">
          <p className="text-center font-medium">
            Pointez votre appareil vers une surface plane (table)
          </p>
          <p className="text-center text-sm mt-2 text-gray-300">
            Mode test activé dans 3 secondes si aucune surface n'est détectée
          </p>
        </div>
      )}

      {/* Indicateur mode test */}
      {testMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-full border border-white/20">
          <p className="text-center font-medium">
            🧪 Mode test actif - Modèle affiché à position fixe
          </p>
        </div>
      )}

      {/* Instructions de rotation */}
      {modelPath && (detectedPlane || testMode) && !session && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/30 backdrop-blur-xl text-white px-6 py-4 rounded-2xl border border-white/20 max-w-sm">
          <p className="text-center font-medium mb-2">
            👆 Faites glisser pour tourner
          </p>
          <p className="text-center text-sm text-gray-300">
            Pincez pour zoomer • Voyez le plat sous tous les angles
          </p>
        </div>
      )}

      {/* Instructions WebXR */}
      {modelPath && detectedPlane && session && !showControls && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/30 backdrop-blur-xl text-white px-6 py-4 rounded-2xl border border-white/20 max-w-sm">
          <p className="text-center font-medium mb-2">
            📱 Bougez votre appareil
          </p>
          <p className="text-center text-sm text-gray-300">
            Tournez autour du plat pour le voir sous tous les angles
          </p>
        </div>
      )}

      {/* Contrôles AR améliorés */}
      <AnimatePresence>
        {modelPath && (detectedPlane || testMode) && showControls && (
          <ARControlsOverlay
            onReset={handleReset}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRotateLeft={handleRotateLeft}
            onRotateRight={handleRotateRight}
            currentScale={userScale}
            isPlaced={isModelPlaced}
            onReplace={handleReplace}
          />
        )}
      </AnimatePresence>

      {/* Bouton pour afficher/masquer les contrôles */}
      {modelPath && (detectedPlane || testMode) && (
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute top-20 right-4 z-50 w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white transition-all hover:bg-white/30"
          aria-label={showControls ? "Masquer les contrôles" : "Afficher les contrôles"}
        >
          {showControls ? "✕" : "⚙"}
        </button>
      )}
    </div>
  );
};
