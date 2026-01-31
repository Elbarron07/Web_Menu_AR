import { useMenu } from '../../hooks/useMenu';
import { useAnalytics } from '../hooks/useAnalytics';
import { Package, UtensilsCrossed, Eye, ShoppingCart, Sparkles, Clock, User, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { adminRoute } from '../../config/routes';

export const Dashboard = () => {
  const { menuItems, loading: menuLoading } = useMenu();
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics(7);

  // Format number with thousands separator
  const formatNumber = (num: number) => {
    return num.toLocaleString('fr-FR');
  };

  // Get activity icon and color based on event type
  const getActivityInfo = (type: string) => {
    switch (type) {
      case 'view_3d':
        return { icon: Eye, color: 'text-amber-600 bg-amber-50', title: 'Vue AR' };
      case 'add_to_cart':
        return { icon: ShoppingCart, color: 'text-green-600 bg-green-50', title: 'Ajout au panier' };
      case 'ar_session_start':
        return { icon: User, color: 'text-blue-600 bg-blue-50', title: 'Session AR démarrée' };
      case 'ar_session_end':
        return { icon: Clock, color: 'text-purple-600 bg-purple-50', title: 'Session AR terminée' };
      case 'hotspot_click':
        return { icon: FileText, color: 'text-orange-600 bg-orange-50', title: 'Hotspot cliqué' };
      default:
        return { icon: FileText, color: 'text-gray-600 bg-gray-50', title: 'Activité' };
    }
  };

  // KPI Stats
  const stats = [
    {
      label: 'Plats au menu',
      value: menuItems.length,
      icon: UtensilsCrossed,
      iconColor: 'bg-primary-600',
      trend: { value: '+12%', direction: 'up' as const },
      link: adminRoute('menu'),
    },
    {
      label: 'Modèles 3D',
      value: menuItems.filter((item) => item.modelUrl).length,
      icon: Package,
      iconColor: 'bg-purple-500',
      trend: { value: '+5', direction: 'up' as const },
      link: adminRoute('assets'),
    },
    {
      label: 'Vues AR (7j)',
      value: analyticsData ? formatNumber(analyticsData.totalViews) : '...',
      icon: Eye,
      iconColor: 'bg-success-500',
      trend: { value: '+21%', direction: 'up' as const },
      link: adminRoute('analytics'),
    },
    {
      label: 'Ajouts panier',
      value: analyticsData ? formatNumber(analyticsData.totalCarts) : '...',
      icon: ShoppingCart,
      iconColor: 'bg-warning-500',
      trend: { value: '+8%', direction: 'up' as const },
      link: adminRoute('analytics'),
    },
  ];

  // Monthly Revenue Data (placeholder - no orders table yet)
  // TODO: Connect to orders table when available
  const monthlyRevenue = [
    { month: 'Mar', revenue: 12000 },
    { month: 'Avr', revenue: 13500 },
    { month: 'Mai', revenue: 14200 },
    { month: 'Jun', revenue: 15000 },
    { month: 'Jul', revenue: 13800 },
    { month: 'Aoû', revenue: 14500 },
    { month: 'Sep', revenue: 15200 },
    { month: 'Oct', revenue: 14800 },
    { month: 'Nov', revenue: 16000 },
  ];

  // Activities from analytics
  const activities = analyticsData?.recentActivities?.slice(0, 4).map((activity) => {
    const info = getActivityInfo(activity.type);
    const Icon = info.icon;
    const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
      addSuffix: true,
    });
    return {
      icon: Icon,
      title: activity.menu_item_name
        ? `${info.title}: ${activity.menu_item_name}`
        : info.title,
      time: timeAgo,
      color: info.color,
    };
  }) || [];

  // Recent Items Table
  const recentItemsColumns = [
    { key: 'name', header: 'Nom', accessor: (item: any) => item.name },
    { key: 'category', header: 'Catégorie', accessor: (item: any) => item.category?.name ?? '-' },
    { key: 'price', header: 'Prix', render: (item: any) => `${item.price.toFixed(2)}€` },
    { key: 'status', header: 'Statut', render: (item: any) => (
      <Badge variant={item.modelUrl ? 'success' : 'warning'} size="sm">
        {item.modelUrl ? 'Complet' : 'En attente'}
      </Badge>
    ) },
  ];

  if (menuLoading || analyticsLoading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Vue d'ensemble de votre menu AR</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <StatCard
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
              trend={stat.trend}
            />
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2">
          <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Revenus mensuels</h2>
                <p className="text-sm text-gray-500 mt-1">Évolution sur 9 mois (Données indicatives - à connecter avec table orders)</p>
              </div>
              <Badge variant="success" size="sm" trend="up">
                +12%
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* NEW Feature Card */}
        <Card variant="default" padding="lg" className="bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
          <div className="flex items-start justify-between mb-4">
            <Badge variant="info" size="sm" className="bg-white/20 text-white border-white/30">
              NOUVEAU
            </Badge>
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nouvelles fonctionnalités disponibles !</h3>
          <p className="text-primary-100 text-sm mb-4">
            Découvrez le tracking avancé des clients et les analyses de données approfondies.
          </p>
          <Link to={adminRoute('customers')}>
            <button className="w-full bg-white text-primary-600 font-semibold py-2.5 px-4 rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
              Explorer maintenant
            </button>
          </Link>
        </Card>
      </div>

      {/* Activities and Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activities */}
        <Card variant="default" padding="lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Activités récentes</h2>
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className={`${activity.color} p-3 rounded-xl`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Items Table */}
        <Card variant="default" padding="lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Plats récents</h2>
          <Table
            columns={recentItemsColumns}
            data={menuItems.slice(0, 5)}
            emptyMessage="Aucun plat récent"
          />
        </Card>
      </div>
    </div>
  );
};
