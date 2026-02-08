import { Eye, ShoppingCart, Clock, TrendingUp, MousePointerClick, Smartphone } from 'lucide-react';
import type { AnalyticsData } from '../../hooks/useAnalytics';

interface MetricsCardsProps {
  data: AnalyticsData;
}

export const MetricsCards = ({ data }: MetricsCardsProps) => {
  const hotspotCount = data.eventsByType.find(e => e.event_type === 'hotspot_click')?.count || 0;
  const arSessionsCount = data.eventsByType.find(e => e.event_type === 'ar_session_start')?.count || 0;

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
    {
      label: 'Clics Hotspot',
      value: hotspotCount,
      icon: MousePointerClick,
      color: 'bg-amber-500',
      change: '',
    },
    {
      label: 'Sessions AR',
      value: arSessionsCount,
      icon: Smartphone,
      color: 'bg-indigo-500',
      change: '',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              {metric.change && (
                <span className="text-sm font-medium text-green-600">{metric.change}</span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
          </div>
        );
      })}
    </div>
  );
};
