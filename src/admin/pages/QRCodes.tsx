import { useState, useEffect, useCallback } from 'react';
import { QrCode, Plus, Download, Trash2, Search, Layers, Coffee, Building2, Truck, Tag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { adminApi, type QRCode } from '../../lib/adminApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ToggleSwitch } from '../components/ui/ToggleSwitch';
import { AdminPageSkeleton } from '../components/skeletons/AdminPageSkeleton';

type QRType = 'table' | 'room' | 'delivery' | 'custom';
type FilterType = 'all' | QRType;

const TYPE_CONFIG: Record<QRType, { label: string; icon: typeof Coffee; color: string; prefix: string; labelTemplate: string }> = {
  table: { label: 'Table', icon: Coffee, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', prefix: 'T', labelTemplate: 'Table {n}' },
  room: { label: 'Chambre', icon: Building2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30', prefix: 'R', labelTemplate: 'Chambre {n}' },
  delivery: { label: 'Livraison', icon: Truck, color: 'text-green-600 bg-green-50 dark:bg-green-900/30', prefix: 'DLV-', labelTemplate: 'Livraison {n}' },
  custom: { label: 'Personnalisé', icon: Tag, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30', prefix: 'C-', labelTemplate: 'QR {n}' },
};

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'table', label: 'Tables' },
  { key: 'room', label: 'Chambres' },
  { key: 'delivery', label: 'Livraison' },
  { key: 'custom', label: 'Personnalisé' },
];

export const QRCodes = () => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [previewQR, setPreviewQR] = useState<QRCode | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({ type: 'table' as QRType, label: '', code: '' });
  const [creating, setCreating] = useState(false);

  // Batch form state
  const [batchForm, setBatchForm] = useState({ type: 'table' as QRType, start: 1, end: 10 });
  const [batchCreating, setBatchCreating] = useState(false);

  const fetchQRCodes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.qrCodes.getQRCodes();
      setQrCodes(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQRCodes(); }, [fetchQRCodes]);

  const filteredCodes = qrCodes.filter((qr) => {
    const matchFilter = filter === 'all' || qr.type === filter;
    const matchSearch = !search || qr.label.toLowerCase().includes(search.toLowerCase()) || qr.code.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.qrCodes.createQRCode(createForm);
      setShowCreateModal(false);
      setCreateForm({ type: 'table', label: '', code: '' });
      await fetchQRCodes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchCreating(true);
    try {
      const cfg = TYPE_CONFIG[batchForm.type];
      await adminApi.qrCodes.createBatchQRCodes(
        batchForm.type,
        cfg.prefix,
        batchForm.start,
        batchForm.end,
        cfg.labelTemplate
      );
      setShowBatchModal(false);
      await fetchQRCodes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la création par lot');
    } finally {
      setBatchCreating(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await adminApi.qrCodes.toggleQRCode(id, isActive);
      await fetchQRCodes();
    } catch {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async (qr: QRCode) => {
    if (!confirm(`Supprimer le QR code « ${qr.label} » ?`)) return;
    try {
      await adminApi.qrCodes.deleteQRCode(qr.id);
      await fetchQRCodes();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const getQRUrl = (code: string) => `${window.location.origin}/q/${code}`;

  const handleDownloadQR = (qr: QRCode) => {
    const svg = document.getElementById(`qr-preview-${qr.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-${qr.code}.png`;
      link.href = pngFile;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) return <AdminPageSkeleton variant="table" />;
  if (error) return <div className="text-center py-12 text-red-600">Erreur : {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <QrCode className="w-8 h-8" />
            QR Codes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez vos QR codes pour tables, chambres et livraisons</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Layers className="w-4 h-4" />} onClick={() => setShowBatchModal(true)}>
            Génération par lot
          </Button>
          <Button icon={<Plus className="w-5 h-5" />} onClick={() => setShowCreateModal(true)}>
            Nouveau QR
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({qrCodes.filter((q) => q.type === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Table */}
      <Card variant="default" padding="lg">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par label ou code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {filteredCodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <QrCode className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>Aucun QR code trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Label</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scans</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actif</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCodes.map((qr) => {
                  const cfg = TYPE_CONFIG[qr.type];
                  const Icon = cfg.icon;
                  return (
                    <tr key={qr.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-opacity ${!qr.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{qr.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{qr.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">{qr.scan_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <ToggleSwitch checked={qr.is_active} onChange={(checked) => handleToggle(qr.id, checked)} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setPreviewQR(qr)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors" title="Aperçu QR">
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(qr)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nouveau QR Code</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                <select
                  value={createForm.type}
                  onChange={(e) => {
                    const type = e.target.value as QRType;
                    setCreateForm((f) => ({ ...f, type, code: '' }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label *</label>
                <input
                  type="text"
                  value={createForm.label}
                  onChange={(e) => setCreateForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Ex: Table 5, Chambre 401..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code unique *</label>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '-') }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono"
                  placeholder={`Ex: ${TYPE_CONFIG[createForm.type].prefix}5`}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  URL : {getQRUrl(createForm.code || '...')}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Annuler</Button>
                <Button type="submit" loading={creating} disabled={!createForm.label.trim() || !createForm.code.trim()}>Créer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Génération par lot</h2>
            <form onSubmit={handleBatchCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={batchForm.type}
                  onChange={(e) => setBatchForm((f) => ({ ...f, type: e.target.value as QRType }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">De</label>
                  <input
                    type="number"
                    min={1}
                    value={batchForm.start}
                    onChange={(e) => setBatchForm((f) => ({ ...f, start: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">À</label>
                  <input
                    type="number"
                    min={batchForm.start}
                    value={batchForm.end}
                    onChange={(e) => setBatchForm((f) => ({ ...f, end: parseInt(e.target.value, 10) || 10 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cela générera {batchForm.end - batchForm.start + 1} QR codes ({TYPE_CONFIG[batchForm.type].prefix}{batchForm.start} à {TYPE_CONFIG[batchForm.type].prefix}{batchForm.end})
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowBatchModal(false)}>Annuler</Button>
                <Button type="submit" loading={batchCreating}>Générer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewQR && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreviewQR(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">{previewQR.label}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4 font-mono">{previewQR.code}</p>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  id={`qr-preview-${previewQR.id}`}
                  value={getQRUrl(previewQR.code)}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-4 break-all">{getQRUrl(previewQR.code)}</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setPreviewQR(null)}>Fermer</Button>
              <Button className="flex-1" icon={<Download className="w-4 h-4" />} onClick={() => handleDownloadQR(previewQR)}>
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
