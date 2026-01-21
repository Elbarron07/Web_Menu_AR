import { useRef, useEffect } from 'react';
import '@google/model-viewer';

interface Hotspot {
  slot: string;
  pos: string;
  label: string;
  detail: string;
}

interface ModelViewer3DProps {
  modelUrl: string;
  hotspots?: Hotspot[];
  onHotspotClick?: (position: { x: number; y: number; z: number }) => void;
  editable?: boolean;
}

export const ModelViewer3D = ({
  modelUrl,
  hotspots = [],
  onHotspotClick,
  editable = false,
}: ModelViewer3DProps) => {
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (viewerRef.current && editable) {
      const handleClick = (event: MouseEvent) => {
        if (!onHotspotClick) return;

        const rect = viewerRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Approximation simple - dans un vrai cas, utiliser un raycaster Three.js
        const position = {
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          z: 0,
        };

        onHotspotClick(position);
      };

      viewerRef.current.addEventListener('click', handleClick);
      return () => {
        if (viewerRef.current) {
          viewerRef.current.removeEventListener('click', handleClick);
        }
      };
    }
  }, [editable, onHotspotClick]);

  if (!modelUrl) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Aucun modèle chargé</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
      <model-viewer
        ref={viewerRef}
        src={modelUrl}
        alt="3D Model"
        camera-controls
        auto-rotate
        ar
        ar-modes="webxr scene-viewer quick-look"
        style={{ width: '100%', height: '100%' }}
      >
        {hotspots.map((hotspot, index) => (
          <button
            key={index}
            slot={`hotspot-${index}`}
            data-position={hotspot.pos}
            data-normal="0 1 0"
            className="hotspot"
            style={{
              position: 'absolute',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(251, 191, 36, 0.8)',
              border: '2px solid #f59e0b',
              cursor: 'pointer',
            }}
            title={hotspot.label}
          />
        ))}
      </model-viewer>
      
      {editable && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
          Mode édition : Cliquez sur le modèle pour ajouter un hotspot
        </div>
      )}
    </div>
  );
};
