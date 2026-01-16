import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
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
}

interface ModelRendererProps {
  modelPath: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  hotspots?: Array<{ position: string; name: string; detail?: string }>;
}

const ModelRenderer = ({ modelPath, position, scale }: ModelRendererProps) => {
  const { scene } = useGLTF(modelPath);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.position.copy(position);
      modelRef.current.scale.copy(scale);
    }
  }, [position, scale]);

  useFrame(() => {
    if (modelRef.current) {
      // Animation subtile de rotation
      modelRef.current.rotation.y += 0.005;
    }
  });

  // Cloner la scène pour éviter les problèmes de référence
  const clonedScene = scene.clone();

  return (
    <primitive 
      ref={modelRef} 
      object={clonedScene}
    />
  );
};

export const WebXRViewer = ({ 
  modelPath, 
  selectedDishId,
  onDishSelect,
  hotspots = [],
  scale = "1 1 1"
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
    setDetectedPlane(position);
  };

  // Parser l'échelle
  const parseScale = (scaleStr: string): THREE.Vector3 => {
    const parts = scaleStr.split(' ').map(Number);
    return new THREE.Vector3(parts[0] || 1, parts[1] || 1, parts[2] || 1);
  };

  const modelScale = parseScale(scale);

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

        {/* Modèle 3D sur la table détectée */}
        {modelPath && detectedPlane && (
          <ModelRenderer
            modelPath={modelPath}
            position={detectedPlane}
            scale={modelScale}
            hotspots={hotspots}
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
      {!detectedPlane && modelPath && !showMenu && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-black/20 backdrop-blur-xl text-white px-6 py-4 rounded-2xl border border-white/20">
          <p className="text-center font-medium">
            Pointez votre appareil vers une surface plane (table)
          </p>
        </div>
      )}
    </div>
  );
};
