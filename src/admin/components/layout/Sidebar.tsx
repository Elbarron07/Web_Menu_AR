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
  FolderOpen,
  ChevronLeft,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { adminRoute } from '../../../config/routes';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

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

export const Sidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const handleNavClick = () => {
    // Fermer la sidebar sur mobile apres navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-50 
        lg:relative lg:z-auto
        bg-background-sidebar min-h-screen flex flex-col border-r border-gray-200
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64
      `}
    >
      {/* Logo/Branding */}
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-soft flex-shrink-0">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-xl font-bold text-gray-900 transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : ''}`}>
              Admin
            </h1>
          </div>
          
          {/* Bouton fermer mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === adminRoute() && location.pathname === adminRoute());
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              title={isCollapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
                ${isActive
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: Collapse button + Logout */}
      <div className="border-t border-gray-200">
        {/* Bouton collapse desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          <span className={`text-sm font-medium ${isCollapsed ? 'hidden' : ''}`}>Réduire</span>
        </button>
        
        {/* Logout */}
        <div className="p-2 lg:p-4">
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            title={isCollapsed ? 'Déconnexion' : undefined}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg 
              text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors
              ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`font-medium text-sm ${isCollapsed ? 'lg:hidden' : ''}`}>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
