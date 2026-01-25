import { Settings as SettingsIcon } from 'lucide-react';
import { RestaurantSettings } from '../components/settings/RestaurantSettings';
import { QRCodeGenerator } from '../components/settings/QRCodeGenerator';
import { Card } from '../components/ui/Card';

export const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          Paramètres
        </h1>
        <p className="text-gray-600">Configurez votre restaurant et générez des QR Codes</p>
      </div>

      <Card variant="default" padding="lg">
        <RestaurantSettings />
      </Card>
      <Card variant="default" padding="lg">
        <QRCodeGenerator />
      </Card>
    </div>
  );
};
