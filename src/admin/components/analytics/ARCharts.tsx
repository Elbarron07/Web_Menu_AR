import {
  BarChart,
  Bar,
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

const EVENT_LABELS: Record<string, string> = {
  view_3d: 'Vues 3D',
  add_to_cart: 'Ajouts panier',
  hotspot_click: 'Clics hotspot',
  ar_session_start: 'Sessions AR',
  ar_session_end: 'Fin sessions',
};

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: 'none',
  borderRadius: '12px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  padding: '10px 14px',
  color: '#F1F5F9',
  fontSize: '13px',
};

const gridStroke = '#334155';

export const ARCharts = ({ data }: ARChartsProps) => {
  // Labeled event data for pie chart
  const labeledEvents = data.eventsByType.map(e => ({
    ...e,
    label: EVENT_LABELS[e.event_type] || e.event_type,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top plats — horizontal bar for better fill */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Top plats visualisés</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Nombre de vues AR et ajouts panier</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.topItems.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis type="number" stroke="#6B7280" fontSize={11} />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend />
            <Bar dataKey="views" fill="#f59e0b" name="Vues AR" radius={[0, 6, 6, 0]} barSize={14} />
            <Bar dataKey="carts" fill="#10b981" name="Paniers" radius={[0, 6, 6, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Évolution — filled area chart instead of thin lines */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Évolution récente</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Vues AR et ajouts panier par jour</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.eventsByDay}>
            <defs>
              <linearGradient id="evoViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="evoCarts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(v).toLocaleDateString('fr-FR')} />
            <Legend />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#f59e0b"
              fill="url(#evoViews)"
              name="Vues AR"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#f59e0b' }}
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="carts"
              stroke="#ef4444"
              fill="url(#evoCarts)"
              name="Ajouts panier"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#ef4444' }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition — donut chart, bigger and centered */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Répartition des événements</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Distribution par type d'interaction</p>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={labeledEvents}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={3}
              label={({ label: l, percent: p }: { label?: string; percent?: number }) => `${l ?? ''} (${((p ?? 0) * 100).toFixed(0)}%)`}
              labelLine={{ stroke: '#64748B', strokeWidth: 1 }}
            >
              {labeledEvents.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Taux de conversion — horizontal bars fill better */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Taux de conversion par plat</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Pourcentage vue → ajout panier</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.topItems.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis type="number" stroke="#6B7280" fontSize={11} unit="%" />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Conversion']} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="conversionRate" name="Conversion (%)" radius={[0, 6, 6, 0]} barSize={16}>
              {data.topItems.slice(0, 10).map((_item, index) => (
                <Cell key={index} fill={`hsl(${160 + index * 8}, 70%, ${55 - index * 3}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activités par jour — full width, strong area fills */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Activités par jour</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Toutes les interactions – vue détaillée</p>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data.eventsByDay}>
            <defs>
              <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="gCarts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="gHotspots" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="gArStarts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="gArEnds" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(v).toLocaleDateString('fr-FR')} />
            <Legend />
            <Area type="monotone" dataKey="views" stroke="#f59e0b" fill="url(#gViews)" name="Vues 3D" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
            <Area type="monotone" dataKey="carts" stroke="#ef4444" fill="url(#gCarts)" name="Ajouts panier" strokeWidth={2.5} dot={{ r: 2.5, fill: '#ef4444' }} />
            <Area type="monotone" dataKey="hotspots" stroke="#f97316" fill="url(#gHotspots)" name="Clics hotspot" strokeWidth={2} dot={{ r: 2.5, fill: '#f97316' }} />
            <Area type="monotone" dataKey="arStarts" stroke="#3b82f6" fill="url(#gArStarts)" name="Sessions AR" strokeWidth={2} dot={{ r: 2.5, fill: '#3b82f6' }} />
            <Area type="monotone" dataKey="arEnds" stroke="#8b5cf6" fill="url(#gArEnds)" name="Fin sessions" strokeWidth={2} dot={{ r: 2.5, fill: '#8b5cf6' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
