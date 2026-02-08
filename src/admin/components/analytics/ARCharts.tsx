import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AnalyticsData } from '../../hooks/useAnalytics';

interface ARChartsProps {
  data: AnalyticsData;
}

const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'];

export const ARCharts = ({ data }: ARChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 10 plats les plus visualisés */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top 10 plats visualisés</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.topItems.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="views" fill="#f59e0b" name="Vues AR" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Évolution dans le temps */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Évolution (7 derniers jours)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.eventsByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#f59e0b"
              name="Vues AR"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="carts"
              stroke="#ef4444"
              name="Ajouts panier"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition par type d'événement */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Répartition des événements</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.eventsByType}
              dataKey="count"
              nameKey="event_type"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.eventsByType.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Activités par jour - Multi-lignes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Activités par jour</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data.eventsByDay}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCarts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHotspots" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorArStarts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorArEnds" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="views" stroke="#f59e0b" fill="url(#colorViews)" name="Vues 3D" strokeWidth={2} />
            <Area type="monotone" dataKey="carts" stroke="#ef4444" fill="url(#colorCarts)" name="Ajouts panier" strokeWidth={2} />
            <Area type="monotone" dataKey="hotspots" stroke="#f97316" fill="url(#colorHotspots)" name="Clics hotspot" strokeWidth={2} />
            <Area type="monotone" dataKey="arStarts" stroke="#3b82f6" fill="url(#colorArStarts)" name="Sessions AR" strokeWidth={2} />
            <Area type="monotone" dataKey="arEnds" stroke="#8b5cf6" fill="url(#colorArEnds)" name="Fin sessions AR" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Taux de conversion par plat */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Taux de conversion</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.topItems.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="conversionRate"
              fill="#10b981"
              name="Taux de conversion (%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
