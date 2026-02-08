import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { AdminPageSkeleton } from '../components/skeletons/AdminPageSkeleton';
import { useAnalytics } from '../hooks/useAnalytics';
import { MetricsCards } from '../components/analytics/MetricsCards';
import { ARCharts } from '../components/analytics/ARCharts';

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Analytics & Insights
          </h1>
          <p className="text-gray-600">Analysez l'impact de votre menu AR</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
        </select>
      </div>

      <MetricsCards data={data} />
      <ARCharts data={data} />
    </div>
  );
};
