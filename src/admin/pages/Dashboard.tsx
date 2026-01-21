import { useMenu } from '../../hooks/useMenu';
import { Package, UtensilsCrossed, Eye, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { menuItems, loading } = useMenu();

  const stats = [
    {
      label: 'Plats au menu',
      value: menuItems.length,
      icon: UtensilsCrossed,
      color: 'bg-blue-500',
      link: '/admin/menu',
    },
    {
      label: 'Modèles 3D',
      value: menuItems.filter((item) => item.modelUrl).length,
      icon: Package,
      color: 'bg-purple-500',
      link: '/admin/assets',
    },
    {
      label: 'Vues AR (7j)',
      value: '0',
      icon: Eye,
      color: 'bg-green-500',
      link: '/admin/analytics',
    },
    {
      label: 'Ajouts panier',
      value: '0',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      link: '/admin/analytics',
    },
  ];

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Vue d'ensemble de votre menu AR</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Plats récents</h2>
        <div className="space-y-3">
          {menuItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">{item.category}</p>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {item.price.toFixed(2)}€
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
