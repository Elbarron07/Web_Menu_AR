import { useState } from 'react';
import { Users, Search, Filter, Download } from 'lucide-react';
import { AdminPageSkeleton } from '../components/skeletons/AdminPageSkeleton';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSessions } from '../hooks/useSessions';

export const CustomerTracking = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [days, setDays] = useState(30);
  const { data: sessionsData, loading, error } = useSessions(days, searchQuery);

  // Format engagement data for chart (by day of week)
  const engagementData = sessionsData?.engagementByDay?.map((item) => {
    const date = new Date(item.day);
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return {
      day: dayNames[date.getDay()],
      views: item.views,
      interactions: item.interactions,
    };
  }) || [];

  const customerColumns = [
    { key: 'session_id', header: 'Session ID', accessor: (item: any) => item.session_id.substring(0, 12) + '...' },
    { key: 'views', header: 'Vues', accessor: (item: any) => item.views },
    { key: 'carts', header: 'Panier', accessor: (item: any) => item.carts },
    { key: 'conversion_rate', header: 'Taux conversion', render: (item: any) => `${item.conversion_rate.toFixed(1)}%` },
    { key: 'last_seen', header: 'Dernière visite', accessor: (item: any) => new Date(item.last_seen).toLocaleDateString('fr-FR') },
    { key: 'status', header: 'Statut', render: (item: any) => (
      <Badge variant={item.status === 'active' ? 'success' : 'neutral'} size="sm">
        {item.status === 'active' ? 'Actif' : 'Inactif'}
      </Badge>
    ) },
  ];

  const sessions = sessionsData?.sessions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Users className="w-8 h-8" />
            Suivi des clients
          </h1>
          <p className="text-gray-600">Analysez l'engagement et le comportement de vos clients</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
          <Button icon={<Download className="w-4 h-4" />}>
            Exporter
          </Button>
        </div>
      </div>

      {loading && (
        <AdminPageSkeleton variant="table" />
      )}

      {error && (
        <div className="text-center py-12 text-red-600">Erreur : {error}</div>
      )}

      {!loading && !error && sessionsData && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Sessions totales"
              value={sessionsData.stats.totalSessions}
              icon={Users}
              iconColor="bg-primary-600"
              trend={{ value: '+12%', direction: 'up' as const }}
            />
            <StatCard
              label="Sessions actives"
              value={sessionsData.stats.activeSessions}
              icon={Users}
              iconColor="bg-success-500"
              trend={{ value: '+8%', direction: 'up' as const }}
            />
            <StatCard
              label="Ajouts panier moyens"
              value={sessionsData.stats.avgOrders.toFixed(1)}
              icon={Users}
              iconColor="bg-warning-500"
            />
            <StatCard
              label="Taux de rétention"
              value={`${sessionsData.stats.retentionRate.toFixed(1)}%`}
              icon={Users}
              iconColor="bg-purple-500"
              trend={{ value: '+3%', direction: 'up' as const }}
            />
          </div>

          {/* Engagement Chart */}
          <Card variant="default" padding="lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement hebdomadaire</h2>
            {engagementData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={2} name="Vues" />
                  <Line type="monotone" dataKey="interactions" stroke="#10B981" strokeWidth={2} name="Interactions" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">Aucune donnée disponible</div>
            )}
          </Card>

          {/* Sessions Table */}
          <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Liste des sessions</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une session..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>
                  Filtres
                </Button>
              </div>
            </div>
            <Table
              columns={customerColumns}
              data={sessions}
              emptyMessage="Aucune session trouvée"
            />
          </Card>
        </>
      )}
    </div>
  );
};
