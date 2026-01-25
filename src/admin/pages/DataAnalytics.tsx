import { useState } from 'react';
import { Database, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Mock data
const conversionData = [
  { category: 'Pizza', views: 450, conversions: 120, rate: 26.7 },
  { category: 'Burger', views: 380, conversions: 95, rate: 25.0 },
  { category: 'Salade', views: 290, conversions: 65, rate: 22.4 },
  { category: 'Dessert', views: 320, conversions: 88, rate: 27.5 },
];

const categoryDistribution = [
  { name: 'Pizza', value: 35, color: '#2563EB' },
  { name: 'Burger', value: 28, color: '#10B981' },
  { name: 'Salade', value: 20, color: '#F59E0B' },
  { name: 'Dessert', value: 17, color: '#EF4444' },
];

const timeData = [
  { hour: '08h', views: 45, conversions: 12 },
  { hour: '10h', views: 78, conversions: 22 },
  { hour: '12h', views: 145, conversions: 45 },
  { hour: '14h', views: 98, conversions: 28 },
  { hour: '16h', views: 112, conversions: 35 },
  { hour: '18h', views: 165, conversions: 52 },
  { hour: '20h', views: 134, conversions: 42 },
];

export const DataAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Database className="w-8 h-8" />
            Analyses de données
          </h1>
          <p className="text-gray-600">Analyses approfondies et insights sur vos données</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>
          <Button icon={<Download className="w-4 h-4" />}>
            Exporter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Taux de conversion moyen"
          value="25.4%"
          icon={TrendingUp}
          iconColor="bg-success-500"
          trend={{ value: '+2.3%', direction: 'up' }}
        />
        <StatCard
          label="Vues totales"
          value="12,450"
          icon={Database}
          iconColor="bg-primary-600"
          trend={{ value: '+18%', direction: 'up' }}
        />
        <StatCard
          label="Interactions AR"
          value="3,120"
          icon={Database}
          iconColor="bg-purple-500"
          trend={{ value: '+12%', direction: 'up' }}
        />
        <StatCard
          label="Temps moyen d'engagement"
          value="4.2 min"
          icon={Database}
          iconColor="bg-warning-500"
          trend={{ value: '+0.5 min', direction: 'up' }}
        />
      </div>

      {/* Conversion Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Taux de conversion par catégorie</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="category" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)'
                }}
              />
              <Bar dataKey="rate" fill="#2563EB" radius={[8, 8, 0, 0]} name="Taux (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Distribution par catégorie</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Time-based Analysis */}
      <Card variant="default" padding="lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Analyse temporelle (par heure)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="hour" stroke="#6B7280" fontSize={12} />
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
            <Bar dataKey="views" fill="#2563EB" radius={[8, 8, 0, 0]} name="Vues" />
            <Bar dataKey="conversions" fill="#10B981" radius={[8, 8, 0, 0]} name="Conversions" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Conversion Table */}
      <Card variant="default" padding="lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Détails des conversions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vues</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Conversions</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Taux</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {conversionData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.views}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.conversions}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center gap-1">
                      {item.rate}%
                      {item.rate > 25 ? (
                        <TrendingUp className="w-4 h-4 text-success-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-error-500" />
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
