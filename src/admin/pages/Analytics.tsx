import { useState } from 'react';
import { BarChart3, Eye, ShoppingCart, User, Clock, FileText, MousePointerClick, Hash } from 'lucide-react';
import { AdminPageSkeleton } from '../components/skeletons/AdminPageSkeleton';
import { useAnalytics } from '../hooks/useAnalytics';
import { MetricsCards } from '../components/analytics/MetricsCards';
import { ARCharts } from '../components/analytics/ARCharts';
import { Card } from '../components/ui/Card';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

const getActivityInfo = (type: string) => {
  switch (type) {
    case 'view_3d':
      return { icon: Eye, color: 'text-amber-600 bg-amber-50', title: 'Vue 3D' };
    case 'add_to_cart':
      return { icon: ShoppingCart, color: 'text-green-600 bg-green-50', title: 'Ajout au panier' };
    case 'ar_session_start':
      return { icon: User, color: 'text-blue-600 bg-blue-50', title: 'Session AR démarrée' };
    case 'ar_session_end':
      return { icon: Clock, color: 'text-purple-600 bg-purple-50', title: 'Session AR terminée' };
    case 'hotspot_click':
      return { icon: MousePointerClick, color: 'text-orange-600 bg-orange-50', title: 'Hotspot cliqué' };
    default:
      return { icon: FileText, color: 'text-gray-600 bg-gray-50', title: 'Activité' };
  }
};

const getMetadataDetail = (type: string, metadata: Record<string, unknown> | null): string | null => {
  if (!metadata) return null;
  switch (type) {
    case 'hotspot_click':
      return metadata.hotspot_slot ? `Slot : ${metadata.hotspot_slot}` : null;
    case 'ar_session_end':
      return metadata.duration ? `Durée : ${metadata.duration}s` : null;
    default:
      return null;
  }
};

export const Analytics = () => {
  const [days, setDays] = useState(7);
  const { data, loading, error } = useAnalytics(days);

  if (loading) {
    return <AdminPageSkeleton variant="analytics" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur : {error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-600">Aucune donnée disponible</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Analytics & Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Analysez l'impact de votre menu AR</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
        </select>
      </div>

      <MetricsCards data={data} />
      <ARCharts data={data} />

      {/* Activités récentes détaillées */}
      <Card variant="default" padding="lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Activités récentes</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Les {Math.min(data.recentActivities.length, 10)} dernières interactions utilisateurs</p>

        {data.recentActivities.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aucune activité récente</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.recentActivities.slice(0, 10).map((activity) => {
              const info = getActivityInfo(activity.type);
              const Icon = info.icon;
              const metaDetail = getMetadataDetail(activity.type, activity.metadata);
              const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
                addSuffix: true,
                locale: fr,
              });
              const exactTime = format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr });

              return (
                <div key={activity.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className={`${info.color} p-2.5 rounded-xl flex-shrink-0`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {activity.menu_item_name
                        ? `${info.title} : ${activity.menu_item_name}`
                        : info.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{exactTime}</span>
                      {activity.session_id && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 font-mono">
                          <Hash className="w-3 h-3" />
                          {activity.session_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    {metaDetail && (
                      <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">{metaDetail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
