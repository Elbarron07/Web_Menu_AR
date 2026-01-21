import { Eye, ShoppingCart, Clock, TrendingUp } from 'lucide-react';
import type { AnalyticsData } from '../../hooks/useAnalytics';

interface MetricsCardsProps {
  data: AnalyticsData;
}

export const MetricsCards = ({ data }: MetricsCardsProps) => {
  const metrics = [
    {
      label: 'Vues AR',
      value: data.totalViews,
      icon: Eye,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      label: 'Ajouts panier',
      value: data.totalCarts,
      icon: ShoppingCart,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      label: 'Engagement moyen',
      value: `${Math.round(data.avgEngagement)}s`,
      icon: Clock,
      color: 'bg-purple-500',
      change: '+5%',
    },
    {
      label: 'Taux de conversion',
      value: data.totalViews > 0
        ? `${((data.totalCarts / data.totalViews) * 100).toFixed(1)}%`
        : '0%',
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+2%',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600">{metric.change}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</p>
            <p className="text-sm text-gray-600">{metric.label}</p>
          </div>
        );
      })}
    </div>
  );
};
