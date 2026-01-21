import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface Variant {
  size: string;
  label: string;
  priceModifier: number;
  scale: string;
}

interface VariantManagerProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}

export const VariantManager = ({ variants, onChange }: VariantManagerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [newVariant, setNewVariant] = useState<Variant>({
    size: '',
    label: '',
    priceModifier: 0,
    scale: '1 1 1',
  });

  const handleAdd = () => {
    if (newVariant.size && newVariant.label) {
      onChange([...variants, newVariant]);
      setNewVariant({ size: '', label: '', priceModifier: 0, scale: '1 1 1' });
      setShowForm(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Variantes</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Taille (ex: M, L)"
              value={newVariant.size}
              onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <input
              type="text"
              placeholder="Label (ex: M (30cm))"
              value={newVariant.label}
              onChange={(e) => setNewVariant({ ...newVariant, label: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Modificateur de prix"
              value={newVariant.priceModifier}
              onChange={(e) => setNewVariant({ ...newVariant, priceModifier: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <input
              type="text"
              placeholder="Échelle (ex: 1 1 1)"
              value={newVariant.scale}
              onChange={(e) => setNewVariant({ ...newVariant, scale: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
            >
              Ajouter
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {variants.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucune variante</p>
        ) : (
          variants.map((variant, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex-1 grid grid-cols-4 gap-4">
                <span className="font-medium">{variant.size}</span>
                <span className="text-gray-600">{variant.label}</span>
                <span className="text-gray-600">{variant.priceModifier >= 0 ? '+' : ''}{variant.priceModifier.toFixed(2)}€</span>
                <span className="text-gray-500 text-sm">{variant.scale}</span>
              </div>
              <button
                onClick={() => handleRemove(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
