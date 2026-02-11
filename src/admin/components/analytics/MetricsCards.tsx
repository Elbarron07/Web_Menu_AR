import { Eye, ShoppingCart, Clock, TrendingUp, MousePointerClick, Smartphone } from 'lucide-react';
import type { AnalyticsData, AnalyticsTrends } from '../../hooks/useAnalytics';

interface MetricsCardsProps {
  data: AnalyticsData;
  trends?: AnalyticsTrends | null;
}

export const MetricsCards = ({ data, trends }: MetricsCardsProps) => {
  const hotspotCount = data.eventsByType.find(e => e.event_type === 'hotspot_click')?.count || 0;
  const arSessionsCount = data.eventsByType.find(e => e.event_type === 'ar_session_start')?.count || 0;

  const metrics = [
    {
      label: 'Vues AR',
      value: data.totalViews,
      icon: Eye,
      color: 'bg-blue-500',
      trend: trends?.views,
    },
    {
      label: 'Ajouts panier',
      value: data.totalCarts,
      icon: ShoppingCart,
      color: 'bg-green-500',
      trend: trends?.carts,
    },
    {
      label: 'Engagement moyen',
      value: `${Math.round(data.avgEngagement)}s`,
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      label: 'Taux de conversion',
      value: data.totalViews > 0
        ? `${((data.totalCarts / data.totalViews) * 100).toFixed(1)}%`
        : '0%',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      label: 'Clics Hotspot',
      value: hotspotCount,
      icon: MousePointerClick,
      color: 'bg-amber-500',
    },
    {
      label: 'Sessions AR',
      value: arSessionsCount,
      icon: Smartphone,
      color: 'bg-indigo-500',
      trend: trends?.sessions,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const trendInfo = 'trend' in metric ? metric.trend : undefined;
        return (
          <div
            key={metric.label}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              {trendInfo && (
                <span className={`text-sm font-medium ${trendInfo.direction === 'up' ? 'text-green-600' :
                    trendInfo.direction === 'down' ? 'text-red-500' :
                      'text-gray-500'
                  }`}>
                  {trendInfo.value}
                </span>
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
