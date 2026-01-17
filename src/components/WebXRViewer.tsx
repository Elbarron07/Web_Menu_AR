import { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, PresentationControls } from '@react-three/drei';
import { useCameraStream } from '../hooks/useCameraStream';
import { useWebXR } from '../hooks/useWebXR';
import { PlaneDetector } from './PlaneDetector';
import { ARMenu } from './ARMenu';
import * as THREE from 'three';

interface WebXRViewerProps {
  modelPath?: string;
  selectedDishId?: number;
  onDishSelect?: (dishId: number) => void;
  hotspots?: Array<{ position: string; name: string; detail?: string }>;
  scale?: string;
  dimensions?: string; // Ex: "Diamètre 30cm", "Hauteur 15cm"
}

interface ModelRendererProps {
  modelPath: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  hotspots?: Array<{ position: string; name: string; detail?: string }>;
  realWorldSize?: number; // Taille réelle en mètres (ex: 0.30 pour 30cm)
}

const ModelRenderer = ({ modelPath, position, scale, realWorldSize }: ModelRendererProps) => {
  const modelRef = useRef<THREE.Group>(null);
  
  // Charger le modèle GLTF (useGLTF gère automatiquement le cache)
  const { scene } = useGLTF(modelPath);
  
  useEffect(() => {
    console.log('✅ Modèle GLTF chargé avec succès:', modelPath, 'Scene:', scene);
  }, [modelPath, scene]);

  useEffect(() => {
    if (modelRef.current && scene) {
      // Calculer la bounding box pour centrer le modèle
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      console.log('📦 Bounding box:', { center, size, min: box.min, max: box.max });
      
      // Calculer l'échelle pour taille réelle (1:1)
      let finalScale = scale.clone();
      
      if (realWorldSize) {
        // Pour une taille réelle, on utilise généralement la dimension horizontale (X ou Z)
        // Pour une pizza : diamètre = max(size.x, size.z)
        // Pour un burger : hauteur = size.y
        // On prend la dimension horizontale la plus grande (X ou Z) pour les plats plats
        // ou la hauteur (Y) pour les objets verticaux
        const horizontalSize = Math.max(size.x, size.z);
        const verticalSize = size.y;
        
        // Utiliser la dimension appropriée selon le type d'objet
        // Si la hauteur est significativement plus grande, c'est probablement un objet vertical
        const isVertical = verticalSize > horizontalSize * 1.5;
        const modelDimension = isVertical ? verticalSize : horizontalSize;
        
        // Calculer le facteur d'échelle pour que la dimension corresponde à la taille réelle
        const scaleFactor = realWorldSize / modelDimension;
        
        // Appliquer le facteur d'échelle uniformément pour maintenir les proportions
        finalScale.multiplyScalar(scaleFactor);
        
        console.log('📏 Échelle taille réelle calculée:', {
          realWorldSize,
          modelDimension: isVertical ? `hauteur: ${verticalSize}` : `diamètre: ${horizontalSize}`,
          scaleFactor,
          finalScale,
          isVertical
        });
      }
      
      // Positionner le modèle : centré sur la position détectée
      // Ajuster Y pour placer le bas du modèle sur la surface
      const adjustedY = position.y + (size.y / 2) * finalScale.y;
      
      modelRef.current.position.set(
        position.x - center.x * finalScale.x,
        adjustedY,
        position.z - center.z * finalScale.z
      );
      
      // Appliquer l'échelle finale (taille réelle + variant)
      modelRef.current.scale.copy(finalScale);
      
      console.log('📍 Modèle positionné à taille réelle:', {
        modelPath,
        position: modelRef.current.position,
        scale: modelRef.current.scale,
        originalPosition: position,
        realWorldSize
      });
    }
  }, [position, scale, scene, modelPath, realWorldSize]);

  // Ne pas faire de rotation automatique - laisser l'utilisateur contrôler
  // useFrame(() => {
  //   if (modelRef.current) {
  //     // Animation subtile de rotation
  //     modelRef.current.rotation.y += 0.005;
  //   }
  // });

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
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  // Note: L'initialisation WebXR est maintenant gérée dans onCreated du Canvas

  // Gérer la sélection d'un plat
  const handleDishSelect = (dishId: number) => {
    setShowMenu(false);
    setDetectedPlane(null); // Réinitialiser la détection de plan
    if (onDishSelect) {
      onDishSelect(dishId);
    }
  };

  // Afficher le menu si aucun plat n'est sélectionné
  useEffect(() => {
    if (!selectedDishId || !modelPath) {
      setShowMenu(true);
    } else {
      setShowMenu(false);
    }
  }, [selectedDishId, modelPath]);

  // Gérer la détection de plan
  const handlePlaneDetected = (position: THREE.Vector3, _normal: THREE.Vector3) => {
    console.log('Plan détecté à la position:', position);
    setDetectedPlane(position);
  };

  // Mode test : afficher le modèle à une position fixe pour tester
  useEffect(() => {
    if (modelPath && !detectedPlane && !showMenu) {
      // Après 3 secondes, activer le mode test si aucune surface n'est détectée
      const timer = setTimeout(() => {
        console.log('Mode test activé - affichage du modèle à position fixe');
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
                  console.error('Erreur démarrage WebXR:', err);
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
            {/* Contrôles de rotation - seulement si WebXR n'est pas actif */}
            {!session && (
              <PresentationControls
                global
                zoom={0.8}
                rotation={[0, 0, 0]}
                polar={[-Math.PI / 3, Math.PI / 3]}
                azimuth={[-Math.PI / 1.4, Math.PI / 2]}
              >
                <ModelRenderer
                  modelPath={modelPath}
                  position={detectedPlane || new THREE.Vector3(0, 0, -1)}
                  scale={modelScale}
                  hotspots={hotspots}
                  realWorldSize={realWorldSize}
                />
              </PresentationControls>
            )}
            
            {/* En mode WebXR, afficher sans contrôles (l'utilisateur bouge son appareil) */}
            {session && (
              <ModelRenderer
                modelPath={modelPath}
                position={detectedPlane || new THREE.Vector3(0, 0, -1)}
                scale={modelScale}
                hotspots={hotspots}
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
      {modelPath && detectedPlane && session && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/30 backdrop-blur-xl text-white px-6 py-4 rounded-2xl border border-white/20 max-w-sm">
          <p className="text-center font-medium mb-2">
            📱 Bougez votre appareil
          </p>
          <p className="text-center text-sm text-gray-300">
            Tournez autour du plat pour le voir sous tous les angles
          </p>
        </div>
      )}
    </div>
  );
};
