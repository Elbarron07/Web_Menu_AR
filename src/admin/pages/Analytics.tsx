import { useState, useMemo } from 'react';
import {
  BarChart3, Eye, ShoppingCart, User, Clock, FileText, MousePointerClick, Hash,
  RotateCcw, Wifi, WifiOff,
} from 'lucide-react';
import { AdminPageSkeleton } from '../components/skeletons/AdminPageSkeleton';
import { useAnalytics } from '../hooks/useAnalytics';
import { MetricsCards } from '../components/analytics/MetricsCards';
import { ResizablePanel } from '../components/ui/ResizablePanel';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Helpers ──
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

const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'];
const EVENT_LABELS: Record<string, string> = {
  view_3d: 'Vues 3D',
  add_to_cart: 'Paniers',
  hotspot_click: 'Hotspots',
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

const PANEL_KEYS = [
  'panel-h-top-plats-visualisés',
  'panel-h-évolution-récente',
  'panel-h-répartition-des-événements',
  'panel-h-taux-de-conversion-par-plat',
  'panel-h-activités-par-jour',
  'panel-h-activités-récentes',
];

// ── Main Component ──
export const Analytics = () => {
  const [days, setDays] = useState(7);
  const { data, trends, loading, error, isRealtime } = useAnalytics(days);

  const labeledEvents = useMemo(() =>
    data?.eventsByType?.map(e => ({ ...e, label: EVENT_LABELS[e.event_type] || e.event_type })) || [],
    [data]);

  const resetPanels = () => {
    PANEL_KEYS.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Analytics & Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analysez l'impact de votre menu AR — <span className="text-primary-500 font-medium">étirez les panneaux</span> pour les ajuster
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isRealtime
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isRealtime ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {isRealtime ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isRealtime ? 'Live' : 'Hors ligne'}
          </div>
          <button
            onClick={resetPanels}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            title="Réinitialiser les tailles"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
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
      </div>

      {/* Metrics Cards (fixed) */}
      <MetricsCards data={data} trends={trends} />

      {/* Row 1: Top plats + Évolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResizablePanel title="Top plats visualisés" subtitle="Vues AR et ajouts panier" defaultHeight={360}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topItems.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" stroke="#6B7280" fontSize={11} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend />
              <Bar dataKey="views" fill="#f59e0b" name="Vues AR" radius={[0, 6, 6, 0]} barSize={12} />
              <Bar dataKey="carts" fill="#10b981" name="Paniers" radius={[0, 6, 6, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </ResizablePanel>

        <ResizablePanel title="Évolution récente" subtitle="Vues AR et ajouts panier par jour" defaultHeight={360}>
          <ResponsiveContainer width="100%" height="100%">
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
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
              />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(v as string).toLocaleDateString('fr-FR')} />
              <Legend />
              <Area type="monotone" dataKey="views" stroke="#f59e0b" fill="url(#evoViews)" name="Vues AR" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
              <Area type="monotone" dataKey="carts" stroke="#ef4444" fill="url(#evoCarts)" name="Paniers" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ResizablePanel>
      </div>

      {/* Row 2: Répartition + Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResizablePanel title="Répartition des événements" subtitle="Distribution par type d'interaction" defaultHeight={360}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={labeledEvents}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="45%"
                innerRadius="30%"
                outerRadius="65%"
                paddingAngle={3}
                label={({ label: l, percent: p }: any) => `${l ?? ''} (${((p ?? 0) * 100).toFixed(0)}%)`}
                labelLine={{ stroke: '#64748B', strokeWidth: 1 }}
              >
                {labeledEvents.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ResizablePanel>

        <ResizablePanel title="Taux de conversion par plat" subtitle="Pourcentage vue → ajout panier" defaultHeight={360}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topItems.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" stroke="#6B7280" fontSize={11} unit="%" />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Conversion']} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="conversionRate" name="Conversion (%)" radius={[0, 6, 6, 0]} barSize={14}>
                {data.topItems.slice(0, 10).map((_item, index) => (
                  <Cell key={index} fill={`hsl(${160 + index * 8}, 70%, ${55 - index * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ResizablePanel>
      </div>

      {/* Row 3: Full-width activities chart */}
      <ResizablePanel title="Activités par jour" subtitle="Toutes les interactions – vue détaillée" defaultHeight={380}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.eventsByDay}>
            <defs>
              <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="gAS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="gAE" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }}
              tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
            />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(v as string).toLocaleDateString('fr-FR')} />
            <Legend />
            <Area type="monotone" dataKey="views" stroke="#f59e0b" fill="url(#gV)" name="Vues 3D" strokeWidth={2.5} dot={{ r: 2.5, fill: '#f59e0b' }} />
            <Area type="monotone" dataKey="carts" stroke="#ef4444" fill="url(#gC)" name="Paniers" strokeWidth={2.5} dot={{ r: 2, fill: '#ef4444' }} />
            <Area type="monotone" dataKey="hotspots" stroke="#f97316" fill="url(#gH)" name="Hotspots" strokeWidth={2} dot={{ r: 2, fill: '#f97316' }} />
            <Area type="monotone" dataKey="arStarts" stroke="#3b82f6" fill="url(#gAS)" name="Sessions AR" strokeWidth={2} dot={{ r: 2, fill: '#3b82f6' }} />
            <Area type="monotone" dataKey="arEnds" stroke="#8b5cf6" fill="url(#gAE)" name="Fin sessions" strokeWidth={2} dot={{ r: 2, fill: '#8b5cf6' }} />
          </AreaChart>
        </ResponsiveContainer>
      </ResizablePanel>

      {/* Row 4: Recent activities */}
      <ResizablePanel title="Activités récentes" subtitle={`${data.recentActivities.length} interactions — mise à jour en temps réel`} defaultHeight={400}>
        <div className="overflow-y-auto h-full">
          {data.recentActivities.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune activité récente</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.recentActivities.map((activity) => {
                const info = getActivityInfo(activity.type);
                const Icon = info.icon;
                const metaDetail = getMetadataDetail(activity.type, activity.metadata);
                const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: fr,
                });
                const exactTime = format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr });

                return (
                  <div key={activity.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className={`${info.color} p-2 rounded-xl flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                        {activity.menu_item_name
                          ? `${info.title} : ${activity.menu_item_name}`
                          : info.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{exactTime}</span>
                        {activity.session_id && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5 font-mono">
                            <Hash className="w-2.5 h-2.5" />
                            {activity.session_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      {metaDetail && (
                        <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-0.5 font-medium">{metaDetail}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ResizablePanel>
    </div>
  );
};
