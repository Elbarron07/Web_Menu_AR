import { useState } from 'react';
import { Users, Search, Filter, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock data - à remplacer par de vraies données
const mockCustomers = [
  { id: 1, name: 'Jean Dupont', email: 'jean@example.com', orders: 12, lastVisit: '2024-01-15', status: 'active' },
  { id: 2, name: 'Marie Martin', email: 'marie@example.com', orders: 8, lastVisit: '2024-01-14', status: 'active' },
  { id: 3, name: 'Pierre Durand', email: 'pierre@example.com', orders: 5, lastVisit: '2024-01-10', status: 'inactive' },
  { id: 4, name: 'Sophie Bernard', email: 'sophie@example.com', orders: 15, lastVisit: '2024-01-16', status: 'active' },
  { id: 5, name: 'Luc Petit', email: 'luc@example.com', orders: 3, lastVisit: '2024-01-05', status: 'inactive' },
];

const engagementData = [
  { day: 'Lun', views: 120, interactions: 45 },
  { day: 'Mar', views: 145, interactions: 52 },
  { day: 'Mer', views: 138, interactions: 48 },
  { day: 'Jeu', views: 162, interactions: 61 },
  { day: 'Ven', views: 178, interactions: 68 },
  { day: 'Sam', views: 195, interactions: 75 },
  { day: 'Dim', views: 210, interactions: 82 },
];

export const CustomerTracking = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const customerColumns = [
    { key: 'name', header: 'Nom', accessor: (item: any) => item.name },
    { key: 'email', header: 'Email', accessor: (item: any) => item.email },
    { key: 'orders', header: 'Commandes', accessor: (item: any) => item.orders },
    { key: 'lastVisit', header: 'Dernière visite', accessor: (item: any) => new Date(item.lastVisit).toLocaleDateString('fr-FR') },
    { key: 'status', header: 'Statut', render: (item: any) => (
      <Badge variant={item.status === 'active' ? 'success' : 'neutral'} size="sm">
        {item.status === 'active' ? 'Actif' : 'Inactif'}
      </Badge>
    ) },
  ];

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button icon={<Download className="w-4 h-4" />}>
          Exporter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Clients totaux"
          value={mockCustomers.length}
          icon={Users}
          iconColor="bg-primary-600"
          trend={{ value: '+12%', direction: 'up' as const }}
        />
        <StatCard
          label="Clients actifs"
          value={mockCustomers.filter(c => c.status === 'active').length}
          icon={Users}
          iconColor="bg-success-500"
          trend={{ value: '+8%', direction: 'up' as const }}
        />
        <StatCard
          label="Commandes moyennes"
          value={Math.round(mockCustomers.reduce((acc, c) => acc + c.orders, 0) / mockCustomers.length)}
          icon={Users}
          iconColor="bg-warning-500"
        />
        <StatCard
          label="Taux de rétention"
          value="87%"
          icon={Users}
          iconColor="bg-purple-500"
          trend={{ value: '+3%', direction: 'up' as const }}
        />
      </div>

      {/* Engagement Chart */}
      <Card variant="default" padding="lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement hebdomadaire</h2>
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
      </Card>

      {/* Customers Table */}
      <Card variant="default" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Liste des clients</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un client..."
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
          data={filteredCustomers}
          emptyMessage="Aucun client trouvé"
        />
      </Card>
    </div>
  );
};
