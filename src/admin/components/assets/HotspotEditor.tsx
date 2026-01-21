import { useState } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { ModelViewer3D } from './ModelViewer3D';

interface Hotspot {
  slot: string;
  pos: string;
  label: string;
  detail: string;
}

interface HotspotEditorProps {
  modelUrl: string;
  hotspots: Hotspot[];
  onChange: (hotspots: Hotspot[]) => void;
}

export const HotspotEditor = ({ modelUrl, hotspots, onChange }: HotspotEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newHotspot, setNewHotspot] = useState<Hotspot>({
    slot: '',
    pos: '0m 0m 0m',
    label: '',
    detail: '',
  });

  const handleAddHotspot = (position: { x: number; y: number; z: number }) => {
    const pos = `${position.x}m ${position.y}m ${position.z}m`;
    const hotspot: Hotspot = {
      slot: `hotspot-${hotspots.length + 1}`,
      pos,
      label: newHotspot.label || 'Nouveau hotspot',
      detail: newHotspot.detail || '',
    };
    onChange([...hotspots, hotspot]);
    setNewHotspot({ slot: '', pos: '0m 0m 0m', label: '', detail: '' });
  };

  const handleRemoveHotspot = (index: number) => {
    onChange(hotspots.filter((_, i) => i !== index));
  };

  const handleUpdateHotspot = (index: number, updated: Hotspot) => {
    const newHotspots = [...hotspots];
    newHotspots[index] = updated;
    onChange(newHotspots);
    setEditingIndex(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Éditeur 3D</h3>
          <ModelViewer3D
            modelUrl={modelUrl}
            hotspots={hotspots}
            onHotspotClick={handleAddHotspot}
            editable
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Hotspots</h3>
          <button
            onClick={() => {
              setNewHotspot({ slot: '', pos: '0m 0m 0m', label: '', detail: '' });
              setEditingIndex(-1);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {hotspots.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Cliquez sur le modèle 3D pour ajouter un hotspot
            </p>
          ) : (
            hotspots.map((hotspot, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                {editingIndex === index ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Slot"
                      value={hotspot.slot}
                      onChange={(e) =>
                        handleUpdateHotspot(index, { ...hotspot, slot: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Label"
                      value={hotspot.label}
                      onChange={(e) =>
                        handleUpdateHotspot(index, { ...hotspot, label: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    />
                    <textarea
                      placeholder="Détail"
                      value={hotspot.detail}
                      onChange={(e) =>
                        handleUpdateHotspot(index, { ...hotspot, detail: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        Terminer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{hotspot.label}</p>
                      <p className="text-sm text-gray-500 mt-1">{hotspot.detail}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {hotspot.slot} - {hotspot.pos}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingIndex(index)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveHotspot(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
