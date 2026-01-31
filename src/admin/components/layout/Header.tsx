import { useAuth } from '../../hooks/useAuth';
import { Bell, User, Search, Menu } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { adminUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6">
      <div className="flex items-center justify-between w-full gap-3 md:gap-6">
        {/* Bouton Menu Mobile */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search Mobile */}
          <button className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full border-2 border-white"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-soft">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900">
                {adminUser?.email?.split('@')[0] || 'Admin'}
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
