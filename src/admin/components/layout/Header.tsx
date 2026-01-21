import { useAuth } from '../../hooks/useAuth';
import { Bell, User } from 'lucide-react';

export const Header = () => {
  const { adminUser } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Gestion du menu AR</p>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {adminUser?.email || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {adminUser?.role || 'admin'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
