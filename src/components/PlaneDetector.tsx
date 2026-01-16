import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlaneDetectorProps {
  session: XRSession | null;
  referenceSpace: XRReferenceSpace | null;
  onPlaneDetected?: (position: THREE.Vector3, normal: THREE.Vector3) => void;
  showIndicator?: boolean;
}

export const PlaneDetector = ({ 
  session, 
  referenceSpace, 
  onPlaneDetected,
  showIndicator = true 
}: PlaneDetectorProps) => {
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const indicatorRef = useRef<THREE.Mesh | null>(null);
  const lastHitPositionRef = useRef<THREE.Vector3 | null>(null);

  // Initialiser la source de hit test
  useEffect(() => {
    if (!session || !referenceSpace) return;

    const initHitTest = async () => {
      try {
        const viewerSpace = await session.requestReferenceSpace('viewer');
        if (session.requestHitTestSource) {
          const hitTestSource = await session.requestHitTestSource({
            space: viewerSpace
          } as any);
          if (hitTestSource) {
            hitTestSourceRef.current = hitTestSource;
          }
        }
      } catch (err) {
        console.error('Erreur initialisation hit test:', err);
      }
    };

    initHitTest();

    return () => {
      if (hitTestSourceRef.current) {
        hitTestSourceRef.current.cancel();
        hitTestSourceRef.current = null;
      }
    };
  }, [session, referenceSpace]);

  // Animer la détection de plan
  useFrame((state: any) => {
    if (!session || !hitTestSourceRef.current || !referenceSpace) {
      if (indicatorRef.current) {
        indicatorRef.current.visible = false;
      }
      return;
    }

    // Obtenir le frame XR
    const xrFrame = state.gl.xr.getFrame?.();
    if (!xrFrame) return;

    try {
      // Effectuer un hit test depuis le centre de l'écran
      const hitTestResults = xrFrame.getHitTestResults(hitTestSourceRef.current);
      
      if (hitTestResults && hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        
        if (pose) {
          const position = new THREE.Vector3(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z
          );

          const quaternion = new THREE.Quaternion(
            pose.transform.orientation.x,
            pose.transform.orientation.y,
            pose.transform.orientation.z,
            pose.transform.orientation.w
          );

          // Calculer la normale (vers le haut)
          const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

          // Vérifier si c'est une surface horizontale (tolérance de 30 degrés)
          const angleFromUp = Math.acos(normal.dot(new THREE.Vector3(0, 1, 0)));
          const isHorizontal = angleFromUp < Math.PI / 6; // ~30 degrés

          if (isHorizontal) {
            lastHitPositionRef.current = position;

            // Afficher l'indicateur
            if (indicatorRef.current) {
              indicatorRef.current.visible = showIndicator;
              indicatorRef.current.position.copy(position);
              indicatorRef.current.quaternion.copy(quaternion);
            }

            // Notifier le parent
            if (onPlaneDetected) {
              onPlaneDetected(position, normal);
            }
          } else {
            if (indicatorRef.current) {
              indicatorRef.current.visible = false;
            }
          }
        }
      } else {
        if (indicatorRef.current) {
          indicatorRef.current.visible = false;
        }
      }
    } catch (err) {
      console.error('Erreur hit test:', err);
    }
  });

  return (
    <>
      {showIndicator && (
        <mesh ref={indicatorRef} visible={false}>
          {/* Cercle indicateur de surface */}
          <ringGeometry args={[0.1, 0.15, 32]} />
          <meshBasicMaterial 
            color="#00ff00" 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
          {/* Point central */}
          <mesh position={[0, 0.001, 0]}>
            <circleGeometry args={[0.05, 32]} />
            <meshBasicMaterial 
              color="#00ff00" 
              transparent 
              opacity={0.8}
            />
          </mesh>
        </mesh>
      )}
    </>
  );
};
