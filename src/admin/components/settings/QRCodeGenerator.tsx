import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';
import { generateQRCodeUrl, downloadQRCode } from '../../../lib/qrcode';
import { useMenu } from '../../../hooks/useMenu';

export const QRCodeGenerator = () => {
  const { menuItems } = useMenu();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState(window.location.origin);

  const selectedItem = menuItems.find((item) => item.id === selectedItemId);
  const qrUrl = selectedItemId ? generateQRCodeUrl({ menuItemId: selectedItemId, tableNumber, baseUrl }) : '';

  const handleDownload = () => {
    const svg = document.getElementById('qrcode-svg');
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
      downloadQRCode(pngFile, `qr-${selectedItemId}-${tableNumber || 'table'}.png`);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <QrCode className="w-6 h-6" />
        Générateur de QR Code
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de base
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              placeholder="https://votre-domaine.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un plat
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              <option value="">-- Choisir un plat --</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de table (optionnel)
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              placeholder="Table 5"
            />
          </div>

          {qrUrl && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">URL générée :</p>
              <p className="text-xs text-gray-800 break-all font-mono">{qrUrl}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center">
          {qrUrl ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <QRCodeSVG
                  id="qrcode-svg"
                  value={qrUrl}
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>
              {selectedItem && (
                <div className="text-center">
                  <p className="font-medium text-gray-900">{selectedItem.name}</p>
                  {tableNumber && (
                    <p className="text-sm text-gray-600">Table {tableNumber}</p>
                  )}
                </div>
              )}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <Download className="w-5 h-5" />
                Télécharger QR Code
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Sélectionnez un plat pour générer le QR Code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
