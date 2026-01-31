import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Package, 
  BarChart3, 
  Settings,
  LogOut,
  Users,
  Database,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { adminRoute } from '../../../config/routes';

const menuItems = [
  { path: adminRoute(), icon: LayoutDashboard, label: 'Dashboard' },
  { path: adminRoute('categories'), icon: FolderOpen, label: 'Catégories' },
  { path: adminRoute('menu'), icon: UtensilsCrossed, label: 'Menu' },
  { path: adminRoute('assets'), icon: Package, label: 'Assets 3D' },
  { path: adminRoute('analytics'), icon: BarChart3, label: 'Analytics' },
  { path: adminRoute('customers'), icon: Users, label: 'Clients' },
  { path: adminRoute('data-analytics'), icon: Database, label: 'Données' },
  { path: adminRoute('settings'), icon: Settings, label: 'Paramètres' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="w-64 bg-background-sidebar min-h-screen flex flex-col border-r border-gray-200">
      {/* Logo/Branding */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-soft">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Admin
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === adminRoute() && location.pathname === adminRoute());
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};
